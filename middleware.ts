import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
// Use Web Crypto API (global crypto object) instead of Node.js crypto module for Edge Runtime compatibility
import { logger } from './lib/logger';
import { setRequestContext } from './lib/request-context';

// Track redirects to prevent infinite loops
const redirectTracker = new Map<string, { count: number; timestamp: number }>();
const MAX_REDIRECTS = 3;
const REDIRECT_TIMEOUT = 30000; // 30 seconds

// Helper function to check for redirect loops
function isRedirectLoop(clientId: string): boolean {
  const now = Date.now();
  const tracker = redirectTracker.get(clientId);

  if (!tracker) {
    redirectTracker.set(clientId, { count: 1, timestamp: now });
    return false;
  }

  // Reset tracker if timeout exceeded
  if (now - tracker.timestamp > REDIRECT_TIMEOUT) {
    redirectTracker.set(clientId, { count: 1, timestamp: now });
    return false;
  }

  // Check if too many redirects
  if (tracker.count >= MAX_REDIRECTS) {
    logger.warn('Redirect loop detected', {
      clientId,
      count: tracker.count,
      maxRedirects: MAX_REDIRECTS,
      timestamp: tracker.timestamp,
    });
    return true;
  }

  // Increment counter
  redirectTracker.set(clientId, { count: tracker.count + 1, timestamp: tracker.timestamp });
  return false;
}

// Clean up old redirect tracking entries
function cleanupRedirectTracker() {
  const now = Date.now();
  for (const [key, value] of redirectTracker.entries()) {
    if (now - value.timestamp > REDIRECT_TIMEOUT) {
      redirectTracker.delete(key);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRedirectTracker, 5 * 60 * 1000);

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Set request context for logging
    const requestId = crypto.randomUUID(); // Web Crypto API (compatible with Edge Runtime)
    setRequestContext({
      requestId,
      userId: token?.sub,
      userRole: token?.role as string | undefined,
      path: pathname,
      method: req.method,
      timestamp: Date.now(),
    });

    // Create unique client identifier
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const trackingKey = `${clientId}-${pathname}`;

    // Protected routes that require authentication
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      if (!token) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Admin routes - check for redirect loops
      if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
        if (isRedirectLoop(trackingKey)) {
          logger.error('Admin redirect loop detected, allowing access to prevent lockup', undefined, {
            trackingKey,
            pathname,
            role: token.role,
          });
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }

      // Map role names: convert underscores to hyphens for URL matching
      const roleMapping: Record<string, string> = {
        'story_manager': 'story-manager',
        'book_manager': 'book-manager',
        'content_admin': 'content-admin',
        'learner': 'learner',
        'teacher': 'teacher',
        'writer': 'writer',
        'institution': 'institution',
        'admin': 'admin'
      };

      const userRole = (token.role as string)?.toLowerCase();
      const expectedDashboardRole = roleMapping[userRole] || userRole;

      // Redirect /dashboard to role-specific dashboard
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL(`/dashboard/${expectedDashboardRole}`, req.url));
      }

      // Role-based dashboard access
      if (pathname.startsWith('/dashboard/')) {
        const dashboardRole = pathname.split('/')[2];

        if (dashboardRole !== expectedDashboardRole && dashboardRole !== 'page') {
          if (isRedirectLoop(trackingKey)) {
            logger.error('Dashboard redirect loop detected, allowing access to prevent lockup', undefined, {
              trackingKey,
              pathname,
              dashboardRole,
              expectedDashboardRole,
              role: token.role,
            });
            return NextResponse.next();
          }
          return NextResponse.redirect(new URL(`/dashboard/${expectedDashboardRole}`, req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes
        if (
          pathname === '/' ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/health') ||
          pathname.startsWith('/api/books') ||
          pathname.startsWith('/login') ||
          pathname.startsWith('/signup') ||
          pathname.startsWith('/about') ||
          pathname.startsWith('/library') ||
          pathname.startsWith('/legal') ||
          pathname.startsWith('/contact') ||
          pathname.startsWith('/help') ||
          pathname.startsWith('/privacy') ||
          pathname.startsWith('/terms') ||
          pathname.startsWith('/demo') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname === '/manifest.json' ||
          pathname === '/site.webmanifest' ||
          pathname === '/build-info.json' ||
          pathname.startsWith('/android-chrome-') ||
          pathname.startsWith('/apple-touch-icon') ||
          pathname.startsWith('/landing/') ||
          pathname.startsWith('/assets/') ||
          pathname.startsWith('/images/') ||
          pathname.startsWith('/figma-assets/')
        ) {
          return true;
        }

        // Require token for protected routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/health|_next/static|_next/image|favicon|manifest.json|site.webmanifest|build-info.json|android-chrome-|apple-touch-icon).*)',
  ],
};
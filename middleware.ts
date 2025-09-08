import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, generateCSRFToken, validateCSRFToken, logAuditEvent } from '@/lib/security/headers';
import { rateLimit } from '@/lib/rate-limiter';

// Define proper type interface for NextAuth middleware
interface NextRequestWithAuth extends NextRequest {
  nextauth?: {
    token?: {
      role?: string;
      id?: string;
      email?: string;
    };
  };
}

// Rate limiters for different endpoint types
const adminApiLimiter = rateLimit({
  maxRequests: 60,
  windowMs: 60 * 1000,
  message: 'Too many admin API requests, please try again later.'
});

const authLimiter = rateLimit({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  message: 'Too many authentication attempts, please try again later.'
});

const uploadLimiter = rateLimit({
  maxRequests: 10,
  windowMs: 60 * 1000,
  message: 'Too many upload requests, please try again later.'
});

// This middleware combines authentication with comprehensive security
export default withAuth(
  async function middleware(req: NextRequest) {
    const token = (req as NextRequestWithAuth).nextauth?.token;
    const pathname = req.nextUrl.pathname;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Debug log for development
    if (process.env.NODE_ENV === "development") {
      console.log("[Middleware] Path:", pathname, "Role:", token?.role, "IP:", ip);
    }

    // Create base response
    let response = NextResponse.next();

    // Apply comprehensive security headers to all responses
    response = applySecurityHeaders(response, req);

    // Rate limiting for sensitive endpoints
    if (pathname.startsWith("/api/admin")) {
      const rateLimitResult = await adminApiLimiter.check(req, ip);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: rateLimitResult.message },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    } else if (pathname.startsWith("/api/auth/signin") || pathname.startsWith("/api/auth/signup")) {
      const rateLimitResult = await authLimiter.check(req, ip);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: rateLimitResult.message },
          { status: 429, headers: { 'Retry-After': '900' } }
        );
      }
    } else if (pathname.includes("/upload")) {
      const rateLimitResult = await uploadLimiter.check(req, ip);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: rateLimitResult.message },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }
    }

    // CSRF protection for state-changing operations
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      // Skip CSRF for auth endpoints (NextAuth handles its own CSRF) and public API endpoints
      if (!pathname.startsWith('/api/auth') && 
          !pathname.startsWith('/api/health') &&
          !pathname.startsWith('/api/library/stories') &&
          !pathname.startsWith('/api/shop/products')) {
        
        const csrfToken = req.headers.get('x-csrf-token');
        const sessionToken = req.cookies.get('csrf-token')?.value;
        
        // CSRF protection for admin operations
        if (pathname.startsWith('/api/admin')) {
          if (!csrfToken || !sessionToken || !validateCSRFToken(csrfToken, sessionToken)) {
            await logAuditEvent({
              timestamp: new Date(),
              userId: token?.id,
              action: 'CSRF_VIOLATION',
              resource: pathname,
              ip,
              userAgent: req.headers.get('user-agent') || '',
              success: false,
              metadata: { 
                method: req.method,
                hasCSRFToken: !!csrfToken,
                hasSessionToken: !!sessionToken 
              }
            });
            
            return NextResponse.json(
              { error: 'CSRF token required for admin operations' },
              { status: 403 }
            );
          }
        }
      }
    }

    // Admin-only access control for web pages
    if (pathname.startsWith("/admin") && token) {
      const role = token.role;
      if (role !== "ADMIN") {
        await logAuditEvent({
          timestamp: new Date(),
          userId: token?.id,
          action: 'UNAUTHORIZED_ADMIN_ACCESS',
          resource: pathname,
          ip,
          userAgent: req.headers.get('user-agent') || '',
          success: false,
          metadata: { userRole: role || 'unknown' }
        });
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // API admin route protection (double-check)
    if (pathname.startsWith("/api/admin") && token?.role !== "ADMIN") {
      await logAuditEvent({
        timestamp: new Date(),
        userId: token?.id,
        action: 'UNAUTHORIZED_API_ACCESS',
        resource: pathname,
        ip,
        userAgent: req.headers.get('user-agent') || '',
        success: false,
        metadata: { userRole: token?.role || 'unknown' }
      });
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Unified Learning System Redirects
    // Redirect old learner dashboard to new unified learn page
    if (pathname === '/dashboard/learner' && token?.role === 'LEARNER') {
      return NextResponse.redirect(new URL('/learn', req.url));
    }
    
    // Note: /programs/english-education is now an enrollment page, not a redirect
    
    // Redirect dashboard to appropriate location based on role
    if (pathname === '/dashboard' && token?.role) {
      switch (token.role) {
        case 'LEARNER':
        case 'STUDENT':
          // Redirect to unified learn page instead of separate dashboard
          return NextResponse.redirect(new URL('/learn', req.url));
        case 'TEACHER':
          return NextResponse.redirect(new URL('/dashboard/teacher', req.url));
        case 'INSTITUTION':
          return NextResponse.redirect(new URL('/dashboard/institution', req.url));
        case 'VOLUNTEER':
          return NextResponse.redirect(new URL('/dashboard/volunteer', req.url));
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/login",
          "/signup",
          "/verify-email",
          "/about",
          "/contact",
          "/library",
          "/mission",
          "/partners",
          "/programs",
          "/shop",
          "/team",
          "/terms",
          "/privacy",
          "/donate",
          "/ko",
          "/es",
          "/fr",
          "/zh",
          // Demo routes (safe, read-only with sample data)
          "/demo",
          "/demo/learner",
          "/demo/teacher",
          "/demo/institution",
          "/demo/volunteer"
        ];
        
        // API routes that don't require authentication
        if (pathname.startsWith("/api/auth") || 
            pathname.startsWith("/api/health") ||
            pathname.startsWith("/api/library/stories") ||
            pathname.startsWith("/api/library/books") ||
            pathname.startsWith("/api/shop/products") ||
            pathname.startsWith("/api/shop/cart") ||
            pathname.startsWith("/api/pdf") ||
            pathname.startsWith("/api/covers") ||
            pathname.startsWith("/api/surveys")) {
          return true;
        }
        
        // Check if the route is public
        const isPublicRoute = publicRoutes.some(route => 
          pathname === route || pathname.startsWith(`${route}/`)
        );
        
        if (isPublicRoute) {
          return true;
        }
        
        // Protected routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images and other static assets
     * - api/auth routes (handled by NextAuth)
     * - api/covers routes (public book cover serving)
     * 
     * SECURITY: /api/admin and /api/pdf are now PROTECTED by middleware
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/covers|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.js).*)",
  ],
};
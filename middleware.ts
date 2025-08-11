import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of supported languages
const locales = ['en', 'ko', 'es', 'fr', 'zh'];
const defaultLocale = 'en';

// Get locale from pathname
function getLocale(pathname: string): string | null {
  const segments = pathname.split('/');
  const firstSegment = segments[1];
  return locales.includes(firstSegment) ? firstSegment : null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes, static files, and Next.js internal paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  const locale = getLocale(pathname);
  
  // If pathname starts with a locale (e.g., /ko, /es, etc.)
  if (locale && locale !== defaultLocale) {
    // Remove the locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    
    // Create response that redirects to the path without locale
    const response = NextResponse.redirect(new URL(pathWithoutLocale, request.url));
    
    // Set the language preference in a cookie
    response.cookies.set('NEXT_LOCALE', locale, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    
    return response;
  }

  // For all other requests, just continue
  return NextResponse.next();
}

export const config = {
  // Match all paths except those starting with api, _next, or containing a dot
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*))',
  ],
};
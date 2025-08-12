import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple middleware - just pass through
  // Language handling is now done by individual route pages
  return NextResponse.next();
}

export const config = {
  // Minimal matcher - exclude static files and API routes
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
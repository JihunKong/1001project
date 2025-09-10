import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // Basic response
    const response = NextResponse.next();
    
    // Basic security headers
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Admin route protection
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    
    // Admin API protection
    if (pathname.startsWith("/api/admin") && token?.role !== "ADMIN") {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Always allow public routes and static files
        const publicPaths = [
          "/",
          "/login",
          "/signup", 
          "/about",
          "/contact",
          "/library",
          "/api/auth",
          "/api/health",
          "/api/books",
          "/api/library",
          "/api/thumbnails"
        ];
        
        // Check if it's a public route
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true;
        }
        
        // Allow static files
        if (pathname.includes('.') || pathname.startsWith('/_next')) {
          return true;
        }
        
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.js|.*\\.css|.*\\.woff|.*\\.woff2).*)",
  ],
};
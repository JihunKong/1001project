import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

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

// This middleware combines authentication with existing functionality
export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as NextRequestWithAuth).nextauth?.token;
    const pathname = req.nextUrl.pathname;
    
    // Debug log for development
    if (process.env.NODE_ENV === "development") {
      console.log("[Middleware] Path:", pathname, "Role:", token?.role);
    }

    // Admin-only access control
    if (pathname.startsWith("/admin") && token) {
      const role = token.role;
      if (role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
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
            pathname.startsWith("/api/covers")) {
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
     * - PDF files (for thumbnails and reading)
     * - api/auth routes (handled by NextAuth)
     * - api/admin routes (handle authentication internally)
     * - api/pdf routes (public PDF serving)
     * - api/covers routes (book cover serving)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/admin|api/pdf|api/covers|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp|.*\\.pdf|.*\\.js).*)",
  ],
};
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';

// This middleware combines authentication with existing functionality
export default withAuth(
  function middleware(req: NextRequest) {
    const token = (req as any).nextauth?.token;
    const pathname = req.nextUrl.pathname;

    // Role-based dashboard redirects
    if (pathname === "/dashboard" && token) {
      const role = token.role;
      let dashboardPath = "/dashboard/learner";
      
      switch (role) {
        case "TEACHER":
          dashboardPath = "/dashboard/teacher";
          break;
        case "INSTITUTION":
          dashboardPath = "/dashboard/institution";
          break;
        case "VOLUNTEER":
          dashboardPath = "/volunteer";
          break;
        case "ADMIN":
          dashboardPath = "/admin";
          break;
        default:
          dashboardPath = "/dashboard/learner";
      }
      
      return NextResponse.redirect(new URL(dashboardPath, req.url));
    }
    
    // Check access to specific dashboards
    if (token) {
      const role = token.role;
      
      if (pathname.startsWith("/dashboard/teacher") && role !== "TEACHER" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      
      if (pathname.startsWith("/dashboard/institution") && role !== "INSTITUTION" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      
      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
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
          "/zh"
        ];
        
        // API routes that don't require authentication
        if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/health")) {
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
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webp).*)",
  ],
};
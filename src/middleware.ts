import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/practice/:path*",
    "/analytics/:path*",
    "/study-plan/:path*",
    "/mock-exam/:path*",
    "/ai-tutor/:path*",
    "/sage-coach/:path*",
    "/sage-coach",
    "/admin/:path*",
    "/community/:path*",
    "/community",
    "/resources/:path*",
    "/resources",
    "/diagnostic/:path*",
    "/diagnostic",
    "/frq-practice/:path*",
    "/frq-practice",
  ],
};

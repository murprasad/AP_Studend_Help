import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isAdminRoute = path.startsWith("/admin");
    const isOnboardingRoute = path === "/onboarding" || path.startsWith("/onboarding/");

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect first-time users to /onboarding BEFORE any dashboard page
    // renders. The earlier client-side redirect (in dashboard/layout.tsx)
    // caused a flash-of-dashboard for new users — visible bug, killed
    // first-impression. Server-side redirect via middleware fires before
    // the page even loads.
    if (
      token &&
      !isOnboardingRoute &&
      !isAdminRoute &&
      // onboardingCompletedAt is null for new users, ISO string for completed
      (token.onboardingCompletedAt === null || token.onboardingCompletedAt === undefined)
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
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
    "/onboarding",
    "/billing",
    "/billing/:path*",
  ],
};

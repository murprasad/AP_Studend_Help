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
    //
    // The "onboarding_completed" cookie is a short-lived hint set by the
    // onboarding page when the user completes the flow. It bridges the
    // window between PATCH /api/user (DB write) and JWT refresh (which
    // happens on the next request). Without this, users complete
    // onboarding → click any nav link → middleware reads stale JWT (still
    // null) → bounces them back here. Real user reported this 2026-04-24.
    const recentlyOnboarded = req.cookies.get("onboarding_completed")?.value === "true";
    if (
      token &&
      !isOnboardingRoute &&
      !isAdminRoute &&
      !recentlyOnboarded &&
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

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const isAdminRoute = path.startsWith("/admin");
    // Beta 9 (2026-04-29) — quickstart replaced the legacy 4-step wizard.
    // Both /onboarding (legacy URL — server-redirects to /practice/quickstart)
    // AND /practice/quickstart are valid landing points for new users.
    // Exempting both from the "redirect new users to onboarding" rule
    // below is what prevents the redirect loop:
    //   /dashboard → middleware → /onboarding → my page redirect →
    //   /practice/quickstart → middleware sees onboardingCompletedAt=null
    //   → bounces to /onboarding → loop.
    const isOnboardingRoute = path === "/onboarding"
      || path.startsWith("/onboarding/")
      || path === "/practice/quickstart"
      || path.startsWith("/practice/quickstart/");

    if (isAdminRoute && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect first-time users to the new quickstart flow BEFORE any
    // dashboard page renders. Beta 9 changed the target from /onboarding
    // (deleted 4-step wizard) to /practice/quickstart (single-screen
    // smart-default). Server-side redirect via middleware fires before
    // the page even loads — no flash-of-dashboard for new users.
    //
    // The "onboarding_completed" cookie is a short-lived hint set by the
    // session-complete handler. It bridges the window between PATCH
    // (DB write) and JWT refresh (next request). Without this, users
    // complete their first session → click any nav link → middleware
    // reads stale JWT (still null) → bounces them back to quickstart.
    const recentlyOnboarded = req.cookies.get("onboarding_completed")?.value === "true";
    // Beta 9.0.1 hotfix — exempt the FIRST hop from quickstart click into
    // /practice. Without this, fresh user clicks Start on /practice/quickstart
    // → router.push(/practice?...&quickstart=1) → middleware sees
    // onboardingCompletedAt=null → bounces them back to /practice/quickstart.
    // The user lands on the loading screen and never advances.
    const isFromQuickstart = req.nextUrl.searchParams.get("quickstart") === "1";
    if (
      token &&
      !isOnboardingRoute &&
      !isAdminRoute &&
      !recentlyOnboarded &&
      !isFromQuickstart &&
      // onboardingCompletedAt is null for new users, ISO string for completed
      (token.onboardingCompletedAt === null || token.onboardingCompletedAt === undefined)
    ) {
      // Beta 9.6.4 (2026-04-30) — was /practice/quickstart, now /journey.
      // The dashboard layout already routes null-onboardingCompletedAt
      // users to /journey (Beta 9.6.1). Middleware MUST match or fresh
      // signups bounce off middleware to /practice/quickstart before
      // layout ever runs — and never reach the journey rail. The
      // onboarding_completed bridge cookie still exempts users in the
      // middle of completing their first session.
      return NextResponse.redirect(new URL("/journey", req.url));
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

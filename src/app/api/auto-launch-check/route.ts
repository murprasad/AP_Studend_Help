/**
 * GET /api/auto-launch-check
 *
 * Returns a signal the dashboard uses to decide whether to nudge the
 * student into a quick warmup session. Motivated by the "Nawal pattern"
 * seen in the 2026-04-22 engagement snapshot: a real user hit the
 * dashboard 4 times over 10 hours, clicked the coach CTA, but never
 * answered a single practice question. Dashboard staring, not acting.
 *
 * Rule — return `shouldNudge: true` iff ALL of:
 *   1. User is FREE tier (PREMIUM users already paid; don't bug them)
 *   2. Account is ≥30 minutes old (avoid bugging first-time signups;
 *      real user bug report 2026-04-23: brand-new user saw the modal
 *      right after onboarding because SSR+hydrate created 2 impressions
 *      in seconds, which isn't the Nawal pattern at all)
 *   3. User has ≥2 DashboardImpression rows spread across ≥30 min
 *      (first + last impression today are at least 30 min apart)
 *   4. User has 0 StudentResponse rows today
 *
 * The nudge is natural self-limiting: after the user accepts and
 * answers ≥1 question, condition #4 fails and they won't be nudged
 * again today. Dismissing the nudge is client-side (sessionStorage).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPremiumForTrack, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const MIN_ACCOUNT_AGE_MINUTES = 30;
const MIN_IMPRESSION_SPREAD_MINUTES = 30;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
    const hasPremium =
      hasAnyPremium(moduleSubs) ||
      isPremiumForTrack(session.user.subscriptionTier, session.user.track ?? "ap");
    if (hasPremium) {
      return NextResponse.json({ shouldNudge: false, reason: "premium" });
    }

    // Check account age FIRST — cheap, avoids a DB query for brand-new users.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) {
      return NextResponse.json({ shouldNudge: false, reason: "user_not_found" });
    }
    const accountAgeMinutes = (Date.now() - new Date(user.createdAt).getTime()) / 60_000;
    if (accountAgeMinutes < MIN_ACCOUNT_AGE_MINUTES) {
      return NextResponse.json({
        shouldNudge: false,
        reason: "account_too_new",
        accountAgeMinutes: Math.round(accountAgeMinutes),
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [impressionsToday, qsAnsweredToday] = await Promise.all([
      // Need the actual timestamps (not just count) so we can check spread.
      prisma.dashboardImpression.findMany({
        where: { userId, dashboardLoadedAt: { gte: startOfDay } },
        select: { dashboardLoadedAt: true },
        orderBy: { dashboardLoadedAt: "asc" },
        take: 100,
      }),
      prisma.studentResponse.count({
        where: { userId, answeredAt: { gte: startOfDay } },
      }),
    ]);

    const dashViews = impressionsToday.length;

    // Spread check: first and last impression today must be at least
    // MIN_IMPRESSION_SPREAD_MINUTES apart. Catches the "SSR + hydrate +
    // onboarding click" burst that creates multiple rows in seconds.
    let spreadMinutes = 0;
    if (dashViews >= 2) {
      const first = new Date(impressionsToday[0].dashboardLoadedAt).getTime();
      const last = new Date(impressionsToday[dashViews - 1].dashboardLoadedAt).getTime();
      spreadMinutes = (last - first) / 60_000;
    }

    const shouldNudge =
      dashViews >= 2 &&
      spreadMinutes >= MIN_IMPRESSION_SPREAD_MINUTES &&
      qsAnsweredToday === 0;

    let reason = "first_visit";
    if (qsAnsweredToday > 0) reason = "already_practiced_today";
    else if (dashViews < 2) reason = "too_few_visits";
    else if (spreadMinutes < MIN_IMPRESSION_SPREAD_MINUTES) reason = "visits_clustered_not_spread";
    else if (shouldNudge) reason = `dashboard_views=${dashViews}, spread=${Math.round(spreadMinutes)}min, qs_today=0`;

    return NextResponse.json({
      shouldNudge,
      reason,
      dashViews,
      qsAnsweredToday,
      spreadMinutes: Math.round(spreadMinutes),
      accountAgeMinutes: Math.round(accountAgeMinutes),
    });
  } catch (e) {
    console.error("[/api/auto-launch-check] error:", e);
    // Fail silent — the nudge is enhancement, not core UX. Don't break the dashboard.
    return NextResponse.json({ shouldNudge: false, reason: "error" });
  }
}

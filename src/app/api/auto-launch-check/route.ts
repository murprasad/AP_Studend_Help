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
 *   2. User has ≥2 DashboardImpression rows today
 *   3. User has 0 StudentResponse rows today
 *
 * The nudge is natural self-limiting: after the user accepts and
 * answers ≥1 question, condition #3 fails and they won't be nudged
 * again today. Dismissing the nudge is client-side (sessionStorage) —
 * the backend doesn't track dismissals because "still shown to 2+
 * visitors that haven't practiced" is a signal worth re-surfacing.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPremiumForTrack, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

export const dynamic = "force-dynamic";

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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [dashViews, qsAnsweredToday] = await Promise.all([
      prisma.dashboardImpression.count({
        where: { userId, dashboardLoadedAt: { gte: startOfDay } },
      }),
      prisma.studentResponse.count({
        where: { userId, answeredAt: { gte: startOfDay } },
      }),
    ]);

    const shouldNudge = dashViews >= 2 && qsAnsweredToday === 0;

    return NextResponse.json({
      shouldNudge,
      reason: shouldNudge
        ? `dashboard_views=${dashViews}, qs_today=0`
        : qsAnsweredToday > 0
          ? "already_practiced_today"
          : "first_visit",
      dashViews,
      qsAnsweredToday,
    });
  } catch (e) {
    console.error("[/api/auto-launch-check] error:", e);
    // Fail silent — the nudge is enhancement, not core UX. Don't break the dashboard.
    return NextResponse.json({ shouldNudge: false, reason: "error" });
  }
}

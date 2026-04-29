/**
 * GET /api/user/conversion-signal
 *
 * Single-shot endpoint that tells the client everything it needs to
 * decide whether to show the diagnostic nudge modal:
 *   - `responseCount` — lifetime correct+wrong answers
 *   - `hasDiagnostic` — whether a diagnostic result row exists
 *   - `hasTrial`     — whether a free trial was ever started
 *
 * Called after answer submission in the practice flow. If the count
 * crosses a threshold (5 or 10) and `!hasDiagnostic`, the client opens
 * the nudge modal. Cheap — three `count`/`exists` queries, no joins.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  // SEC-3 (2026-04-24): return 401 for anonymous to match the rest of the
  // user-scoped API surface. Previous 200 with placeholder was not a data
  // leak (values are invariant for anon) but broke the auth convention
  // flagged in the security audit. Callers (diagnostic-nudge-modal) handle
  // non-OK responses gracefully — no client change needed.
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Beta 9.1.4 — extended for JourneyHeroCard state machine.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [responseCount, diag, user, frqAttempt, sessionsToday] = await Promise.all([
    prisma.studentResponse.count({ where: { userId } }),
    prisma.diagnosticResult.findFirst({ where: { userId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { freeTrialCourse: true, subscriptionTier: true, createdAt: true },
    }),
    prisma.frqAttempt.findFirst({ where: { userId }, select: { id: true, frq: { select: { course: true } } } }),
    prisma.studentResponse.count({ where: { userId, answeredAt: { gte: startOfDay } } }),
  ]);

  const cohortAgeDays = user?.createdAt
    ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return NextResponse.json({
    responseCount,
    hasDiagnostic: !!diag,
    hasFrqAttempt: !!frqAttempt,
    frqAttemptCourse: frqAttempt?.frq?.course ?? null,
    hasTrial: !!user?.freeTrialCourse,
    subscriptionTier: user?.subscriptionTier ?? "FREE",
    cohortAgeDays,
    answeredToday: sessionsToday,
  });
}

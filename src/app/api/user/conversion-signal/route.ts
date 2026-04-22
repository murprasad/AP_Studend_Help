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
  if (!session?.user?.id) {
    return NextResponse.json({ responseCount: 0, hasDiagnostic: false, hasTrial: false });
  }
  const userId = session.user.id;

  const [responseCount, diag, user] = await Promise.all([
    prisma.studentResponse.count({ where: { userId } }),
    prisma.diagnosticResult.findFirst({ where: { userId }, select: { id: true } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { freeTrialCourse: true, subscriptionTier: true },
    }),
  ]);

  return NextResponse.json({
    responseCount,
    hasDiagnostic: !!diag,
    hasTrial: !!user?.freeTrialCourse,
    subscriptionTier: user?.subscriptionTier ?? "FREE",
  });
}

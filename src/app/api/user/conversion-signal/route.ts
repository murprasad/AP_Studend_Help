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

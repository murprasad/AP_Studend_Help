/**
 * GET/POST /api/cron/pass-guarantee-eligibility
 *
 * Auto-flips `User.passGuaranteeEligible = true` for users who meet all
 * three criteria from docs/cross-product-learnings-from-nursehub.md §1:
 *   1. ≥80% of generated study plan complete (StudyPlan items checked off
 *      OR equivalent practice activity per unit)
 *   2. ≥3 full-length mock exams completed with ≥75 average score
 *   3. Subscription tier is paid (i.e. NOT FREE)
 *
 * Once eligible, the user sees the dashboard banner + the /pass-guarantee
 * link becomes a claim form (Batch 3 — refund flow + Stripe integration).
 *
 * Auth: Bearer CRON_SECRET. External scheduler hits hourly OR can be
 * invoked manually for one-off backfill:
 *
 *   curl -X POST https://studentnest.ai/api/cron/pass-guarantee-eligibility \
 *        -H "Authorization: Bearer $CRON_SECRET" \
 *        -H "Content-Type: application/json" \
 *        -d '{"dryRun": true}'
 *
 * Returns JSON report of who was newly flagged.
 *
 * NurseHub Batch 2 — schema added 2026-05-14 (commit 22f84c4-mirror).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Report {
  scanned: number;
  newlyEligible: Array<{ userId: string; email: string; criteriaMet: string[] }>;
  alreadyEligible: number;
  notYetEligible: number;
  durationMs: number;
}

const MIN_STUDY_PLAN_COMPLETION = 0.80;    // 80%
const MIN_MOCK_EXAMS = 3;
const MIN_MOCK_AVG_SCORE = 75;             // %

async function checkEligibility(userId: string): Promise<{ eligible: boolean; criteriaMet: string[] }> {
  const criteriaMet: string[] = [];

  // Criterion 3 (cheapest — check first to short-circuit free users)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, passGuaranteeEligible: true },
  });
  if (!user) return { eligible: false, criteriaMet };
  if (user.passGuaranteeEligible) {
    // Already eligible — skip re-checking criteria, save work
    return { eligible: true, criteriaMet: ["already_eligible"] };
  }
  if (user.subscriptionTier === "FREE") {
    return { eligible: false, criteriaMet };
  }
  criteriaMet.push("paid_subscription");

  // Criterion 2 — ≥3 mock exams with ≥75 avg
  const mocks = await prisma.practiceSession.findMany({
    where: {
      userId,
      sessionType: "MOCK_EXAM",
      status: "COMPLETED",
      // We want score as the percent-correct, which is stored as 0-100 in
      // PracticeSession.score (see api/diagnostic/complete/route.ts:67).
      score: { not: null },
    },
    select: { score: true },
  });
  if (mocks.length < MIN_MOCK_EXAMS) {
    return { eligible: false, criteriaMet };
  }
  // Use the best 3 mock scores (per pass-guarantee.tsx policy:
  // "You can take as many as you'd like — only your best 3 count").
  const sortedScores = mocks.map((m) => m.score ?? 0).sort((a, b) => b - a).slice(0, MIN_MOCK_EXAMS);
  const avgScore = sortedScores.reduce((a, b) => a + b, 0) / sortedScores.length;
  if (avgScore < MIN_MOCK_AVG_SCORE) {
    return { eligible: false, criteriaMet };
  }
  criteriaMet.push(`mock_avg_${avgScore.toFixed(1)}`);

  // Criterion 1 — ≥80% study plan complete
  // Study plan completion isn't a single field; we approximate via
  // MasteryScore coverage. A user is "completing the plan" if they have
  // mastery scores recorded for ≥80% of the units in their selected
  // course. This is the rough heuristic Batch 3 will refine when the
  // study plan tracking is more structured.
  //
  // For now: count MasteryScore rows the user has across their COURSE.
  // Compare against the unit count for that course.
  const studyPlan = await prisma.studyPlan.findFirst({
    where: { userId, isActive: true },
    select: { id: true, course: true, planData: true },
  });
  if (!studyPlan) {
    // No active study plan — can't be eligible
    return { eligible: false, criteriaMet };
  }

  // Approximate completion: mastery scores recorded vs total units.
  // (Real completion tracking lands in Batch 3 with explicit study-plan
  // item-checkoff.)
  const masteryRows = await prisma.masteryScore.count({
    where: { userId, course: studyPlan.course },
  });
  // We don't know the unit count without importing COURSE_REGISTRY; treat
  // ≥8 mastery rows as approximate "80% of a typical AP course's ~10 units."
  if (masteryRows < 8) {
    return { eligible: false, criteriaMet };
  }
  criteriaMet.push(`mastery_units_${masteryRows}`);

  return { eligible: true, criteriaMet };
}

async function authorize(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${cronSecret}`;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  if (!(await authorize(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const dryRun = !!body?.dryRun;
  const startTs = Date.now();

  const report: Report = {
    scanned: 0,
    newlyEligible: [],
    alreadyEligible: 0,
    notYetEligible: 0,
    durationMs: 0,
  };

  // Scope: paid users only, who aren't already eligible. Saves DB work —
  // free users can never qualify, already-eligible users don't need re-check.
  const candidates = await prisma.user.findMany({
    where: {
      subscriptionTier: { not: "FREE" },
      passGuaranteeEligible: false,
    },
    select: { id: true, email: true },
    take: 1000,  // CF Workers 30s cap — process in batches
  });

  report.scanned = candidates.length;

  for (const c of candidates) {
    const { eligible, criteriaMet } = await checkEligibility(c.id);
    if (eligible) {
      report.newlyEligible.push({ userId: c.id, email: c.email, criteriaMet });
      if (!dryRun) {
        await prisma.user.update({
          where: { id: c.id },
          data: {
            passGuaranteeEligible: true,
            passGuaranteeEligibleAt: new Date(),
          },
        });
      }
    } else {
      report.notYetEligible++;
    }
  }

  report.durationMs = Date.now() - startTs;
  return NextResponse.json({ ok: true, dryRun, ...report });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}

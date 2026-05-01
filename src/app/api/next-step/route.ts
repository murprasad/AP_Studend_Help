/**
 * GET /api/next-step?course=AP_BIOLOGY
 *
 * Single source of truth for "what should this user do next?" Beta 10
 * (2026-05-01). Fans out to the existing data tables in parallel, feeds
 * the snapshot into computeNextStep(), and returns the prescribed action.
 *
 * Every recommendation surface (dashboard hero, post-session card,
 * post-journey hero, FRQ cap screen) consumes this endpoint via the
 * `useNextStep` hook — no surface decides on its own.
 *
 * Direct Prisma queries (not internal HTTP fan-out) — keeps the request
 * to a single DB round-trip cluster on Cloudflare Workers.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, ApUnit, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";
import { loadReadinessSnapshot } from "@/lib/score-engine-inputs";
import { computeNextStep, type NextStepInputs } from "@/lib/next-step-engine";
import { FREE_LIMITS } from "@/lib/tier-limits";

export const dynamic = "force-dynamic";

/**
 * Pick the user's weakest unit in this course from mastery scores.
 * Prefers units with attempts > 0 (real signal); falls back to first config
 * unit if nothing has been attempted (so we still suggest a starting point
 * rather than emit null).
 *
 * missRatePct = 100 - masteryScore. Mastery score is already a 0-100
 * weighted-accuracy field, so this gives an honest "how often you miss"
 * approximation that matches what coach-plan uses.
 */
function deriveWeakestUnit(
  course: ApCourse,
  mastery: Array<{ unit: ApUnit; masteryScore: number; totalAttempts: number }>,
): { unit: string; unitName: string; missRatePct: number } | null {
  const config = COURSE_REGISTRY[course];
  if (!config) return null;

  const attempted = mastery.filter((m) => m.totalAttempts > 0);
  const pick = attempted.length > 0 ? attempted[0] : null;
  if (!pick) return null;

  const meta = config.units[pick.unit as ApUnit];
  if (!meta) return null;

  return {
    unit: pick.unit,
    unitName: meta.name,
    missRatePct: Math.max(0, Math.min(100, 100 - pick.masteryScore)),
  };
}

const FRQ_TYPES: Array<{ key: string; type: QuestionType; limitField: keyof typeof FREE_LIMITS }> = [
  { key: "DBQ", type: "DBQ" as QuestionType, limitField: "dbqFreeAttemptsPerCourse" },
  { key: "LEQ", type: "LEQ" as QuestionType, limitField: "leqFreeAttemptsPerCourse" },
  { key: "SAQ", type: "SAQ" as QuestionType, limitField: "saqFreeAttemptsPerCourse" },
  { key: "FRQ", type: "FRQ" as QuestionType, limitField: "frqFreeAttemptsPerCourse" },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";
    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Parallel fan-out — all reads are independent.
    const [
      user,
      premiumSub,
      journey,
      // Conversion-signal pieces
      responseCount,
      responseCountInCourse,
      diag,
      diagInCourse,
      frqAttempt,
      frqAttemptInCourse,
      answeredToday,
      answeredTodayInCourse,
      latestResponse,
      // Readiness
      readinessSnapshot,
      // Mastery (used to derive weakestUnit for the engine)
      mastery,
      // FRQ-type caps (4 parallel counts, joined to question table)
      dbqAttempts,
      leqAttempts,
      saqAttempts,
      frqAttempts,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, createdAt: true },
      }),
      prisma.moduleSubscription.findFirst({
        where: { userId, status: { in: ["active", "ACTIVE", "trialing", "TRIALING"] } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.userJourney.findUnique({ where: { userId } }),
      prisma.studentResponse.count({ where: { userId } }),
      prisma.studentResponse.count({ where: { userId, question: { course } } }),
      prisma.diagnosticResult.findFirst({ where: { userId }, select: { id: true } }),
      prisma.diagnosticResult.findFirst({ where: { userId, course }, select: { id: true } }),
      prisma.frqAttempt.findFirst({ where: { userId }, select: { id: true } }),
      prisma.frqAttempt.findFirst({ where: { userId, frq: { course } }, select: { id: true } }),
      prisma.studentResponse.count({ where: { userId, answeredAt: { gte: startOfDay } } }),
      prisma.studentResponse.count({
        where: { userId, answeredAt: { gte: startOfDay }, question: { course } },
      }),
      prisma.studentResponse.findFirst({
        where: { userId },
        orderBy: { answeredAt: "desc" },
        select: { answeredAt: true },
      }),
      loadReadinessSnapshot(userId, course, prisma).catch(() => null),
      prisma.masteryScore.findMany({
        where: { userId, course },
        orderBy: { masteryScore: "asc" },
        select: { unit: true, masteryScore: true, totalAttempts: true },
      }),
      prisma.studentResponse.count({
        where: { userId, question: { questionType: "DBQ", course } },
      }),
      prisma.studentResponse.count({
        where: { userId, question: { questionType: "LEQ", course } },
      }),
      prisma.studentResponse.count({
        where: { userId, question: { questionType: "SAQ", course } },
      }),
      prisma.studentResponse.count({
        where: { userId, question: { questionType: "FRQ", course } },
      }),
    ]);

    const subscriptionTier = user?.subscriptionTier === "PREMIUM" ? "PREMIUM" : "FREE";
    const isPremium = subscriptionTier === "PREMIUM" || !!premiumSub;
    const effectiveTier: "FREE" | "PREMIUM" = isPremium ? "PREMIUM" : "FREE";
    const daysAsPremium = premiumSub
      ? Math.floor((Date.now() - new Date(premiumSub.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const cohortAgeDays = user?.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const daysSinceLastSession = latestResponse?.answeredAt
      ? Math.floor((Date.now() - new Date(latestResponse.answeredAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Determine which FRQ types are capped for this user-in-this-course.
    const attemptsByType: Record<string, number> = {
      DBQ: dbqAttempts,
      LEQ: leqAttempts,
      SAQ: saqAttempts,
      FRQ: frqAttempts,
    };
    const frqCappedTypes = effectiveTier === "FREE"
      ? FRQ_TYPES.filter((t) => attemptsByType[t.key] >= (FREE_LIMITS[t.limitField] as number)).map((t) => t.key)
      : [];

    const practiceCappedToday =
      effectiveTier === "FREE" && answeredToday >= FREE_LIMITS.practiceQuestionsPerDay;

    // Daily-goal lite: targetQs is the house default (10), goalHit derived from
    // today's per-course count. Engine doesn't currently consume goalHit but
    // keeping the field populated lets future kinds (daily_goal_hit celebration)
    // light up without a schema change.
    const dailyTarget = 10;
    const dailyGoal = {
      targetQs: dailyTarget,
      answeredToday: answeredTodayInCourse,
      goalHit: answeredTodayInCourse >= dailyTarget,
      progressPercent: Math.min(100, Math.round((answeredTodayInCourse / dailyTarget) * 100)),
    };

    const inputs: NextStepInputs = {
      course,
      subscriptionTier: effectiveTier,
      daysAsPremium,
      journey: journey
        ? {
            currentStep: journey.currentStep,
            completedAt: journey.completedAt,
            weakestUnit: journey.weakestUnit,
          }
        : null,
      signal: {
        responseCount,
        responseCountInCourse,
        hasDiagnostic: !!diag,
        hasDiagnosticInCourse: !!diagInCourse,
        hasFrqAttempt: !!frqAttempt,
        hasFrqAttemptInCourse: !!frqAttemptInCourse,
        answeredToday,
        answeredTodayInCourse,
        daysSinceLastSession,
        cohortAgeDays,
      },
      readiness: {
        weakestUnit: deriveWeakestUnit(course, mastery),
        scaledScore: readinessSnapshot?.scaledScore ?? null,
        scaleMax: readinessSnapshot?.scaleMax ?? 5,
      },
      dailyGoal,
      caps: { practiceCappedToday, frqCappedTypes },
    };

    const nextStep = computeNextStep(inputs);

    return NextResponse.json(
      { nextStep, debug: process.env.NEXT_STEP_DEBUG === "true" ? { inputs } : undefined },
      { headers: { "Cache-Control": "private, max-age=30" } },
    );
  } catch (err) {
    console.error("[/api/next-step] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

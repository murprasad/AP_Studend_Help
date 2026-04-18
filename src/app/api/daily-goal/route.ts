/**
 * GET /api/daily-goal — today's target tied to projected score delta.
 *
 * Replaces the generic "practice today" goal with score-movement language.
 * Reuses `loadReadinessSnapshot` (single SoT for the scaled score) and
 * `computeDailyGoal` (pure logic layered on top of `projectImprovement`).
 *
 * Response shape:
 *   {
 *     targetQs: 10,
 *     answeredToday: N,
 *     scoreDeltaProjected: number,   // 0-100 pp
 *     goalHit: boolean,
 *     beforeScore: number | null,    // family-native (e.g., AP 1-5)
 *     currentScore: number | null,   // same shape as beforeScore today
 *     family: "AP" | "SAT" | "ACT",
 *     scaleMax: number,
 *     projectedScore: number | null, // family-native after +1 day of practice
 *     hasSignal: boolean,            // false → show "keep practicing…" copy
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { loadReadinessSnapshot } from "@/lib/score-engine-inputs";
import { computeDailyGoal, DEFAULT_DAILY_TARGET } from "@/lib/daily-goal";

export const dynamic = "force-dynamic";

/**
 * Convert a 0-100 composite back into the family-native scale for display.
 * Matches the rough shape of each predictor's scale-up so the numbers we
 * show line up with the readiness card (±1 unit). The readiness card
 * remains the source of truth for the raw displayed score — this mapping
 * is only used to render the projected delta in the same unit.
 */
function toFamilyScore(pp: number, family: "AP" | "SAT" | "ACT"): number {
  const clamped = Math.max(0, Math.min(100, pp));
  if (family === "AP") {
    // 0-100 pp → 1.0-5.0, one decimal place.
    const ap = 1 + (clamped / 100) * 4;
    return Math.round(ap * 10) / 10;
  }
  if (family === "SAT") {
    // 0-100 → 400-1600, rounded to nearest 10.
    const sat = 400 + (clamped / 100) * 1200;
    return Math.round(sat / 10) * 10;
  }
  // ACT: 0-100 → 1-36.
  const act = 1 + (clamped / 100) * 35;
  return Math.round(act * 10) / 10;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";

    if (!VALID_AP_COURSES.includes(course)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    const snapshot = await loadReadinessSnapshot(userId, course, prisma);

    // Today's answered-question count — scoped to the selected course so
    // the goal progress bar reflects work on *this* exam, not cross-course.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let answeredToday = 0;
    try {
      answeredToday = await prisma.studentResponse.count({
        where: {
          userId,
          answeredAt: { gte: todayStart },
          session: { course },
        },
      });
    } catch {
      answeredToday = 0;
    }

    // Derive a 0-100 composite from the scaled score.
    // The `showScore` guard captures the "too little signal" case: when the
    // predictor has no data, the composite is meaningless → hasSignal=false.
    const hasSignal = snapshot.showScore && snapshot.scaleMax > 0;
    const currentPassPercent = hasSignal
      ? (() => {
          if (snapshot.family === "AP") return (snapshot.scaledScore / 5) * 100;
          if (snapshot.family === "SAT") return ((snapshot.scaledScore - 400) / 1200) * 100;
          // ACT
          return ((snapshot.scaledScore - 1) / 35) * 100;
        })()
      : 0;

    const goal = computeDailyGoal(currentPassPercent, answeredToday);

    const beforeScore = hasSignal ? toFamilyScore(currentPassPercent, snapshot.family) : null;
    const currentScore = beforeScore;
    const projectedScore = hasSignal
      ? toFamilyScore(currentPassPercent + goal.scoreDeltaProjected, snapshot.family)
      : null;

    return NextResponse.json(
      {
        targetQs: goal.targetQs,
        answeredToday,
        scoreDeltaProjected: goal.scoreDeltaProjected,
        goalHit: goal.goalHit,
        progressPercent: goal.progressPercent,
        beforeScore,
        currentScore,
        projectedScore,
        family: snapshot.family,
        scaleMax: snapshot.scaleMax,
        hasSignal,
        defaultTarget: DEFAULT_DAILY_TARGET,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    console.error("[/api/daily-goal] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

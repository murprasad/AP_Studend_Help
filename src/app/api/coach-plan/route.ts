/**
 * GET /api/coach-plan — Dashboard "Coach Mode" prescription.
 *
 * One server call returns everything the CoachCard renders: rough score
 * (even pre-diagnostic), confidence, target, questions-to-target, the
 * single weakest unit, a single "next action" CTA, and the accuracy
 * delta vs the prior two-week window.
 *
 * Reads from the same `loadReadinessSnapshot` the ReadinessCard uses so
 * score numbers can't drift between the hero card and the coach card.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import { loadReadinessSnapshot } from "@/lib/score-engine-inputs";
import { buildCoachPlan } from "@/lib/coach-plan";
import { COURSE_UNITS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

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

    const [snapshot, user, priorSessions, masteryRows] = await Promise.all([
      loadReadinessSnapshot(userId, course, prisma),
      prisma.user.findUnique({ where: { id: userId }, select: { examDate: true } }),
      // Prior two-week window, for accuracy delta.
      prisma.practiceSession.findMany({
        where: {
          userId,
          course,
          completedAt: {
            gte: new Date(Date.now() - 2 * TWO_WEEKS_MS),
            lt: new Date(Date.now() - TWO_WEEKS_MS),
          },
          status: "COMPLETED",
        },
        select: { totalQuestions: true, correctAnswers: true },
      }),
      prisma.masteryScore.findMany({
        where: { userId, course },
        select: { unit: true, masteryScore: true, accuracy: true, totalAttempts: true },
      }),
    ]);

    const priorAnswered = priorSessions.reduce((s, r) => s + (r.totalQuestions ?? 0), 0);
    const priorCorrect = priorSessions.reduce((s, r) => s + (r.correctAnswers ?? 0), 0);
    const priorAccuracy = priorAnswered > 0 ? (priorCorrect / priorAnswered) * 100 : null;

    const unitMap = COURSE_UNITS[course] as Record<string, string> | undefined;
    const mastery = masteryRows.map((m) => ({
      unit: m.unit,
      unitName: unitMap?.[m.unit] ?? m.unit,
      masteryScore: m.masteryScore ?? 0,
      accuracy: m.accuracy ?? 0,
      totalAttempts: m.totalAttempts ?? 0,
    }));
    const masteryAvg =
      mastery.length > 0
        ? mastery.reduce((s, r) => s + (r.masteryScore ?? 0), 0) / mastery.length
        : 0;

    const plan = buildCoachPlan({
      family: snapshot.family as "AP" | "SAT" | "ACT",
      scaledScore: snapshot.scaledScore,
      scaleMax: snapshot.scaleMax,
      showScore: snapshot.showScore,
      hasDiagnostic: snapshot.hasDiagnostic,
      totalAnswered: snapshot.totalAnswered,
      recentAccuracy: snapshot.recentAccuracy,
      priorAccuracy,
      examDate: user?.examDate ?? null,
      mastery,
      masteryAvg,
    });

    return NextResponse.json(
      {
        ...plan,
        family: snapshot.family,
        scaleMax: snapshot.scaleMax,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    console.error("[/api/coach-plan] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

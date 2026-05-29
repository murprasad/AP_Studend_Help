/**
 * GET /api/todays-set?course=X
 *
 * Returns the user's Today's Set for the given course. If a plan for today
 * (UTC midnight) already exists in DailyPracticePlan, return it. Otherwise
 * generate a new one and persist.
 *
 * Response:
 *   {
 *     plan: { questionIds: string[], conceptKeys: string[], expectedDeltaPctHint: number },
 *     alreadyDone: boolean,
 *     generated: boolean,  // false if served from cache
 *   }
 *
 * Designed for the dashboard hero CTA. Cheap (<150ms).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTodaysSet } from "@/lib/todays-set";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_COURSE_PREFIX = ["AP_", "SAT_", "PSAT_", "ACT_"];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseParam = searchParams.get("course");
    if (!courseParam || !VALID_COURSE_PREFIX.some(p => courseParam.startsWith(p))) {
      return NextResponse.json({ error: "Missing or invalid course" }, { status: 400 });
    }
    const course = courseParam as ApCourse;
    const userId = session.user.id;

    const now = new Date();
    const todayUtc = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    ));

    // Already have a plan for today?
    const existing = await prisma.dailyPracticePlan.findUnique({
      where: { userId_course_forDate: { userId, course, forDate: todayUtc } },
    });
    if (existing) {
      return NextResponse.json({
        plan: {
          questionIds: existing.questionIds,
          conceptKeys: existing.conceptKeys,
          expectedDeltaPctHint: existing.expectedDeltaPct ?? 0,
        },
        alreadyDone: existing.completedAt !== null,
        generated: false,
      });
    }

    // Build inputs.
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
    const [candidatePool, pastResponses, unitMasteries] = await Promise.all([
      // Approved questions in this course. Cap to a sane upper bound to
      // avoid pulling huge pools — randomize the take with a recent take.
      prisma.question.findMany({
        where: { course, isApproved: true },
        take: 500,
        select: { id: true, unit: true, difficulty: true },
      }),
      // All responses for this user/course in the last 30 days.
      prisma.studentResponse.findMany({
        where: {
          userId,
          question: { course },
          answeredAt: { gte: new Date(now.getTime() - 30 * 86400000) },
        },
        orderBy: { answeredAt: "desc" },
        select: { questionId: true, isCorrect: true, confidenceSelf: true, answeredAt: true },
        take: 200,
      }),
      prisma.masteryScore.findMany({
        where: { userId, course },
        select: { unit: true, masteryScore: true },
      }),
    ]);

    if (candidatePool.length === 0) {
      return NextResponse.json({
        plan: { questionIds: [], conceptKeys: [], expectedDeltaPctHint: 0 },
        alreadyDone: false,
        generated: false,
        warning: "No approved questions for this course",
      });
    }

    // If user has zero mastery rows, treat every unit equally (use Question.unit values).
    let masteries: { unit: string; masteryScore: number }[] = unitMasteries.map(m => ({
      unit: m.unit,
      masteryScore: m.masteryScore,
    }));
    if (masteries.length === 0) {
      const distinctUnits = Array.from(new Set(candidatePool.map(q => q.unit)));
      masteries = distinctUnits.map(u => ({ unit: u, masteryScore: 50 }));
    }

    const result = generateTodaysSet({
      candidatePool: candidatePool.map(q => ({ id: q.id, unit: q.unit, difficulty: q.difficulty })),
      pastResponses: pastResponses.map(r => ({
        questionId: r.questionId,
        isCorrect: r.isCorrect,
        confidenceSelf: r.confidenceSelf,
        answeredAt: r.answeredAt,
      })),
      unitMasteries: masteries,
    });

    await prisma.dailyPracticePlan.create({
      data: {
        userId,
        course,
        forDate: todayUtc,
        questionIds: result.questionIds,
        conceptKeys: result.conceptKeys,
        expectedDeltaPct: result.expectedDeltaPctHint,
      },
    }).catch(() => { /* race ignored */ });

    return NextResponse.json({
      plan: {
        questionIds: result.questionIds,
        conceptKeys: result.conceptKeys,
        expectedDeltaPctHint: result.expectedDeltaPctHint,
      },
      alreadyDone: false,
      generated: true,
    });
  } catch (err) {
    console.error("[/api/todays-set] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

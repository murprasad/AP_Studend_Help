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
 *     conceptMeta: Array<{
 *       key: string,         // "unit:ACT_ENG_1_PRODUCTION_WRITING"
 *       attempts: number,    // historic Qs answered in this unit
 *       mastery: number,     // 0-1 accuracy in this unit
 *       isUntried: boolean,  // attempts == 0
 *     }>,
 *     alreadyDone: boolean,
 *     generated: boolean,  // false if served from cache
 *   }
 *
 * 2026-06-01 conceptMeta added (bug #1, #5, #9 from persona walkthrough)
 * so TodaysSetCard can render correct verb (Try vs Strengthen vs Polish)
 * and not claim "Strengthen X" for units the user has never touched.
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
    // Shared helper: derive per-unit attempts + accuracy from this user's
    // course responses. Used for both cached and freshly-generated plans
    // so the conceptMeta is always live (not stale from yesterday's plan).
    const buildConceptMeta = async (keys: string[]) => {
      if (keys.length === 0) return [];
      const units = keys.map((k) => (k.startsWith("unit:") ? k.slice(5) : k));
      const rows: Array<{ unit: string; attempts: number; correct: number }> = await prisma.$queryRawUnsafe(
        `SELECT q.unit::text AS unit,
                COUNT(*)::int AS attempts,
                COUNT(*) FILTER (WHERE sr."isCorrect" = true)::int AS correct
         FROM student_responses sr
         JOIN questions q ON q.id = sr."questionId"
         WHERE sr."userId" = $1
           AND q.course = $2::"ApCourse"
           AND q.unit = ANY($3::"ApUnit"[])
         GROUP BY q.unit`,
        userId, course, units,
      );
      const byUnit: Record<string, { attempts: number; correct: number }> = {};
      for (const r of rows) byUnit[r.unit] = { attempts: r.attempts, correct: r.correct };
      return keys.map((key) => {
        const unit = key.startsWith("unit:") ? key.slice(5) : key;
        const row = byUnit[unit] ?? { attempts: 0, correct: 0 };
        return {
          key,
          attempts: row.attempts,
          mastery: row.attempts > 0 ? row.correct / row.attempts : 0,
          isUntried: row.attempts === 0,
        };
      });
    };

    if (existing) {
      const conceptMeta = await buildConceptMeta(existing.conceptKeys);
      return NextResponse.json({
        plan: {
          questionIds: existing.questionIds,
          conceptKeys: existing.conceptKeys,
          expectedDeltaPctHint: existing.expectedDeltaPct ?? 0,
        },
        conceptMeta,
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

    // 2026-05-30 — Safety net: if the generator returned empty questionIds
    // but the candidate pool has questions, fall back to the first 12 of
    // the pool. Real-user report: +free saw "no targeted set ready" on
    // dashboard even though candidate pool had hundreds of Qs. Better to
    // serve generic Qs than empty UX.
    if (result.questionIds.length === 0 && candidatePool.length > 0) {
      const recentQids = new Set(pastResponses.map(r => r.questionId));
      const fallback = candidatePool
        .filter(q => !recentQids.has(q.id))
        .slice(0, 12)
        .map(q => q.id);
      result.questionIds = fallback;
      if (result.conceptKeys.length === 0 && candidatePool.length > 0) {
        result.conceptKeys = [`unit:${candidatePool[0].unit}`];
      }
    }

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

    const conceptMeta = await buildConceptMeta(result.conceptKeys);
    return NextResponse.json({
      plan: {
        questionIds: result.questionIds,
        conceptKeys: result.conceptKeys,
        expectedDeltaPctHint: result.expectedDeltaPctHint,
      },
      conceptMeta,
      alreadyDone: false,
      generated: true,
    });
  } catch (err) {
    console.error("[/api/todays-set] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

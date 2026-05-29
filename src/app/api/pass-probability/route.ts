/**
 * GET /api/pass-probability?course=X
 *
 * Returns the user's calibrated pass probability + confidence interval +
 * driver factors for the given course. Designed to be cheap (< 100ms) so
 * the dashboard hero can render it inline on every visit.
 *
 * Response (200):
 *   {
 *     passProbability: number | null,  // null when sampleSize < 10
 *     confidenceInterval: number | null,
 *     sampleSize: number,
 *     components: { mockTerm, drillTerm, coverageTerm, frictionPenalty },
 *     drivers: [{ conceptKey, currentMastery, deltaIfMastered }, ...],
 *     modelVersion: string,
 *     priorSnapshot?: { passProbability, computedAt }  // for delta arrows
 *   }
 *
 * Pulls data fresh from Prisma each call (cheap on Neon HTTP). The
 * snapshot cron writes one row/day; this endpoint can ALSO write a
 * snapshot opportunistically if the day's row is missing — that keeps
 * the calibration corpus complete even if the cron misses.
 *
 * Pass Plan / Free both supported. No tier-gating: the number is
 * informational even for Free users (it powers the upsell).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  computePassProbability,
  passThresholdForCourse,
  PASS_PROB_MODEL_VERSION,
} from "@/lib/pass-probability";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

const VALID_COURSE_PREFIX = ["AP_", "SAT_", "PSAT_", "ACT_"];
function isValidCourse(c: string): boolean {
  return typeof c === "string" && VALID_COURSE_PREFIX.some((p) => c.startsWith(p));
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseParam = searchParams.get("course");
    if (!courseParam || !isValidCourse(courseParam)) {
      return NextResponse.json({ error: "Missing or invalid course" }, { status: 400 });
    }
    const course = courseParam as ApCourse;
    const userId = session.user.id;

    // Pull inputs in parallel for latency.
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const [recentMocks, recentResponses, masteries, abandonedCount, priorSnapshot] = await Promise.all([
      // Top 3 most recent completed mock-exam sessions.
      prisma.practiceSession.findMany({
        where: { userId, course, sessionType: "MOCK_EXAM", completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 3,
        select: { correctAnswers: true, totalQuestions: true, completedAt: true },
      }),
      // Last 30 student responses for this course.
      // Course filter via question relation — index lookup.
      prisma.studentResponse.findMany({
        where: { userId, question: { course } },
        orderBy: { answeredAt: "desc" },
        take: 30,
        select: { isCorrect: true, answeredAt: true },
      }),
      // Per-unit mastery scores. Used as concept-mastery proxy until
      // QuestionConcept rows are populated (PRD Phase 3 backfill).
      prisma.masteryScore.findMany({
        where: { userId, course },
        select: { unit: true, masteryScore: true },
      }),
      // Abandoned sessions in last 7 days.
      prisma.practiceSession.count({
        where: {
          userId,
          course,
          startedAt: { gte: sevenDaysAgo },
          completedAt: null,
        },
      }),
      // Previous-day snapshot (for delta arrow in UI).
      prisma.passProbabilitySnapshot.findFirst({
        where: { userId, course },
        orderBy: { computedAt: "desc" },
        select: { passProbability: true, computedAt: true },
      }),
    ]);

    // Convert prisma rows into formula inputs.
    const result = computePassProbability({
      recentMocks: recentMocks
        .filter(m => m.completedAt && m.totalQuestions > 0)
        .map(m => ({
          score: m.correctAnswers / m.totalQuestions,
          takenAt: m.completedAt!,
        })),
      recentDrillResponses: recentResponses.map(r => ({
        isCorrect: r.isCorrect,
        answeredAt: r.answeredAt,
      })),
      conceptMasteries: masteries.map(m => ({
        conceptKey: `unit:${m.unit}`,
        mastery: m.masteryScore / 100, // MasteryScore stored as 0-100
      })),
      abandonedSessionsLast7d: abandonedCount,
      passThreshold: passThresholdForCourse(course),
    });

    // Opportunistically snapshot if no row exists for today (UTC date).
    if (result.passProbability !== null) {
      const todayUtc = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      ));
      const existing = await prisma.passProbabilitySnapshot.findFirst({
        where: { userId, course, computedAt: { gte: todayUtc } },
        select: { id: true },
      });
      if (!existing) {
        await prisma.passProbabilitySnapshot.create({
          data: {
            userId,
            course,
            passProbability: result.passProbability,
            confidenceInterval: result.confidenceInterval ?? 0,
            sampleSize: result.sampleSize,
            modelVersion: PASS_PROB_MODEL_VERSION,
            driverFactors: result.drivers as object,
          },
        }).catch(() => { /* race with concurrent call — fine */ });
      }
    }

    return NextResponse.json({
      passProbability: result.passProbability,
      confidenceInterval: result.confidenceInterval,
      sampleSize: result.sampleSize,
      components: result.components,
      drivers: result.drivers,
      modelVersion: PASS_PROB_MODEL_VERSION,
      priorSnapshot: priorSnapshot
        ? { passProbability: priorSnapshot.passProbability, computedAt: priorSnapshot.computedAt }
        : null,
    });
  } catch (err) {
    console.error("[/api/pass-probability] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

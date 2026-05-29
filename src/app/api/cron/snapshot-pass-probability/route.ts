/**
 * Cron: nightly Pass Probability snapshots.
 *
 * GET /api/cron/snapshot-pass-probability
 *   Auth: Bearer CRON_SECRET
 *
 * For each user with lastActiveDate in last 30 days, compute and persist
 * a PassProbabilitySnapshot row per (user, course) where the user has at
 * least 1 mock or 10 drill responses. Idempotent on (userId, course,
 * computedAt) via the unique constraint.
 *
 * Runs daily at 02:00 UTC via cron-job.org. Cheap: O(active users × courses
 * studied). Targets ~5 seconds total at 219 users.
 *
 * Endpoint also accepts ?dry=1 for safe diagnostics.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computePassProbability,
  passThresholdForCourse,
  PASS_PROB_MODEL_VERSION,
} from "@/lib/pass-probability";
import type { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Active users with at least one practice session in the last 30d.
  const activeUsers = await prisma.user.findMany({
    where: { lastActiveDate: { gte: thirtyDaysAgo } },
    select: { id: true, email: true },
  });

  let snapshotsWritten = 0;
  let snapshotsSkipped = 0;
  const errors: string[] = [];

  for (const user of activeUsers) {
    // Find courses they've practiced in the last 30d.
    const userCourses = await prisma.practiceSession.findMany({
      where: { userId: user.id, startedAt: { gte: thirtyDaysAgo } },
      distinct: ["course"],
      select: { course: true },
    });

    for (const { course } of userCourses) {
      try {
        // Skip if today's snapshot already exists.
        const existing = await prisma.passProbabilitySnapshot.findFirst({
          where: { userId: user.id, course, computedAt: { gte: todayUtc } },
          select: { id: true },
        });
        if (existing) { snapshotsSkipped++; continue; }

        // Pull inputs.
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const [mocks, responses, masteries, abandoned] = await Promise.all([
          prisma.practiceSession.findMany({
            where: { userId: user.id, course, sessionType: "MOCK_EXAM", completedAt: { not: null } },
            orderBy: { completedAt: "desc" },
            take: 3,
            select: { correctAnswers: true, totalQuestions: true, completedAt: true },
          }),
          prisma.studentResponse.findMany({
            where: { userId: user.id, question: { course: course as ApCourse } },
            orderBy: { answeredAt: "desc" },
            take: 30,
            select: { isCorrect: true, answeredAt: true },
          }),
          prisma.masteryScore.findMany({
            where: { userId: user.id, course: course as ApCourse },
            select: { unit: true, masteryScore: true },
          }),
          prisma.practiceSession.count({
            where: { userId: user.id, course, startedAt: { gte: sevenDaysAgo }, completedAt: null },
          }),
        ]);

        const result = computePassProbability({
          recentMocks: mocks
            .filter(m => m.completedAt && m.totalQuestions > 0)
            .map(m => ({ score: m.correctAnswers / m.totalQuestions, takenAt: m.completedAt! })),
          recentDrillResponses: responses.map(r => ({ isCorrect: r.isCorrect, answeredAt: r.answeredAt })),
          conceptMasteries: masteries.map(m => ({ conceptKey: `unit:${m.unit}`, mastery: m.masteryScore / 100 })),
          abandonedSessionsLast7d: abandoned,
          passThreshold: passThresholdForCourse(course as string),
        });

        if (result.passProbability === null) { snapshotsSkipped++; continue; }

        if (!dry) {
          await prisma.passProbabilitySnapshot.create({
            data: {
              userId: user.id,
              course,
              passProbability: result.passProbability,
              confidenceInterval: result.confidenceInterval ?? 0,
              sampleSize: result.sampleSize,
              modelVersion: PASS_PROB_MODEL_VERSION,
              driverFactors: result.drivers as object,
            },
          });
        }
        snapshotsWritten++;
      } catch (e) {
        errors.push(`${user.email}/${course}: ${String((e as Error).message ?? e).slice(0, 80)}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dry,
    activeUsers: activeUsers.length,
    snapshotsWritten,
    snapshotsSkipped,
    errors: errors.slice(0, 20),
  });
}

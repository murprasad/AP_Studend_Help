import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit } from "@prisma/client";
import { AP_UNITS } from "@/lib/utils";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get mastery scores for all units
  const masteryScores = await prisma.masteryScore.findMany({
    where: { userId },
  });

  // Fill in missing units with 0
  const allUnits = Object.keys(AP_UNITS) as ApUnit[];
  const masteryData = allUnits.map((unit) => {
    const score = masteryScores.find((m) => m.unit === unit);
    return {
      unit,
      unitName: AP_UNITS[unit],
      masteryScore: score?.masteryScore || 0,
      accuracy: score?.accuracy || 0,
      totalAttempts: score?.totalAttempts || 0,
      lastPracticed: score?.lastPracticed || null,
    };
  });

  // Get accuracy over time (last 14 days)
  const twoWeeksAgo = subDays(new Date(), 14);
  const recentSessions = await prisma.practiceSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      completedAt: { gte: twoWeeksAgo },
    },
    orderBy: { completedAt: "asc" },
  });

  const accuracyTimeline = recentSessions.map((s) => ({
    date: format(s.completedAt!, "MMM d"),
    accuracy: Math.round(s.score || 0),
    questions: s.totalQuestions,
  }));

  // Overall stats
  const allResponses = await prisma.studentResponse.findMany({
    where: { userId },
    select: { isCorrect: true, timeSpentSecs: true },
  });

  const totalAnswered = allResponses.length;
  const totalCorrect = allResponses.filter((r) => r.isCorrect).length;
  const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  const avgTime = totalAnswered > 0
    ? allResponses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAnswered
    : 0;

  // User info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalXp: true, level: true, streakDays: true },
  });

  // Best estimated AP score from completed mock exams
  const bestMockScore = await prisma.practiceSession.findFirst({
    where: {
      userId,
      sessionType: "MOCK_EXAM",
      status: "COMPLETED",
    },
    orderBy: { apScoreEstimate: "desc" },
    select: { apScoreEstimate: true },
  });

  return NextResponse.json({
    masteryData,
    accuracyTimeline,
    stats: {
      totalAnswered,
      totalCorrect,
      overallAccuracy: Math.round(overallAccuracy),
      avgTimeSecs: Math.round(avgTime),
      totalSessions: recentSessions.length,
      streakDays: user?.streakDays || 0,
      totalXp: user?.totalXp || 0,
      level: user?.level || 1,
      estimatedApScore: bestMockScore?.apScoreEstimate || null,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit, ApCourse } from "@prisma/client";
import { COURSE_UNITS } from "@/lib/utils";
import { VALID_AP_COURSES } from "@/lib/courses";
import { format } from "date-fns";

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

    const courseUnitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];
    const now = Date.now();
    const twoWeeksAgo = new Date(now - 14 * 86400000);
    const sevenDaysAgo = new Date(now - 7 * 86400000);

    // Batch: 4 independent queries in parallel
    const [masteryScores, user, allSessions, knowledgeChecks] = await Promise.all([
      prisma.masteryScore.findMany({ where: { userId, unit: { in: courseUnitKeys } } }),
      prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, level: true, streakDays: true } }),
      prisma.practiceSession.findMany({
        where: { userId, course },
        orderBy: { completedAt: "desc" },
      }),
      prisma.tutorKnowledgeCheck.findMany({
        where: { userId, course },
        select: { score: true },
      }),
    ]);

    // Derive all needed data from the single sessions list (avoid extra queries)
    const completedSessions = allSessions.filter(s => s.status === "COMPLETED" && s.completedAt);

    // Mastery data
    const unitLabels = COURSE_UNITS[course];
    const masteryData = courseUnitKeys.map((unit) => {
      const score = masteryScores.find((m) => m.unit === unit);
      return {
        unit,
        unitName: unitLabels[unit] || unit,
        masteryScore: score?.masteryScore || 0,
        accuracy: score?.accuracy || 0,
        totalAttempts: score?.totalAttempts || 0,
        lastPracticed: score?.lastPracticed || null,
      };
    });

    // Accuracy timeline (last 14 days)
    const recentCompleted = completedSessions
      .filter(s => s.completedAt! >= twoWeeksAgo)
      .reverse(); // oldest first for timeline
    const accuracyTimeline = recentCompleted.map((s) => ({
      date: format(s.completedAt!, "MMM d"),
      accuracy: Math.round(s.score || 0),
      questions: s.totalQuestions,
    }));

    // Overall stats — one more query for responses (dependent on session IDs)
    const sessionIds = allSessions.map(s => s.id);
    const allResponses = sessionIds.length > 0
      ? await prisma.studentResponse.findMany({
          where: { userId, sessionId: { in: sessionIds } },
          select: { isCorrect: true, timeSpentSecs: true },
        })
      : [];

    const totalAnswered = allResponses.length;
    const totalCorrect = allResponses.filter((r) => r.isCorrect).length;
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    const avgTime = totalAnswered > 0
      ? allResponses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAnswered : 0;

    // Best mock score
    const mockSessions = completedSessions.filter(s => s.sessionType === "MOCK_EXAM");
    const bestMockScore = mockSessions.length > 0
      ? Math.max(...mockSessions.map(s => s.apScoreEstimate ?? 0)) : null;

    // Predicted AP score
    const avgMastery = masteryScores.length > 0
      ? masteryScores.reduce((s, m) => s + m.masteryScore, 0) / masteryScores.length : 0;
    const recentForPrediction = completedSessions.filter(s => s.completedAt! >= twoWeeksAgo);
    const recentAccuracy = recentForPrediction.length > 0
      ? recentForPrediction.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)) * 100, 0) / recentForPrediction.length : 0;
    const latestMock = mockSessions[0]?.apScoreEstimate ?? null;
    const weightedScore = (avgMastery * 0.50) + (recentAccuracy * 0.30) + (latestMock ? latestMock * 20 * 0.20 : 0);
    const predictedScore = Math.min(5, Math.max(1, Math.ceil(weightedScore / 20))) as 1|2|3|4|5;
    const confidence: "low"|"medium"|"high" = allSessions.length > 20 ? "high" : allSessions.length > 5 ? "medium" : "low";

    // Weekly growth
    const recentWeek = completedSessions.filter(s => s.completedAt! >= sevenDaysAgo);
    const prevWeek = completedSessions.filter(s => s.completedAt! >= new Date(now - 14 * 86400000) && s.completedAt! < sevenDaysAgo);
    const recentWeekAcc = recentWeek.length > 0
      ? recentWeek.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)), 0) / recentWeek.length : 0;
    const prevWeekAcc = prevWeek.length > 0
      ? prevWeek.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)), 0) / prevWeek.length : 0;
    const weeklyGrowth = Math.round((recentWeekAcc - prevWeekAcc) * 100);

    // Knowledge check stats
    const totalChecks = knowledgeChecks.length;
    const avgComprehension = totalChecks > 0
      ? Math.round((knowledgeChecks.reduce((s, c) => s + c.score, 0) / (totalChecks * 3)) * 100) : null;

    return NextResponse.json({
      masteryData,
      accuracyTimeline,
      knowledgeCheckStats: { totalChecks, avgComprehension },
      stats: {
        totalAnswered,
        totalCorrect,
        overallAccuracy: Math.round(overallAccuracy),
        avgTimeSecs: Math.round(avgTime),
        totalSessions: recentCompleted.length,
        streakDays: user?.streakDays || 0,
        totalXp: user?.totalXp || 0,
        level: user?.level || 1,
        estimatedApScore: bestMockScore,
      },
      predictedScore: {
        score: predictedScore,
        confidence,
        weeklyGrowth,
        improving: weeklyGrowth > 0,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

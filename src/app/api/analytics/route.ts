import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit, ApCourse } from "@prisma/client";
import { COURSE_UNITS } from "@/lib/utils";
import { VALID_AP_COURSES } from "@/lib/courses";
import { subDays, format } from "date-fns";

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
    const twoWeeksAgo = subDays(new Date(), 14);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const fourteenToSevenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Run ALL independent queries in parallel to avoid CF Workers timeout
    const [
      masteryScores,
      recentSessions,
      courseSessionIds,
      user,
      bestMockScore,
      allMastery,
      recentSessionsForPrediction,
      mockExamSessions,
      totalSessionsCount,
      recentWeekSessions,
      prevWeekSessions,
      knowledgeChecks,
    ] = await Promise.all([
      prisma.masteryScore.findMany({ where: { userId, unit: { in: courseUnitKeys } } }),
      prisma.practiceSession.findMany({
        where: { userId, course, status: "COMPLETED", completedAt: { gte: twoWeeksAgo } },
        orderBy: { completedAt: "asc" },
      }),
      prisma.practiceSession.findMany({ where: { userId, course }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { totalXp: true, level: true, streakDays: true } }),
      prisma.practiceSession.findFirst({
        where: { userId, course, sessionType: "MOCK_EXAM", status: "COMPLETED" },
        orderBy: { apScoreEstimate: "desc" },
        select: { apScoreEstimate: true },
      }),
      prisma.masteryScore.findMany({ where: { userId, course }, select: { masteryScore: true } }),
      prisma.practiceSession.findMany({
        where: { userId, course, completedAt: { gte: twoWeeksAgo } },
        select: { correctAnswers: true, totalQuestions: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, course, sessionType: "MOCK_EXAM", completedAt: { not: null } },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { apScoreEstimate: true },
      }),
      prisma.practiceSession.count({ where: { userId, course } }),
      prisma.practiceSession.findMany({
        where: { userId, course, completedAt: { gte: sevenDaysAgo } },
        select: { correctAnswers: true, totalQuestions: true },
      }),
      prisma.practiceSession.findMany({
        where: { userId, course, completedAt: { gte: fourteenToSevenDaysAgo, lt: sevenDaysAgo } },
        select: { correctAnswers: true, totalQuestions: true },
      }),
      prisma.tutorKnowledgeCheck.findMany({
        where: { userId, course },
        select: { score: true, topic: true, completedAt: true },
      }),
    ]);

    // Process mastery data
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

    // Accuracy timeline
    const accuracyTimeline = recentSessions.map((s) => ({
      date: format(s.completedAt!, "MMM d"),
      accuracy: Math.round(s.score || 0),
      questions: s.totalQuestions,
    }));

    // Overall stats — run responses query only if sessions exist
    const sessionIdList = courseSessionIds.map((s) => s.id);
    const allResponses = sessionIdList.length > 0
      ? await prisma.studentResponse.findMany({
          where: { userId, sessionId: { in: sessionIdList } },
          select: { isCorrect: true, timeSpentSecs: true },
        })
      : [];

    const totalAnswered = allResponses.length;
    const totalCorrect = allResponses.filter((r) => r.isCorrect).length;
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    const avgTime = totalAnswered > 0
      ? allResponses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAnswered
      : 0;

    // Predicted AP score
    const avgMasteryVal = allMastery.length > 0
      ? allMastery.reduce((s, m) => s + m.masteryScore, 0) / allMastery.length
      : 0;
    const recentAccuracy = recentSessionsForPrediction.length > 0
      ? recentSessionsForPrediction.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)) * 100, 0) / recentSessionsForPrediction.length
      : 0;
    const mockScore = mockExamSessions[0]?.apScoreEstimate ?? null;
    const weightedScore = (avgMasteryVal * 0.50) + (recentAccuracy * 0.30) + (mockScore ? mockScore * 20 * 0.20 : 0);
    const predictedScore = Math.min(5, Math.max(1, Math.ceil(weightedScore / 20))) as 1|2|3|4|5;
    const confidence: "low"|"medium"|"high" = totalSessionsCount > 20 ? "high" : totalSessionsCount > 5 ? "medium" : "low";

    // Weekly growth trend
    const recentWeekAccuracy = recentWeekSessions.length > 0
      ? recentWeekSessions.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)), 0) / recentWeekSessions.length
      : 0;
    const prevWeekAccuracy = prevWeekSessions.length > 0
      ? prevWeekSessions.reduce((s, sess) => s + (sess.correctAnswers / Math.max(sess.totalQuestions, 1)), 0) / prevWeekSessions.length
      : 0;
    const weeklyGrowth = Math.round((recentWeekAccuracy - prevWeekAccuracy) * 100);
    const improving = weeklyGrowth > 0;

    // Knowledge check stats
    const totalChecks = knowledgeChecks.length;
    const avgComprehension = totalChecks > 0
      ? Math.round((knowledgeChecks.reduce((s, c) => s + c.score, 0) / (totalChecks * 3)) * 100)
      : null;

    return NextResponse.json({
      masteryData,
      accuracyTimeline,
      knowledgeCheckStats: { totalChecks, avgComprehension },
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
      predictedScore: {
        score: predictedScore,
        confidence,
        weeklyGrowth,
        improving,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

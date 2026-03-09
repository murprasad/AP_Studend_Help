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

    // Get mastery scores for units in this course
    const courseUnitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];

    const masteryScores = await prisma.masteryScore.findMany({
      where: { userId, unit: { in: courseUnitKeys } },
    });

    // Fill in missing units with 0
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

    // Get accuracy over time (last 14 days) for this course
    const twoWeeksAgo = subDays(new Date(), 14);
    const recentSessions = await prisma.practiceSession.findMany({
      where: {
        userId,
        course,
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

    // Overall stats for this course (via questions answered in course sessions)
    const courseSessionIds = (
      await prisma.practiceSession.findMany({
        where: { userId, course },
        select: { id: true },
      })
    ).map((s) => s.id);

    const allResponses = await prisma.studentResponse.findMany({
      where: {
        userId,
        ...(courseSessionIds.length > 0 ? { sessionId: { in: courseSessionIds } } : { id: "none" }),
      },
      select: { isCorrect: true, timeSpentSecs: true },
    });

    const totalAnswered = allResponses.length;
    const totalCorrect = allResponses.filter((r) => r.isCorrect).length;
    const overallAccuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
    const avgTime =
      totalAnswered > 0
        ? allResponses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAnswered
        : 0;

    // User info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXp: true, level: true, streakDays: true },
    });

    // Best estimated AP score from completed mock exams for this course
    const bestMockScore = await prisma.practiceSession.findFirst({
      where: {
        userId,
        course,
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
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit } from "@prisma/client";
import { estimateApScore } from "@/lib/utils";

// Submit an answer for a question in a session
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { questionId, answer, timeSpentSecs } = await req.json();
  const { sessionId } = params;

  // Verify session belongs to user
  const practiceSession = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get the question to check answer
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const isCorrect = answer.toUpperCase() === question.correctAnswer.toUpperCase();

  // Record the response
  await prisma.studentResponse.create({
    data: {
      userId: session.user.id,
      questionId,
      sessionId,
      studentAnswer: answer,
      isCorrect,
      timeSpentSecs: timeSpentSecs || 0,
    },
  });

  // Update question stats
  await prisma.question.update({
    where: { id: questionId },
    data: {
      timesAnswered: { increment: 1 },
      timesCorrect: { increment: isCorrect ? 1 : 0 },
    },
  });

  // Update mastery score for this unit
  await updateMasteryScore(session.user.id, question.unit);

  return NextResponse.json({
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  });
}

// Complete a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = params;

  const practiceSession = await prisma.practiceSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get all responses for this session
  const responses = await prisma.studentResponse.findMany({
    where: { sessionId },
  });

  const correctCount = responses.filter((r) => r.isCorrect).length;
  const totalTime = responses.reduce((sum, r) => sum + r.timeSpentSecs, 0);
  const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;
  const apScore = estimateApScore(accuracy, responses.length);

  const updatedSession = await prisma.practiceSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      correctAnswers: correctCount,
      timeSpentSecs: totalTime,
      score: accuracy,
      apScoreEstimate: apScore,
      completedAt: new Date(),
    },
  });

  // Update user XP and streak
  const xpEarned = Math.round(correctCount * 10 + (accuracy >= 80 ? 50 : 0));
  await updateUserProgress(session.user.id, xpEarned);

  return NextResponse.json({
    session: updatedSession,
    summary: {
      totalQuestions: responses.length,
      correctAnswers: correctCount,
      accuracy: Math.round(accuracy),
      timeSpentSecs: totalTime,
      xpEarned,
      apScoreEstimate: apScore,
    },
  });
}

async function updateMasteryScore(userId: string, unit: ApUnit) {
  const responses = await prisma.studentResponse.findMany({
    where: {
      userId,
      question: { unit },
    },
    orderBy: { answeredAt: "desc" },
    take: 50,
  });

  if (responses.length === 0) return;

  const totalAttempts = responses.length;
  const correctAttempts = responses.filter((r) => r.isCorrect).length;
  const accuracy = (correctAttempts / totalAttempts) * 100;

  // Weighted mastery: recent performance matters more
  const recentResponses = responses.slice(0, 10);
  const recentAccuracy =
    recentResponses.length > 0
      ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
      : 0;

  const masteryScore = accuracy * 0.4 + recentAccuracy * 0.6;
  const avgTimeSecs =
    responses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAttempts;

  await prisma.masteryScore.upsert({
    where: { userId_unit: { userId, unit } },
    create: {
      userId,
      unit,
      masteryScore,
      accuracy,
      totalAttempts,
      correctAttempts,
      avgTimeSecs,
      lastPracticed: new Date(),
    },
    update: {
      masteryScore,
      accuracy,
      totalAttempts,
      correctAttempts,
      avgTimeSecs,
      lastPracticed: new Date(),
    },
  });
}

async function updateUserProgress(userId: string, xpEarned: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user.lastActiveDate
    ? new Date(user.lastActiveDate)
    : null;

  let newStreak = user.streakDays;
  if (lastActive) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    lastActive.setHours(0, 0, 0, 0);

    if (lastActive.getTime() === yesterday.getTime()) {
      newStreak += 1; // continued streak
    } else if (lastActive.getTime() < yesterday.getTime()) {
      newStreak = 1; // reset streak
    }
    // if lastActive is today, streak stays the same
  } else {
    newStreak = 1;
  }

  const newXp = user.totalXp + xpEarned;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: newXp,
      level: newLevel,
      streakDays: newStreak,
      lastActiveDate: new Date(),
    },
  });
}

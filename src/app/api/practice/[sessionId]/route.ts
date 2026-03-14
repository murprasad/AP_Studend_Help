import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit } from "@prisma/client";
import { estimateApScore } from "@/lib/utils";
import { getCourseForUnit } from "@/lib/courses";
import { callAIWithCascade } from "@/lib/ai-providers";

// Submit an answer for a question in a session
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { questionId, answer, timeSpentSecs } = body;
    const { sessionId } = params;

    if (!questionId || !answer) {
      return NextResponse.json({ error: "questionId and answer are required" }, { status: 400 });
    }

    // Verify session belongs to user
    const practiceSession = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!practiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (practiceSession.status === "COMPLETED") {
      return NextResponse.json({ error: "Session already completed" }, { status: 400 });
    }

    // Get the question to check answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Detect open-ended (FRQ) questions — options is null or empty array
    const parsedOptions = question.options
      ? (Array.isArray(question.options) ? question.options : (() => { try { return JSON.parse(question.options as string); } catch { return []; } })())
      : [];
    const isOpenEnded = parsedOptions.length === 0;

    let isCorrect: boolean;
    let frqScore: { pointsEarned: number; totalPoints: number; feedback: string; modelAnswer: string } | undefined;

    if (isOpenEnded && answer.trim().length > 10) {
      // AI rubric scoring for FRQ answers
      try {
        const scoringPrompt = `You are an AP exam grader. Score this student response using the official rubric criteria.

Question: ${question.questionText}
Model Answer / Rubric: ${question.correctAnswer}
${question.explanation ? `Scoring Guidance: ${question.explanation}` : ""}
Student Response: ${answer}

Return ONLY valid JSON (no markdown, no extra text):
{"pointsEarned": 2, "totalPoints": 3, "feedback": "specific feedback referencing what was correct and what was missing", "modelAnswer": "ideal 2-3 sentence response hitting all rubric points"}`;

        const raw = await callAIWithCascade(scoringPrompt);
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (typeof parsed.pointsEarned === "number" && typeof parsed.totalPoints === "number") {
            frqScore = {
              pointsEarned: parsed.pointsEarned,
              totalPoints: parsed.totalPoints,
              feedback: parsed.feedback ?? "",
              modelAnswer: parsed.modelAnswer ?? "",
            };
            isCorrect = frqScore.pointsEarned >= frqScore.totalPoints / 2;
          } else {
            isCorrect = false;
          }
        } else {
          isCorrect = false;
        }
      } catch {
        // AI scoring failed — mark as needs review
        isCorrect = false;
        frqScore = { pointsEarned: 0, totalPoints: 3, feedback: "AI scoring unavailable — your answer was recorded.", modelAnswer: question.correctAnswer };
      }
    } else {
      isCorrect = answer.toUpperCase() === question.correctAnswer.toUpperCase();
    }

    // Check if already answered in this session
    const existingResponse = await prisma.studentResponse.findFirst({
      where: { userId: session.user.id, questionId, sessionId },
    });

    if (existingResponse) {
      return NextResponse.json({
        isCorrect: existingResponse.isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    }

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
      ...(frqScore && { frqScore }),
    });
  } catch (error) {
    console.error("POST /api/practice/[sessionId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Complete a session
export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId } = params;

    const practiceSession = await prisma.practiceSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!practiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (practiceSession.status === "COMPLETED") {
      // Return existing summary
      const responses = await prisma.studentResponse.findMany({ where: { sessionId } });
      const correctCount = responses.filter((r) => r.isCorrect).length;
      const totalTime = responses.reduce((sum, r) => sum + r.timeSpentSecs, 0);
      const accuracy = responses.length > 0 ? (correctCount / responses.length) * 100 : 0;
      return NextResponse.json({
        session: practiceSession,
        summary: {
          totalQuestions: responses.length,
          correctAnswers: correctCount,
          accuracy: Math.round(accuracy),
          timeSpentSecs: totalTime,
          xpEarned: 0,
          apScoreEstimate: practiceSession.apScoreEstimate || 0,
        },
      });
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
  } catch (error) {
    console.error("PATCH /api/practice/[sessionId] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateMasteryScore(userId: string, unit: ApUnit) {
  try {
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

    const recentResponses = responses.slice(0, 10);
    const recentAccuracy =
      recentResponses.length > 0
        ? (recentResponses.filter((r) => r.isCorrect).length / recentResponses.length) * 100
        : 0;

    const masteryScore = accuracy * 0.4 + recentAccuracy * 0.6;
    const avgTimeSecs =
      responses.reduce((sum, r) => sum + r.timeSpentSecs, 0) / totalAttempts;

    // Determine course from unit via registry lookup
    const course = getCourseForUnit(unit);

    await prisma.masteryScore.upsert({
      where: { userId_unit: { userId, unit } },
      create: {
        userId,
        course,
        unit,
        masteryScore,
        accuracy,
        totalAttempts,
        correctAttempts,
        avgTimeSecs,
        lastPracticed: new Date(),
      },
      update: {
        course,
        masteryScore,
        accuracy,
        totalAttempts,
        correctAttempts,
        avgTimeSecs,
        lastPracticed: new Date(),
      },
    });
  } catch (error) {
    console.error("updateMasteryScore error:", error);
  }
}

async function updateUserProgress(userId: string, xpEarned: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;

    let newStreak = user.streakDays;
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      lastActive.setHours(0, 0, 0, 0);

      if (lastActive.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActive.getTime() < yesterday.getTime()) {
        newStreak = 1;
      }
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
  } catch (error) {
    console.error("updateUserProgress error:", error);
  }
}

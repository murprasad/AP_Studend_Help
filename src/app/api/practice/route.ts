import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionType, ApUnit, Difficulty } from "@prisma/client";
import { estimateApScore } from "@/lib/utils";

// Create a new practice session
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionType, unit, difficulty, questionCount = 10 } = await req.json();

  // Determine which questions to include
  const whereClause = {
    isApproved: true,
    questionType: "MCQ" as const,
    ...(unit && unit !== "ALL" && { unit: unit as ApUnit }),
    ...(difficulty && difficulty !== "ALL" && { difficulty: difficulty as Difficulty }),
  };

  const allQuestions = await prisma.question.findMany({ where: whereClause });

  // Get student's recent responses to prioritize unseen/wrong questions
  const recentResponses = await prisma.studentResponse.findMany({
    where: {
      userId: session.user.id,
      questionId: { in: allQuestions.map((q) => q.id) },
    },
  });

  const responseMap = new Map(recentResponses.map((r) => [r.questionId, r]));

  const scored = allQuestions.map((q) => {
    const response = responseMap.get(q.id);
    let priority = Math.random(); // random tiebreaker
    if (!response) priority += 3;
    else if (!response.isCorrect) priority += 2;
    else priority += 1;
    return { ...q, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);
  const selectedQuestions = scored.slice(0, questionCount);

  if (selectedQuestions.length === 0) {
    return NextResponse.json({ error: "No questions available for selected criteria" }, { status: 400 });
  }

  // Create the session
  const practiceSession = await prisma.practiceSession.create({
    data: {
      userId: session.user.id,
      sessionType: sessionType as SessionType,
      totalQuestions: selectedQuestions.length,
      questions: {
        create: selectedQuestions.map((q, i) => ({
          questionId: q.id,
          order: i,
        })),
      },
    },
  });

  return NextResponse.json({
    sessionId: practiceSession.id,
    questions: selectedQuestions.map((q) => ({
      id: q.id,
      unit: q.unit,
      topic: q.topic,
      subtopic: q.subtopic,
      difficulty: q.difficulty,
      questionType: q.questionType,
      questionText: q.questionText,
      stimulus: q.stimulus,
      options: q.options,
    })),
  });
}

// Get all sessions for the current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ sessions });
}

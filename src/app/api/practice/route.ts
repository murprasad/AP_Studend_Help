import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionType, ApUnit, Difficulty, ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

// Create a new practice session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { sessionType, unit, difficulty, questionCount = 10, course = "AP_WORLD_HISTORY" } = body;

    if (!sessionType) {
      return NextResponse.json({ error: "sessionType is required" }, { status: 400 });
    }

    if (!VALID_AP_COURSES.includes(course as ApCourse)) {
      return NextResponse.json({ error: "Invalid course" }, { status: 400 });
    }

    // Determine which questions to include
    const whereClause: Record<string, unknown> = {
      isApproved: true,
      questionType: "MCQ",
      course: course as ApCourse,
      ...(unit && unit !== "ALL" && { unit: unit as ApUnit }),
      ...(difficulty && difficulty !== "ALL" && { difficulty: difficulty as Difficulty }),
    };

    const allQuestions = await prisma.question.findMany({ where: whereClause });

    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "No questions available for the selected course and criteria. Try different filters or add questions via Admin." },
        { status: 400 }
      );
    }

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
      let priority = Math.random();
      if (!response) priority += 3;
      else if (!response.isCorrect) priority += 2;
      else priority += 1;
      return { ...q, priority };
    });

    scored.sort((a, b) => b.priority - a.priority);
    const count = Math.min(questionCount, scored.length);
    const selectedQuestions = scored.slice(0, count);

    // Create the session
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: session.user.id,
        course: course as ApCourse,
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
        course: q.course,
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
  } catch (error) {
    console.error("POST /api/practice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get all sessions for the current user
export async function GET(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("GET /api/practice error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

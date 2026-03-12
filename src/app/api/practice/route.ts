import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SessionType, ApUnit, Difficulty, ApCourse, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES, getUnitsForCourse, COURSE_REGISTRY } from "@/lib/courses";
import { generateQuestion } from "@/lib/ai";

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

    let allQuestions = await prisma.question.findMany({ where: whereClause });

    // Fetch student's mastery scores for adaptive topic targeting
    const masteryData = await prisma.masteryScore.findMany({
      where: { userId: session.user.id, course: course as ApCourse },
      orderBy: { masteryScore: "asc" },
    });
    // Build weak-topic map: unit → weakest keyTheme (for targeted generation)
    const weakTopicMap = new Map<string, string>();
    for (const m of masteryData) {
      if (m.masteryScore < 70) {
        const unitMeta = COURSE_REGISTRY[course as ApCourse]?.units[m.unit as ApUnit];
        const themes = unitMeta?.keyThemes || [];
        if (themes.length) weakTopicMap.set(m.unit, themes[0]);
      }
    }

    // Auto-generate AI questions when the DB bank is insufficient
    // Cap at 5 parallel generations per request to stay within Netlify's 26s timeout.
    // Groq (Llama 3.3) typically responds in 1–3s, so 5 parallel ≈ 5s total.
    const MAX_GEN_PER_REQUEST = 5;
    let aiGenerationWarning: string | null = null;
    if (allQuestions.length < questionCount) {
      const needed = Math.min(questionCount - allQuestions.length, MAX_GEN_PER_REQUEST);
      const courseUnitKeys = getUnitsForCourse(course as ApCourse);
      const diffs: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

      const genPromises = Array.from({ length: needed }, (_, i) => {
        const u: ApUnit = (unit && unit !== "ALL")
          ? (unit as ApUnit)
          : courseUnitKeys[i % courseUnitKeys.length];
        const d: Difficulty = (difficulty && difficulty !== "ALL")
          ? (difficulty as Difficulty)
          : diffs[i % diffs.length];
        const weakTopic = weakTopicMap.get(u) || undefined;
        return generateQuestion(u, d, QuestionType.MCQ, weakTopic, course as ApCourse)
          .then((gen) =>
            prisma.question.create({
              data: {
                course: course as ApCourse,
                unit: gen.unit,
                topic: gen.topic,
                subtopic: gen.subtopic,
                difficulty: gen.difficulty,
                questionType: gen.questionType,
                questionText: gen.questionText,
                stimulus: gen.stimulus || null,
                options: gen.options ? JSON.stringify(gen.options) : undefined,
                correctAnswer: gen.correctAnswer,
                explanation: gen.explanation,
                isAiGenerated: true,
                isApproved: true,
              },
            })
          );
      });

      const settled = await Promise.allSettled(genPromises);
      const generated = settled
        .filter((r): r is PromiseFulfilledResult<(typeof allQuestions)[0]> => r.status === "fulfilled")
        .map((r) => r.value);

      if (generated.length > 0) {
        allQuestions = [...allQuestions, ...generated];
        const stillNeeded = questionCount - allQuestions.length;
        aiGenerationWarning = stillNeeded > 0
          ? `${generated.length} AI question${generated.length === 1 ? "" : "s"} generated. Start another session to get ${stillNeeded} more — they'll be ready instantly!`
          : `${generated.length} AI question${generated.length === 1 ? "" : "s"} generated and saved for future sessions too.`;
      } else if (allQuestions.length === 0) {
        return NextResponse.json(
          { error: "No questions available and AI generation failed. Please try again later." },
          { status: 400 }
        );
      }
    }

    // Warn only if still below target after AI generation
    const lowBankWarning = !aiGenerationWarning && allQuestions.length < questionCount * 2
      ? `Only ${allQuestions.length} questions in the bank — you may see repeats soon.`
      : null;

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
      lowBankWarning,
      aiGenerationWarning,
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

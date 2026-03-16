import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBulkQuestions } from "@/lib/ai";
import { ApUnit, Difficulty, ApCourse, QuestionType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins can bulk generate
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { count = 5, unit, difficulty, course, questionType } = await req.json();

  if (count > 20) {
    return NextResponse.json({ error: "Max 20 questions per request" }, { status: 400 });
  }

  try {
    const questions = await generateBulkQuestions(
      count,
      unit as ApUnit | undefined,
      difficulty as Difficulty | undefined,
      course as ApCourse | undefined,
      (questionType as QuestionType) || QuestionType.MCQ
    );

    // Save all generated questions to DB (auto-approved for admin)
    const saved = await Promise.all(
      questions.map((q) =>
        prisma.question.create({
          data: {
            course: (course as ApCourse) || "AP_WORLD_HISTORY",
            unit: q.unit,
            topic: q.topic,
            subtopic: q.subtopic || "",
            difficulty: q.difficulty,
            questionType: q.questionType,
            questionText: q.questionText,
            stimulus: q.stimulus || null,
            options: q.options ? JSON.stringify(q.options) : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            isAiGenerated: true,
            isApproved: true, // admin-generated questions are auto-approved
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      generated: saved.length,
      questions: saved.map((q) => ({ id: q.id, topic: q.topic, unit: q.unit, difficulty: q.difficulty })),
    });
  } catch (error) {
    console.error("Bulk generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

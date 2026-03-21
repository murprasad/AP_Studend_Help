import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestion } from "@/lib/ai";
import { ApUnit, ApCourse, Difficulty, QuestionType } from "@prisma/client";
import { getCourseForUnit } from "@/lib/courses";
import { isAnyPremium, hasAnyPremium, type ModuleSub } from "@/lib/tiers";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only allow admins or premium users to generate questions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, subscriptionTier: true },
  });

  const moduleSubs: ModuleSub[] = (session.user as { moduleSubs?: ModuleSub[] }).moduleSubs ?? [];
  if (!user || (user.role !== "ADMIN" && !hasAnyPremium(moduleSubs) && !isAnyPremium(user.subscriptionTier))) {
    return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
  }

  const { unit, difficulty, questionType, topic, course } = await req.json();

  try {
    const generated = await generateQuestion(
      unit as ApUnit,
      difficulty as Difficulty,
      questionType as QuestionType,
      topic,
      course as ApCourse | undefined
    );

    const resolvedCourse = (course as ApCourse) || getCourseForUnit(unit as ApUnit);

    // Save to DB (pending approval for non-admins)
    const question = await prisma.question.create({
      data: {
        course: resolvedCourse,
        unit: generated.unit,
        topic: generated.topic,
        subtopic: generated.subtopic,
        difficulty: generated.difficulty,
        questionType: generated.questionType,
        questionText: generated.questionText,
        stimulus: generated.stimulus || null,
        stimulusImageUrl: generated.stimulusImageUrl || null,
        options: generated.options ? JSON.stringify(generated.options) : undefined,
        correctAnswer: generated.correctAnswer,
        explanation: generated.explanation,
        isAiGenerated: true,
        isApproved: user.role === "ADMIN",
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

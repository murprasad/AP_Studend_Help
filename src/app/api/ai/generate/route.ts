import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateQuestion } from "@/lib/ai";
import { ApUnit, Difficulty, QuestionType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only allow admins or premium users to generate questions
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, subscriptionTier: true },
  });

  if (!user || (user.role !== "ADMIN" && user.subscriptionTier !== "PREMIUM")) {
    return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
  }

  const { unit, difficulty, questionType, topic } = await req.json();

  try {
    const generated = await generateQuestion(
      unit as ApUnit,
      difficulty as Difficulty,
      questionType as QuestionType,
      topic
    );

    // Save to DB (pending approval for non-admins)
    const question = await prisma.question.create({
      data: {
        ...generated,
        options: generated.options ? JSON.stringify(generated.options) : undefined,
        isApproved: user.role === "ADMIN",
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

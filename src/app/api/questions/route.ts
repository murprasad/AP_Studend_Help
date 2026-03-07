import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApUnit, Difficulty, QuestionType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unit = searchParams.get("unit") as ApUnit | null;
  const difficulty = searchParams.get("difficulty") as Difficulty | null;
  const questionType = searchParams.get("type") as QuestionType | null;
  const limit = parseInt(searchParams.get("limit") || "10");
  const excludeIds = searchParams.get("exclude")?.split(",") || [];

  const where = {
    isApproved: true,
    ...(unit && { unit }),
    ...(difficulty && { difficulty }),
    ...(questionType && { questionType }),
    ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
  };

  // Get questions, prioritizing ones the student hasn't seen or got wrong
  const questions = await prisma.question.findMany({
    where,
    take: limit * 3,
    orderBy: { createdAt: "asc" },
  });

  // Get student's recent responses for these questions
  const recentResponses = await prisma.studentResponse.findMany({
    where: {
      userId: session.user.id,
      questionId: { in: questions.map((q) => q.id) },
    },
    orderBy: { answeredAt: "desc" },
  });

  const responseMap = new Map(recentResponses.map((r) => [r.questionId, r]));

  // Prioritize: unseen > wrong > correct
  const scored = questions.map((q) => {
    const response = responseMap.get(q.id);
    let priority = 0;
    if (!response) priority = 3; // never seen
    else if (!response.isCorrect) priority = 2; // got wrong
    else priority = 1; // got correct
    return { ...q, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);
  const selected = scored.slice(0, limit);

  return NextResponse.json({ questions: selected });
}

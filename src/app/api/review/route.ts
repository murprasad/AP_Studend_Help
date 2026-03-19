import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const course = req.nextUrl.searchParams.get("course") as ApCourse | null;

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Wrong MCQ answers in the SRS window (3-7 days ago)
  const wrongResponses = await prisma.studentResponse.findMany({
    where: {
      userId: session.user.id,
      isCorrect: false,
      answeredAt: { gte: sevenDaysAgo, lte: threeDaysAgo },
      question: {
        questionType: "MCQ",
        ...(course ? { course } : {}),
      },
    },
    include: {
      question: {
        select: {
          id: true,
          course: true,
          unit: true,
          topic: true,
          difficulty: true,
          questionType: true,
          questionText: true,
          options: true,
          stimulus: true,
          correctAnswer: true,
          explanation: true,
        },
      },
    },
    orderBy: { answeredAt: "asc" },
    take: 10,
  });

  // Deduplicate by questionId — take earliest wrong answer per question
  const seen = new Set<string>();
  const questions = wrongResponses
    .filter((r) => {
      if (seen.has(r.questionId)) return false;
      seen.add(r.questionId);
      return true;
    })
    .map((r) => r.question)
    .slice(0, 5);

  return NextResponse.json({ questions, count: questions.length });
}

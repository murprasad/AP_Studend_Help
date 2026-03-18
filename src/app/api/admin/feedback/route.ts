import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [feedbacks, thumbsUp, thumbsDown] = await Promise.all([
    prisma.sessionFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        session: { select: { course: true, sessionType: true, correctAnswers: true, totalQuestions: true } },
      },
    }),
    prisma.sessionFeedback.count({ where: { rating: 1 } }),
    prisma.sessionFeedback.count({ where: { rating: -1 } }),
  ]);

  return NextResponse.json({ feedbacks, thumbsUp, thumbsDown });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [
      tutorCallsToday,
      tutorCallsWeek,
      questionsGeneratedToday,
      activeUsersToday,
      totalQuestions,
      totalUsers,
      newUsersToday,
      knowledgeChecksToday,
      totalCacheEntries,
    ] = await Promise.all([
      prisma.tutorConversation.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.tutorConversation.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.question.count({ where: { isAiGenerated: true, createdAt: { gte: startOfDay } } }),
      prisma.practiceSession.groupBy({
        by: ["userId"],
        where: { startedAt: { gte: startOfDay } },
      }).then((rows) => rows.length),
      prisma.question.count({ where: { isApproved: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.tutorKnowledgeCheck.count({ where: { completedAt: { gte: startOfDay } } }),
      prisma.aiResponseCache.count(),
    ]);

    return NextResponse.json({
      tutorCallsToday,
      tutorCallsWeek,
      questionsGeneratedToday,
      activeUsersToday,
      totalQuestions,
      totalUsers,
      newUsersToday,
      knowledgeChecksToday,
      totalCacheEntries,
      fetchedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

  // Start of current week (Monday 00:00:00)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysToMonday);
  weekStart.setHours(0, 0, 0, 0);

  // Sessions completed this week
  const sessions = await prisma.practiceSession.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: weekStart },
      ...(course ? { course } : {}),
    },
    select: { userId: true, correctAnswers: true },
  });

  // Aggregate XP per user (10 XP per correct answer)
  const xpByUser = new Map<string, number>();
  for (const s of sessions) {
    const xp = (s.correctAnswers || 0) * 10;
    xpByUser.set(s.userId, (xpByUser.get(s.userId) || 0) + xp);
  }

  const userIds = Array.from(xpByUser.keys());
  if (userIds.length === 0) {
    return NextResponse.json({ leaderboard: [], userRank: null, userXp: 0 });
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const sorted = Array.from(xpByUser.entries())
    .map(([userId, xp]) => {
      const u = userMap.get(userId);
      const displayName = u ? `${u.firstName} ${u.lastName?.charAt(0) ?? "?"}. ` : "Anonymous";
      return { userId, displayName, xp };
    })
    .sort((a, b) => b.xp - a.xp);

  const top10 = sorted.slice(0, 10).map((e, i) => ({ ...e, rank: i + 1 }));
  const userRankIndex = sorted.findIndex((e) => e.userId === session.user.id);
  const userXp = xpByUser.get(session.user.id) || 0;

  return NextResponse.json({
    leaderboard: top10,
    userRank: userRankIndex >= 0 ? userRankIndex + 1 : null,
    userXp,
  });
}

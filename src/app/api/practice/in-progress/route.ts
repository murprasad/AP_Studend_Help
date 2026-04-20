/**
 * GET /api/practice/in-progress?course=AP_WORLD_HISTORY
 *
 * Returns the most recent IN_PROGRESS PracticeSession for the user +
 * course, with answered-count computed from StudentResponse joins.
 * Empty response when there's nothing to resume.
 *
 * Used by ResumeCard on the dashboard to surface "Continue where you
 * left off" prominently. Part of the retention loop (#56).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ session: null });
  }

  const { searchParams } = new URL(req.url);
  const course = (searchParams.get("course") || "AP_WORLD_HISTORY") as ApCourse;

  const row = await prisma.practiceSession.findFirst({
    where: {
      userId: session.user.id,
      course,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      sessionType: true,
      totalQuestions: true,
      startedAt: true,
    },
  });

  if (!row) return NextResponse.json({ session: null });

  const answered = await prisma.studentResponse.count({
    where: { sessionId: row.id, userId: session.user.id },
  });

  return NextResponse.json({
    session: {
      id: row.id,
      sessionType: row.sessionType,
      totalQuestions: row.totalQuestions,
      answered,
      startedAt: row.startedAt,
    },
  });
}

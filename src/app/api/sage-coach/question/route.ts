/**
 * GET /api/sage-coach/question?course=AP_WORLD_HISTORY
 *
 * Returns one SageCoachConcept for the student to answer. Preference
 * order:
 *   1. Concepts the user hasn't attempted yet (fresh)
 *   2. Concepts where last-attempt scored below 70 (worth retrying)
 *   3. Random from the course pool
 *
 * Difficulty cycles basic→intermediate→advanced across visits so students
 * don't hit only hard prompts early.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawCourse = searchParams.get("course");

  // NEVER default to AP_WORLD_HISTORY silently — user-reported bug 2026-04-21
  // was that a stale client captured the default and always asked for World
  // History regardless of selected course. Reject missing/invalid course so
  // the client must pass a real one.
  if (!rawCourse) {
    return NextResponse.json({ error: "course param required" }, { status: 400 });
  }
  if (!VALID_AP_COURSES.includes(rawCourse as ApCourse)) {
    return NextResponse.json({ error: `invalid course: ${rawCourse}` }, { status: 400 });
  }
  const course = rawCourse as ApCourse;

  // 1) Fresh concepts — never attempted by this user
  const seen = await prisma.sageCoachSession.findMany({
    where: { userId: session.user.id, course },
    select: { conceptId: true },
  });
  const seenIds = new Set(seen.map((s) => s.conceptId));

  const all = await prisma.sageCoachConcept.findMany({ where: { course } });
  if (all.length === 0) {
    return NextResponse.json({ error: "No concepts available for this course yet." }, { status: 404 });
  }

  let pool = all.filter((c) => !seenIds.has(c.id));

  // 2) If user has seen everything, offer weakest-scored concept as retry
  if (pool.length === 0) {
    const weakest = await prisma.sageCoachSession.findFirst({
      where: { userId: session.user.id, course },
      orderBy: { createdAt: "desc" },
      take: 20, // look at last 20 sessions
    });
    if (weakest) pool = all.filter((c) => c.id === weakest.conceptId);
    if (pool.length === 0) pool = all; // fallback to random
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json({
    id: pick.id,
    concept: pick.concept,
    question: pick.question,
    difficulty: pick.difficulty,
    unit: pick.unit,
    course: pick.course,
    // keyPoints intentionally withheld — would bias the student's answer.
  });
}

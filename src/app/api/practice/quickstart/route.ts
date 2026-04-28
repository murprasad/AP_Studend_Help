// Beta 8.12 — POST /api/practice/quickstart
//
// One-call session creator for the post-signup funnel fix. Creates a 5-Q
// EASY-only practice session in the user's track-default course (or one
// they specified via ?course=) and returns the sessionId so the client
// can router.push directly into the session — no dashboard, no onboarding,
// no extra clicks.
//
// Hard rules (per Beta 8.12 spec):
//   - Difficulty=EASY only (momentum, not assessment)
//   - 5 questions (finite progress)
//   - Course defaults to track-most-popular if not specified
//   - Reuses existing session creation logic for consistency
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, SessionType, Difficulty, QuestionType } from "@prisma/client";
import { VALID_AP_COURSES, COURSE_REGISTRY } from "@/lib/courses";

export const dynamic = "force-dynamic";

const TRACK_DEFAULTS: Record<string, ApCourse> = {
  ap: "AP_WORLD_HISTORY",
  sat: "SAT_MATH",
  act: "ACT_MATH",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const requestedCourse = url.searchParams.get("course") as ApCourse | null;
  const userTrack = session.user.track ?? "ap";
  const course =
    requestedCourse && VALID_AP_COURSES.includes(requestedCourse)
      ? requestedCourse
      : TRACK_DEFAULTS[userTrack] ?? "AP_WORLD_HISTORY";

  // Pull 5 EASY MCQs at random from the approved bank.
  const questions = await prisma.question.findMany({
    where: { course, isApproved: true, questionType: QuestionType.MCQ, difficulty: Difficulty.EASY },
    select: { id: true, unit: true },
    take: 50,
    orderBy: { id: "asc" },
  });

  if (questions.length === 0) {
    // Fallback to any difficulty if EASY pool is empty
    const anyDiff = await prisma.question.findMany({
      where: { course, isApproved: true, questionType: QuestionType.MCQ },
      select: { id: true, unit: true },
      take: 50,
      orderBy: { id: "asc" },
    });
    if (anyDiff.length === 0) {
      return NextResponse.json({ error: "No questions available for course" }, { status: 400 });
    }
    questions.push(...anyDiff);
  }

  // Random sample of 5
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, Math.min(5, shuffled.length));

  // Single create + bulk insert (Neon HTTP supports this pattern)
  const newSession = await prisma.practiceSession.create({
    data: {
      userId: session.user.id,
      course,
      sessionType: SessionType.QUICK_PRACTICE,
      totalQuestions: picked.length,
      correctAnswers: 0,
      startedAt: new Date(),
    },
    select: { id: true },
  });

  const placeholders = picked
    .map((_, i) => {
      const b = i * 4;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
    })
    .join(", ");
  await prisma.$executeRawUnsafe(
    `INSERT INTO practice_session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
    ...picked.flatMap((q, i) => [crypto.randomUUID(), newSession.id, q.id, i]),
  );

  return NextResponse.json({ sessionId: newSession.id, course, questionCount: picked.length });
}

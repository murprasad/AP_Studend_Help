/**
 * GET /api/q1 — fetch ONE easy MCQ for the dashboard's single-question entry.
 *
 * Why this exists: 80% of new sign-ups bounce before answering even 1
 * question (data 2026-04-27). The full /practice flow has too much
 * commitment friction ("10 questions", session config UI, course
 * selection, etc.). This endpoint returns 1 question with minimal
 * framing so the user can answer in <30 seconds and see instant value.
 *
 * Returns:
 *   { question: { id, course, unit, questionText, options, correctAnswer,
 *                 explanation, difficulty } }
 *   correctAnswer + explanation are sent client-side because Q1 is a
 *   no-session quick-check; the client reveals them after submit. No DB
 *   write happens — we want zero commitment.
 *
 * Returns 404 if no EASY MCQ exists in the course (rare; fallback to MEDIUM).
 *
 * Auth: optional. Anonymous users CAN hit this for the landing page
 * "Try one question" experience too.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApCourse, Difficulty, QuestionType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const course = (searchParams.get("course") as ApCourse) || "AP_WORLD_HISTORY";

  // Pull a small candidate pool of EASY MCQs, then pick one at random.
  // Avoid questions the user has already answered correctly (so we don't
  // re-show them stale content).
  //
  // Also: if the user already has ANY practice response for this course,
  // skip Q1 entirely. Q1 is a commitment hook for fresh users; returning
  // users hitting the dashboard don't need to be re-prompted with a "quick
  // check" they've already moved past. Hiding here (server-side) backs up
  // the localStorage flag the client sets on submit — covers cross-device
  // and cleared-storage cases.
  let excludeIds: string[] = [];
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const [responseCount, correct] = await Promise.all([
        prisma.studentResponse.count({
          where: { userId: session.user.id, question: { course } },
        }),
        prisma.studentResponse.findMany({
          where: { userId: session.user.id, isCorrect: true },
          select: { questionId: true },
          take: 100,
        }),
      ]);
      if (responseCount > 0) {
        return NextResponse.json(
          { question: null, hide: true, reason: "has_practice_history" },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      excludeIds = correct.map((r) => r.questionId);
    }
  } catch { /* anonymous — no exclusion list */ }

  const where = {
    course,
    isApproved: true,
    questionType: "MCQ" as QuestionType,
    difficulty: "EASY" as Difficulty,
    ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
  };
  let pool = await prisma.question.findMany({
    where,
    select: {
      id: true, course: true, unit: true, topic: true,
      questionText: true, options: true, correctAnswer: true, explanation: true,
      difficulty: true,
    },
    take: 50,
  });

  // Fallback to MEDIUM if no EASY available
  if (pool.length === 0) {
    pool = await prisma.question.findMany({
      where: { ...where, difficulty: "MEDIUM" as Difficulty },
      select: {
        id: true, course: true, unit: true, topic: true,
        questionText: true, options: true, correctAnswer: true, explanation: true,
        difficulty: true,
      },
      take: 50,
    });
  }

  if (pool.length === 0) {
    return NextResponse.json({ error: "No question available for this course yet" }, { status: 404 });
  }

  const q = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json(
    { question: q },
    { headers: { "Cache-Control": "no-store" } },
  );
}

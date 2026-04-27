/**
 * POST /api/mock-exam — CB-fidelity mock exam session.
 *
 * Bug fixed by this endpoint (2026-04-27): the existing mock exam pulled
 * MCQs only via /api/practice. The Mock Exam intro page advertised the
 * real CB structure (e.g. "55 MCQ + 3 SAQ + 1 DBQ + 1 LEQ") but the
 * actual mock served only MCQs. Students caught the lie within seconds
 * and lost trust.
 *
 * This endpoint returns a session with questions from each CB section
 * in the correct proportions, drawn from our DB (post-Stage 4 quality).
 * Falls back gracefully when a section's bank is empty (skips it but
 * notes it in the response so UI can label).
 *
 * Auth: required. FREE users get a partial mock (Q5 paywall already
 * exists per FREE_LIMITS; this endpoint just serves the questions).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApCourse, QuestionType, SessionType } from "@prisma/client";
import { getCBExamStructure } from "@/lib/cb-exam-structure";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const course = (body.course as ApCourse) || "AP_WORLD_HISTORY";

    const struct = getCBExamStructure(course);
    if (!struct) {
      return NextResponse.json({ error: "No CB structure for this course" }, { status: 400 });
    }

    // For each section, pull random approved questions of the right type +
    // optional subtopic match. CB exam typically has 1-3 of each FRQ type;
    // we serve 1-2 to keep the session manageable, scaling MCQ count down
    // proportionally so total session is ~30-45 minutes (not the full
    // 3-hour real exam — students rarely complete a full mock anyway).
    const SCALE = 0.4; // ~40% of real exam length
    const sections: Array<{ cbName: string; questions: Array<unknown> }> = [];
    const skippedSections: Array<{ cbName: string; reason: string }> = [];

    for (const sec of struct.sections) {
      const targetCount = Math.max(1, Math.floor(sec.count * SCALE));
      // For MCQ, scale further so we don't overwhelm the session
      const adjustedCount = sec.questionType === "MCQ"
        ? Math.min(targetCount, 15)
        : Math.min(targetCount, 2);

      const where: Record<string, unknown> = {
        course: course as ApCourse,
        isApproved: true,
        questionType: sec.questionType as QuestionType,
        ...(sec.subtopic && { subtopic: sec.subtopic }),
      };
      const pool = await prisma.question.findMany({
        where,
        select: {
          id: true, course: true, unit: true, topic: true, subtopic: true,
          difficulty: true, questionType: true, questionText: true,
          stimulus: true, stimulusImageUrl: true, options: true,
          correctAnswer: true, explanation: true,
        },
        take: 50,
      });
      if (pool.length === 0) {
        skippedSections.push({ cbName: sec.cbName, reason: "no questions in bank yet" });
        continue;
      }
      // Shuffle + take adjustedCount
      const picked = pool
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.min(adjustedCount, pool.length))
        .map((q) => ({ ...q, sectionLabel: sec.cbName, sectionType: sec.questionType }));
      sections.push({ cbName: sec.cbName, questions: picked });
    }

    if (sections.length === 0 || sections.every((s) => s.questions.length === 0)) {
      return NextResponse.json(
        { error: "No CB-fidelity content available for this course yet" },
        { status: 400 },
      );
    }

    // Flatten with section markers preserved on each question
    const allQuestions = sections.flatMap((s) => s.questions);
    const totalQuestions = allQuestions.length;

    // Create a PracticeSession with type=MOCK_EXAM
    const practiceSession = await prisma.practiceSession.create({
      data: {
        userId: session.user.id,
        course: course as ApCourse,
        sessionType: "MOCK_EXAM" as SessionType,
        totalQuestions,
      },
    });

    // Insert session_questions
    const placeholders = allQuestions
      .map((_, i) => {
        const b = i * 4;
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
      })
      .join(", ");
    const values = allQuestions.flatMap((q, i) => [
      crypto.randomUUID(), practiceSession.id, (q as { id: string }).id, i,
    ]);
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
        ...values,
      );
    } catch (err) {
      console.error("session_questions insert failed:", err);
      await prisma.practiceSession.delete({ where: { id: practiceSession.id } }).catch(() => {});
      return NextResponse.json(
        { error: "Couldn't load mock exam questions. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessionId: practiceSession.id,
      totalQuestions,
      sections: sections.map((s) => ({ cbName: s.cbName, count: s.questions.length })),
      skippedSections,
      questions: allQuestions,
    });
  } catch (e) {
    console.error("[/api/mock-exam] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

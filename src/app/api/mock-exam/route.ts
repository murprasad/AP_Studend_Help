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
import { FREE_LIMITS } from "@/lib/tier-limits";
import { isPremiumForTrack } from "@/lib/tiers";

export const dynamic = "force-dynamic";

const ADAPTIVE_COURSES: ReadonlySet<string> = new Set([
  "SAT_MATH",
  "SAT_READING_WRITING",
  "PSAT_MATH",
  "PSAT_READING_WRITING",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const course = (body.course as ApCourse) || "AP_WORLD_HISTORY";
    // mode: "scaled" (default, ~40% length) or "full" (full CB count)
    const mode = (body.mode as string) || "scaled";
    // 2026-06-03 — Full Practice Test mode. When body.practiceTestSet is
    // 1, 2, or 3, bypass section sampling and serve the deterministic
    // pre-tagged 44-question set in CB Module-1 / Module-2 order. The
    // /full-practice-test page calls this with practiceTestSet param.
    const practiceTestSet = typeof body.practiceTestSet === "number"
      ? body.practiceTestSet
      : null;

    // F16 (#100) — server-side adaptive-mock cap. SAT/PSAT free students
    // get 8 full-length adaptive mocks; the 9th create attempt returns 402
    // so the client can surface the upgrade screen instead of starting a
    // doomed session. Premium users + non-adaptive courses are unaffected.
    if (ADAPTIVE_COURSES.has(course as string)) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionTier: true, track: true },
      });
      const premium = user
        ? isPremiumForTrack(user.subscriptionTier ?? "FREE", user.track ?? "ap")
        : false;
      if (!premium) {
        const mocksUsed = await prisma.practiceSession.count({
          where: {
            userId: session.user.id,
            course: course as ApCourse,
            sessionType: "MOCK_EXAM" as SessionType,
          },
        });
        if (mocksUsed >= FREE_LIMITS.freeAdaptiveMocksLifetime) {
          return NextResponse.json(
            {
              error: "Free adaptive mock cap reached",
              code: "FREE_ADAPTIVE_MOCK_CAP",
              mocksUsed,
              cap: FREE_LIMITS.freeAdaptiveMocksLifetime,
            },
            { status: 402 },
          );
        }
      }
    }

    // ── Full Practice Test fast path ──
    // When practiceTestSet is specified, serve the deterministic 44-Q set
    // tagged on the Question table. Skips section sampling entirely.
    if (practiceTestSet && [1, 2, 3].includes(practiceTestSet)) {
      const ftQuestions = await prisma.question.findMany({
        where: {
          course: course as ApCourse,
          isApproved: true,
          practiceTestSet,
        },
        orderBy: { practiceTestPosition: "asc" },
        select: {
          id: true, course: true, unit: true, topic: true, subtopic: true,
          difficulty: true, questionType: true, questionText: true,
          stimulus: true, stimulusImageUrl: true, options: true,
          practiceTestPosition: true,
        },
      });
      if (ftQuestions.length === 0) {
        return NextResponse.json(
          { error: `Full Practice Test ${practiceTestSet} not yet seeded for ${course}` },
          { status: 400 },
        );
      }
      const session_ = await prisma.practiceSession.create({
        data: {
          userId: session.user.id,
          course: course as ApCourse,
          sessionType: "MOCK_EXAM" as SessionType,
          totalQuestions: ftQuestions.length,
        },
      });
      const placeholders = ftQuestions
        .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
        .join(", ");
      const values = ftQuestions.flatMap((q, i) => [crypto.randomUUID(), session_.id, q.id, i]);
      await prisma.$executeRawUnsafe(
        `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
        ...values,
      );
      return NextResponse.json({
        sessionId: session_.id,
        course,
        mode: "full-practice-test",
        practiceTestSet,
        totalQuestions: ftQuestions.length,
        questions: ftQuestions.map((q) => ({
          ...q,
          sectionLabel: (q.practiceTestPosition ?? 0) <= 22 ? "Module 1" : "Module 2",
        })),
      });
    }

    const struct = getCBExamStructure(course);
    if (!struct) {
      return NextResponse.json({ error: "No CB structure for this course" }, { status: 400 });
    }

    // For each section, pull random approved questions of the right type +
    // optional subtopic match. Two modes:
    //   "scaled" — ~40% of real exam length, ~30-45 min sessions
    //   "full"   — full CB count for serious-prep simulation (3+ hours)
    const SCALE = mode === "full" ? 1.0 : 0.4;
    const sections: Array<{ cbName: string; questions: Array<unknown> }> = [];
    const skippedSections: Array<{ cbName: string; reason: string }> = [];

    for (const sec of struct.sections) {
      const targetCount = Math.max(1, Math.floor(sec.count * SCALE));
      // For MCQ, scale further so we don't overwhelm the session.
      // Caps removed in "full" mode for true exam simulation.
      const adjustedCount = mode === "full"
        ? targetCount
        : sec.questionType === "MCQ"
        ? Math.min(targetCount, 15)
        : Math.min(targetCount, 2);

      // 2026-05-31 (F6) — Section filter now supports unit-keyed sampling
      // for SAT/PSAT/ACT (where CB content domains map to our `unit` field)
      // in addition to the legacy subtopic-keyed sampling for AP courses.
      const where: Record<string, unknown> = {
        course: course as ApCourse,
        isApproved: true,
        questionType: sec.questionType as QuestionType,
        ...(sec.subtopic && { subtopic: sec.subtopic }),
        ...(sec.unit && { unit: sec.unit }),
      };
      // 2026-05-27 — P0 cheat-leak fix per design audit. Never SELECT
      // correctAnswer or explanation in any route that returns questions
      // to the client. Grading happens server-side in
      // POST /api/practice/[sessionId] which re-loads with keys. A
      // student opening DevTools Network would otherwise read the entire
      // answer key for the mock before submitting.
      const pool = await prisma.question.findMany({
        where,
        select: {
          id: true, course: true, unit: true, topic: true, subtopic: true,
          difficulty: true, questionType: true, questionText: true,
          stimulus: true, stimulusImageUrl: true, options: true,
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

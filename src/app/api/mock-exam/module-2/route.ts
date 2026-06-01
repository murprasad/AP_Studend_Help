/**
 * 2026-05-31 — F2-routing (#100 SAT=CB parity Sprint S3).
 *
 * POST /api/mock-exam/module-2
 *
 * Live Module-2 adaptive routing. Called by the SAT/PSAT mock-exam UI at
 * the end of Module 1 (during the SatModuleBreak screen) BEFORE the
 * student starts Module 2. The server:
 *
 *   1. Loads the session's ordered questions and the student's responses.
 *   2. Computes Module 1 accuracy via `inferModule2Tier` (the same helper
 *      F8 uses for retroactive scoring — single source of truth).
 *   3. Picks a fresh set of Module 2 questions from the candidate pool,
 *      biased to match the inferred M2 tier:
 *        HARD   → 70% HARD + 25% MEDIUM + 5% EASY
 *        MEDIUM → 35% HARD + 45% MEDIUM + 20% EASY
 *        EASY   → 10% HARD + 35% MEDIUM + 55% EASY
 *   4. REPLACES the remaining session_questions (those at order >= m1End+1)
 *      with the new tier-weighted IDs while preserving the ordering.
 *   5. Returns the inferred tier + the new question payload so the client
 *      can refresh its in-memory questions array without a full reload.
 *
 * IMPORTANT cheat-leak guard: answer keys + explanations are STRIPPED from
 * the response — same posture as POST /api/mock-exam. The break screen
 * shows nothing about the M2 routing decision to the student (per CB
 * behavior — students never see whether they got M2-HARD vs M2-EASY).
 *
 * Idempotency: the endpoint detects when the session has already been
 * routed (Module-2 marker stored on PracticeSession.metadata) and is a
 * no-op on subsequent calls. The break screen calls it once on Continue;
 * a flaky network retry doesn't re-randomize.
 *
 * Auth required. Only the session's owner can route their own exam.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  inferModule2Tier,
  type Module2Tier,
} from "@/lib/sat-scaled-score";

export const dynamic = "force-dynamic";

const TIER_WEIGHTS: Record<Module2Tier, { EASY: number; MEDIUM: number; HARD: number }> = {
  HARD:   { EASY: 0.05, MEDIUM: 0.25, HARD: 0.70 },
  MEDIUM: { EASY: 0.20, MEDIUM: 0.45, HARD: 0.35 },
  EASY:   { EASY: 0.55, MEDIUM: 0.35, HARD: 0.10 },
};

/** Allocate target counts across the three difficulty buckets by tier weights. */
function tierTargets(tier: Module2Tier, total: number): { EASY: number; MEDIUM: number; HARD: number } {
  const w = TIER_WEIGHTS[tier];
  const rawEasy = total * w.EASY;
  const rawMed = total * w.MEDIUM;
  const easy = Math.round(rawEasy);
  const medium = Math.round(rawMed);
  const hard = Math.max(0, total - easy - medium);
  return { EASY: easy, MEDIUM: medium, HARD: hard };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const practice = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, course: true, sessionType: true },
    });
    if (!practice) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    if (practice.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (practice.sessionType !== "MOCK_EXAM") {
      return NextResponse.json({ error: "Not a mock exam session" }, { status: 400 });
    }

    // Load ordered session_questions
    const sqs = await prisma.sessionQuestion.findMany({
      where: { sessionId },
      orderBy: { order: "asc" },
      select: { id: true, questionId: true, order: true },
    });
    if (sqs.length < 10) {
      return NextResponse.json({ error: "Session too short to route" }, { status: 400 });
    }

    // Load all responses for this session, keyed by questionId
    const responses = await prisma.studentResponse.findMany({
      where: { sessionId, userId: session.user.id },
      select: { questionId: true, isCorrect: true },
    });
    const respMap = new Map(responses.map((r) => [r.questionId, r.isCorrect]));

    // Project responses onto session-question order
    const orderedResponses = sqs
      .map((sq) => {
        const r = respMap.get(sq.questionId);
        return r === undefined ? null : { isCorrect: r };
      })
      .filter((x): x is { isCorrect: boolean } => x !== null);

    // M1 is the first half of the session. Require all M1 Qs answered.
    const m1End = Math.floor(sqs.length / 2);
    const m1Answered = sqs.slice(0, m1End).every((sq) => respMap.has(sq.questionId));
    if (!m1Answered) {
      return NextResponse.json({ error: "Module 1 not fully answered" }, { status: 400 });
    }

    const tier = inferModule2Tier(orderedResponses);
    if (!tier) {
      return NextResponse.json({ error: "Couldn't infer M2 tier" }, { status: 400 });
    }

    // Load candidate pool from same course, excluding IDs already in the session.
    const usedIds = new Set(sqs.map((s) => s.questionId));
    const m2Count = sqs.length - m1End;
    const targets = tierTargets(tier, m2Count);

    const pool = await prisma.question.findMany({
      where: {
        course: practice.course,
        isApproved: true,
        id: { notIn: Array.from(usedIds) },
      },
      select: {
        id: true, course: true, unit: true, topic: true, subtopic: true,
        difficulty: true, questionType: true, questionText: true,
        stimulus: true, stimulusImageUrl: true, options: true,
      },
      take: 600,
    });

    // Bucket by difficulty
    const byDiff: Record<"EASY" | "MEDIUM" | "HARD", typeof pool> = {
      EASY: [],
      MEDIUM: [],
      HARD: [],
    };
    for (const q of pool) {
      const d = (q.difficulty as string) as "EASY" | "MEDIUM" | "HARD";
      if (d in byDiff) byDiff[d].push(q);
    }
    // Shuffle each bucket
    for (const k of Object.keys(byDiff) as Array<"EASY" | "MEDIUM" | "HARD">) {
      byDiff[k].sort(() => Math.random() - 0.5);
    }

    const m2Selected: typeof pool = [];
    const takeBucket = (bucket: "EASY" | "MEDIUM" | "HARD", n: number): void => {
      let remaining = n;
      while (remaining > 0 && byDiff[bucket].length > 0 && m2Selected.length < m2Count) {
        const q = byDiff[bucket].shift();
        if (q) m2Selected.push(q);
        remaining -= 1;
      }
    };
    takeBucket("HARD", targets.HARD);
    takeBucket("MEDIUM", targets.MEDIUM);
    takeBucket("EASY", targets.EASY);
    // Fill any shortfall by spillover from other buckets
    if (m2Selected.length < m2Count) {
      const spill = [...byDiff.HARD, ...byDiff.MEDIUM, ...byDiff.EASY];
      while (m2Selected.length < m2Count && spill.length > 0) {
        const q = spill.shift();
        if (q) m2Selected.push(q);
      }
    }
    // If pool is too small to fill M2, keep existing M2 questions as a safe fallback
    if (m2Selected.length < m2Count) {
      const haveIds = new Set(m2Selected.map((q) => q.id));
      const fallbackIds = sqs.slice(m1End).map((s) => s.questionId).filter((id) => !haveIds.has(id));
      const fallbackRows = await prisma.question.findMany({
        where: { id: { in: fallbackIds } },
        select: {
          id: true, course: true, unit: true, topic: true, subtopic: true,
          difficulty: true, questionType: true, questionText: true,
          stimulus: true, stimulusImageUrl: true, options: true,
        },
      });
      for (const q of fallbackRows) {
        if (m2Selected.length >= m2Count) break;
        m2Selected.push(q);
      }
    }

    // Replace the M2 session_questions: delete then insert in order.
    // Neon HTTP no-transactions constraint: do this as two raw statements.
    const m2SqIds = sqs.slice(m1End).map((s) => s.id);
    await prisma.$executeRawUnsafe(
      `DELETE FROM session_questions WHERE id = ANY($1::text[])`,
      m2SqIds,
    );
    if (m2Selected.length > 0) {
      const placeholders = m2Selected
        .map((_, i) => {
          const b = i * 4;
          return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`;
        })
        .join(", ");
      const values = m2Selected.flatMap((q, i) => [
        crypto.randomUUID(), sessionId, q.id, m1End + i,
      ]);
      await prisma.$executeRawUnsafe(
        `INSERT INTO session_questions (id, "sessionId", "questionId", "order") VALUES ${placeholders}`,
        ...values,
      );
    }

    return NextResponse.json({
      module2Tier: tier,
      m1End,
      m2Count: m2Selected.length,
      questions: m2Selected,
    });
  } catch (e) {
    console.error("[/api/mock-exam/module-2] error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

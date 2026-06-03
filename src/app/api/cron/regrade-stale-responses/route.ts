// Nightly cron — regrade student_responses whose isCorrect bit is stale
// relative to current questions.correctAnswer.
//
// Root cause: question.correctAnswer can be updated post-launch (quality
// sweeps, manual admin edits, LLM-judge corrections). Historical
// student_responses keep their isCorrect from submission time, so users
// see scores based on superseded grading. Confirmed bug class — see
// memory/project_pl_grading_bugs_2026-06-03.md
//
// Strategy: every night, scan MCQ student_responses, compute
// expected_isCorrect = UPPER(studentAnswer) == UPPER(correctAnswer), fix
// mismatches, rebuild affected practice_sessions.correctAnswers.
//
// Idempotent — running twice is safe.
//
// Schedule: nightly via GitHub Actions or Cloudflare cron.
// Auth: CRON_SECRET header.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
// Note: NOT edge runtime — Prisma WASM raw-SQL helpers (prisma.$queryRawUnsafe
// / $executeRawUnsafe) need the Node runtime path. Building this route under
// edge triggers a webpack WASM-not-flagged parse error against the Prisma
// query engine WASM binary.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || !auth || !auth.includes(expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use raw SQL to scan + fix in one pass (avoid Prisma row-by-row)
  const found = await prisma.$queryRawUnsafe<Array<{ srid: string; userId: string; sessionId: string; expected: boolean; current: boolean }>>(`
    SELECT sr.id AS srid, sr."userId", sr."sessionId",
      (UPPER(LEFT(TRIM(sr."studentAnswer"), 1)) = UPPER(LEFT(TRIM(q."correctAnswer"), 1))) AS expected,
      sr."isCorrect" AS current
    FROM student_responses sr
    JOIN questions q ON q.id = sr."questionId"
    WHERE sr."studentAnswer" IS NOT NULL
      AND sr."studentAnswer" != ''
      AND sr."studentAnswer" != '__IDK__'
      AND q."correctAnswer" IS NOT NULL
      AND q."correctAnswer" != ''
      AND q."questionType"::text = 'MCQ'
      AND UPPER(LEFT(TRIM(sr."studentAnswer"), 1)) IN ('A','B','C','D','E')
      AND UPPER(LEFT(TRIM(q."correctAnswer"), 1)) IN ('A','B','C','D','E')
      AND (UPPER(LEFT(TRIM(sr."studentAnswer"), 1)) = UPPER(LEFT(TRIM(q."correctAnswer"), 1))) != sr."isCorrect"
    LIMIT 5000
  `);

  if (found.length === 0) {
    return NextResponse.json({ ok: true, mismatchesFound: 0, message: "No stale grading detected." });
  }

  let updated = 0;
  const sessionsToRecompute = new Set<string>();
  for (const row of found) {
    await prisma.$executeRawUnsafe(
      `UPDATE student_responses SET "isCorrect" = $1 WHERE id = $2`,
      row.expected,
      row.srid,
    );
    updated++;
    if (row.sessionId) sessionsToRecompute.add(row.sessionId);
  }

  // Rebuild correctAnswers aggregate for affected sessions
  let sessionsRecomputed = 0;
  for (const sessionId of Array.from(sessionsToRecompute)) {
    await prisma.$executeRawUnsafe(
      `UPDATE practice_sessions
       SET "correctAnswers" = (
         SELECT COUNT(*) FILTER (WHERE "isCorrect" = true)
         FROM student_responses WHERE "sessionId" = $1
       )::int
       WHERE id = $1`,
      sessionId,
    );
    sessionsRecomputed++;
  }

  return NextResponse.json({
    ok: true,
    mismatchesFound: found.length,
    responsesUpdated: updated,
    sessionsRecomputed,
    note: "Stale grading fixed. If sessions found, scores have been corrected.",
  });
}

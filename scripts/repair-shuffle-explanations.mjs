#!/usr/bin/env node
/**
 * Repair MCQ explanations broken by Beta 8.2 shuffle.
 *
 * The shuffle script (scripts/shuffle-mcq-answers.mjs) swapped option
 * positions and updated correctAnswer letter — but DID NOT rewrite
 * the explanation field. Many explanations reference letters by name
 * ("A is correct because...", "B is wrong (trap)..."). After the
 * shuffle, those letter references no longer match the actual options.
 *
 * Detection: explanations containing /[A-E] is (correct|wrong|incorrect)/i
 * are STALE — the letter inside almost certainly doesn't match the
 * current correctAnswer.
 *
 * Fix strategies:
 *   A) Strip ALL letter-references from explanations (defensive — loses
 *      some content but never lies)
 *   B) Use AI to rewrite the explanation referencing the new correct letter
 *      (preserves teaching content but expensive — 5K+ Groq calls)
 *
 * This script does (A) — the safe immediate fix. (B) is a follow-up
 * if user wants richer explanations restored.
 *
 * Usage:
 *   node scripts/repair-shuffle-explanations.mjs --dry      # report only
 *   node scripts/repair-shuffle-explanations.mjs            # apply fix
 *   node scripts/repair-shuffle-explanations.mjs AP_CHEMISTRY # one course
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const courseFilter = args.find((a) => a.startsWith("AP_") || a.startsWith("SAT_") || a.startsWith("ACT_") || a.startsWith("CLEP_"));

// Aggressive sentence-level strip of letter-references. Mirrors the
// approach we took for flashcards in Beta 8.2 hotfix.
//
// 2026-04-27: extended to catch "the correct answer is X" / "the answer is X"
// patterns the original missed (those put a verb between "answer" and the
// letter, breaking the previous \bcorrect\s+answer[,\s]+[A-E]\b match).
// AP World History gap analysis surfaced 13% of MCQs still leaking these.
function stripStaleLetterRefs(text) {
  if (!text) return "";
  let out = text;

  // SENTENCE-LEVEL strip — terminator class is [.!?:\n] now, expanded from
  // [.!?\n] (Beta 8.5.1) to also cover colon-ending headers like
  // "Why A (39.6 g) is correct: First, convert each reactant…" — colons
  // were leaking 57 stragglers across the bank (2026-04-27 audit).
  // Also matches end-of-string via `(?:[.!?:\n]|$)`.
  const TERM = "(?:[.!?:\\n]|$)";

  // "A is correct" / "B is wrong" / "C is incorrect"
  out = out.replace(new RegExp(`[^.!?\\n:]*\\b[\\(\\[]?[A-E][\\)\\],]?\\s+(?:is|was)\\s+(?:correct|wrong|incorrect|right)[^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // "Why A is correct" / "Why D (14) is correct:" / "Why A "
  out = out.replace(new RegExp(`[^.!?\\n:]*\\bWhy\\s+[\\(\\[]?[A-E][\\)\\]]?[^.!?\\n:]*?(?:is|was)\\s+(?:correct|wrong|incorrect|right)[^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // "the correct answer is A" / "correct answer would be A"
  out = out.replace(new RegExp(`[^.!?\\n:]*\\b(?:the\\s+)?correct\\s+answer\\s+(?:is|was|would\\s+be|here\\s+is|here\\s+was|=)\\s*[\\(\\[]?[A-E][\\)\\],]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");
  out = out.replace(new RegExp(`[^.!?\\n:]*\\b(?:the\\s+)?answer\\s+(?:is|was|would\\s+be|here\\s+is|here\\s+was|=)\\s*[\\(\\[]?[A-E][\\)\\],]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // "Answer A" / "The correct answer, C, is..." — original patterns.
  out = out.replace(new RegExp(`[^.!?\\n:]*\\bcorrect\\s+answer[,\\s]+[\\(\\[]?[A-E][\\)\\],]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");
  out = out.replace(new RegExp(`[^.!?\\n:]*\\bAnswer\\s+[A-E][^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // "Option A" / "Choice B" / "selecting B" / "choosing C"
  out = out.replace(new RegExp(`[^.!?\\n:]*\\b(?:Option|Choice)\\s+[\\(\\[]?[A-E][\\)\\]]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");
  out = out.replace(new RegExp(`[^.!?\\n:]*\\b(?:selecting|choosing|picking)\\s+[\\(\\[]?[A-E][\\)\\]]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // "Distractor A:" / "Distractor B:" — header-style for distractor analysis
  out = out.replace(new RegExp(`[^.!?\\n:]*\\bDistractor\\s+[\\(\\[]?[A-E][\\)\\]]?[^.!?\\n:]*${TERM}\\s*`, "gi"), "");

  // Trap parentheticals
  out = out.replace(/\((?:trap|distractor)[^)]*\)/gi, "");

  // Markdown headers
  out = out.replace(/^[ \t]*(?:#{1,6}\s+|\*{2,3})[^*\n]*[A-E][^*\n]*\*{0,3}\n?/gim, "");

  // Collapse + trim
  return out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

(async () => {
  console.log(`\n🔧 Repairing shuffle-stale explanations ${dryRun ? "(DRY RUN)" : "(WRITE)"}\n`);

  const rows = courseFilter
    ? await sql`
        SELECT id, course, explanation, "correctAnswer"
        FROM questions
        WHERE "questionType" = 'MCQ' AND course = ${courseFilter}::"ApCourse"
      `
    : await sql`
        SELECT id, course, explanation, "correctAnswer"
        FROM questions
        WHERE "questionType" = 'MCQ'
      `;
  console.log(`Loaded ${rows.length} MCQs from ${courseFilter ?? "ALL courses"}`);

  // Also catches verb-between variants: "the correct answer is A",
  // "the answer is (B)", "selecting C", "choosing D" — these were the
  // 13% leak found in AP_WH 2026-04-27 audit.
  const STALE_PATTERN = /\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b|\bWhy\s+[A-E]\s|\b(?:the\s+)?correct\s+answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\b(?:the\s+)?answer\s+(?:is|was|would\s+be|here\s+is|=)\s*[\(\[]?[A-E]\b|\bcorrect\s+answer[,\s]+[A-E]\b|\bOption\s+[A-E]\b|\bChoice\s+[A-E]\b|\bAnswer\s+[A-E]\b|\b(?:selecting|choosing|picking)\s+[\(\[]?[A-E]\b/i;

  let staleCount = 0;
  let fixedCount = 0;
  let errCount = 0;
  const sampleStale = [];

  for (const row of rows) {
    if (!STALE_PATTERN.test(row.explanation)) continue;
    staleCount++;
    if (sampleStale.length < 3) sampleStale.push({ id: row.id, course: row.course, before: row.explanation.slice(0, 150) });

    const cleaned = stripStaleLetterRefs(row.explanation);
    if (dryRun) {
      fixedCount++;
      continue;
    }
    try {
      await sql`UPDATE questions SET explanation = ${cleaned} WHERE id = ${row.id}`;
      fixedCount++;
    } catch (e) {
      errCount++;
      console.error(`  ✗ ${row.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Total MCQs scanned: ${rows.length}`);
  console.log(`  STALE (letter-references found): ${staleCount} (${((staleCount / rows.length) * 100).toFixed(1)}%)`);
  console.log(`  ${dryRun ? "Would fix" : "Fixed"}: ${fixedCount}`);
  console.log(`  Errors: ${errCount}`);
  if (sampleStale.length > 0) {
    console.log(`\n  Sample stale explanations (BEFORE fix):`);
    for (const s of sampleStale) {
      console.log(`    ${s.course} ${s.id.slice(0,8)}: "${s.before}..."`);
    }
  }
})().catch(e => { console.error("Fatal:", e); process.exit(1); });

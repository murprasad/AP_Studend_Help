/**
 * Retroactive letter-mismatch sweep — finds questions where explanation
 * text says "X is correct" but stored correctAnswer is a different letter.
 *
 * This is Gregory's bug (the one the user just hit on College Algebra):
 *   stored correctAnswer = "B"
 *   options[B] = "W = (P - 2L) / 2"  (math correct)
 *   explanation = "C is correct because ... W = (P - 2L) / 2"  (says C — WRONG letter)
 *
 * The deterministic gate catches this on NEW gen but older banks (pre-2026-05-18)
 * predate the gate. This script finds + (optionally) unapproves all offenders.
 *
 * Usage:
 *   node _sweep-letter-mismatch.mjs                # dry-run
 *   node _sweep-letter-mismatch.mjs --apply        # unapprove all matches
 *   node _sweep-letter-mismatch.mjs --course=CLEP_COLLEGE_ALGEBRA
 *   node _sweep-letter-mismatch.mjs --fix          # patch explanation to use stored correctAnswer letter
 */
import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const APPLY = !!args.apply;
const FIX = !!args.fix;
const COURSE = args.course ?? null;

const LETTER_CLAIM_REGEX = /(?:^|[^A-Z])(?:option\s+|answer\s+is\s+)?\(?([A-E])\)?\s+is\s+correct/i;

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "correctAnswer", explanation, "isApproved", "modelUsed" FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true`
  : await sql`SELECT id, course::text AS course, "correctAnswer", explanation, "isApproved", "modelUsed" FROM questions WHERE "isApproved" = true`;
console.log(`Scanning ${rows.length} approved questions${COURSE ? ` for ${COURSE}` : ""}…`);

const mismatches = [];
for (const r of rows) {
  if (!r.explanation || !r.correctAnswer) continue;
  const head = String(r.explanation).slice(0, 300);
  const m = head.match(LETTER_CLAIM_REGEX);
  if (!m) continue;
  const claimedLetter = m[1].toUpperCase();
  if (claimedLetter !== r.correctAnswer) {
    mismatches.push({ id: r.id, course: r.course, stored: r.correctAnswer, claimed: claimedLetter, modelUsed: r.modelUsed, explSnippet: head.slice(0, 100) });
  }
}

console.log(`\n══ Mismatches found: ${mismatches.length} ══`);
const byCourse = {};
const byModel = {};
mismatches.forEach((x) => {
  byCourse[x.course] = (byCourse[x.course] || 0) + 1;
  byModel[x.modelUsed || "null"] = (byModel[x.modelUsed || "null"] || 0) + 1;
});
console.log("\nBy course:");
Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([c, n]) => console.log(`  ${c.padEnd(38)} ${n}`));
console.log("\nBy model:");
Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([m, n]) => console.log(`  ${(m || "null").padEnd(48)} ${n}`));

if (mismatches.length > 0) {
  console.log("\nFirst 5 examples:");
  mismatches.slice(0, 5).forEach((x) => {
    console.log(`  ${x.id} [${x.course}] stored=${x.stored} claimed=${x.claimed} (${x.modelUsed})`);
    console.log(`    expl: ${x.explSnippet}…`);
  });
}

if (!APPLY && !FIX) {
  console.log("\n(dry-run — no DB changes. Use --apply to unapprove, or --fix to patch explanations.)");
  process.exit(0);
}

let updated = 0;
for (const x of mismatches) {
  if (FIX) {
    // Patch: replace the wrong letter in explanation with the stored correctAnswer letter
    const row = (await sql`SELECT explanation FROM questions WHERE id = ${x.id}`)[0];
    if (!row) continue;
    const patched = row.explanation.replace(
      new RegExp(`(?<=^|[^A-Z])(?:option\\s+|answer\\s+is\\s+)?\\(?${x.claimed}\\)?(\\s+is\\s+correct)`, "i"),
      `${x.stored}$1`
    );
    if (patched !== row.explanation) {
      await sql`UPDATE questions SET explanation = ${patched}, "updatedAt" = NOW() WHERE id = ${x.id}`;
      updated++;
    }
  } else if (APPLY) {
    await sql`UPDATE questions SET "isApproved" = false, "updatedAt" = NOW() WHERE id = ${x.id}`;
    updated++;
  }
}

console.log(`\n${FIX ? "Patched explanations" : "Unapproved"}: ${updated} / ${mismatches.length}`);

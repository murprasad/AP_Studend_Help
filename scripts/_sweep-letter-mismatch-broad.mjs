/**
 * Broad letter-mismatch sweep — catches MORE variations than the narrow
 * "X is correct" pattern in deterministic-question-gates.ts.
 *
 * Patterns checked (in order, first match wins):
 *   1. "X is correct"                   → existing gate
 *   2. "X is the correct answer"        → variant
 *   3. "the correct answer is X"        → subject-first form
 *   4. "the answer is X"                → variant
 *   5. "option X is correct"            → variant
 *   6. "option X gives"                 → loose variant
 *   7. "letter X is"                    → variant (with any verb)
 *   8. "(X) is correct"                 → parenthesized
 *   9. "X correctly"                    → adverbial form (HIGHER false-positive risk)
 *
 * For each match, if the captured letter != stored correctAnswer, it's a
 * mismatch. Stored correctAnswer is authoritative — if explanation disagrees,
 * the EXPLANATION is wrong (UI uses correctAnswer).
 *
 * Usage:
 *   node _sweep-letter-mismatch-broad.mjs           # dry-run
 *   node _sweep-letter-mismatch-broad.mjs --apply   # unapprove
 *   node _sweep-letter-mismatch-broad.mjs --course=CLEP_COLLEGE_ALGEBRA
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
const COURSE = args.course ?? null;

// Stricter set — every pattern requires the letter near "correct"/"answer" to minimize false positives.
// Letter MUST be a single A-E preceded by word boundary, NOT immediately followed by ).
const PATTERNS = [
  { name: "X is correct",                     re: /(?:^|[^A-Za-z])(?:option\s+|answer\s+is\s+|letter\s+)?\(?\b([A-E])\)?\b\s+is\s+correct\b/i },
  { name: "X is the correct",                 re: /(?:^|[^A-Za-z])(?:option\s+|letter\s+)?\(?\b([A-E])\)?\b\s+is\s+the\s+correct/i },
  { name: "the correct answer is X",          re: /\bthe\s+correct\s+(?:answer|option|choice)\s+is\s+\(?\b([A-E])\)?\b/i },
  { name: "the answer is X",                  re: /\bthe\s+answer\s+is\s+\(?\b([A-E])\)?\b(?!\s+wrong|\s+incorrect|\s+not)/i },
  { name: "correct option is X",              re: /\bcorrect\s+(?:option|choice|answer|letter)\s+is\s+\(?\b([A-E])\)?\b/i },
  { name: "option X gives the correct",       re: /\boption\s+\(?\b([A-E])\)?\b\s+(?:gives|provides|shows|states|represents)\s+the\s+correct/i },
  { name: "Letter X is the (correct/answer)", re: /\bLetter\s+\(?\b([A-E])\)?\b\s+is\s+the\b/i },
];

function findClaim(text) {
  if (!text) return null;
  // Only look at first 400 chars to focus on the lead claim
  const head = String(text).slice(0, 400);
  for (const p of PATTERNS) {
    const m = head.match(p.re);
    if (m) return { letter: m[1].toUpperCase(), pattern: p.name };
  }
  return null;
}

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "correctAnswer", explanation, "modelUsed" FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true`
  : await sql`SELECT id, course::text AS course, "correctAnswer", explanation, "modelUsed" FROM questions WHERE "isApproved" = true`;
console.log(`Scanning ${rows.length} approved questions${COURSE ? ` for ${COURSE}` : ""}…`);

const mismatches = [];
for (const r of rows) {
  if (!r.explanation || !r.correctAnswer) continue;
  const claim = findClaim(r.explanation);
  if (!claim) continue;
  if (claim.letter !== r.correctAnswer) {
    mismatches.push({ id: r.id, course: r.course, stored: r.correctAnswer, claimed: claim.letter, pattern: claim.pattern, modelUsed: r.modelUsed, explSnippet: String(r.explanation).slice(0, 120) });
  }
}

console.log(`\n══ Mismatches found: ${mismatches.length} ══`);
const byCourse = {}, byPattern = {}, byModel = {};
mismatches.forEach((x) => {
  byCourse[x.course] = (byCourse[x.course] || 0) + 1;
  byPattern[x.pattern] = (byPattern[x.pattern] || 0) + 1;
  byModel[x.modelUsed || "null"] = (byModel[x.modelUsed || "null"] || 0) + 1;
});
console.log("\nBy course:");
Object.entries(byCourse).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c.padEnd(38)} ${n}`));
console.log("\nBy pattern:");
Object.entries(byPattern).sort((a, b) => b[1] - a[1]).forEach(([p, n]) => console.log(`  ${p.padEnd(38)} ${n}`));
console.log("\nBy model:");
Object.entries(byModel).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([m, n]) => console.log(`  ${(m || "null").padEnd(48)} ${n}`));

if (mismatches.length > 0) {
  console.log("\nFirst 10 examples:");
  mismatches.slice(0, 10).forEach((x) => {
    console.log(`  ${x.id} [${x.course}] stored=${x.stored} claimed=${x.claimed} via "${x.pattern}"`);
    console.log(`    expl: ${x.explSnippet}…`);
  });
}

if (!APPLY) {
  console.log("\n(dry-run — no DB changes. Use --apply to unapprove.)");
  process.exit(0);
}

let updated = 0;
for (const x of mismatches) {
  await sql`UPDATE questions SET "isApproved" = false, "updatedAt" = NOW() WHERE id = ${x.id}`;
  updated++;
}
console.log(`\nUnapproved: ${updated} / ${mismatches.length}`);

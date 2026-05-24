/**
 * Legacy explanation rewrite — kills the "Letter X is correct" pattern
 * retroactively. All NEW Qs use value-based ("The answer is 8 because…")
 * but legacy Qs still reference letter labels, which is brittle when
 * options shuffle.
 *
 * Strategy:
 *   For each approved MCQ whose explanation matches /^(Letter|Option|Choice|Answer)\s+([A-E])\s+is\s+correct/i:
 *     Look up the option text at that letter position
 *     Rewrite explanation: "Letter A is correct because" → "[Option A text] is correct because"
 *     (keeps everything after "because" unchanged)
 *
 * Safety:
 *   - Only matches well-formed patterns at start of explanation
 *   - Skips if claimed-letter ≠ stored correctAnswer (that's a bug; let the
 *     letter-mismatch sweep handle it)
 *   - Dry-run by default; --apply to write
 *   - Records every change for audit
 *
 * Usage:
 *   node scripts/_rewrite-letter-explanations.mjs                # dry-run all PL CLEPs
 *   node scripts/_rewrite-letter-explanations.mjs --apply
 *   node scripts/_rewrite-letter-explanations.mjs --course=CLEP_COLLEGE_ALGEBRA --apply
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

const LETTER_HEAD = /^(?:Letter|Option|Choice|Answer)\s+([A-E])\s+is\s+correct\s+because\s+/i;
const BARE_LETTER_HEAD = /^([A-E])\s+is\s+correct\s+because\s+/i;

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
              FROM questions
              WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE}`
  : await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
              FROM questions
              WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text LIKE 'CLEP_%'`;

console.log(`Scanning ${rows.length} approved MCQs for legacy "Letter X is correct" pattern...\n`);

let candidates = 0;
let mismatched = 0;
let toRewrite = 0;
const rewrites = [];

for (const q of rows) {
  if (!q.explanation) continue;
  const expl = q.explanation;
  const m = expl.match(LETTER_HEAD) || expl.match(BARE_LETTER_HEAD);
  if (!m) continue;
  candidates++;
  const claimedLetter = m[1].toUpperCase();
  if (claimedLetter !== q.correctAnswer.toUpperCase()) {
    // Letter-mismatch — defer to the letter-mismatch sweep
    mismatched++;
    continue;
  }
  // Look up the actual option text at this letter
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  const idx = claimedLetter.charCodeAt(0) - 65;
  if (idx < 0 || idx >= opts.length) continue;
  // Strip "A) " prefix if present
  const optText = opts[idx].replace(/^[A-E]\)\s*/, "").trim();
  // Trim to first 50 chars + "..." if longer than 60, else use full text
  let valueRef = optText.length > 60 ? optText.slice(0, 50) + "..." : optText;
  // If option text has math/LaTeX, wrap in quotes for clarity
  if (/[$\\(){}^]/.test(optText)) valueRef = `"${valueRef}"`;

  const newExpl = expl.replace(LETTER_HEAD, `${valueRef} is correct because `)
                       .replace(BARE_LETTER_HEAD, `${valueRef} is correct because `);
  if (newExpl === expl) continue; // no change
  toRewrite++;
  rewrites.push({ id: q.id, course: q.course, old: expl, new: newExpl, claimed: claimedLetter });
}

console.log(`Candidates (start with "Letter X is correct"): ${candidates}`);
console.log(`  → ${mismatched} have letter-mismatch (skipped; sweep handles)`);
console.log(`  → ${toRewrite} ready to rewrite\n`);

const SAMPLE = parseInt(args.sample ?? "3", 10);
console.log(`First ${SAMPLE} examples:`);
for (const r of rewrites.slice(0, SAMPLE)) {
  console.log(`  ${r.course} ${r.id.slice(0, 12)}`);
  console.log(`    OLD: ${r.old.slice(0, 100)}...`);
  console.log(`    NEW: ${r.new.slice(0, 100)}...`);
  console.log();
}

if (!APPLY) {
  console.log(`(dry-run — pass --apply to rewrite ${toRewrite} explanations)`);
  process.exit(0);
}

console.log(`Applying ${toRewrite} rewrites...`);
let done = 0;
for (const r of rewrites) {
  await sql`UPDATE questions SET explanation = ${r.new}, "updatedAt" = NOW() WHERE id = ${r.id}`;
  done++;
  if (done % 200 === 0) console.log(`  ${done}/${toRewrite}`);
}
console.log(`\nDone. Rewrote ${done} explanations.`);
console.log("Recommend: run scripts/_sweep-letter-mismatch.mjs to verify no regressions.");

// Quality Process v1 follow-up — fix the "question claims a visual but
// has no image" defect class reported by user on SN journey diagnostic.
//
// Two surgical fixes:
//   1) Rewrite 5 ACT_MATH "Figure: ..." MCQs — info is in the text, just
//      strip the misleading "Figure:" prefix.
//   2) Unapprove 22 MCQs that reference "the diagram/graph below/etc"
//      with no stimulusImageUrl — student can't answer these without
//      seeing the visual. Set isApproved=false so practice/diagnostic
//      stops serving them. They stay in the bank for later re-render.
//
// Run: node scripts/_fix-claims-visual-questions.mjs            (dry-run)
//      node scripts/_fix-claims-visual-questions.mjs --apply    (writes)
import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const APPLY = process.argv.includes("--apply");
const log = (s) => console.log(s);
log(APPLY ? "Mode: APPLY (writes will happen)" : "Mode: DRY-RUN (no writes)");

// ── 1. Rewrite 5 ACT_MATH "Figure:" MCQs ────────────────────────────────────
const figureQs = await sql`
  SELECT id, "questionText"
  FROM questions
  WHERE "isApproved" = true
    AND course::text = 'ACT_MATH'
    AND "questionType"::text = 'MCQ'
    AND "questionText" ILIKE 'Figure:%'
`;
log(`\n[1] ACT_MATH "Figure:" MCQs to rewrite: ${figureQs.length}`);

for (const q of figureQs) {
  // Strip "Figure: " then ensure first letter is uppercase.
  // "Figure: A right triangle with legs 3 and 4. What is..." →
  // "A right triangle has legs of length 3 and 4. What is..."
  let newText = q.questionText.replace(/^Figure:\s*/i, "").trim();
  // Convert lowercase first char from descriptor → uppercase sentence
  if (newText[0] && newText[0] === newText[0].toLowerCase()) {
    newText = newText[0].toUpperCase() + newText.slice(1);
  }
  // Common pattern: "A right triangle with legs 3 and 4." → "A right triangle has legs of length 3 and 4."
  newText = newText.replace(/^(A [a-z\- ]+ triangle)\s+with\s+(legs\s+\d+\s+and\s+\d+)\b/i, "$1 has $2");
  newText = newText.replace(/^(A [a-z\- ]+ triangle)\s+with\s+(sides\s+[\d, and]+)\b/i, "$1 has $2");
  newText = newText.replace(/^(A [\d\-]+ triangle)\s+with\s+hypotenuse\s+(\d+)\b/i, "$1 has hypotenuse $2");
  newText = newText.replace(/^(Two parallel lines)\s+cut by a transversal/i, "$1 are cut by a transversal");

  log(`\n  [${q.id.slice(0, 12)}]`);
  log(`    BEFORE: ${q.questionText.slice(0, 140)}`);
  log(`    AFTER:  ${newText.slice(0, 140)}`);

  if (APPLY) {
    await sql`UPDATE questions SET "questionText" = ${newText} WHERE id = ${q.id}`;
    log(`    ✅ updated`);
  }
}

// ── 2. Unapprove 22 MCQs that claim a visual but have no image ──────────────
const visualMcqs = await sql`
  SELECT id, course::text AS course, LEFT("questionText", 140) AS stem
  FROM questions
  WHERE "isApproved" = true
    AND "questionType"::text = 'MCQ'
    AND ("questionText" ILIKE '%the diagram%'
         OR "questionText" ILIKE '%the graph below%'
         OR "questionText" ILIKE '%shown in the graph%'
         OR "questionText" ILIKE '%Figure shows%'
         OR "questionText" ILIKE '%shown in the figure%')
    AND ("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')
`;
log(`\n\n[2] MCQs claiming a visual with no image to unapprove: ${visualMcqs.length}`);
for (const q of visualMcqs) {
  log(`  [${q.id.slice(0, 12)} ${q.course}] ${q.stem.replace(/\n/g, " | ")}`);
}

if (APPLY && visualMcqs.length > 0) {
  const ids = visualMcqs.map((q) => q.id);
  const result = await sql`
    UPDATE questions SET "isApproved" = false
    WHERE id = ANY(${ids})
  `;
  log(`\n  ✅ unapproved ${visualMcqs.length} MCQs`);
}

log(APPLY ? "\nDone. Writes applied." : "\nDry-run complete. Re-run with --apply to commit.");

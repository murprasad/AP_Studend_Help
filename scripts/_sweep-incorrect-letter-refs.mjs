/**
 * Find + rewrite explanations that name a letter as INCORRECT in the body.
 *   "B is incorrect due to..." / "Option C is incorrect..." / "Choice D is wrong..."
 *
 * Same brittleness as "[Letter] is correct" — breaks when options shuffle.
 *
 * Strategy: TRUNCATE the explanation at the first such reference. The
 * lead value-based reasoning is preserved; the brittle "B is incorrect"
 * tail is dropped.
 *
 * Usage:
 *   node scripts/_sweep-incorrect-letter-refs.mjs              # dry-run
 *   node scripts/_sweep-incorrect-letter-refs.mjs --apply
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

// Match "X is incorrect", "Option X is incorrect", "Letter X is wrong", etc.
// Capture position so we can truncate.
const INCORRECT_REF = /\.\s*(?:Letter|Option|Choice|Answer)?\s*\(?[A-E]\)?\s+is\s+(?:in)?correct(?:\b|$|,|\.)/i;
const WRONG_REF = /\.\s*(?:Letter|Option|Choice|Answer)?\s*\(?[A-E]\)?\s+is\s+wrong\b/i;
const NOT_CORRECT_REF = /\.\s*(?:Letter|Option|Choice|Answer)?\s*\(?[A-E]\)?\s+is\s+not\s+correct\b/i;

function findCutPoint(expl) {
  // Find earliest reference after position 60 (so we keep the lead value statement)
  let earliest = Infinity;
  for (const re of [INCORRECT_REF, WRONG_REF, NOT_CORRECT_REF]) {
    const m = expl.match(re);
    if (m && m.index !== undefined && m.index >= 60 && m.index < earliest) {
      earliest = m.index;
    }
  }
  return earliest === Infinity ? -1 : earliest;
}

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
              FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE}`
  : await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", explanation
              FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text LIKE 'CLEP_%'`;

console.log(`Scanning ${rows.length} approved MCQs for body letter-references...\n`);

const updates = [];
for (const q of rows) {
  if (!q.explanation) continue;
  const cut = findCutPoint(q.explanation);
  if (cut === -1) continue;
  const newExpl = q.explanation.slice(0, cut + 1).trim() + ".";
  // Skip if cut would leave explanation < 40 chars (gate v2 min)
  if (newExpl.length < 40) continue;
  updates.push({ id: q.id, course: q.course, old: q.explanation, new: newExpl });
}

console.log(`Found ${updates.length} explanations with body letter-references.\n`);

const byCourse = {};
for (const u of updates) byCourse[u.course] = (byCourse[u.course] || 0) + 1;
for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(40)} ${n}`);
}

console.log("\nFirst 5 examples:");
for (const u of updates.slice(0, 5)) {
  console.log(`  ${u.course} ${u.id.slice(0, 12)}`);
  console.log(`    OLD: ${u.old.slice(0, 200)}`);
  console.log(`    NEW: ${u.new.slice(0, 200)}`);
  console.log();
}

if (!APPLY) {
  console.log(`(dry-run — pass --apply)`);
  process.exit(0);
}

console.log(`Applying ${updates.length} truncations...`);
let done = 0;
for (const u of updates) {
  await sql`UPDATE questions SET explanation = ${u.new}, "updatedAt" = NOW() WHERE id = ${u.id}`;
  done++;
  if (done % 500 === 0) console.log(`  ${done}/${updates.length}`);
}
console.log(`Done. Rewrote ${done}.`);

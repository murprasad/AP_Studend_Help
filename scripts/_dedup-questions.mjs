/**
 * Detect duplicate questionText within same course (case/whitespace-insensitive).
 * If 2+ approved Qs have the same stem + same correct value, user sees them
 * as identical → bad UX.
 *
 * Strategy:
 *   - Normalize stem (lowercase, collapse whitespace, strip punctuation)
 *   - Group by (course, normalized stem)
 *   - For groups with 2+ approved: keep oldest (most-validated), unapprove rest
 *
 * Usage:
 *   node scripts/_dedup-questions.mjs                 # dry-run all PL CLEP
 *   node scripts/_dedup-questions.mjs --apply
 *   node scripts/_dedup-questions.mjs --course=CLEP_COLLEGE_ALGEBRA
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

function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", "createdAt"
              FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE}
              ORDER BY "createdAt" ASC`
  : await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer", "createdAt"
              FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text LIKE 'CLEP_%'
              ORDER BY "createdAt" ASC`;

console.log(`Scanning ${rows.length} approved MCQs for stem duplicates...\n`);

const groups = new Map(); // (course|normStem) → [qids]
for (const q of rows) {
  const key = `${q.course}|${normalize(q.questionText)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(q);
}

const dupes = [];
for (const [key, qs] of groups.entries()) {
  if (qs.length < 2) continue;
  // Keep oldest; mark rest for unapprove
  const [keep, ...drop] = qs;
  for (const d of drop) {
    dupes.push({ id: d.id, course: d.course, stem: d.questionText.slice(0, 100), keepId: keep.id });
  }
}

console.log(`Duplicate groups found: ${groups.size} groups have 2+ Qs`);
console.log(`Qs to unapprove (keeping oldest in each group): ${dupes.length}\n`);

const byCourse = {};
for (const d of dupes) byCourse[d.course] = (byCourse[d.course] || 0) + 1;
for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${c.padEnd(40)} ${n}`);
}

console.log("\nFirst 5 examples:");
for (const d of dupes.slice(0, 5)) {
  console.log(`  ${d.course} drop=${d.id.slice(0, 12)} keep=${d.keepId.slice(0, 12)}`);
  console.log(`    "${d.stem}"`);
}

if (!APPLY) {
  console.log(`\n(dry-run — pass --apply)`);
  process.exit(0);
}

const ids = dupes.map((d) => d.id);
const chunkSize = 100;
let done = 0;
for (let i = 0; i < ids.length; i += chunkSize) {
  const chunk = ids.slice(i, i + chunkSize);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${chunk})`;
  done += chunk.length;
  if (done % 500 === 0) console.log(`  ${done}/${ids.length}`);
}
console.log(`Done. Unapproved ${done} duplicate stems.`);

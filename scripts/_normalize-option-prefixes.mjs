/**
 * Add "A) ", "B) ", ... prefixes to options that lack them.
 *
 * Today's prefix-sweep unapproved 21k Qs that had options stored without
 * the explicit "A)/B)/" prefix. But the UI auto-adds the letter at render
 * time, so those Qs are FUNCTIONAL — the gate is correct that they
 * SHOULD be normalized, but the right fix is normalize (not unapprove).
 *
 * Strategy:
 *   For each approved MCQ where options have NO prefix on any option:
 *     Prepend "A) ", "B) ", "C) ", "D) " (and "E) " when 5 options)
 *   Skip if ANY option already has a prefix (avoid partial double-prefix bug)
 *
 * Usage:
 *   node scripts/_normalize-option-prefixes.mjs                 # dry-run
 *   node scripts/_normalize-option-prefixes.mjs --apply
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

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, options FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE}`
  : await sql`SELECT id, course::text AS course, options FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text LIKE 'CLEP_%'`;

console.log(`Scanning ${rows.length} approved MCQs for missing option prefixes...\n`);

const PREFIX_RE = /^[A-E][\)\.]\s*/;
let needsNormalize = 0;
const updates = [];

for (const q of rows) {
  if (!Array.isArray(q.options)) continue;
  const opts = q.options.map(String);
  if (opts.length < 4 || opts.length > 5) continue;
  // Skip if ANY option already has a prefix (we'd double-prefix)
  const anyHasPrefix = opts.some((o) => PREFIX_RE.test(o.trim()));
  if (anyHasPrefix) continue;
  const newOpts = opts.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`);
  needsNormalize++;
  updates.push({ id: q.id, course: q.course, newOpts });
}

console.log(`Need normalization: ${needsNormalize}\n`);
console.log("First 3 examples:");
for (const u of updates.slice(0, 3)) {
  console.log(`  ${u.course} ${u.id.slice(0, 12)}`);
  console.log(`    → ${JSON.stringify(u.newOpts).slice(0, 140)}`);
}

if (!APPLY) {
  console.log(`\n(dry-run — pass --apply)`);
  process.exit(0);
}

console.log(`\nApplying ${updates.length} normalizations...`);
let done = 0;
for (const u of updates) {
  await sql`UPDATE questions SET options = ${JSON.stringify(u.newOpts)}::jsonb, "updatedAt" = NOW() WHERE id = ${u.id}`;
  done++;
  if (done % 500 === 0) console.log(`  ${done}/${updates.length}`);
}
console.log(`Done. Normalized ${done}.`);

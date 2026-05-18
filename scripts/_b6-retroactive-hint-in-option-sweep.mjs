/**
 * B6 retroactive hint-in-option sweep (StudentNest variant).
 * Mirror of PL sweep. Scans all approved questions for CB-style violations.
 */
import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const APPLY = process.argv.includes("--apply");

const HINT_PATTERNS = [
  /\([^)]{25,}\)/,
  / — | -- /,
  /,\s*because\s/i,
  /,\s*which\s+is\s/i,
  /,\s*which\s+refers\s+to\s/i,
  /,\s*also\s+called\s/i,
  /\bi\.e\.\,/i,
  /\be\.g\.\,/i,
];

function hintInOption(opt) {
  const stripped = String(opt).replace(/^[A-E]\)\s*/, "");
  for (const re of HINT_PATTERNS) {
    if (re.test(stripped)) return re.source;
  }
  return null;
}

const rows = await sql`
  SELECT id, course::text AS course, options
  FROM questions
  WHERE "isApproved" = true
`;
console.log(`Loaded ${rows.length} approved SN questions. Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

const offenders = [];
for (const r of rows) {
  let opts = r.options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { continue; } }
  if (!Array.isArray(opts)) continue;
  for (const o of opts) {
    const hit = hintInOption(o);
    if (hit) {
      offenders.push({ id: r.id, course: r.course, pattern: hit });
      break;
    }
  }
}
console.log(`Hint-in-option offenders: ${offenders.length}\n`);

const byCourse = {};
for (const o of offenders) byCourse[o.course] = (byCourse[o.course] ?? 0) + 1;
console.log("By course (top 20):");
for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`  ${c.padEnd(36)} ${n}`);
}

if (!APPLY) {
  console.log("\nDRY-RUN.");
  process.exit(0);
}

const safeIds = [];
const blocked = [];
for (const [course, count] of Object.entries(byCourse)) {
  const cur = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course::text = ${course} AND "isApproved" = true`;
  const after = cur[0].n - count;
  if (after >= 200) {
    safeIds.push(...offenders.filter(o => o.course === course).map(o => o.id));
    console.log(`  ${course.padEnd(36)}: ${cur[0].n} → ${after} ✓`);
  } else {
    blocked.push({ course, count, after });
    console.log(`  ${course.padEnd(36)}: ${cur[0].n} → ${after} BLOCKED`);
  }
}

console.log(`\nUnapproving ${safeIds.length}...`);
const B = 500;
for (let i = 0; i < safeIds.length; i += B) {
  const batch = safeIds.slice(i, i + B);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${batch})`;
  console.log(`  Batch ${Math.floor(i / B) + 1}: ${batch.length}`);
}
console.log(`✓ Unapproved ${safeIds.length}.`);

/**
 * scripts/visible-courses-dynamic.mjs
 *
 * Queries the live DB for current per-course approved-MCQ counts, then
 * sets SiteSetting.visible_courses to ONLY the courses meeting the
 * ≥200 high-quality threshold.
 *
 * Run with --dry to preview; otherwise it writes immediately.
 *   node scripts/visible-courses-dynamic.mjs --dry
 *   node scripts/visible-courses-dynamic.mjs
 *
 * Used after a sweep that auto-unapproved broken questions, when
 * some courses dropped below the visibility threshold.
 */

import "dotenv/config";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const DRY = process.argv.includes("--dry");
const THRESHOLD = 200;

console.log(`Visible-courses dynamic update — threshold: ≥${THRESHOLD} approved MCQs`);
console.log(`Mode: ${DRY ? "DRY (preview)" : "WRITE (will update SiteSetting)"}`);

// Per-course approved-MCQ count
const counts = await sql`
  SELECT course::text AS course, COUNT(*) AS approved_count
  FROM questions
  WHERE "isApproved" = true AND "questionType" = 'MCQ'
  GROUP BY course
  ORDER BY approved_count DESC
`;

console.log(`\nFound ${counts.length} courses with at least 1 approved MCQ.\n`);

// Build a count map for ALL courses (above + below threshold).
const countMap = new Map();
for (const row of counts) countMap.set(row.course, Number(row.approved_count));

console.log(`Current per-course approved-MCQ counts (top 60):`);
const sorted = [...countMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60);
for (const [course, n] of sorted) {
  const flag = n >= THRESHOLD ? "✓" : "✗";
  console.log(`  ${flag} ${course.padEnd(45)} ${n}`);
}

// Read CURRENT visible_courses, only REMOVE items that dropped below threshold.
// Don't ADD new ones — that's a separate decision (some courses may have ≥200
// approved but be hidden for other reasons: CB-equivalence audit, structural
// defects, CB-trademark concerns, etc.).
const current = await sql`SELECT value FROM site_settings WHERE key = 'visible_courses'`;
const currentValue = current[0]?.value ?? null;
if (!currentValue) {
  console.log("\n⚠ visible_courses SiteSetting not found. This script removes-only — needs an existing list to operate on.");
  process.exit(1);
}
if (currentValue === "all") {
  console.log("\n⚠ visible_courses is 'all' — show-all mode. Remove-only operation has no effect.");
  process.exit(0);
}
let currentList;
try { currentList = JSON.parse(currentValue); }
catch { console.log(`\n⚠ Could not parse current visible_courses value: ${currentValue}`); process.exit(1); }

console.log(`\n── Current visible_courses (${currentList.length}) ──`);
const toRemove = [];
const toKeep = [];
for (const c of currentList) {
  const n = countMap.get(c) ?? 0;
  if (n < THRESHOLD) {
    toRemove.push({ course: c, count: n });
  } else {
    toKeep.push({ course: c, count: n });
  }
}

for (const r of toKeep) console.log(`  KEEP ${r.course.padEnd(45)} ${r.count} ✓`);
for (const r of toRemove) console.log(`  ✗ REMOVE ${r.course.padEnd(43)} ${r.count} (below ${THRESHOLD})`);

if (toRemove.length === 0) {
  console.log("\nNo courses fell below threshold. Nothing to remove.");
  process.exit(0);
}

const newList = currentList.filter(c => (countMap.get(c) ?? 0) >= THRESHOLD);
const newValue = JSON.stringify(newList);
console.log(`\nNew visible_courses (${newList.length}): ${newValue.slice(0, 250)}${newValue.length > 250 ? "..." : ""}`);

if (DRY) {
  console.log(`\n[DRY mode] No changes written.`);
  process.exit(0);
}

await sql`
  UPDATE site_settings
  SET value = ${newValue}, "updatedBy" = 'visible-courses-dynamic', "updatedAt" = NOW()
  WHERE key = 'visible_courses'
`;
console.log(`\n✓ visible_courses updated. ${toRemove.length} courses removed (now below ${THRESHOLD}). ${newList.length} courses still visible.`);

/**
 * scripts/auto-update-visibility.mjs
 *
 * Auto-update the visible_courses SiteSetting based on approved-question
 * counts. Per user requirement 2026-05-08:
 *   "Once a no of quality questions > 200, make it automatically visible.
 *    The questions should have gone through the question generation
 *    process and pipeline/gate you recently working on."
 *
 * Behavior:
 *   - Count approved MCQ per course (these passed deterministic gates +
 *     LLM judge + ensemble; isApproved=true means they've cleared the
 *     production pipeline as of Beta 9.9.2).
 *   - For every course with approved >= MIN (default 200), ensure it's
 *     in the visible_courses allowlist.
 *   - ADD-ONLY by default. To also remove courses that fell BELOW the
 *     threshold, pass --remove-stale (off by default — safer).
 *   - Optional --tier=AP|SAT|ACT|CLEP filter.
 *   - --dry just prints the diff without writing.
 *
 * Exit signals via stdout: ADDED=N REMOVED=M UNCHANGED=K total visible after.
 *
 * Run:
 *   node scripts/auto-update-visibility.mjs            # dry across all tiers
 *   node scripts/auto-update-visibility.mjs --apply
 *   node scripts/auto-update-visibility.mjs --apply --tier=CLEP
 *   node scripts/auto-update-visibility.mjs --apply --min=300
 *   node scripts/auto-update-visibility.mjs --apply --remove-stale
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
const MIN = parseInt(args.min ?? "200", 10);
const APPLY = !!args.apply;
const REMOVE_STALE = !!args["remove-stale"];
const TIER = args.tier ?? null;
const ONLY = args.only ? String(args.only).split(",") : null; // course filter
const DRY = !APPLY;

console.log(`Mode: ${DRY ? "DRY (no writes)" : "APPLY (will update DB)"}`);
console.log(`Threshold: approved MCQ >= ${MIN}`);
if (TIER) console.log(`Tier filter: ${TIER}`);
if (REMOVE_STALE) console.log(`Remove-stale: ON (also removes courses that dropped below ${MIN})`);

// 1) Pull bank state
const counts = await sql`
  SELECT course::text AS course,
         SUM(CASE WHEN "isApproved" = true AND "questionType" = 'MCQ' THEN 1 ELSE 0 END)::int AS approved
  FROM questions
  GROUP BY course
`;

function tierOf(course) {
  if (course.startsWith("AP_")) return "AP";
  if (course.startsWith("SAT_")) return "SAT";
  if (course.startsWith("ACT_")) return "ACT";
  if (course.startsWith("CLEP_")) return "CLEP";
  if (course.startsWith("DSST_")) return "DSST";
  return "OTHER";
}

const eligible = counts
  .filter((c) => c.approved >= MIN)
  .filter((c) => !TIER || tierOf(c.course) === TIER)
  .filter((c) => !ONLY || ONLY.includes(c.course))
  .map((c) => c.course)
  .sort();

// 2) Pull current visible_courses
const cur = await sql`SELECT value FROM site_settings WHERE key = 'visible_courses'`;
let currentList = [];
if (cur.length > 0 && cur[0].value && cur[0].value !== "all") {
  try {
    const parsed = JSON.parse(cur[0].value);
    if (Array.isArray(parsed)) currentList = parsed;
  } catch {}
}
const currentSet = new Set(currentList);
const eligibleSet = new Set(eligible);

// 3) Compute diff
const toAdd = eligible.filter((c) => !currentSet.has(c));
const toRemove = REMOVE_STALE ? currentList.filter((c) => !eligibleSet.has(c)) : [];

console.log(`\nCurrent visible_courses (${currentList.length}):`);
for (const c of currentList) console.log(`  ${c}`);

console.log(`\nWill ADD (${toAdd.length}):`);
for (const c of toAdd) {
  const ct = counts.find((x) => x.course === c);
  console.log(`  + ${c.padEnd(40)} approved=${ct?.approved}`);
}

if (REMOVE_STALE) {
  console.log(`\nWill REMOVE (${toRemove.length}):`);
  for (const c of toRemove) {
    const ct = counts.find((x) => x.course === c);
    console.log(`  - ${c.padEnd(40)} approved=${ct?.approved ?? 0}`);
  }
}

if (toAdd.length === 0 && toRemove.length === 0) {
  console.log("\nNo changes needed.");
  process.exit(0);
}

// 4) Build new list (sorted, unique)
const newSet = new Set(currentList);
for (const c of toAdd) newSet.add(c);
if (REMOVE_STALE) for (const c of toRemove) newSet.delete(c);
const newList = [...newSet].sort();

console.log(`\nNew visible_courses size: ${newList.length} (was ${currentList.length})`);

if (DRY) {
  console.log("\n(DRY mode — no changes written. Re-run with --apply to commit.)");
  process.exit(0);
}

// 5) Write
const newValue = JSON.stringify(newList);
const upd = await sql`
  INSERT INTO site_settings (key, value, "updatedAt")
  VALUES ('visible_courses', ${newValue}, NOW())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
`;
console.log(`\n✓ Updated visible_courses (added=${toAdd.length}, removed=${toRemove.length})`);
console.log(`ADDED=${toAdd.length} REMOVED=${toRemove.length} TOTAL_VISIBLE=${newList.length}`);

/**
 * scripts/priority-sweep-orchestrator.mjs
 *
 * Walks the user's priority order (StudentNest: AP → SAT → ACT) and
 * runs ensemble-sweep on each course end-to-end with --include-unapproved
 * --unapprove. After each course, logs the resulting approved-count and
 * notes whether it crossed the 200/500 threshold.
 *
 * Run:
 *   node scripts/priority-sweep-orchestrator.mjs
 *   node scripts/priority-sweep-orchestrator.mjs --skip=AP_PHYSICS_1
 *   node scripts/priority-sweep-orchestrator.mjs --start-from=AP_CHEMISTRY
 *   node scripts/priority-sweep-orchestrator.mjs --tier=AP   # only AP block
 *
 * Status file: data/priority-sweep-status.json — append-mode log of
 * every course run + summary. Used to resume after crashes.
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const TIER_FILTER = args.tier ?? null;       // "AP" | "SAT" | "ACT"
const SKIP = args.skip ? args.skip.split(",") : [];
const START_FROM = args["start-from"] ?? null;

// Pull current bank state to drive priority order (worst-first within tier)
const bank = await sql`
  SELECT course::text AS course,
         SUM(CASE WHEN "isApproved" = true AND "questionType" = 'MCQ' THEN 1 ELSE 0 END)::int AS approved,
         SUM(CASE WHEN "questionType" = 'MCQ' THEN 1 ELSE 0 END)::int AS total
  FROM questions
  GROUP BY course
`;

function tierOf(course) {
  if (course.startsWith("AP_")) return "AP";
  if (course.startsWith("SAT_")) return "SAT";
  if (course.startsWith("ACT_")) return "ACT";
  return "OTHER"; // CLEP/DSST/etc — never run on StudentNest
}
const TIER_ORDER = ["AP", "SAT", "ACT"];

// Build queue: AP first, worst-first within. Then SAT worst-first. Then ACT.
const queue = bank
  .filter((b) => TIER_ORDER.includes(tierOf(b.course)))
  .filter((b) => !TIER_FILTER || tierOf(b.course) === TIER_FILTER)
  .filter((b) => !SKIP.includes(b.course))
  .filter((b) => b.total > 0)  // skip empty courses
  .sort((a, b) => {
    const ta = TIER_ORDER.indexOf(tierOf(a.course));
    const tb = TIER_ORDER.indexOf(tierOf(b.course));
    if (ta !== tb) return ta - tb;
    return a.approved - b.approved; // worst first within tier
  });

let queueStart = 0;
if (START_FROM) {
  const idx = queue.findIndex((q) => q.course === START_FROM);
  if (idx >= 0) queueStart = idx;
}

console.log("Priority queue:");
for (let i = 0; i < queue.length; i++) {
  const q = queue[i];
  const marker = i === queueStart ? " ← START" : i < queueStart ? " (skip)" : "";
  console.log(`  ${i.toString().padStart(2)}. [${tierOf(q.course)}] ${q.course.padEnd(40)} approved=${q.approved} total=${q.total}${marker}`);
}

// Status log
const statusFile = join(process.cwd(), "data", "priority-sweep-status.json");
mkdirSync(join(process.cwd(), "data"), { recursive: true });
const status = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, "utf8")) : { runs: [] };

function logStatus(entry) {
  status.runs.push({ ts: new Date().toISOString(), ...entry });
  writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

async function runSweep(course) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [
      "scripts/ensemble-sweep.mjs",
      `--course=${course}`,
      "--include-unapproved",
      "--unapprove",
      "--concurrency=4",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    proc.stdout.on("data", (d) => { stdout += d.toString(); process.stdout.write(d); });
    proc.stderr.on("data", (d) => process.stderr.write(d));
    proc.on("close", (code) => resolve({ code, stdout }));
  });
}

for (let i = queueStart; i < queue.length; i++) {
  const { course, approved: before } = queue[i];
  console.log(`\n══════════════════════════════════════`);
  console.log(`[${i + 1}/${queue.length}] Sweeping ${course} (before=${before})`);
  console.log(`══════════════════════════════════════`);
  const t0 = Date.now();
  const { code, stdout } = await runSweep(course);
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(0);
  // Pull post-sweep approved count
  const after = await sql`SELECT COUNT(*)::int AS c FROM questions WHERE course::text = ${course} AND "isApproved" = true AND "questionType" = 'MCQ'`;
  const afterCount = after[0]?.c ?? 0;
  const delta = afterCount - before;
  const visible = afterCount >= 200;
  const ideal = afterCount >= 500;
  const summary = { course, code, before, after: afterCount, delta, visible, ideal, elapsedSec };
  logStatus(summary);
  console.log(`\n[${i + 1}/${queue.length}] DONE ${course}: before=${before} after=${afterCount} delta=${delta >= 0 ? "+" : ""}${delta} visible=${visible ? "✓" : "✗"} ideal=${ideal ? "✓" : "✗"} elapsed=${elapsedSec}s`);
}

console.log("\n══ PRIORITY SWEEP COMPLETE ══");
console.log("Final status saved to:", statusFile);

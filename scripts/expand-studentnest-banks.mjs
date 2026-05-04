/**
 * scripts/expand-studentnest-banks.mjs
 *
 * Master orchestrator: expand StudentNest (AP/SAT/ACT) banks to ≥200
 * approved questions. Runs rebuild-bank.ts in batches, sequencing the
 * worst courses first so visibility unlocks earliest.
 *
 * Cost estimate: ~$30-80 in Gemini Flash spend across the 16-course batch.
 * Time: ~2-3 days at Flash Tier-1 quota (10K RPD).
 *
 * Usage:
 *   node scripts/expand-studentnest-banks.mjs            (run all)
 *   node scripts/expand-studentnest-banks.mjs --dry      (list only)
 *   node scripts/expand-studentnest-banks.mjs --target=300  (override target)
 */

import { spawn } from "node:child_process";
import { writeFileSync, appendFileSync, existsSync } from "node:fs";

const DEFAULT_TARGET = 200;
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const TARGET = Number(args.target ?? DEFAULT_TARGET);
const DRY = !!args.dry;

// Courses to rebuild, ranked worst-first so the most-broken ones unlock visibility soonest.
const QUEUE = [
  { course: "AP_WORLD_HISTORY",                     current: 44 },
  { course: "AP_US_HISTORY",                        current: 42 },
  { course: "ACT_READING",                          current: 10 },
  { course: "ACT_SCIENCE",                          current: 13 },
  { course: "AP_PHYSICS_C_ELECTRICITY_MAGNETISM",  current: 83 },
  { course: "AP_PHYSICS_2",                         current: 89 },
  { course: "AP_ENVIRONMENTAL_SCIENCE",             current: 90 },
  { course: "AP_COMPUTER_SCIENCE_A",                current: 88 },
  { course: "AP_MACROECONOMICS",                    current: 93 },
  { course: "SAT_READING_WRITING",                  current: 98 },
  { course: "AP_MICROECONOMICS",                    current: 103 },
  { course: "AP_ENGLISH_LITERATURE",                current: 110 },
  { course: "AP_EUROPEAN_HISTORY",                  current: 110 },
  { course: "AP_STATISTICS",                        current: 113 },
  { course: "AP_PHYSICS_C_MECHANICS",               current: 129 },
  { course: "AP_CALCULUS_AB",                       current: 134 },
];

const LOG = "data/expand-studentnest.log";
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(line.trimEnd());
  try { appendFileSync(LOG, line); } catch { /* fs error — keep going */ }
};

if (DRY) {
  console.log(`Target: ≥${TARGET} approved per course\nQueue (${QUEUE.length} courses):`);
  for (const q of QUEUE) {
    const need = TARGET - q.current;
    console.log(`  ${q.course.padEnd(40)} ${q.current} → ${TARGET} (+${need})`);
  }
  process.exit(0);
}

writeFileSync(LOG, `=== StudentNest expand started ${new Date().toISOString()} ===\n`);
log(`Queue: ${QUEUE.length} courses, target=${TARGET}`);

async function rebuild(course) {
  return new Promise((resolve) => {
    log(`▶ ${course} starting (target=${TARGET}, budget=$5)`);
    const child = spawn("npx", ["tsx", "scripts/rebuild-bank.ts", `--course=${course}`, `--target=${TARGET}`, "--budget=5"], {
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let out = "";
    child.stdout.on("data", (b) => { out += b.toString(); });
    child.stderr.on("data", (b) => { out += b.toString(); });
    child.on("close", (code) => {
      const tail = out.split("\n").slice(-8).join("\n");
      log(`◀ ${course} exit=${code}\n${tail}`);
      resolve({ course, code, tail });
    });
  });
}

const results = [];
for (const item of QUEUE) {
  const r = await rebuild(item.course);
  results.push(r);
  // Small breather between courses so the Gemini quota window doesn't slam.
  await new Promise((r) => setTimeout(r, 5_000));
}

log("\n=== SUMMARY ===");
let ok = 0, fail = 0;
for (const r of results) {
  if (r.code === 0) ok++; else fail++;
  log(`${r.code === 0 ? "✓" : "✗"} ${r.course} (exit=${r.code})`);
}
log(`Total: ${ok} ok, ${fail} fail`);

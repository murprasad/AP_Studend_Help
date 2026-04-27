#!/usr/bin/env node
/**
 * Stage 4 pipeline runner — sweeps AP → SAT → ACT in priority order,
 * worst-first within each block, regenerating every non-standard MCQ.
 *
 * Per user mandate (2026-04-27):
 *   1. AP courses (worst-first within AP)
 *   2. SAT courses (worst-first within SAT)
 *   3. ACT courses (worst-first within ACT)
 *   4. CLEP / DSST handled by PrepLion separately
 *
 * Resumable: re-running re-audits + re-scores; already-standard skipped.
 *
 * Usage:
 *   node scripts/run-stage4-pipeline.mjs                 # full sweep
 *   node scripts/run-stage4-pipeline.mjs --ap-only       # stop after AP
 *   node scripts/run-stage4-pipeline.mjs --start AP_BIOLOGY  # resume from
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const apOnly = args.includes("--ap-only");
const startArg = args.find((a, i) => args[i - 1] === "--start");

const PRIORITY_PREFIXES = apOnly ? ["AP_"] : ["AP_", "SAT_", "ACT_"];

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const audit = JSON.parse(await readFile(`data/question-quality-audit-${today}.json`, "utf8"));

  // Filter + sort each prefix block worst-first
  const queue = [];
  for (const prefix of PRIORITY_PREFIXES) {
    const block = audit.perCourse
      .filter((c) => c.course.startsWith(prefix))
      .filter((c) => c.worstIds.length > 0)
      .sort((a, b) => (a.standard / a.total) - (b.standard / b.total));
    queue.push(...block);
  }

  if (startArg) {
    const idx = queue.findIndex((c) => c.course === startArg);
    if (idx > 0) queue.splice(0, idx);
  }

  console.log(`\n🚀 Stage 4 pipeline — ${queue.length} courses queued\n`);
  queue.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${c.course.padEnd(35)} bad=${c.worstIds.length.toString().padStart(4)} std=${((c.standard / c.total) * 100).toFixed(1).padStart(5)}%`);
  });

  let runIdx = 0;
  for (const c of queue) {
    runIdx++;
    console.log(`\n\n━━━ [${runIdx}/${queue.length}] ${c.course} (${c.worstIds.length} to fix) ━━━`);
    const t0 = Date.now();
    const r = spawnSync("node", ["scripts/regen-low-quality-questions.mjs", c.course], {
      stdio: "inherit",
      env: process.env,
    });
    const mins = ((Date.now() - t0) / 60_000).toFixed(1);
    console.log(`\n[${c.course}] exit ${r.status} after ${mins} min`);
    if (r.status !== 0) {
      console.log(`[WARN] non-zero exit on ${c.course}; continuing pipeline anyway`);
    }
  }

  console.log(`\n\n✅ Pipeline complete. Re-run audit-question-quality.mjs to verify lift.`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });

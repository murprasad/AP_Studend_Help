#!/usr/bin/env node
/**
 * Stage 4 Pass 2 — second-pass MCQ regen.
 *
 * After Pass 1 (run-stage4-pipeline.mjs), each course typically lifts from
 * ~20% standard to ~70% standard. The remaining ~30% are questions whose
 * highest-priority issue was already fixed in Pass 1 but they still have
 * SECONDARY issues (typically explanation_too_long, options_too_long,
 * stem_long, options_too_terse). Pass 2 re-audits each course, then
 * re-runs the regen script — which now picks the FIRST remaining issue
 * for each question that still scored < 7.
 *
 * Proven impact: AP_PHYSICS_1 went 73.7% → 91.6% standard via Pass 2
 * (2026-04-27). +18 percentage points on top of Pass 1's +30.
 *
 * Per-course flow:
 *   1. node scripts/audit-question-quality.mjs <COURSE>
 *      → writes data/question-quality-audit-<TODAY>-<COURSE>.json
 *   2. Merge fresh worstIds into the master audit JSON (overwrites just
 *      this course's entry — never overwrites the multi-course file).
 *   3. node scripts/regen-low-quality-questions.mjs <COURSE>
 *      → reads master audit, fixes worstIds.
 *
 * Resumable: re-running re-audits + re-scores; standard questions skipped.
 * Per-course serial. Continues across course failures (logs and moves on).
 *
 * Usage:
 *   node scripts/run-stage4-pass2.mjs                  # all AP+SAT+ACT
 *   node scripts/run-stage4-pass2.mjs --ap-only        # AP only
 *   node scripts/run-stage4-pass2.mjs --start AP_BIOLOGY  # resume
 */

import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const apOnly = args.includes("--ap-only");
const startArg = args.find((a, i) => args[i - 1] === "--start");

const PRIORITY_PREFIXES = apOnly ? ["AP_"] : ["AP_", "SAT_", "ACT_"];

const TODAY = new Date().toISOString().slice(0, 10);
const MAIN_AUDIT = `data/question-quality-audit-${TODAY}.json`;

function shell(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { stdio: "inherit", env: process.env });
  return r.status ?? 1;
}

(async () => {
  // 1. Need the master audit so we know which courses to iterate.
  let master;
  try {
    master = JSON.parse(await readFile(MAIN_AUDIT, "utf8"));
  } catch {
    console.error(`Missing ${MAIN_AUDIT}. Run audit-question-quality.mjs first.`);
    process.exit(1);
  }

  const queue = [];
  for (const prefix of PRIORITY_PREFIXES) {
    const block = master.perCourse
      .filter((c) => c.course.startsWith(prefix))
      .filter((c) => c.standard / c.total < 0.92)  // skip courses already at 92%+
      .sort((a, b) => (a.standard / a.total) - (b.standard / b.total));
    queue.push(...block);
  }

  if (startArg) {
    const idx = queue.findIndex((c) => c.course === startArg);
    if (idx > 0) queue.splice(0, idx);
  }

  console.log(`\n🔁 Stage 4 Pass 2 — ${queue.length} courses below 92% standard\n`);
  queue.forEach((c, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${c.course.padEnd(35)} std=${((c.standard / c.total) * 100).toFixed(1).padStart(5)}%`);
  });

  for (let i = 0; i < queue.length; i++) {
    const c = queue[i];
    console.log(`\n\n━━━ Pass 2 [${i + 1}/${queue.length}] ${c.course} ━━━`);
    const t0 = Date.now();

    // Step A — fresh single-course audit (writes …-<COURSE>.json).
    const auditExit = shell("node", ["scripts/audit-question-quality.mjs", c.course]);
    if (auditExit !== 0) {
      console.log(`[WARN] audit failed for ${c.course}; skipping`);
      continue;
    }

    // Step B — merge fresh worstIds into the master file (just this course).
    try {
      const fresh = JSON.parse(await readFile(`data/question-quality-audit-${TODAY}-${c.course}.json`, "utf8"));
      const freshEntry = fresh.perCourse[0];
      if (!freshEntry) {
        console.log(`[WARN] fresh audit empty for ${c.course}; skipping`);
        continue;
      }
      master = JSON.parse(await readFile(MAIN_AUDIT, "utf8")); // re-read in case Pass 1 still writing
      master.perCourse = master.perCourse.map((entry) =>
        entry.course === c.course ? freshEntry : entry,
      );
      await writeFile(MAIN_AUDIT, JSON.stringify(master, null, 2));
      const stillBad = freshEntry.worstIds?.length ?? 0;
      console.log(`[${c.course}] fresh audit: ${stillBad} still need fixing`);
      if (stillBad === 0) {
        console.log(`[${c.course}] already standard; skipping regen`);
        continue;
      }
    } catch (e) {
      console.log(`[WARN] merge failed for ${c.course}: ${e.message}; skipping`);
      continue;
    }

    // Step C — Pass 2 regen against the freshened master audit.
    const regenExit = shell("node", ["scripts/regen-low-quality-questions.mjs", c.course]);
    const mins = ((Date.now() - t0) / 60_000).toFixed(1);
    console.log(`\n[${c.course}] Pass 2 exit ${regenExit} after ${mins} min`);
  }

  console.log(`\n\n✅ Pass 2 complete. Final audit:`);
  shell("node", ["scripts/audit-question-quality.mjs"]);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });

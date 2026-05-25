/**
 * Quality sweep orchestrator — runs every permanent gate against the
 * approved question bank in sequence and unapproves any failures.
 *
 * Used by:
 *   - manual: `node scripts/_quality-sweep-all.mjs --apply`
 *   - cron (GitHub Actions or cron-job.org daily ping):
 *       node scripts/_quality-sweep-all.mjs --apply --quiet
 *
 * Sweeps run:
 *   1. _sweep-letter-mismatch.mjs   — explanation says letter X but stored Y
 *   2. _sweep-full-gates.mjs        — structure, options, hints, length, etc.
 *   3. _cas-sweep.mjs               — mathjs recompute for math courses
 *
 * Each sweep auto-unapproves its failures (strict mode default for #2 since
 * 2026-05-23). Exit code is non-zero if any sweep errors out.
 */
import "dotenv/config";
import { spawn } from "node:child_process";

const APPLY = process.argv.includes("--apply");
const QUIET = process.argv.includes("--quiet");

const sweeps = [
  { name: "letter-mismatch",  cmd: ["node", "scripts/_sweep-letter-mismatch.mjs",      ...(APPLY ? ["--apply"] : [])] },
  { name: "full-gates",       cmd: ["node", "scripts/_sweep-full-gates.mjs",           ...(APPLY ? ["--apply"] : [])] },
  { name: "cas-recompute",    cmd: ["npx", "tsx", "scripts/_cas-sweep.mjs",            ...(APPLY ? ["--apply"] : [])] },
  { name: "distractor",       cmd: ["node", "scripts/_distractor-plausibility-sweep.mjs", ...(APPLY ? ["--apply"] : [])] },
  // Sprint B-lite (2026-05-24, UARP §6.1) — writes data/question-performance-snapshot.json.
  // Harmless until traffic arrives; thresholds gate by MIN_N=5 so no false flags today.
  { name: "item-performance", cmd: ["node", "scripts/_item-performance-sweep.mjs"] },
  // UARP §6.4 (2026-05-25) — template-collapse detector; review-only flagging.
  { name: "cognitive-diversity", cmd: ["node", "scripts/_cognitive-diversity-sweep.mjs"] },
  // UARP §16 (2026-05-25) — trust certification engine (gold/silver/bronze tier).
  { name: "trust-certification", cmd: ["node", "scripts/_trust-certification-engine.mjs", ...(APPLY ? ["--apply"] : [])] },
];

function run(name, cmd) {
  return new Promise((resolve) => {
    if (!QUIET) console.log(`\n══ Running ${name} ══`);
    const proc = spawn(cmd[0], cmd.slice(1), { stdio: QUIET ? ["ignore", "pipe", "pipe"] : "inherit", shell: true });
    let buf = "";
    if (QUIET) {
      proc.stdout.on("data", (d) => buf += d.toString());
      proc.stderr.on("data", (d) => buf += d.toString());
    }
    proc.on("exit", (code) => {
      if (QUIET) {
        // Print only the bottom summary lines
        const tail = buf.split("\n").slice(-15).join("\n");
        console.log(`[${name}] exit=${code}\n${tail}\n`);
      }
      resolve({ name, code });
    });
  });
}

const results = [];
let anyFail = 0;
for (const s of sweeps) {
  const r = await run(s.name, s.cmd);
  results.push(r);
  if (r.code !== 0) anyFail++;
}

console.log("\n══ SWEEP SUMMARY ══");
for (const r of results) console.log(`  ${r.name}: exit=${r.code} ${r.code === 0 ? "✓" : "✗"}`);
process.exit(anyFail === 0 ? 0 : 1);

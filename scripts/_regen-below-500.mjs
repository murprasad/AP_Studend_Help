/**
 * Regen Orchestrator (UARP §15 partial — Sprint E spawn).
 *
 * Identifies CLEP courses below the 500-Q target and orchestrates regen
 * via the existing fill scripts. Routes each course to its most-effective
 * generator based on per-course history.
 *
 * Strategy:
 *  - For each course below MIN_TARGET, compute deficit (target - approved)
 *  - Prefer mirror-fill (uses CB samples) when OfficialSample table has rows
 *  - Fall back to fill-from-cb-spec for courses without samples
 *  - Per-question second-pass-verifier (UARP §3.5 LLM gate) — paused on credits
 *  - All gates run at gen-time; failures rejected before INSERT
 *
 * Requires: Anthropic OR Gemini OR Groq credits. Will early-exit with a
 * clear message if all 3 cascades are exhausted.
 *
 * Usage:
 *   node _regen-below-500.mjs                     # dry-run: print plan
 *   node _regen-below-500.mjs --apply             # execute regen
 *   node _regen-below-500.mjs --course=CLEP_X     # single course
 *   node _regen-below-500.mjs --target=500        # change target (default 500)
 *   node _regen-below-500.mjs --skip-foreign      # skip Spanish/French/German
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
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
const TARGET = Number(args.target ?? 500);
const SINGLE = args.course ?? null;
const SKIP_FOREIGN = !!args["skip-foreign"];
const FOREIGN = new Set(["CLEP_SPANISH","CLEP_SPANISH_WRITING","CLEP_FRENCH","CLEP_GERMAN"]);

// Priority order — defined per CEO 2026-05-25 (SN focus: SAT > ACT > AP)
const PRIORITY = [
  "SAT_MATH",                            // priority 1 SAT
  "SAT_READING_WRITING",
  "PSAT_MATH","PSAT_READING_WRITING",
  "ACT_MATH","ACT_READING","ACT_ENGLISH","ACT_SCIENCE",
  "AP_CALCULUS_AB","AP_CALCULUS_BC","AP_STATISTICS",
  "AP_BIOLOGY","AP_CHEMISTRY","AP_PHYSICS_1",
];

// Pre-flight: detect credit availability
async function checkCredits() {
  const status = {};
  // Anthropic precheck — call a near-zero-token Haiku request
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "ok" }] }),
      });
      if (r.status === 200) status.anthropic = "ok";
      else if (r.status === 401) status.anthropic = "auth-failed";
      else if (r.status === 402 || r.status === 429) status.anthropic = "no-credits-or-rate-limited";
      else status.anthropic = `http-${r.status}`;
    } catch { status.anthropic = "error"; }
  } else status.anthropic = "no-key";
  status.gemini = process.env.GOOGLE_AI_API_KEY ? "key-present" : "no-key";
  status.groq = process.env.GROQ_API_KEY ? "key-present" : "no-key";
  return status;
}

const credits = await checkCredits();
console.log(`Credit precheck:`, credits);
const anyCreditsAvailable = credits.anthropic === "ok" || credits.gemini === "key-present" || credits.groq === "key-present";
if (!anyCreditsAvailable) {
  console.log(`\n⚠ No LLM credits available across all providers. Regen cannot run.`);
  console.log(`Restore credits at: https://console.anthropic.com/settings/billing`);
  process.exit(0);
}

// Build the plan: courses below TARGET, sorted by priority then alphabetical
const courseCounts = await sql`
  SELECT course::text AS course, COUNT(*)::int AS n
  FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ'
  GROUP BY course
`;
const byCourse = Object.fromEntries(courseCounts.map((c) => [c.course, c.n]));

let candidates = courseCounts.filter((c) => c.n < TARGET);
if (SINGLE) candidates = candidates.filter((c) => c.course === SINGLE);
if (SKIP_FOREIGN) candidates = candidates.filter((c) => !FOREIGN.has(c.course));
// SN: only SAT/ACT/PSAT/AP (skip CLEP — PL covers CLEP)
candidates = candidates.filter((c) => /^(SAT|ACT|PSAT|AP)_/.test(c.course));

// Sort: priority first, then by deficit (largest deficit first within tier)
function priorityRank(course) {
  const idx = PRIORITY.indexOf(course);
  return idx === -1 ? 999 : idx;
}
candidates.sort((a, b) => priorityRank(a.course) - priorityRank(b.course) || (TARGET - a.n) - (TARGET - b.n));

console.log(`\nRegen plan (target=${TARGET}, ${candidates.length} courses below):`);
let totalDeficit = 0;
for (const c of candidates) {
  const deficit = TARGET - c.n;
  totalDeficit += deficit;
  const tag = PRIORITY.includes(c.course) ? `[P${PRIORITY.indexOf(c.course) + 1}]` : "    ";
  console.log(`  ${tag} ${c.course.padEnd(38)} ${c.n}  +${deficit}`);
}
console.log(`\nTotal deficit: ${totalDeficit.toLocaleString()} questions across ${candidates.length} courses`);

if (!APPLY) {
  console.log(`\n(dry-run — use --apply to execute regen)`);
  console.log(`Estimated Anthropic Haiku cost @ 500 input + 800 output tokens × $0.80/$4.00 per M tokens:`);
  console.log(`  ~$0.0036 per Q × ${totalDeficit.toLocaleString()} Qs = $${(totalDeficit * 0.0036).toFixed(2)}`);
  process.exit(0);
}

// Apply: route each course to the appropriate fill script
let coursesAttempted = 0, coursesSucceeded = 0, totalAdded = 0;
for (const c of candidates) {
  const deficit = TARGET - c.n;
  console.log(`\n━━━ ${c.course} (current=${c.n}, need=+${deficit}) ━━━`);
  coursesAttempted++;

  // Provider routing: if Anthropic auth-failed, force Groq-based cb-spec script.
  const sampleCount = (await sql`SELECT COUNT(*)::int AS n FROM official_samples WHERE course::text = ${c.course}`)[0]?.n ?? 0;
  const anthropicOk = credits.anthropic === "ok";
  const useScript = (anthropicOk && sampleCount > 50)
    ? "scripts/_fill-mirror-haiku.mjs"
    : "scripts/_fill-from-cb-spec.mjs";
  console.log(`  Using: ${useScript}  (anthropic=${credits.anthropic}, samples=${sampleCount})`);
  const beforeN = byCourse[c.course];
  const proc = spawnSync("node", [useScript, `--course=${c.course}`, `--target=${TARGET}`], {
    stdio: "inherit", env: process.env,
  });
  if (proc.status !== 0) {
    console.log(`  ${c.course}: script exited with code ${proc.status} — skipping`);
    continue;
  }
  const afterN = (await sql`SELECT COUNT(*)::int AS n FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${c.course}`)[0].n;
  const added = afterN - beforeN;
  totalAdded += added;
  if (added >= deficit * 0.5) coursesSucceeded++;
  console.log(`  ${c.course}: +${added} (${beforeN} → ${afterN}${afterN >= TARGET ? " ✓ HIT TARGET" : ""})`);
}

console.log(`\n══ Regen complete ══`);
console.log(`Courses attempted: ${coursesAttempted}`);
console.log(`Courses succeeded (≥50% of deficit): ${coursesSucceeded}`);
console.log(`Total Qs added: ${totalAdded.toLocaleString()}`);

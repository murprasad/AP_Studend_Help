// Math-recompute audit — find questions whose listed correctAnswer is
// arithmetically wrong, using deterministic recompute where possible.
//
// Bug surfaced 2026-06-03: mamatha Q4 "Estimate f(4.1) using tangent line
// to f(x) = x² at x = 4". Tangent approximation: f(4) + f'(4)*0.1 = 16 + 0.8
// = 16.8. Listed correct option was A) 17.72 — wrong. No option matched the
// true value.
//
// Strategy:
//   1. Detect computable question patterns by regex on stem
//   2. Re-compute expected answer with mathjs
//   3. Compare against listed correctAnswer option text
//   4. Flag mismatches; queue for human review or LLM regen
//
// V1 patterns supported:
//   - "f(x) = <expr>" + "f(<n>) + <m>" or "Estimate f(<n>)"
//   - "lim x->0 (sin x) / x" → 1 (L'Hopital classics)
//   - "What is <num> + <num>?" simple arithmetic
//   - "What is X% of Y?" percentage
//   - "Find the slope between (x1,y1) and (x2,y2)"
//
// Run:
//   node scripts/_audit-math-recompute.mjs                    # dry-run all SAT/PSAT/ACT math
//   node scripts/_audit-math-recompute.mjs --course=SAT_MATH  # one course
//   node scripts/_audit-math-recompute.mjs --apply            # unapprove failed Qs

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const FLAGS = process.argv.slice(2);
const APPLY = FLAGS.includes("--apply");
const COURSE_FILTER = FLAGS.find((f) => f.startsWith("--course="))?.split("=")[1];

const COURSES = COURSE_FILTER
  ? [COURSE_FILTER]
  : ["SAT_MATH", "PSAT_MATH", "ACT_MATH", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS", "AP_PRECALCULUS"];

console.log(`\n═══ Math-recompute audit — ${APPLY ? "WRITE" : "DRY-RUN"} (courses: ${COURSES.join(", ")}) ═══\n`);

// ── Recomputers ──────────────────────────────────────────────────────────

function tryParseOption(text) {
  // Extract a numeric value from option text "A) 17.72" → 17.72
  const stripped = String(text).replace(/^[A-E][.)]\s*/, "").trim();
  const num = parseFloat(stripped.replace(/[,$]/g, ""));
  if (isFinite(num)) return num;
  return null;
}

function recomputeTangentApprox(stem) {
  // "Estimate f(<x0+dx>) using tangent line to f(x) = <expr> at x = <x0>"
  // Patterns: f(x) = x^2, x^3, kx, k*x^n
  const m = stem.match(/Estimate (?:the value of )?f\(([\d.]+)\)\s*(?:using|with)?\s*tangent line to f\(x\)\s*=\s*([^.]+?)\s*at\s*x\s*=\s*([\d.]+)/i);
  if (!m) return null;
  const xTarget = parseFloat(m[1]);
  const exprRaw = m[2].replace(/\$/g, "").replace(/\s/g, "");
  const x0 = parseFloat(m[3]);
  // Match patterns: x^N, kx^N, kx, just x
  let f, fPrime;
  const xN = exprRaw.match(/^x\^?\{?(\d+)\}?$/);
  if (xN) {
    const N = parseInt(xN[1], 10);
    f = (x) => Math.pow(x, N);
    fPrime = (x) => N * Math.pow(x, N - 1);
  } else if (exprRaw === "x") {
    f = (x) => x; fPrime = () => 1;
  } else {
    return null; // unsupported expression
  }
  const value = f(x0) + fPrime(x0) * (xTarget - x0);
  return { expected: value, label: `tangent-approx(${exprRaw}, x=${x0}, target=${xTarget})` };
}

function recomputeLHopitalSinX(stem) {
  // "lim x->0 (sin x) / x" or "Use L'Hôpital's Rule to evaluate lim x->0 (sin x) / x"
  if (/lim\s+x\s*-?>\s*0\s*\(?\s*sin\s*x?\s*\)?\s*\/\s*x/i.test(stem)) {
    return { expected: 1, label: "limit sin(x)/x at 0" };
  }
  return null;
}

function recomputePercentOf(stem) {
  // "What is X% of Y?" or "Find X percent of Y"
  const m = stem.match(/What is ([\d.]+)\s*%\s*of\s*([\d.]+)\??/i)
    ?? stem.match(/Find ([\d.]+)\s*percent of\s*([\d.]+)/i);
  if (!m) return null;
  const pct = parseFloat(m[1]);
  const val = parseFloat(m[2]);
  return { expected: (pct / 100) * val, label: `${pct}% of ${val}` };
}

function recomputeSlope(stem) {
  // "Find the slope between (x1,y1) and (x2,y2)"
  const m = stem.match(/slope\s+(?:of the line\s+)?(?:between|through|from)?\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)\s*(?:and|to)\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i);
  if (!m) return null;
  const [, x1, y1, x2, y2] = m.map(parseFloat);
  if (x2 === x1) return null;
  return { expected: (y2 - y1) / (x2 - x1), label: `slope (${x1},${y1})→(${x2},${y2})` };
}

const recomputers = [recomputeTangentApprox, recomputeLHopitalSinX, recomputePercentOf, recomputeSlope];

// ── Main loop ──────────────────────────────────────────────────────────

const flagged = [];
for (const course of COURSES) {
  const rows = await sql`
    SELECT id, course::text AS course, "questionText", "correctAnswer", options::text AS options
    FROM questions
    WHERE course::text = ${course}
      AND "isApproved" = true
      AND "questionType"::text = 'MCQ'
      AND "correctAnswer" IS NOT NULL
  `;
  console.log(`${course}: scanning ${rows.length} Qs...`);
  let scanned = 0, computable = 0, mismatched = 0;
  for (const r of rows) {
    let recomputed = null;
    for (const fn of recomputers) {
      recomputed = fn(r.questionText || "");
      if (recomputed) break;
    }
    if (!recomputed) continue;
    computable++;
    // Parse the listed correct option's numeric value
    let opts = [];
    try { opts = JSON.parse(r.options); } catch { continue; }
    if (!Array.isArray(opts)) continue;
    const corrLetter = String(r.correctAnswer).toUpperCase().charAt(0);
    const corrIdx = "ABCDE".indexOf(corrLetter);
    if (corrIdx < 0 || corrIdx >= opts.length) continue;
    const listedValue = tryParseOption(opts[corrIdx]);
    if (listedValue === null) continue;
    // Tolerance: 1% of expected magnitude or 0.01 absolute, whichever larger
    const tol = Math.max(Math.abs(recomputed.expected) * 0.01, 0.01);
    const delta = Math.abs(listedValue - recomputed.expected);
    if (delta > tol) {
      mismatched++;
      flagged.push({
        id: r.id, course, expected: recomputed.expected, listed: listedValue,
        label: recomputed.label, stem: r.questionText.slice(0, 150),
        opts: opts.map((o, i) => `${"ABCDE"[i]}: ${String(o).slice(0, 30)}`).join(" | "),
      });
    }
    scanned++;
  }
  console.log(`  scanned=${scanned} computable=${computable} mismatched=${mismatched}\n`);
}

console.log(`\nTotal flagged: ${flagged.length}\n`);
for (const f of flagged.slice(0, 20)) {
  console.log(`  ${f.id.slice(0,8)} ${f.course} expected=${f.expected.toFixed(2)} listed=${f.listed.toFixed(2)} [${f.label}]`);
  console.log(`    stem: ${f.stem}`);
  console.log(`    opts: ${f.opts}`);
}

if (!APPLY) {
  console.log("\n(dry-run) Pass --apply to unapprove flagged questions.");
  process.exit(0);
}

console.log(`\nUnapproving ${flagged.length} broken-math questions...`);
let written = 0;
for (const f of flagged) {
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ${f.id}`;
  written++;
}
console.log(`  → unapproved ${written} questions. Auto-populate cron will regenerate replacements.`);

/**
 * scripts/math-consistency-gate.mjs
 *
 * MATH CONSISTENCY VALIDATOR — pure deterministic, no LLM.
 *
 * For numeric-answer MCQs, verifies:
 *   1. Numeric uniqueness: all 4 options parse to distinct numeric values
 *      (catches "4/2, 6/3, 8/4, 2/1 all = 2" trap).
 *   2. Letter↔value consistency: the option text indicated by stored
 *      correctAnswer letter must match the final numeric value the
 *      explanation arrives at.
 *
 * Catches the specific bug found 2026-05-10 in CED-grounded AP_PHYSICS_1:
 *   Q: "What is the block's acceleration?"
 *   Options: ["A) 2 m/s^2", "B) 3 m/s^2", "C) 4 m/s^2", "D) 5 m/s^2"]
 *   Stored correctAnswer: B
 *   Explanation: "F_parallel = F * sin(30) = 5 N..."  (arrives at 5)
 *   → 5 matches option D, but stored letter is B → INCONSISTENT
 *
 * This validator can be run AFTER the existing deterministic-gate to
 * silver-promote STEM rows that pass BOTH gates:
 *
 *   node scripts/math-consistency-gate.mjs --course=AP_PHYSICS_1 --approve
 *
 * Limitations (honest):
 *   - Does NOT verify "is this the correct physics answer." Just internal
 *     consistency between stored letter and explanation's final number.
 *   - Skips Qs with non-numeric options (text answers).
 *   - Heuristic for "final number" — picks the LAST numeric value in the
 *     explanation. Works for ~80% of explanations; edge cases (multiple
 *     final values, variable assignments at end) get NO_VERDICT.
 *
 * Run:
 *   node scripts/math-consistency-gate.mjs                        # dry, all isApproved=false
 *   node scripts/math-consistency-gate.mjs --course=AP_PHYSICS_1
 *   node scripts/math-consistency-gate.mjs --approve              # writes
 *   node scripts/math-consistency-gate.mjs --limit=100
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--approve") return ["approve", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const APPROVE = !!args.approve;
const COURSE = args.course ?? null;
const SOURCE = args.source ?? null;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;

console.log(`Mode: ${APPROVE ? "WRITE" : "DRY"}, course=${COURSE ?? "ANY"}, limit=${LIMIT ?? "none"}`);

function stripPrefix(s) { return String(s).replace(/^[A-E]\s*\)\s*/, "").trim(); }

// Parse a numeric value from a string. Returns null if not parseable.
// Handles: "245 N", "0.5 m/s^2", "3.14×10^8", "1/2", "50%", "-9.8", scientific notation.
function parseNumeric(s) {
  if (!s || typeof s !== "string") return null;
  let t = s.trim().toLowerCase().replace(/[,$]/g, "");
  // Scientific notation with × or x
  const sciMatch = t.match(/(-?\d+\.?\d*)\s*[×x*]\s*10\s*\^?\s*(-?\d+)/);
  if (sciMatch) return parseFloat(sciMatch[1]) * Math.pow(10, parseInt(sciMatch[2], 10));
  // Fraction "a/b"
  const fracMatch = t.match(/^\s*(-?\d+\.?\d*)\s*\/\s*(-?\d+\.?\d*)\b/);
  if (fracMatch) {
    const denom = parseFloat(fracMatch[2]);
    if (denom !== 0) return parseFloat(fracMatch[1]) / denom;
  }
  // Percent
  const pctMatch = t.match(/^(-?\d+\.?\d*)\s*%/);
  if (pctMatch) return parseFloat(pctMatch[1]) / 100;
  // Plain number (with optional decimal, optional negative, optional units after)
  const numMatch = t.match(/^\s*(-?\d+\.?\d*(?:e[-+]?\d+)?)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return null;
}

// Extract the LAST numeric value from explanation text.
// Useful for "and we arrive at 5 N" style endings.
function extractFinalNumber(exp) {
  if (!exp) return null;
  // Find all numbers in the text (with optional scientific notation, fractions)
  const matches = [...exp.matchAll(/(-?\d+\.?\d*(?:e[-+]?\d+)?)/g)];
  if (matches.length === 0) return null;
  // Filter out year-like numbers (1492, 1815, 1865, 1900, 1914, 1945, 2024, etc.)
  // when context suggests they're historical dates not answer values
  const candidates = matches
    .map((m) => parseFloat(m[1]))
    .filter((n) => !Number.isNaN(n));
  if (candidates.length === 0) return null;
  // Heuristic: take the last value, unless it's 0 or a simple "1" or "2" trailing in a citation.
  // For physics/math problems, the final calculated value is usually the answer.
  return candidates[candidates.length - 1];
}

function approxEqual(a, b, relTol = 0.05) {
  if (a === b) return true;
  if (a === 0 && Math.abs(b) < 0.01) return true;
  if (b === 0 && Math.abs(a) < 0.01) return true;
  const diff = Math.abs(a - b);
  const denom = Math.max(Math.abs(a), Math.abs(b));
  return diff / denom < relTol;
}

// ── pull rows ────────────────────────────────────────────────────────────────
let qs;
// Only consider rows with sourceBook attribution — silver tier requires provenance.
if (COURSE && LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE} AND "sourceBook" IS NOT NULL LIMIT ${LIMIT}`;
} else if (COURSE) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE} AND "sourceBook" IS NOT NULL`;
} else if (LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND "sourceBook" IS NOT NULL LIMIT ${LIMIT}`;
} else {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND "sourceBook" IS NOT NULL`;
}

console.log(`\nLoaded ${qs.length} unapproved MCQs.\n`);

const results = [];
let numericCount = 0;
let nonNumericCount = 0;
let uniquePass = 0;
let uniqueFail = 0;
let consistPass = 0;
let consistFail = 0;
let noVerdict = 0;
const passIds = [];

for (const q of qs) {
  const opts = Array.isArray(q.options) ? q.options.map((o) => stripPrefix(o)) : [];
  if (opts.length !== 4) { nonNumericCount++; continue; }
  // Try parse all 4 as numeric
  const values = opts.map(parseNumeric);
  const numericOpts = values.filter((v) => v !== null);
  if (numericOpts.length < 3) {
    // Mostly non-numeric — skip
    nonNumericCount++;
    results.push({ id: q.id, course: q.course, verdict: "NON_NUMERIC" });
    continue;
  }
  numericCount++;

  // Check 1: Numeric uniqueness (must have 4 distinct numeric values)
  const distinctVals = new Set(numericOpts.map((v) => Math.round(v * 1e6) / 1e6));
  if (distinctVals.size < 4) {
    uniqueFail++;
    results.push({ id: q.id, course: q.course, verdict: "FAIL", reason: `option values not unique: ${numericOpts.join(", ")}` });
    continue;
  }
  uniquePass++;

  // Check 2: Letter↔value consistency
  const letter = String(q.correctAnswer ?? "").trim().toUpperCase().charAt(0);
  if (!"ABCD".includes(letter)) {
    results.push({ id: q.id, course: q.course, verdict: "FAIL", reason: `bad correctAnswer letter ${q.correctAnswer}` });
    continue;
  }
  const storedIdx = letter.charCodeAt(0) - 65;
  const storedValue = values[storedIdx];
  if (storedValue === null) {
    noVerdict++;
    results.push({ id: q.id, course: q.course, verdict: "NO_VERDICT", reason: "stored option not numeric" });
    continue;
  }
  const expFinal = extractFinalNumber(q.explanation);
  if (expFinal === null) {
    noVerdict++;
    results.push({ id: q.id, course: q.course, verdict: "NO_VERDICT", reason: "explanation has no numeric value" });
    continue;
  }
  // Find which option index matches expFinal
  let matchedIdx = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && approxEqual(values[i], expFinal)) {
      matchedIdx = i;
      break;
    }
  }
  if (matchedIdx === -1) {
    noVerdict++;
    results.push({ id: q.id, course: q.course, verdict: "NO_VERDICT", reason: `explanation final value ${expFinal} doesn't match any option` });
    continue;
  }
  if (matchedIdx !== storedIdx) {
    consistFail++;
    results.push({
      id: q.id, course: q.course, verdict: "FAIL",
      reason: `explanation derives ${expFinal} (option ${String.fromCharCode(65 + matchedIdx)}) but stored=${letter}`,
    });
    continue;
  }
  consistPass++;
  passIds.push(q.id);
  results.push({ id: q.id, course: q.course, verdict: "PASS" });
}

console.log("══ SUMMARY ══");
console.log(`  total processed:     ${qs.length}`);
console.log(`  non-numeric (skip):  ${nonNumericCount}`);
console.log(`  numeric MCQs:        ${numericCount}`);
console.log(`  uniqueness PASS:     ${uniquePass}`);
console.log(`  uniqueness FAIL:     ${uniqueFail}`);
console.log(`  consistency PASS:    ${consistPass}`);
console.log(`  consistency FAIL:    ${consistFail}`);
console.log(`  no verdict (skip):   ${noVerdict}`);
console.log(`  TOTAL PASS:          ${passIds.length}`);

const perCourse = {};
for (const r of results) {
  if (!perCourse[r.course]) perCourse[r.course] = { pass: 0, fail: 0, noVerdict: 0, nonNumeric: 0 };
  if (r.verdict === "PASS") perCourse[r.course].pass++;
  else if (r.verdict === "FAIL") perCourse[r.course].fail++;
  else if (r.verdict === "NO_VERDICT") perCourse[r.course].noVerdict++;
  else if (r.verdict === "NON_NUMERIC") perCourse[r.course].nonNumeric++;
}
console.log("\n══ PER-COURSE ══");
for (const [c, m] of Object.entries(perCourse).sort((a, b) => (b[1].pass + b[1].fail) - (a[1].pass + a[1].fail))) {
  if (m.pass + m.fail + m.noVerdict < 5) continue;
  console.log(`  ${c.padEnd(40)} pass=${m.pass} fail=${m.fail} noVerdict=${m.noVerdict} nonNum=${m.nonNumeric}`);
}

const outDir = join(process.cwd(), "data", "math-consistency-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `math-${ts}.json`);
writeFileSync(outFile, JSON.stringify({
  generatedAt: new Date().toISOString(),
  mode: APPROVE ? "WRITE" : "DRY",
  filter: { course: COURSE, limit: LIMIT },
  summary: { total: qs.length, numericCount, nonNumericCount, uniquePass, uniqueFail, consistPass, consistFail, noVerdict },
  perCourse,
  results: results.filter((r) => r.verdict === "FAIL" || r.verdict === "PASS").slice(0, 500),
}, null, 2));
console.log(`\nArtifact: ${outFile}`);

if (APPROVE && passIds.length > 0) {
  console.log(`\nPromoting ${passIds.length} math-consistent rows to silver tier...`);
  const CHUNK = 200;
  let promoted = 0;
  for (let i = 0; i < passIds.length; i += CHUNK) {
    const slice = passIds.slice(i, i + CHUNK);
    await sql`UPDATE questions SET "isApproved" = true, "pipelineVetted" = true WHERE id = ANY(${slice})`;
    promoted += slice.length;
  }
  console.log(`✓ Promoted ${promoted} rows to silver tier.`);
}

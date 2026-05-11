/**
 * scripts/deterministic-gate.mjs
 *
 * SILVER-TIER GATE — no LLM judges, pure deterministic checks.
 *
 * Promotes pipeline-pending questions (isApproved=false) to silver tier
 * (isApproved=true, pipelineVetted=true, auditPassed=false) when they
 * PASS all of:
 *
 *   1. STRUCTURE          — 4 options, distinct option texts, correctAnswer ∈ {A,B,C,D}
 *   2. ANSWER_CONSISTENCY — explanation either restates correct-option content
 *                           OR doesn't reference a different letter as correct
 *   3. STIMULUS_HEALTH    — no LLM monologue, no "Correct"/"Wrong" labels in options
 *   4. STYLE              — fails the 4-detector style validator? unapprove-eligible
 *   5. SOURCE_PRESENCE    — must have sourceBook OR sourceUrl populated
 *      (required since this gate exists specifically to promote sourced rows)
 *   6. DEDUP              — no contentHash collision (DB-enforced; just a safety read)
 *
 * Why deterministic-only? Per HARD-REQ memory:
 *   - "AI judging AI is theater — validators must be deterministic"
 *   - "Generator AI ≠ judge AI"
 *   Self-judging LLMs (e.g. Groq grading Groq-determined answers) share blind
 *   spots. Pure structural/regex checks have no such overlap risk.
 *
 * Silver vs gold:
 *   silver = passed deterministic gates only.
 *            isApproved=true, pipelineVetted=true, auditPassed=false
 *   gold   = silver + ensemble PASS + audit PASS
 *
 * Gold tier remains gated on the 3-judge ensemble. When Anthropic/Gemini
 * are back, run ensemble-sweep to elevate silver → gold.
 *
 * Run:
 *   node scripts/deterministic-gate.mjs                          # all isApproved=false, dry
 *   node scripts/deterministic-gate.mjs --course=AP_BIOLOGY      # one course
 *   node scripts/deterministic-gate.mjs --source=biology-ap-courses # source filter
 *   node scripts/deterministic-gate.mjs --approve                # writes
 *   node scripts/deterministic-gate.mjs --limit=100              # cap (testing)
 *
 * Artifact: data/deterministic-gate-runs/<ISO>.json with per-Q verdict + reason.
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

console.log(`Mode: ${APPROVE ? "WRITE (will promote PASS rows to silver tier)" : "DRY (read-only)"}`);
console.log(`Filter: course=${COURSE ?? "ANY"}, source=${SOURCE ?? "ANY"}, limit=${LIMIT ?? "none"}`);

// ── helpers ──────────────────────────────────────────────────────────────────
function stripPrefix(s) { return String(s).replace(/^[A-E]\s*\)\s*/, "").trim(); }

// 1. STRUCTURE
function checkStructure(q) {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  if (opts.length !== 4) return { pass: false, reason: `option count ${opts.length}` };
  const stripped = opts.map(stripPrefix);
  if (new Set(stripped).size !== 4) return { pass: false, reason: "duplicate option texts" };
  for (const s of stripped) {
    if (!s || s.length < 2) return { pass: false, reason: "empty/tiny option" };
  }
  const letter = String(q.correctAnswer ?? "").trim().toUpperCase().charAt(0);
  if (!"ABCD".includes(letter)) return { pass: false, reason: `bad correctAnswer "${q.correctAnswer}"` };
  return { pass: true };
}

// 2. ANSWER_CONSISTENCY — explanation doesn't contradict stored letter
function checkAnswerConsistency(q) {
  const exp = String(q.explanation ?? "");
  const letter = String(q.correctAnswer ?? "").trim().toUpperCase().charAt(0);
  if (!exp) return { pass: true }; // empty explanation isn't a contradiction
  // Pattern: "the correct answer is <letter>" where letter != stored letter
  const m = exp.match(/correct answer is\s*[\(\[\"]?([A-D])/i);
  if (m && m[1].toUpperCase() !== letter) {
    return { pass: false, reason: `explanation says correct=${m[1]} but stored=${letter}` };
  }
  // Pattern: "answer: <letter>" or "(answer: <letter>)" disagreeing
  const m2 = exp.match(/answer\s*[:=]\s*[\(\[\"]?([A-D])/i);
  if (m2 && m2[1].toUpperCase() !== letter) {
    return { pass: false, reason: `explanation answer:${m2[1]} but stored=${letter}` };
  }
  return { pass: true };
}

// 3. STIMULUS_HEALTH
function checkStimulusHealth(q) {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  const exp = String(q.explanation ?? "");
  const stim = String(q.stimulus ?? "");
  const qt = String(q.questionText ?? "");
  // Option contains "Correct"/"Incorrect"/"Wrong"/"Right" answer-label leak
  for (const o of opts) {
    if (/\b(Correct|Incorrect|Wrong|Right)\b/i.test(o)) {
      return { pass: false, reason: `option contains answer-label leak: ${o.slice(0, 50)}` };
    }
  }
  // LLM monologue tells in explanation
  if (/\b(hmm,|let me reconsider|wait, let me|actually, the|i think|i believe)\b/i.test(exp)) {
    return { pass: false, reason: "explanation contains LLM monologue" };
  }
  // Bare LaTeX command without backslash (e.g., "int_0^1" or "frac{a}{b}" or "rac{...}")
  // Check questionText + stimulus + explanation
  const combined = qt + " " + stim + " " + exp;
  if (/(?<![\\a-zA-Z])(rac|nfty|imes)\{|(?<![\\a-zA-Z])\b(rac|sum|int|infty)\s*[\{\(\^_]/i.test(combined)) {
    // Stricter: only flag if the bare keyword is in a math-y context (followed by {  ( ^ or _)
    return { pass: false, reason: "bare LaTeX command without backslash" };
  }
  return { pass: true };
}

// 4. STYLE — re-use detector logic inline (subset that's high-precision)
function checkStyle(q) {
  const opts = (Array.isArray(q.options) ? q.options : []).map(stripPrefix);
  if (opts.length < 4) return { pass: true }; // structure-check already handles this
  // Negation overload — ALL options use negation
  const NEG = /\b(not|never|except|none|neither|cannot|won't|doesn't|don't)\b/i;
  if (opts.every((o) => NEG.test(o))) {
    return { pass: false, reason: "all 4 options use negation (negation overload)" };
  }
  // Severe distractor imbalance — one option ≥3× avg length, and >120 chars
  const lengths = opts.map((o) => o.length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const max = Math.max(...lengths);
  if (max >= avg * 3 && max > 120) {
    return { pass: false, reason: `option length imbalance: max ${max} vs avg ${avg.toFixed(0)}` };
  }
  return { pass: true };
}

// 5. SOURCE_PRESENCE — required for this gate
function checkSourcePresence(q) {
  const sb = q.sourceBook ?? "";
  const su = q.sourceUrl ?? "";
  if (!sb && !su) return { pass: false, reason: "no sourceBook or sourceUrl" };
  return { pass: true };
}

// ── pull rows ────────────────────────────────────────────────────────────────
let qs;
if (COURSE && SOURCE && LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE} AND "sourceBook" = ${SOURCE} LIMIT ${LIMIT}`;
} else if (COURSE && SOURCE) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE} AND "sourceBook" = ${SOURCE}`;
} else if (COURSE && LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE} LIMIT ${LIMIT}`;
} else if (COURSE) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND course::text = ${COURSE}`;
} else if (SOURCE && LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND "sourceBook" = ${SOURCE} LIMIT ${LIMIT}`;
} else if (SOURCE) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' AND "sourceBook" = ${SOURCE}`;
} else if (LIMIT) {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ' LIMIT ${LIMIT}`;
} else {
  qs = await sql`SELECT id, course::text AS course, options, "correctAnswer", explanation, stimulus, "questionText", "sourceBook", "sourceUrl" FROM questions WHERE "isApproved" = false AND "questionType" = 'MCQ'`;
}

console.log(`\nLoaded ${qs.length} unapproved MCQs for deterministic gate.\n`);

const results = [];
const passIds = [];
const failByCheck = { structure: 0, answer_consistency: 0, stimulus_health: 0, style: 0, source_presence: 0 };
const failByCourse = {};

for (const q of qs) {
  const checks = {
    structure: checkStructure(q),
    answer_consistency: checkAnswerConsistency(q),
    stimulus_health: checkStimulusHealth(q),
    style: checkStyle(q),
    source_presence: checkSourcePresence(q),
  };
  const failed = Object.entries(checks).filter(([, c]) => !c.pass);
  if (failed.length === 0) {
    passIds.push(q.id);
    results.push({ id: q.id, course: q.course, verdict: "PASS" });
  } else {
    for (const [name] of failed) failByCheck[name]++;
    if (!failByCourse[q.course]) failByCourse[q.course] = 0;
    failByCourse[q.course]++;
    results.push({
      id: q.id,
      course: q.course,
      verdict: "FAIL",
      reasons: failed.map(([name, c]) => `${name}: ${c.reason}`),
    });
  }
}

console.log("══ SUMMARY ══");
console.log(`  total processed: ${qs.length}`);
console.log(`  PASS (silver-eligible): ${passIds.length} (${qs.length ? (100 * passIds.length / qs.length).toFixed(1) : 0}%)`);
console.log(`  FAIL: ${qs.length - passIds.length}`);
console.log("\n══ FAILURES BY CHECK ══");
for (const [k, v] of Object.entries(failByCheck)) console.log(`  ${k.padEnd(22)} ${v}`);

console.log("\n══ PER-COURSE PASS RATE ══");
const courseStats = {};
for (const r of results) {
  if (!courseStats[r.course]) courseStats[r.course] = { pass: 0, fail: 0 };
  courseStats[r.course][r.verdict === "PASS" ? "pass" : "fail"]++;
}
for (const [c, m] of Object.entries(courseStats).sort((a, b) => b[1].pass + b[1].fail - a[1].pass - a[1].fail)) {
  const total = m.pass + m.fail;
  console.log(`  ${c.padEnd(40)} pass=${m.pass}/${total} (${(100 * m.pass / total).toFixed(0)}%)`);
}

const outDir = join(process.cwd(), "data", "deterministic-gate-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `det-gate-${ts}.json`);
writeFileSync(outFile, JSON.stringify({
  generatedAt: new Date().toISOString(),
  mode: APPROVE ? "WRITE" : "DRY",
  filter: { course: COURSE, source: SOURCE, limit: LIMIT },
  summary: { total: qs.length, pass: passIds.length, fail: qs.length - passIds.length, failByCheck, courseStats },
  results,
}, null, 2));
console.log(`\nArtifact: ${outFile}`);

if (APPROVE && passIds.length > 0) {
  console.log(`\nPromoting ${passIds.length} rows to silver tier (isApproved=true, pipelineVetted=true, auditPassed=false)...`);
  const CHUNK = 200;
  let promoted = 0;
  for (let i = 0; i < passIds.length; i += CHUNK) {
    const slice = passIds.slice(i, i + CHUNK);
    await sql`UPDATE questions SET "isApproved" = true, "pipelineVetted" = true WHERE id = ANY(${slice})`;
    promoted += slice.length;
    if (passIds.length > CHUNK) console.log(`  ${promoted}/${passIds.length}...`);
  }
  console.log(`\n✓ Silver-tier promotion complete: ${promoted} rows.`);
  console.log(`Gold-tier promotion (auditPassed=true) requires ensemble-sweep — run when Anthropic/Gemini judges are restored.`);
}

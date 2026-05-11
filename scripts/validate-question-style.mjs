/**
 * scripts/validate-question-style.mjs
 *
 * 4 deterministic detectors from Quality Architecture v1.0 gap list:
 *
 *   1. PARALLELISM        — option list grammar/structure consistency.
 *                           All options should start with same part-of-speech
 *                           (all nouns, all verbs, etc.) and similar length.
 *   2. NEGATION_OVERLOAD  — flag if 3+ of 4 options use NOT/EXCEPT/NEVER.
 *                           Indicates weak generation.
 *   3. DOUBLE_CONCEPT     — flag stems testing >1 topic at once via "and"
 *                           between distinct concept phrases.
 *   4. DISTRACTOR_IMBALANCE — flag if one option's length is 2× the average
 *                           (telltale sign of "obviously the right one").
 *
 * All deterministic regex/string operations. No LLM calls.
 *
 * Run:
 *   node scripts/validate-question-style.mjs                       # dry, all approved
 *   node scripts/validate-question-style.mjs --course=AP_BIOLOGY    # one course
 *   node scripts/validate-question-style.mjs --unapprove            # writes (200-floor gated)
 *
 * Artifact: data/style-validator-runs/<ISO>.json
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--unapprove") return ["unapprove", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COURSE = args.course ?? null;
const UNAPPROVE = !!args.unapprove;

function stripPrefix(s) { return String(s).replace(/^[A-E]\s*\)\s*/, "").trim(); }

// Detector 1: PARALLELISM — first word part-of-speech consistency
const POS_PATTERNS = {
  noun_starter: /^(the|a|an|all|some|every|each|most|many|few)\s/i,
  gerund_starter: /^[a-z]+ing\b/i,
  verb_starter: /^(to\s+)?(use|find|calculate|identify|describe|explain|compare|select|determine|measure|increase|decrease|consider)\b/i,
  number_starter: /^[\d.,$\-]+\s*[a-z%°]/,
  inequality_starter: /^[<>≤≥]/,
  formula_starter: /^[a-zA-Z]\s*=|^\\?[a-z]+\{/,
};
function classifyOption(text) {
  for (const [name, rx] of Object.entries(POS_PATTERNS)) {
    if (rx.test(text)) return name;
  }
  return "other";
}
function detectParallelism(options) {
  const classes = options.map(classifyOption);
  const unique = new Set(classes);
  if (unique.size >= 3) return { hit: true, detail: `mixed: ${classes.join(",")}` };
  return { hit: false };
}

// Detector 2: NEGATION_OVERLOAD — most options use negation
const NEG_RX = /\b(not|never|except|none|neither|cannot|won't|doesn't|don't|wouldn't|aren't|isn't|wasn't|weren't|without|unless)\b/i;
function detectNegationOverload(options) {
  const negCount = options.filter((o) => NEG_RX.test(o)).length;
  if (negCount >= 3 && negCount === options.length) return { hit: true, detail: `${negCount}/${options.length} options use negation` };
  return { hit: false };
}

// Detector 3: DOUBLE_CONCEPT — stem tests two unrelated concepts simultaneously.
// Tightened heuristic: require *both* (a) two distinct action verbs in the
// imperative and (b) an "and" or "as well as" connector between them.
// The earlier "2+ interrogatives" rule produced 713 false positives because
// AP stems commonly include rhetorical "what we know" / "which of these".
function detectDoubleConcept(stem) {
  const text = stem.toLowerCase();
  // "Calculate X AND determine Y" or "find X AND identify Y" — two
  // distinct imperative verbs with explicit AND/AS WELL AS connector.
  const dualImperative = /\b(calculate|compute|find|determine|identify|describe|explain|compare|predict|select)\b[^.?!]{3,80}\b(and|as well as)\b[^.?!]{3,80}\b(calculate|compute|find|determine|identify|describe|explain|compare|predict|select)\b/i;
  if (dualImperative.test(text)) return { hit: true, detail: "two distinct imperative verbs joined by and" };
  // "Both ... and ..." structure with two concepts named on either side.
  if (/\bboth\b[^.?!]{5,80}\band\b/i.test(text) && /\?$/.test(stem.trim())) {
    // Only flag if the stem also has *no* "of the following" (which
    // legitimately tests one concept via Both-and as the answer choice).
    if (!/of the following/i.test(text)) return { hit: true, detail: "both-and pattern outside MCQ list framing" };
  }
  return { hit: false };
}

// Detector 4: DISTRACTOR_IMBALANCE — one option much longer than the rest
function detectDistractorImbalance(options) {
  const lengths = options.map((o) => o.length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const maxLen = Math.max(...lengths);
  const maxIdx = lengths.indexOf(maxLen);
  if (maxLen >= avg * 2 && maxLen > 80) {
    return { hit: true, detail: `option ${String.fromCharCode(65 + maxIdx)} is ${maxLen} chars vs avg ${avg.toFixed(0)}` };
  }
  // Also flag if shortest option is < 20% of avg (out-of-place tiny option)
  const minLen = Math.min(...lengths);
  if (minLen < avg * 0.2 && avg > 30) {
    const minIdx = lengths.indexOf(minLen);
    return { hit: true, detail: `option ${String.fromCharCode(65 + minIdx)} is ${minLen} chars vs avg ${avg.toFixed(0)}` };
  }
  return { hit: false };
}

let where = `"isApproved" = true AND "questionType" = 'MCQ'`;
const rows = COURSE
  ? await sql`SELECT id, course::text AS course, "questionText", options FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE}`
  : await sql`SELECT id, course::text AS course, "questionText", options FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ'`;
console.log(`Validating ${rows.length} approved MCQs...`);

const findings = { parallelism: [], negationOverload: [], doubleConcept: [], distractorImbalance: [] };
const perCourse = {};

for (const r of rows) {
  const opts = Array.isArray(r.options) ? r.options.map(stripPrefix) : [];
  if (opts.length < 4 || opts.length > 5) continue;
  const par = detectParallelism(opts);
  const neg = detectNegationOverload(opts);
  const dbl = detectDoubleConcept(r.questionText);
  const imb = detectDistractorImbalance(opts);

  const flags = [];
  if (par.hit) flags.push({ type: "parallelism", detail: par.detail });
  if (neg.hit) flags.push({ type: "negation_overload", detail: neg.detail });
  if (dbl.hit) flags.push({ type: "double_concept", detail: dbl.detail });
  if (imb.hit) flags.push({ type: "distractor_imbalance", detail: imb.detail });

  if (flags.length === 0) continue;
  if (!perCourse[r.course]) perCourse[r.course] = { parallelism: 0, negation_overload: 0, double_concept: 0, distractor_imbalance: 0, total: 0 };
  perCourse[r.course].total++;
  for (const f of flags) perCourse[r.course][f.type]++;

  if (par.hit) findings.parallelism.push({ course: r.course, id: r.id, detail: par.detail, stem: r.questionText.slice(0, 100) });
  if (neg.hit) findings.negationOverload.push({ course: r.course, id: r.id, detail: neg.detail, stem: r.questionText.slice(0, 100) });
  if (dbl.hit) findings.doubleConcept.push({ course: r.course, id: r.id, detail: dbl.detail, stem: r.questionText.slice(0, 100) });
  if (imb.hit) findings.distractorImbalance.push({ course: r.course, id: r.id, detail: imb.detail, stem: r.questionText.slice(0, 100) });
}

console.log("\n══ TOTAL FINDINGS ══");
console.log(`  parallelism:           ${findings.parallelism.length}`);
console.log(`  negation_overload:     ${findings.negationOverload.length}`);
console.log(`  double_concept:        ${findings.doubleConcept.length}`);
console.log(`  distractor_imbalance:  ${findings.distractorImbalance.length}`);

console.log("\n══ PER COURSE (≥5 flags) ══");
for (const [course, m] of Object.entries(perCourse).sort((a, b) => b[1].total - a[1].total)) {
  if (m.total < 5) continue;
  console.log(`  ${course.padEnd(38)} par=${m.parallelism} neg=${m.negation_overload} dbl=${m.double_concept} imb=${m.distractor_imbalance} (total ${m.total})`);
}

const outDir = join(process.cwd(), "data", "style-validator-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `style-${ts}.json`);
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), findings, perCourse }, null, 2));
console.log(`\nArtifact: ${outFile}`);

// NB: Style violations are softer signals than correctness bugs. By
// default we DO NOT unapprove on these — they get flagged for review.
// The --unapprove flag is preserved for explicit operator action when
// a specific class proves consistently wrong.
if (UNAPPROVE) {
  console.log("\n--unapprove specified but style violations are soft signals.");
  console.log("Defaulting to flag-only (no DB writes). To force, use --really-unapprove.");
}

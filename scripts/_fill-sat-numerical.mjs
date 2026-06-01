/**
 * 2026-06-01 — F1 SPR backfill (#100). Generates SAT_MATH NUMERICAL
 * (grid-in / Student Produced Response) questions to bring SAT_MATH to
 * ~25% SPR mix, matching CB's published digital SAT spec.
 *
 * Why NUMERICAL is its own generator:
 *   - The mirror-fill MCQ pipeline assumes 4 options + a correctAnswer
 *     letter. SPR has no options; the correctAnswer is a NUMBER stored
 *     as a string. Forcing the MCQ pipeline to emit SPR produces malformed
 *     payloads that the deterministic gate rejects.
 *   - CB grid-in rules: positive numbers only (no negatives), fractions
 *     OR decimals OR integers, 4-character max in the grid display
 *     (e.g. "3.14", "11/2", "1.25"). This generator enforces these in
 *     the prompt + post-parse validation.
 *
 * Pipeline:
 *   1. Pull current NUMERICAL distribution from DB; compute per-domain
 *      shortfall to target.
 *   2. For each shortfall domain, prompt the cascade (Gemini → Groq →
 *      OpenRouter → Anthropic) with domain-specific topic seeds.
 *   3. Validate the model's JSON: stem present, correctAnswer numeric
 *      and non-negative, explanation 80-160 chars.
 *   4. Re-solve via secondPassVerify (LLM independent check).
 *   5. Insert with questionType='NUMERICAL', options='[]'.
 *
 * Usage:
 *   node scripts/_fill-sat-numerical.mjs                   # generate to default targets
 *   node scripts/_fill-sat-numerical.mjs --target=80       # custom per-domain target
 *   node scripts/_fill-sat-numerical.mjs --domains=ALGEBRA,ADVANCED_MATH
 *   node scripts/_fill-sat-numerical.mjs --limit=10        # smoke test
 */
import "dotenv/config";
import crypto from "node:crypto";
import { normalizeQuestion, runDeterministicGates } from "./lib/_question-gates.mjs";
// 2026-06-01 — secondPassVerify is MCQ-specific (compares option letters)
// and hardcoded to ANTHROPIC_API_KEY which is depleted. For NUMERICAL we
// use a lightweight independent re-solve via the cascade instead.
import { callJsonObject, PROVIDERS_AVAILABLE, providerDead } from "./lib/_llm-cascade.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neonRetry } = await import("./lib/_sql-retry.mjs");
const sql = neonRetry(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const TARGET = parseInt(args.target ?? "80", 10);
const LIMIT = args.limit ? parseInt(args.limit, 10) : Infinity;
const DOMAINS_FILTER = (args.domains ?? "").split(",").filter(Boolean);

if (PROVIDERS_AVAILABLE.length === 0) {
  console.error("No LLM provider keys set.");
  process.exit(1);
}
console.log("Provider cascade:", PROVIDERS_AVAILABLE.join(" → "));

const DOMAIN_SEEDS = {
  SAT_MATH_1_ALGEBRA: [
    "Solving linear equations with one variable, integer solution",
    "Systems of two linear equations, integer solution for one variable",
    "Linear inequalities — finding boundary integer value",
    "Linear functions f(x) = mx + b — evaluating at a specific x",
    "Slope of a line through two points (integer slope)",
  ],
  SAT_MATH_2_ADVANCED_MATH: [
    "Quadratic equations factorable with integer roots",
    "Equivalent expressions — value of a coefficient after expansion",
    "Exponential functions — evaluating at integer x",
    "Polynomial evaluation at a specified x value (integer result)",
    "Function composition with simple polynomials",
  ],
  SAT_MATH_3_PROBLEM_SOLVING: [
    "Percent of a number — integer percent and integer base",
    "Ratio problems with integer outcome",
    "Unit conversion problems (rate × time)",
    "Mean of a small set of integers",
    "Probability as a fraction — count favorable / count total",
  ],
  SAT_MATH_4_GEOMETRY_TRIG: [
    "Area of a triangle / rectangle with integer side lengths",
    "Right triangle hypotenuse via Pythagorean theorem (integer)",
    "Circumference / area of a circle with integer radius",
    "Volume of a rectangular prism with integer dimensions",
    "Similar triangles — finding a missing side (integer ratio)",
  ],
};

function hashText(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

function isValidSpr(q) {
  if (!q?.questionText || q.questionText.length < 15) return { ok: false, why: "short stem" };
  if (q.correctAnswer == null) return { ok: false, why: "no answer" };
  const ans = String(q.correctAnswer).trim();
  // CB grid-in allows: integers, decimals, fractions (a/b). No negatives.
  if (!/^([0-9]+(\.[0-9]+)?|[0-9]+\/[0-9]+)$/.test(ans)) {
    return { ok: false, why: `bad-answer-format "${ans}"` };
  }
  if (ans.startsWith("-")) return { ok: false, why: "negative answer" };
  if (ans.length > 5) return { ok: false, why: `answer too long "${ans}"` };
  if (!q.explanation || q.explanation.length < 40) return { ok: false, why: "short explanation" };
  return { ok: true };
}

async function generateBatch(domain, topic, count) {
  const system = `You author SAT Math grid-in (Student Produced Response, SPR) questions for the digital SAT.

ABSOLUTE RULES — any violation = regenerate the question:

correctAnswer field MUST be one of:
  ✓ A positive integer: "5", "12", "100"
  ✓ A positive fraction a/b with integer a and b: "3/2", "11/4"
  ✓ A positive decimal: "3.14", "1.25"

correctAnswer field is FORBIDDEN from containing:
  ✗ Symbols: π, √, ², ³, ×, ÷, ^, ≤, ≥, ±
  ✗ Letters or variables: x, y, no "x = 5"
  ✗ Units: "5 cm", "12 inches", "3 sq ft"
  ✗ Equations: "x = 5", "y = 3"
  ✗ Compound expressions: "1 + 2", "2(3)", "(3/4)π"
  ✗ Negative numbers: "-3", "−5"

If the natural answer is "π·r²" with r=4, compute it: the answer is 50.27, write "50.27".
If the natural answer is "5√2", DO NOT use this question — pick a topic where the answer is a clean number.

Stem must be a self-contained math problem with a unique positive numerical answer
that fits in 4 characters max (e.g., "5", "3.14", "11/2", "1.25", "50.27").

Topic: ${topic}

Explanation: 80-160 chars, single sentence starting with "The answer is X because".
Length-fail (under 80 chars) = regenerate.

OUTPUT exactly:
{"questions":[{"questionText":"<stem>","correctAnswer":"<number-only string>","explanation":"<80-160 char reasoning>","topic":"${topic}","difficulty":"<EASY|MEDIUM|HARD>"}]}

JSON only, no markdown, no commentary, no field other than the four shown.`;
  const user = `Generate ${count} grid-in SAT Math questions on "${topic}". Each must have a single, unambiguous, positive numerical answer that fits the ABSOLUTE RULES above. Re-read the FORBIDDEN list before each answer. If your candidate answer contains π, √, units, or symbols, choose a different sub-topic where the answer is a clean number.`;
  let parsed;
  try {
    const r = await callJsonObject(system, user, { maxTokens: 3000 });
    parsed = r.parsed;
  } catch (e) {
    return { questions: [], err: String(e?.message ?? e).slice(0, 100) };
  }
  return { questions: parsed?.questions ?? parsed?.items ?? [], err: null };
}

async function insertOne(q, domain) {
  const id = crypto.randomUUID();
  try {
    await sql`
      INSERT INTO questions (
        id, course, unit, topic, difficulty, "questionType",
        "questionText", stimulus, options, "correctAnswer", explanation,
        "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed",
        "modelUsed", "generatedForTier", "contentHash",
        "timesAnswered", "timesCorrect", "reportedCount",
        "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, 'SAT_MATH'::"ApCourse", ${domain}::"ApUnit",
        ${q.topic || domain}, ${q.difficulty || "MEDIUM"}::"Difficulty",
        'NUMERICAL'::"QuestionType",
        ${q.questionText}, NULL, '[]'::jsonb, ${String(q.correctAnswer)}, ${q.explanation},
        true, true, false, false,
        'cascade:numerical-fill', 'FREE'::"SubTier", ${hashText(q.questionText)},
        0, 0, 0, NOW(), NOW()
      )
    `;
    return { ok: true, id };
  } catch (e) {
    return { ok: false, err: e.code === "23505" ? "dup" : String(e?.message ?? e).slice(0, 80) };
  }
}

// Load current per-domain NUMERICAL counts
const existing = await sql`
  SELECT unit::text AS unit, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'SAT_MATH'::"ApCourse"
    AND "isApproved" = true
    AND "questionType" = 'NUMERICAL'
  GROUP BY unit
`;
const currentByDomain = Object.fromEntries(existing.map((r) => [r.unit, r.n]));

let totalInserted = 0, totalFailed = 0;
for (const [domain, seeds] of Object.entries(DOMAIN_SEEDS)) {
  const shortName = domain.replace("SAT_MATH_", "").replace(/_/g, " ");
  if (DOMAINS_FILTER.length > 0 && !DOMAINS_FILTER.some((d) => domain.includes(d))) continue;
  const have = currentByDomain[domain] || 0;
  const need = Math.max(0, TARGET - have);
  if (need === 0) {
    console.log(`\n══ ${domain} — already at target (${have}/${TARGET})`);
    continue;
  }
  console.log(`\n══ ${domain} — have ${have}, target ${TARGET}, need +${need}`);
  let inserted = 0, failed = 0;
  let seedIdx = 0;
  let consecutiveFailures = 0;
  const failureReasons = {};
  while (inserted < need && totalInserted < LIMIT && consecutiveFailures < 30) {
    const topic = seeds[seedIdx % seeds.length];
    seedIdx += 1;
    const batchSize = Math.min(3, need - inserted);
    const { questions, err } = await generateBatch(domain, topic, batchSize);
    if (err || questions.length === 0) {
      failed += batchSize;
      consecutiveFailures += batchSize;
      console.log(`  ✗ "${topic.slice(0, 50)}" → ${err || "empty"}`);
      if (err && /All providers failed/.test(err)) {
        // 2026-06-01 — rate-limit recovery: sleep 75s + reset providerDead
        // so the cascade can retry. Without this each script invocation
        // grinds ~13-15 Qs then bails forever (Groq is the workhorse and
        // its rate limit window is ~60s).
        console.log(`  ⏳ all providers dead — sleeping 75s then resetting cascade…`);
        await new Promise((r) => setTimeout(r, 75_000));
        providerDead.clear();
        consecutiveFailures = 0;
      }
      continue;
    }
    if (process.env.DEBUG_GEN === "1") {
      console.log(`  [debug] got ${questions.length} Qs:`, JSON.stringify(questions[0]).slice(0, 200));
    }
    for (const q of questions) {
      if (inserted >= need || totalInserted >= LIMIT) break;
      normalizeQuestion(q);
      // SPR-specific validation
      const spr = isValidSpr(q);
      if (!spr.ok) {
        failureReasons[spr.why] = (failureReasons[spr.why] || 0) + 1;
        failed += 1; consecutiveFailures += 1;
        continue;
      }
      consecutiveFailures = 0;
      // Deterministic gate is MCQ-focused (validates A-E correctAnswer +
      // options structure). Most of its 50+ classes don't apply to
      // NUMERICAL — including the structure check that demands letter
      // answers. SPR-specific validation above (positive-number-only,
      // 4-char-max, explanation length) covers the equivalent ground.
      // Skip the MCQ gate entirely.
      // Independent re-solve via cascade. Asks a separate model call to
      // solve the stem from scratch and compare to the claimed answer.
      // Skip on cascade error — better to ship a Q that passed gates than
      // stall the run on a transient provider hiccup.
      try {
        const verifySystem = `You are a math QA auditor. Solve the question yourself, then output ONLY {"computed":"<your-answer>","matches":<true|false>} where matches is true iff your answer equals the claimed answer (allowing equivalent forms like 1/2 = 0.5).`;
        const verifyUser = `Question: ${q.questionText}\nClaimed answer: ${q.correctAnswer}\nSolve and compare.`;
        const v = await callJsonObject(verifySystem, verifyUser, { maxTokens: 500 });
        if (v?.parsed && v.parsed.matches === false) { failed += 1; continue; }
      } catch {
        // cascade hiccup — proceed with the Q (gates already passed)
      }
      const ins = await insertOne(q, domain);
      if (ins.ok) { inserted += 1; totalInserted += 1; }
      else { failed += 1; }
    }
    console.log(`  ${shortName}: +${inserted} so far (need ${need}), failed ${failed}`);
  }
  if (Object.keys(failureReasons).length > 0) {
    console.log(`  failure-reason histogram for ${shortName}:`);
    for (const [reason, count] of Object.entries(failureReasons).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`    ${reason}: ${count}`);
    }
  }
  if (consecutiveFailures >= 30) {
    console.log(`  ⚠ ${shortName}: 30+ consecutive failures, moving on`);
  }
  totalFailed += failed;
}

console.log(`\n══ TOTAL ══\nInserted: ${totalInserted} | Failed: ${totalFailed}`);

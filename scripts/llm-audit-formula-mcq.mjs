/**
 * scripts/llm-audit-formula-mcq.mjs (PrepLion)
 *
 * LLM-based audit for FORMULA / SYMBOLIC MCQs that the deterministic
 * validators (validateAnswerNumericMatch, etc.) miss because there's no
 * single "last number" in the explanation to mismatch-check.
 *
 * Bug class caught: stored correctAnswer disagrees with the option that
 * the explanation actually derives. E.g.:
 *   options: ..., E: 5+3(h-1)
 *   correctAnswer: "C"
 *   explanation: "...giving 5 + 3(h - 1). Option E miscalculates..."
 * → student picks E, system says wrong, explanation contradicts itself.
 *
 * Targets MATH-FAMILY courses (CLEP/DSST math, sciences) where formula
 * answers are common. Other courses (history, English) caught by the
 * existing math-validator's numeric heuristic + LLM has less leverage.
 *
 * Usage:
 *   node scripts/llm-audit-formula-mcq.mjs --course=CLEP_COLLEGE_ALGEBRA --dry
 *   node scripts/llm-audit-formula-mcq.mjs --course=CLEP_COLLEGE_ALGEBRA --unapprove
 *   node scripts/llm-audit-formula-mcq.mjs --course=ALL_MATH --unapprove --limit=200
 *
 * Env: DATABASE_URL, OPENAI_API_KEY
 * Cost: ~$0.005 per question audited.
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  console.error("OPENAI_API_KEY missing — set it in env.");
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const COURSE_ARG = args.course || "CLEP_COLLEGE_ALGEBRA";
const DRY = !!args.dry;
const LIMIT = args.limit ? Number(args.limit) : 0;

const MATH_COURSES = [
  "CLEP_COLLEGE_ALGEBRA",
  "CLEP_PRECALCULUS",
  "CLEP_CALCULUS",
  "CLEP_COLLEGE_MATH",
  "CLEP_NATURAL_SCIENCES",
  "CLEP_CHEMISTRY",
  "DSST_PRINCIPLES_OF_FINANCE",
  "DSST_MONEY_AND_BANKING",
  "DSST_ASTRONOMY",
];

const courses = COURSE_ARG === "ALL_MATH" ? MATH_COURSES : [COURSE_ARG];

console.log(`LLM formula-MCQ audit — courses: ${courses.join(", ")}`);
console.log(`Mode: ${DRY ? "DRY (read-only)" : "WRITE (will unapprove broken Qs)"}`);
console.log(`Per-course limit: ${LIMIT || "ALL"}`);

async function judge(q) {
  const optsStr = Array.isArray(q.options) ? q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("\n") : JSON.stringify(q.options);
  const prompt = `Audit this MCQ for THREE bug classes:

1. LETTER_MISMATCH — stored correctAnswer disagrees with the option the explanation actually derives.
2. CONTRADICTION — explanation self-contradicts (says one option is correct in one sentence, another option in another).
3. LABEL_MISMATCH — when the explanation describes a distractor (e.g. "Option B incorrectly multiplies"), that description does NOT match what's actually in option B's text. This is the CRITICAL new check: the explanation might call the right answer correct overall, but its analysis of WHY each distractor is wrong references the wrong option text.

Question: ${q.questionText}

Options:
${optsStr}

Stored correctAnswer: ${q.correctAnswer}

Explanation: ${q.explanation || "(no explanation)"}

Return JSON only:
{
  "explanation_derives_option": "A" | "B" | "C" | "D" | "E" | "unclear",
  "stored_matches_derived": true | false,
  "explanation_self_contradicts": true | false,
  "distractor_labels_match_options": true | false,
  "label_issues": "<list specific mislabels, or empty>",
  "verdict": "PASS" | "FAIL_LETTER_MISMATCH" | "FAIL_CONTRADICTION" | "FAIL_LABEL_MISMATCH" | "UNCLEAR",
  "reason": "<short string explaining verdict>"
}

PASS only if ALL of: stored_matches_derived === true, explanation_self_contradicts === false, AND distractor_labels_match_options === true.

Examples of LABEL_MISMATCH (real bugs we've seen):
- Explanation says "Option A incorrectly uses (x+2)" but option A is (x-2). Option E is the one with (x+2).
- Explanation says "Option B reverses the inequality" but option B IS the correct answer; option D actually reverses the inequality.
- Explanation says "C and D don't satisfy" when D IS the correct answer.`;

  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          // gpt-4o-mini for bulk audits — 10× cheaper, much higher TPM,
          // catches the same bug classes (LETTER/CONTRADICTION/LABEL).
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 400,
        }),
      });
    } catch (e) {
      // Network connectivity error (ConnectTimeoutError, DNS, etc.) — retry with backoff.
      const wait = (attempt + 1) * 5;
      console.log(`  ↳ network error (${e.message?.slice(0, 50) ?? e}), retry in ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (res.status === 429) {
      const wait = (attempt + 1) * 8;
      console.log(`  ↳ rate-limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    try { return JSON.parse(data.choices[0].message.content); }
    catch { return { error: "JSON parse fail" }; }
  }
  return { error: "all retries exhausted (network or rate-limit)" };
}

const findings = { pass: 0, failLetter: 0, failContradict: 0, failLabel: 0, unclear: 0, error: 0, brokenIds: [] };

for (const course of courses) {
  console.log(`\n── ${course} ──`);
  const limit = LIMIT > 0 ? LIMIT : 10000;
  const qs = await sql`
    SELECT id, "questionText", options, "correctAnswer", explanation
    FROM questions
    WHERE course::text = ${course}
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;
  console.log(`  ${qs.length} approved MCQs to audit`);

  for (const q of qs) {
    const result = await judge(q);
    if (result.error) {
      console.log(`  Q ${q.id.slice(0, 8)} ERROR: ${result.error}`);
      findings.error++;
      continue;
    }
    const v = result.verdict;
    if (v === "PASS") findings.pass++;
    else if (v === "FAIL_LETTER_MISMATCH") {
      findings.failLetter++;
      findings.brokenIds.push({ id: q.id, course, verdict: v, reason: result.reason, derivedFromExplanation: result.explanation_derives_option, stored: q.correctAnswer });
      console.log(`  ✗ Q ${q.id.slice(0, 8)} LETTER_MISMATCH: stored=${q.correctAnswer} derived=${result.explanation_derives_option} — ${result.reason}`);
      // Incremental write: unapprove immediately so partial-completion saves work.
      if (!DRY) {
        await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
      }
    }
    else if (v === "FAIL_CONTRADICTION") {
      findings.failContradict++;
      findings.brokenIds.push({ id: q.id, course, verdict: v, reason: result.reason });
      console.log(`  ✗ Q ${q.id.slice(0, 8)} CONTRADICTION: ${result.reason}`);
      if (!DRY) {
        await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
      }
    }
    else if (v === "FAIL_LABEL_MISMATCH") {
      findings.failLabel++;
      findings.brokenIds.push({ id: q.id, course, verdict: v, reason: result.reason, labelIssues: result.label_issues });
      console.log(`  ✗ Q ${q.id.slice(0, 8)} LABEL_MISMATCH: ${result.reason}`);
      if (!DRY) {
        await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
      }
    }
    else { findings.unclear++; }
    await new Promise(r => setTimeout(r, 1500)); // pace 40/min — mini's higher TPM but still safe under combined load
  }
}

console.log(`\n══ SUMMARY ══`);
console.log(`PASS:                  ${findings.pass}`);
console.log(`FAIL_LETTER_MISMATCH:  ${findings.failLetter}`);
console.log(`FAIL_CONTRADICTION:    ${findings.failContradict}`);
console.log(`FAIL_LABEL_MISMATCH:   ${findings.failLabel}`);
console.log(`UNCLEAR:               ${findings.unclear}`);
console.log(`ERROR:                 ${findings.error}`);
console.log(`Total broken (would unapprove): ${findings.brokenIds.length}`);

const outDir = join(process.cwd(), "data", "llm-audit-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `formula-mcq-audit-${ts}.json`);
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), courses, findings }, null, 2));
console.log(`\nArtifact: ${outFile}`);

if (!DRY) {
  console.log(`\n✓ ${findings.brokenIds.length} questions unapproved (written incrementally as each was detected).`);
}

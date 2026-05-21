/**
 * Generate NUMERICAL + MULTI_SELECT Q types for math-heavy courses.
 *
 * Schema + grading + UI are ALREADY wired:
 *   - prisma/schema.prisma: NUMERICAL + MULTI_SELECT in QuestionType enum
 *   - src/app/api/practice/[sessionId]/route.ts: float-tolerance grading (NUMERICAL),
 *     sorted-letter comparison (MULTI_SELECT)
 *   - src/app/(dashboard)/practice/page.tsx: NUMERICAL input + MULTI_SELECT checkbox UI
 *
 * Gap was: zero questions of these types existed. This script fills the gap
 * per CB blueprint percentages.
 *
 * CB blueprint references:
 *   - CLEP_COLLEGE_MATH: ~25% Student-Produced Response (numeric) + multi-select
 *   - CLEP_COLLEGE_ALGEBRA: ~10% numeric, occasional multi-select
 *   - CLEP_CALCULUS: ~15% numeric
 *   - CLEP_PRECALCULUS: ~10% numeric
 *   - SAT_MATH: ~25% SPR (numeric) per module
 *   - AP_STATISTICS: ~10% numeric on FRQs (but we'll do MCQ-positioned numerical too)
 *   - AP_PHYSICS_*: ~15-20% numeric
 *
 * Usage:
 *   node _seed-numerical-multiselect.mjs --course=CLEP_COLLEGE_ALGEBRA
 */
import "dotenv/config";
import crypto from "node:crypto";
import { normalizeQuestion, runDeterministicGates } from "./lib/_question-gates.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("GROQ_API_KEY missing"); process.exit(1); }

const COURSE = process.argv[2];
if (!COURSE) { console.error("Usage: node _seed-numerical-multiselect.mjs CLEP_COLLEGE_ALGEBRA"); process.exit(1); }

// Per-course numerical/multi-select targets (informed by CB blueprints)
const TARGETS = {
  CLEP_COLLEGE_ALGEBRA: { numerical: 40, multiselect: 20, isSN: false },
  CLEP_COLLEGE_MATH: { numerical: 60, multiselect: 30, isSN: false },
  CLEP_CALCULUS: { numerical: 50, multiselect: 15, isSN: false },
  CLEP_PRECALCULUS: { numerical: 40, multiselect: 15, isSN: false },
  SAT_MATH: { numerical: 80, multiselect: 0, isSN: true },          // SAT uses SPR not multi-select
  AP_STATISTICS: { numerical: 30, multiselect: 20, isSN: true },
  AP_PHYSICS_1: { numerical: 50, multiselect: 10, isSN: true },      // CB AP Phys 1 has multi-select MCQs
  AP_PHYSICS_2: { numerical: 50, multiselect: 10, isSN: true },
  AP_PHYSICS_C_MECHANICS: { numerical: 50, multiselect: 5, isSN: true },
  AP_PHYSICS_C_ELECTRICITY_MAGNETISM: { numerical: 50, multiselect: 5, isSN: true },
  AP_CALCULUS_AB: { numerical: 40, multiselect: 0, isSN: true },
  AP_CALCULUS_BC: { numerical: 40, multiselect: 0, isSN: true },
};

const cfg = TARGETS[COURSE];
if (!cfg) { console.error(`No target config for ${COURSE}. Supported: ${Object.keys(TARGETS).join(", ")}`); process.exit(1); }

// Discover existing units
const dbUnits = await sql`SELECT DISTINCT unit::text AS unit FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true`;
const unitNames = dbUnits.map((u) => u.unit);
if (!unitNames.length) { console.error(`No units in DB for ${COURSE}`); process.exit(1); }
console.log(`${COURSE} | numerical target ${cfg.numerical} | multi-select target ${cfg.multiselect} | units: ${unitNames.length}`);

// Course-aware subject name
const subjectName = COURSE.replace(/^(CLEP|AP|SAT|ACT|PSAT|DSST)_/, "").replace(/_/g, " ").toLowerCase();
const examFamily = COURSE.startsWith("CLEP_") ? "CLEP" : COURSE.startsWith("AP_") ? "AP" : COURSE.startsWith("SAT_") ? "digital SAT" : "exam";

function numericalSystem() {
  return `You generate ${examFamily} ${subjectName} NUMERICAL questions — student types a number, no options.

CRITICAL CONSTRAINTS:
1. Question must have a single numeric answer (integer or decimal). NO multiple choice options.
2. The answer must be UNAMBIGUOUS: only one correct numeric value.
3. Provide answer to ≥4 significant figures if non-integer (e.g., "3.1416" not "3.14"). Float-tolerance grading uses ±0.5% (or ±0.01 absolute).
4. Stem must explicitly say what unit/form the answer should be in (e.g., "in radians", "in square units", "to the nearest integer").
5. Explanation MUST START with "The answer is X" or "Answer: X" where X is the numeric value. Then explain the work.
6. Stem 15-50 words. Direct, CB style.
7. AVOID problems with messy decimal answers when CB would round (CB prefers clean integers or simple fractions).

OUTPUT JSON: {"questions":[{"questionText":"...", "stimulus":null, "options":[], "correctAnswer":"42", "explanation":"The answer is 42 because...", "topic":"", "difficulty":"MEDIUM"}, ...]}

Return JSON only. correctAnswer is a string containing the number.`;
}

function multiSelectSystem() {
  return `You generate ${examFamily} ${subjectName} MULTI-SELECT questions. Student picks ALL options that apply.

CRITICAL CONSTRAINTS:
1. 5 options (A-E for CLEP, A-D for AP/SAT). Multiple options are correct (usually 2 or 3).
2. The stem must say "Select all that apply" or "Which of the following are true?" or "Indicate all such statements".
3. Each option must be evaluable as TRUE or FALSE on its own — no overlap.
4. correctAnswer is a COMMA-SEPARATED list of letters in alphabetical order: "A,C" or "B,D,E".
5. Explanation MUST START with "Letters X, Y are correct" matching the stored correctAnswer (alphabetical order). Then explain each.
6. Stem 15-50 words. CB style.

OUTPUT JSON: {"questions":[{"questionText":"...", "options":["A) ...","B) ...","C) ...","D) ...","E) ..."], "correctAnswer":"A,C", "explanation":"Letters A, C are correct because...", "topic":"", "difficulty":"MEDIUM"}, ...]}

Return JSON only.`;
}

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 4500,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse((await res.json())?.choices?.[0]?.message?.content ?? "{}");
}
function hashText(s) { return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex"); }

// Validate NUMERICAL: must have parseable number in correctAnswer, no options, explanation present
function validateNumerical(q) {
  if (!q.questionText || q.questionText.trim().length < 15) return "stem_short";
  if (q.correctAnswer == null || q.correctAnswer === "") return "no_answer";
  const num = parseFloat(String(q.correctAnswer).replace(/,/g, ""));
  if (!Number.isFinite(num)) return `not_numeric:${q.correctAnswer}`;
  if (!q.explanation || q.explanation.length < 40) return "explanation_short";
  // Ensure no MCQ options leak
  if (Array.isArray(q.options) && q.options.length > 0) return "options_present_in_numerical";
  return null;
}

// Validate MULTI_SELECT: correctAnswer is "A,B" format, options match
function validateMultiSelect(q) {
  if (!q.questionText || q.questionText.trim().length < 15) return "stem_short";
  if (!Array.isArray(q.options) || q.options.length < 4) return `options_${q.options?.length}`;
  if (!q.correctAnswer || typeof q.correctAnswer !== "string") return "no_answer";
  const letters = q.correctAnswer.replace(/\s/g, "").split(",").filter(Boolean);
  if (letters.length < 2 || letters.length > q.options.length) return `letters_${letters.length}`;
  for (const L of letters) {
    if (!/^[A-E]$/.test(L)) return `bad_letter:${L}`;
  }
  // Check alphabetical order + uniqueness
  const sorted = [...new Set(letters)].sort();
  if (sorted.join(",") !== letters.join(",")) {
    q.correctAnswer = sorted.join(","); // normalize
  }
  if (!q.explanation || q.explanation.length < 40) return "explanation_short";
  return null;
}

let insertedN = 0, insertedM = 0, failed = 0, dupes = 0;
const failReasons = {};

// ── NUMERICAL ──────────────────────────────────────────────────────────
if (cfg.numerical > 0) {
  const sysN = numericalSystem();
  const perUnit = Math.ceil(cfg.numerical / unitNames.length);
  for (const unit of unitNames) {
    const batches = Math.ceil(perUnit / 5);
    console.log(`\n[NUMERICAL ${unit}] target ${perUnit} in ${batches} batches`);
    for (let b = 0; b < batches; b++) {
      const ask = Math.min(5, perUnit - b * 5);
      let parsed;
      try { parsed = await callGroq(sysN, `Generate ${ask} ${subjectName} NUMERICAL questions for unit "${unit}". Mix difficulty. JSON only.`); }
      catch (e) { console.log(`  ! ${e.message.slice(0, 80)}`); continue; }
      const arr = parsed?.questions || [];
      if (!arr.length) continue;
      let kept = 0, firstFail = null;
      for (const q of arr) {
        const err = validateNumerical(q);
        if (err) { failed++; failReasons[err] = (failReasons[err] || 0) + 1; if (!firstFail) firstFail = err; continue; }
        const id = crypto.randomUUID();
        try {
          if (cfg.isSN) {
            await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
              VALUES (${id}, ${COURSE}::"ApCourse", ${unit}::"ApUnit", ${q.topic || "Numerical"}, ${(q.difficulty || "MEDIUM").toUpperCase()}::"Difficulty", 'NUMERICAL'::"QuestionType", ${q.questionText}, null, '[]'::jsonb, ${String(q.correctAnswer)}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:numerical', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
          } else {
            await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
              VALUES (${id}, ${COURSE}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || "Numerical"}, ${(q.difficulty || "MEDIUM").toUpperCase()}::"Difficulty", 'NUMERICAL'::"QuestionType", ${q.questionText}, null, '[]'::jsonb, ${String(q.correctAnswer)}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:numerical', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
          }
          insertedN++; kept++;
        } catch (e) {
          if (e.code === "23505") dupes++;
          else { failed++; if (!firstFail) firstFail = `sql:${e.code}`; }
        }
      }
      console.log(`  batch ${b+1}: ${kept}/${arr.length}${firstFail ? ` (1st-fail: ${firstFail})` : ""}`);
      if (insertedN >= cfg.numerical) break;
      await new Promise((r) => setTimeout(r, 3500));
    }
    if (insertedN >= cfg.numerical) break;
  }
}

// ── MULTI_SELECT ───────────────────────────────────────────────────────
if (cfg.multiselect > 0) {
  const sysM = multiSelectSystem();
  const perUnit = Math.ceil(cfg.multiselect / unitNames.length);
  for (const unit of unitNames) {
    const batches = Math.ceil(perUnit / 5);
    console.log(`\n[MULTI_SELECT ${unit}] target ${perUnit} in ${batches} batches`);
    for (let b = 0; b < batches; b++) {
      const ask = Math.min(5, perUnit - b * 5);
      let parsed;
      try { parsed = await callGroq(sysM, `Generate ${ask} ${subjectName} MULTI-SELECT questions for unit "${unit}". Use "Select all that apply" format. JSON only.`); }
      catch (e) { console.log(`  ! ${e.message.slice(0, 80)}`); continue; }
      const arr = parsed?.questions || [];
      if (!arr.length) continue;
      let kept = 0, firstFail = null;
      for (const q of arr) {
        const err = validateMultiSelect(q);
        if (err) { failed++; failReasons[err] = (failReasons[err] || 0) + 1; if (!firstFail) firstFail = err; continue; }
        const id = crypto.randomUUID();
        try {
          if (cfg.isSN) {
            await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
              VALUES (${id}, ${COURSE}::"ApCourse", ${unit}::"ApUnit", ${q.topic || "Multi-Select"}, ${(q.difficulty || "MEDIUM").toUpperCase()}::"Difficulty", 'MULTI_SELECT'::"QuestionType", ${q.questionText}, null, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:multi-select', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
          } else {
            await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
              VALUES (${id}, ${COURSE}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || "Multi-Select"}, ${(q.difficulty || "MEDIUM").toUpperCase()}::"Difficulty", 'MULTI_SELECT'::"QuestionType", ${q.questionText}, null, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:multi-select', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
          }
          insertedM++; kept++;
        } catch (e) {
          if (e.code === "23505") dupes++;
          else { failed++; if (!firstFail) firstFail = `sql:${e.code}`; }
        }
      }
      console.log(`  batch ${b+1}: ${kept}/${arr.length}${firstFail ? ` (1st-fail: ${firstFail})` : ""}`);
      if (insertedM >= cfg.multiselect) break;
      await new Promise((r) => setTimeout(r, 3500));
    }
    if (insertedM >= cfg.multiselect) break;
  }
}

console.log(`\n══ DONE ══`);
console.log(`NUMERICAL inserted: ${insertedN}/${cfg.numerical}`);
console.log(`MULTI_SELECT inserted: ${insertedM}/${cfg.multiselect}`);
console.log(`Failed: ${failed} | Dupes: ${dupes}`);
if (Object.keys(failReasons).length) console.log(`Failure reasons:`, failReasons);
const final = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true`;
console.log(`\n${COURSE} approved total: ${final[0].n}`);

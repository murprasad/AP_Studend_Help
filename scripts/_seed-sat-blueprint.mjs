/**
 * SN SAT blueprint backfill — fix the unit-imbalance findings from the
 * 2026-05-20 walkthrough.
 *
 * SAT_READING_WRITING needs:
 *   STANDARD_ENGLISH_CONVENTIONS: 18 Qs → ~190 (need +170)
 *   EXPRESSION_OF_IDEAS: 26 Qs → ~150 (need +120)
 *
 * SAT_MATH needs:
 *   PROBLEM_SOLVING_DATA_ANALYSIS: 6 Qs → ~40 (need +35)
 *   GEOMETRY_AND_TRIGONOMETRY: 13 Qs → ~40 (need +30)
 *
 * Uses 2024+ digital SAT stem patterns from cb_spec vocabulary_cues.
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
const targets = {
  SAT_READING_WRITING: [
    { unit: "SAT_RW_3_STANDARD_ENGLISH", topic: "Boundaries — commas, semicolons, colons, dashes", target: 50,
      stim: true,
      instr: `Generate digital SAT Reading & Writing questions on STANDARD ENGLISH CONVENTIONS / Boundaries. Stem style: "Which choice completes the text so that it conforms to the conventions of Standard English?" Provide a short 1-2 sentence text (25-80 words) as STIMULUS with one blank, and 4 options testing comma rules (between independent clauses, after introductory phrases, restrictive/non-restrictive), semicolon vs colon, dash use, comma splices vs proper joining. Real digital SAT format.` },
    { unit: "SAT_RW_3_STANDARD_ENGLISH", topic: "Form/Structure/Sense — agreement, modifiers, parallelism", target: 50,
      stim: true,
      instr: `Generate digital SAT questions on Form, Structure, Sense. Stem: "Which choice completes the text so that it conforms to the conventions of Standard English?" Short text with one blank, 4 options testing subject-verb agreement, pronoun agreement, verb tense consistency, modifier placement, parallel structure, plural vs possessive, apostrophe use. Use real digital SAT 4-opt style.` },
    { unit: "SAT_RW_3_STANDARD_ENGLISH", topic: "Punctuation/Mechanics", target: 30,
      stim: true,
      instr: `Generate digital SAT punctuation questions. Stem: "Which choice completes the text so that it conforms to the conventions of Standard English?" Short text with punctuation blank, 4 options. Test: apostrophes (people's vs peoples vs people), commas in series, restrictive vs nonrestrictive clauses, possessive forms of singular/plural nouns. Real digital SAT bank style.` },
    { unit: "SAT_RW_4_EXPRESSION_IDEAS", topic: "Rhetorical Synthesis — notes-to-sentence", target: 50,
      stim: true,
      instr: `Generate digital SAT Rhetorical Synthesis questions. Stem: "While researching a topic, a student has taken the following notes: [bullet list of 3-5 facts]. The student wants to [stated goal e.g. emphasize a similarity / introduce X to a reader unfamiliar with it / present X's findings]. Which choice most effectively uses relevant information from the notes to accomplish this goal?" 4 options each a different sentence drawing from the notes. The correct answer best matches the stated goal.` },
    { unit: "SAT_RW_4_EXPRESSION_IDEAS", topic: "Transitions", target: 30,
      stim: true,
      instr: `Generate digital SAT Transitions questions. Stem: "Which choice completes the text with the most logical transition?" Short 50-100 word text with a missing transition word/phrase. 4 options testing transitions like: Instead, Likewise, Finally, Additionally, However, Specifically, In contrast, As a result, Nevertheless, Similarly. Pick the transition that fits the logical relationship between the surrounding sentences.` },
    { unit: "SAT_RW_4_EXPRESSION_IDEAS", topic: "Cross-Text Connections", target: 25,
      stim: true,
      instr: `Generate digital SAT Cross-Text Connection questions. Format: provide TWO short texts (Text 1 and Text 2, ~50 words each) on related topics, then ask how Text 2 author would respond to Text 1's claim. Stem: "Based on the texts, how would [Text 2 author] most likely respond to the [conventional wisdom / argument / finding] presented in Text 1?" 4 options each a different stance (agree, disagree with rationale, qualify, redirect).` },
  ],
  SAT_MATH: [
    { unit: "SAT_MATH_3_PROBLEM_SOLVING", topic: "Ratios, rates, proportions, units", target: 25,
      stim: false,
      instr: `Generate digital SAT Math questions on PROBLEM SOLVING AND DATA ANALYSIS - ratios, rates, proportional relationships, unit conversions, and percentages. Use real-world contexts (recipes, currency conversion, fuel efficiency, drug dosages, sales tax, markups/discounts). Vary stem style: "What is the value of...", "If [ratio], how many...", "What percent of...". Keep stems 20-40 words. 4-opt MCQ.` },
    { unit: "SAT_MATH_3_PROBLEM_SOLVING", topic: "Statistics — center, spread, scatterplots", target: 20,
      stim: true,
      instr: `Generate digital SAT Math statistics questions. Cover: median vs mean, range, comparing data sets (medians and ranges), scatterplots and linear models, probability and conditional probability, margin of error and inference, observational studies vs experiments. Provide data as stimulus (small table or scatterplot description). Stem styles: "Which of the following correctly compares the medians and the ranges of data sets A and B?", "Based on this estimate and margin of error, which is the most appropriate conclusion?". 4 options. Use "It is plausible that..." style for inference.` },
    { unit: "SAT_MATH_4_GEOMETRY_TRIG", topic: "Right triangle trig, special triangles", target: 20,
      stim: true,
      instr: `Generate digital SAT Math right-triangle and trig questions. Cover: Pythagorean theorem, special right triangles (30-60-90, 45-45-90), sin/cos/tan, complementary angle identity (sin x = cos(90-x)), arc measure, central angles, similarity. Provide figures as stimulus description. Note: Figure not drawn to scale OR drawn to scale per CB convention. Stem: "What is the measure of angle X?", "What is the length of...", "What is the value of cos X?". 4 options.` },
    { unit: "SAT_MATH_4_GEOMETRY_TRIG", topic: "Circles, lines, angles", target: 15,
      stim: true,
      instr: `Generate digital SAT Math geometry questions on circles (equation of circle (x-h)^2+(y-k)^2=r^2, arc measure, central angles, chord/tangent properties), lines and angles (parallel lines cut by transversal, supplementary/complementary, vertical angles), area/perimeter. Provide figure as stimulus. 4-opt.` },
  ],
};

if (!targets[COURSE]) { console.error(`Usage: node _seed-sat-blueprint.mjs ${Object.keys(targets).join("|")}`); process.exit(1); }
const cfg = targets[COURSE];

const SYSTEM = `You generate digital SAT (2024+) ${COURSE === "SAT_MATH" ? "Math" : "Reading & Writing"} exam questions matching the College Board Bluebook practice tests.

CRITICAL CONSTRAINTS:
1. Exactly 4 options (A-D). Each starts with "A)" "B)" etc.
2. Options distinct, no duplicates, no near-duplicates.
3. Explanation MUST START with "Letter X is correct" where X = correctAnswer.
4. Explanation 80-180 chars. Says WHY correct AND why most-tempting distractor is wrong.
5. Stem 12-45 words. Digital SAT style — concise.
6. Difficulty: 30% EASY, 50% MEDIUM, 20% HARD.
7. ${COURSE === "SAT_READING_WRITING" ? "Include a STIMULUS field with the 25-100 word text/passage when needed (Reading & Writing is passage-based)." : "Use stimulus for geometry/data questions; otherwise stimulus=null."}
8. NO 5-option questions. NO essay scoring. NO old paper-SAT formats.

OUTPUT JSON: {"questions":[{"questionText":"", "stimulus":"" or null, "options":["A) ...","B) ...","C) ...","D) ..."], "correctAnswer":"A", "explanation":"Letter A is correct because ...", "topic":"", "difficulty":"MEDIUM"}, ...]}

Return JSON only.`;

async function callGroq(userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 4500,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse((await res.json())?.choices?.[0]?.message?.content ?? "{}");
}
function hashText(s) { return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex"); }
function validate(q) {
  if (!q.questionText || q.questionText.trim().length < 12) return "stem_short";
  if (!Array.isArray(q.options) || q.options.length !== 4) return `options_${q.options?.length}`;
  for (let i = 0; i < 4; i++) {
    const expected = String.fromCharCode(65 + i);
    if (!new RegExp(`^\\s*\\(?${expected}\\)?[).\\s]`, "i").test(String(q.options[i] || ""))) return `missing_prefix_${expected}`;
  }
  const norm = q.options.map((o) => String(o).toLowerCase().replace(/^[a-d]\s*[).\s]\s*/i, "").replace(/\s+/g, "").replace(/['"`""]/g, ""));
  if (new Set(norm).size !== norm.length) return "duplicate_options";
  // Normalize correctAnswer: accept "B" or "B)" or "B) Comma" → "B"
  if (typeof q.correctAnswer === "string") {
    const cleaned = q.correctAnswer.trim().toUpperCase();
    const letterMatch = cleaned.match(/^[A-D]/);
    if (letterMatch) q.correctAnswer = letterMatch[0];
  }
  if (!/^[A-D]$/.test(q.correctAnswer || "")) return "bad_correctAnswer";
  // Normalize difficulty: accept "Easy"/"Medium"/"Hard" → "EASY"/"MEDIUM"/"HARD"
  if (typeof q.difficulty === "string") {
    q.difficulty = q.difficulty.toUpperCase();
    if (!["EASY","MEDIUM","HARD"].includes(q.difficulty)) q.difficulty = "MEDIUM";
  }
  if (!q.explanation || q.explanation.length < 60) return "explanation_short";
  const m = q.explanation.slice(0, 200).match(/(?:^|[^A-Z])(?:option\s+)?\(?([A-D])\)?\s+is\s+correct/i);
  if (m && m[1].toUpperCase() !== q.correctAnswer) return `letter_mismatch`;
  return null;
}

let inserted = 0, failed = 0, dupes = 0;
const failReasons = {};

for (const t of cfg) {
  const batches = Math.ceil(t.target / 5);
  console.log(`\n[${t.unit} | ${t.topic}] target ${t.target} in ${batches} batches`);
  for (let b = 0; b < batches; b++) {
    const ask = Math.min(5, t.target - b * 5);
    let parsed;
    try { parsed = await callGroq(`${t.instr}\n\nGenerate ${ask} questions. ${t.stim ? "Include realistic stimulus." : "stimulus=null"} JSON only.`); }
    catch (e) { console.log(`  ! ${e.message.slice(0, 100)}`); continue; }
    const arr = parsed?.questions || (Array.isArray(parsed) ? parsed : null);
    if (!arr || !arr.length) { console.log(`  batch ${b+1}: empty arr (parsed keys: ${Object.keys(parsed||{}).join(",")})`); continue; }
    let kept = 0;
    let firstErr = null;
    let firstSample = null;
    for (const q of arr) {
      if (!firstSample) firstSample = q;
      normalizeQuestion(q);
      q.course = COURSE;
      const gate = runDeterministicGates(q);
      const err = gate.ok ? null : `${gate.gate}:${(gate.reason || "").slice(0, 80)}`;
      if (err) { failed++; failReasons[err] = (failReasons[err] || 0) + 1; if (!firstErr) firstErr = err; continue; }
      const id = crypto.randomUUID();
      try {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${COURSE}::"ApCourse", ${t.unit}::"ApUnit", ${q.topic || t.topic}, ${q.difficulty || "MEDIUM"}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, ${t.stim ? q.stimulus || null : null}, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:sat-blueprint', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
        inserted++; kept++;
      } catch (e) {
        if (e.code === "23505") dupes++;
        else { failed++; if (!firstErr) firstErr = `sql:${e.code || ""}:${(e.message || "").slice(0, 100)}`; }
      }
    }
    console.log(`  batch ${b+1}: ${kept}/${arr.length}${firstErr ? ` 1st-fail=${firstErr}` : ""}${firstSample && kept===0 ? ` keys=[${Object.keys(firstSample).join(",")}] opts=${Array.isArray(firstSample.options)?firstSample.options.length:typeof firstSample.options}` : ""}`);
    await new Promise((r) => setTimeout(r, 3500));
  }
}

// Also: unapprove the 10 broken 0-option SAT_MATH Qs
if (COURSE === "SAT_MATH") {
  const broken = await sql`UPDATE questions SET "isApproved" = false WHERE course::text = 'SAT_MATH' AND "isApproved" = true AND jsonb_array_length(options) = 0 RETURNING id`;
  console.log(`\nUnapproved ${broken.length} broken 0-option SAT_MATH Qs`);
}

console.log(`\nDONE: ${inserted} inserted, ${failed} failed, ${dupes} dupes`);
if (Object.keys(failReasons).length) console.log(`Reasons:`, failReasons);
const final = await sql`SELECT COUNT(*)::int AS n FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true`;
console.log(`${COURSE} approved total: ${final[0].n}`);

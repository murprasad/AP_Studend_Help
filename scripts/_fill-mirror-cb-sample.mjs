/**
 * Mirror-fill: for each CB sample question flagged GAP or PARTIAL by audit,
 * generate questions that MIRROR the CB sample's exact format — stem
 * structure, option style, concept tested. Uses the CB sample as a few-shot
 * example to Groq.
 *
 * Goal: bring Haiku-strict COVERED % to 90%+ (vs ~30-50% with generic prompts).
 *
 * Usage:
 *   node scripts/_fill-mirror-cb-sample.mjs --audit=data/sample-coverage-2026-05-22.json --course=CLEP_BIOLOGY
 *   node scripts/_fill-mirror-cb-sample.mjs --audit=data/sample-coverage-2026-05-22.json --all-non-covered --count=4
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import crypto from "node:crypto";
import { normalizeQuestion, runDeterministicGates } from "./lib/_question-gates.mjs";
import { secondPassVerify } from "./lib/_second-pass-verifier.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COUNT = parseInt(args.count ?? "4", 10);
const COURSE_FILTER = args.course ?? null;
const ALL = !!args["all-non-covered"];

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("GROQ_API_KEY required"); process.exit(1); }
if (!args.audit) { console.error("Need --audit=<path>"); process.exit(1); }

const audit = JSON.parse(readFileSync(args.audit, "utf8"));

async function callGroq(system, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 4500,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 150)}`);
  return JSON.parse((await res.json())?.choices?.[0]?.message?.content ?? "{}");
}
function hashText(s) { return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex"); }

const isSN = (c) => c.startsWith("AP_") || c.startsWith("SAT_") || c.startsWith("ACT_") || c.startsWith("PSAT_");

async function mirrorFill(course, sampleStem, sampleOptions, suggestedTopic, count) {
  const dbUnits = await sql`SELECT DISTINCT unit::text AS unit FROM questions WHERE course::text = ${course} AND "isApproved" = true LIMIT 1`;
  if (!dbUnits.length) return { inserted: 0, failed: 0 };
  const unit = dbUnits[0].unit;
  const numOpts = isSN(course) ? 4 : (course === "CLEP_COLLEGE_MATH" || course === "CLEP_SPANISH" ? 4 : 5);

  // Find the original sample's correctAnswer from the saved file
  let sampleCorrect = null;
  try {
    const sampleData = JSON.parse(readFileSync(`data/sample-questions/${course}.json`, "utf8"));
    const match = sampleData.questions.find((q) => (q.stem || q.questionText || "").startsWith(sampleStem.slice(0, 40)));
    if (match) sampleCorrect = match.correctAnswer;
  } catch {}

  const SYSTEM = `You write exam questions that MIRROR a reference College Board sample question's exact format.

REFERENCE QUESTION (College Board ${course} sample):
Stem: "${sampleStem}"
Options:
${sampleOptions.join("\n")}
${sampleCorrect ? `Correct: ${sampleCorrect}` : ""}

TOPIC: "${suggestedTopic}"

YOUR JOB: Generate ${count} questions that test the SAME concept as the reference, with:
- Same stem structure / sentence rhythm
- Same option count (${numOpts}, A-${String.fromCharCode(64 + numOpts)})
- Same difficulty level
- Same concept depth
- VARY the specific values, names, scenarios — but keep the conceptual core

RULES:
1. Each option starts with "A) "/"B) " prefix.
2. Explanation MUST refer to the answer by VALUE not by letter label
   (e.g., "The correct answer is 8 because..." — NEVER "Letter C is correct").
   Letter-label references break when options shuffle.
3. Explanation 60-160 chars.
4. NO confession phrases, NO hints in options.

OUTPUT JSON:
{"questions":[{"questionText","options":["A) ...","B) ...","C) ...","D) ...","E) ..."],"correctAnswer","explanation","topic":"${suggestedTopic}","difficulty":"MEDIUM"}]}

Return JSON only.`;

  let parsed;
  try { parsed = await callGroq(SYSTEM, `Generate ${count} mirror questions on "${suggestedTopic}". JSON only.`); }
  catch (e) { return { inserted: 0, failed: 0, err: e.message.slice(0, 60) }; }
  const arr = parsed?.questions || [];
  if (!arr.length) return { inserted: 0, failed: 0 };

  let inserted = 0, failed = 0;
  for (const q of arr) {
    normalizeQuestion(q);
    q.course = course;
    const gate = runDeterministicGates(q);
    if (!gate.ok) { failed++; continue; }
    const verify = await secondPassVerify(q);
    if (!verify.ok) { failed++; continue; }
    const id = crypto.randomUUID();
    try {
      if (isSN(course)) {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ApCourse", ${unit}::"ApUnit", ${q.topic || suggestedTopic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:mirror-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      } else {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || suggestedTopic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:mirror-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      }
      inserted++;
    } catch (e) { if (e.code !== "23505") failed++; }
  }
  return { inserted, failed };
}

let totIns = 0, totFail = 0;
for (const [course, results] of Object.entries(audit)) {
  if (COURSE_FILTER && course !== COURSE_FILTER) continue;
  // Target both GAP and PARTIAL items — mirror generation should fix both
  const targets = results.filter((r) => r.verdict === "GAP" || (ALL && r.verdict === "PARTIAL"));
  if (targets.length === 0) continue;
  console.log(`\n══ ${course} — ${targets.length} mirror targets ══`);
  for (const t of targets) {
    if (!t.stem || !t.suggested_topic || t.suggested_topic === "—") continue;
    // Look up the original sample for this q
    let sampleQ = null;
    try {
      const sd = JSON.parse(readFileSync(`data/sample-questions/${course}.json`, "utf8"));
      sampleQ = sd.questions.find((q) => (q.stem || q.questionText || "").startsWith((t.stem || "").slice(0, 30)));
    } catch {}
    if (!sampleQ) continue;
    const r = await mirrorFill(course, sampleQ.stem || sampleQ.questionText, sampleQ.options, t.suggested_topic, COUNT);
    totIns += r.inserted; totFail += r.failed;
    console.log(`  Q${t.q} "${t.suggested_topic.slice(0, 60)}" → +${r.inserted} / ${r.failed} fail`);
    await new Promise((r) => setTimeout(r, 800));
  }
}
console.log(`\n══ TOTAL ══`);
console.log(`Inserted: ${totIns} | Failed: ${totFail}`);

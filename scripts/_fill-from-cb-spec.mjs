/**
 * Blueprint-driven gap fill — iterates a course's cb_spec topic_areas
 * (or skill_categories) and generates CB-style questions for each
 * subtopic, all in-process (no shell).
 *
 * Usage:
 *   node scripts/_fill-from-cb-spec.mjs --course=SAT_MATH --per-topic=5
 *   node scripts/_fill-from-cb-spec.mjs --courses=SAT_MATH,SAT_READING_WRITING --per-topic=4
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

const coursesArg = args.course || args.courses;
if (!coursesArg) { console.error("Usage: --course=X or --courses=X,Y,Z [--per-topic=5]"); process.exit(1); }
const courses = String(coursesArg).split(",").map((c) => c.trim());
const PER_TOPIC = parseInt(args["per-topic"] ?? "5", 10);

const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("GROQ_API_KEY required"); process.exit(1); }

async function callGroq(system, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 4500,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return JSON.parse((await res.json())?.choices?.[0]?.message?.content ?? "{}");
}
function hashText(s) { return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex"); }
const isSN = (c) => c.startsWith("AP_") || c.startsWith("SAT_") || c.startsWith("ACT_") || c.startsWith("PSAT_");

async function fillTopic(course, unit, topic, count) {
  const numOpts = isSN(course) ? 4 : (course === "CLEP_COLLEGE_MATH" || course === "CLEP_SPANISH" ? 4 : 5);
  const optLabels = numOpts === 4 ? "A-D" : "A-E";
  const family = course.startsWith("CLEP_") ? "CLEP" : course.startsWith("AP_") ? "AP" : course.startsWith("SAT_") ? "digital SAT" : course.startsWith("PSAT_") ? "PSAT" : "ACT";
  const subjectName = course.replace(/^(CLEP|AP|SAT|ACT|PSAT|DSST)_/, "").replace(/_/g, " ").toLowerCase();

  const SYSTEM = `You write ${family} ${subjectName} exam questions in College Board style.
Topic: "${topic}"

CRITICAL:
1. Stem DIRECT, CONCRETE, real-world. 8-40 words.
2. Exactly ${numOpts} options (${optLabels}). Each "A) "/"B) " prefix.
3. Explanation MUST refer to the answer by VALUE not letter. NEVER write
   "Letter X is correct" — that pattern breaks when options shuffle.
   Instead: "The answer is 8 because log₂(8)=3" or "Glucose is correct
   because plants store..."
4. Explanation 60-160 chars. NO confession phrases.
5. NO hints in options.
6. Mix difficulty: 40% EASY, 50% MEDIUM, 10% HARD.

OUTPUT JSON: {"questions":[{"questionText","options":["A) ...",...,"${numOpts===4?'D':'E'}) ..."],"correctAnswer","explanation","topic":"${topic}","difficulty":"EASY"}]}`;

  let parsed;
  try { parsed = await callGroq(SYSTEM, `Generate ${count} ${family} ${subjectName} questions on "${topic}". JSON only.`); }
  catch (e) { return { inserted: 0, failed: 0, err: e.message.slice(0, 60) }; }
  const arr = parsed?.questions || [];
  if (!arr.length) return { inserted: 0, failed: 0 };

  let inserted = 0, failed = 0, dupes = 0;
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
          VALUES (${id}, ${course}::"ApCourse", ${unit}::"ApUnit", ${q.topic || topic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:cb-spec-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      } else {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || topic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:cb-spec-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      }
      inserted++;
    } catch (e) { if (e.code === "23505") dupes++; else failed++; }
  }
  return { inserted, failed, dupes };
}

let grandTotal = 0, grandFail = 0;
for (const course of courses) {
  const specPath = `data/cb-spec/${course}.json`;
  if (!existsSync(specPath)) { console.log(`SKIP ${course} — no cb_spec`); continue; }
  const spec = JSON.parse(readFileSync(specPath, "utf8"));
  const topics = [];
  for (const [_unit, list] of Object.entries(spec.topic_areas || {})) {
    if (Array.isArray(list)) topics.push(...list);
  }
  for (const [_skill, info] of Object.entries(spec.skill_categories || {})) {
    if (info?.subskills && Array.isArray(info.subskills)) topics.push(...info.subskills);
  }
  if (topics.length === 0) { console.log(`SKIP ${course} — no topics in cb_spec`); continue; }

  // Discover one valid unit per course
  const dbUnits = await sql`SELECT DISTINCT unit::text AS unit FROM questions WHERE course::text = ${course} AND "isApproved" = true LIMIT 1`;
  if (dbUnits.length === 0) { console.log(`SKIP ${course} — no units in DB`); continue; }
  const unit = dbUnits[0].unit;

  console.log(`\n══ ${course} — ${topics.length} topics × ${PER_TOPIC} = ${topics.length * PER_TOPIC} target ══`);
  let cIns = 0, cFail = 0;
  for (const t of topics) {
    const r = await fillTopic(course, unit, t, PER_TOPIC);
    cIns += r.inserted || 0;
    cFail += r.failed || 0;
    console.log(`  "${t.slice(0, 60)}" → +${r.inserted || 0} / ${r.failed || 0} fail${r.dupes ? ` / ${r.dupes} dup` : ""}${r.err ? ` (err: ${r.err})` : ""}`);
    await new Promise((r) => setTimeout(r, 800));
  }
  grandTotal += cIns; grandFail += cFail;
  console.log(`══ ${course} subtotal: +${cIns} / ${cFail} fail ══`);
}
console.log(`\n══ GRAND TOTAL ══`);
console.log(`Inserted: ${grandTotal} | Failed (gate): ${grandFail}`);

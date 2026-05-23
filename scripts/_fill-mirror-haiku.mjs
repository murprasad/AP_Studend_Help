/**
 * Haiku-authored mirror-fill: when Groq fails gate v2 on hard topics
 * (math, lit, comp), use Haiku to author the question. Haiku has lower
 * defect rate on math/quantitative items.
 *
 * Usage:
 *   node scripts/_fill-mirror-haiku.mjs --audit=data/sample-coverage-2026-05-23.json --course=CLEP_CALCULUS --count=4
 *   node scripts/_fill-mirror-haiku.mjs --audit=data/sample-coverage-2026-05-23.json --courses=CLEP_CALCULUS,CLEP_PRECALCULUS,CLEP_COLLEGE_COMPOSITION
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import crypto from "node:crypto";
import { normalizeQuestion, runDeterministicGates } from "./lib/_question-gates.mjs";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COUNT = parseInt(args.count ?? "3", 10);
const COURSE_FILTER = args.course ?? null;
const COURSES_LIST = (args.courses ?? "").split(",").filter(Boolean);
const ALL = !!args["all-non-covered"];

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) { console.error("ANTHROPIC_API_KEY required"); process.exit(1); }
if (!args.audit) { console.error("Need --audit=<path>"); process.exit(1); }

const audit = JSON.parse(readFileSync(args.audit, "utf8"));

function hashText(s) { return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex"); }
const isSN = (c) => c.startsWith("AP_") || c.startsWith("SAT_") || c.startsWith("ACT_") || c.startsWith("PSAT_");

async function callHaiku(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      temperature: 0.5,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Haiku ${res.status}: ${(await res.text()).slice(0, 150)}`);
  const j = await res.json();
  const out = j?.content?.[0]?.text || "{}";
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) return { questions: [] };
  try { return JSON.parse(m[0]); } catch { return { questions: [] }; }
}

async function mirrorFill(course, sampleStem, sampleOptions, sampleCorrect, suggestedTopic, count) {
  const dbUnits = await sql`SELECT DISTINCT unit::text AS unit FROM questions WHERE course::text = ${course} AND "isApproved" = true LIMIT 1`;
  if (!dbUnits.length) return { inserted: 0, failed: 0 };
  const unit = dbUnits[0].unit;
  const numOpts = isSN(course) ? 4 : (course === "CLEP_COLLEGE_MATH" || course === "CLEP_SPANISH" ? 4 : 5);
  const letters = "ABCDE".slice(0, numOpts);

  const SYSTEM = `You author College Board ${course} exam questions that mirror the format and difficulty of an authentic CB sample.

REFERENCE (CB SAMPLE):
Stem: "${sampleStem}"
Options:
${sampleOptions.map((o, i) => o.startsWith(letters[i] + ")") ? o : `${letters[i]}) ${o}`).join("\n")}
${sampleCorrect ? `Answer: ${sampleCorrect}` : ""}

TOPIC: ${suggestedTopic}

GENERATE ${count} questions in the SAME format:
- ${numOpts} options labeled A-${letters[numOpts-1]}, each prefixed "X) "
- Same intellectual depth
- VARY values, scenarios — keep the conceptual core
- For math: ensure correctAnswer is mathematically valid; double-check arithmetic
- Each explanation MUST start with "Letter X is correct" where X = correctAnswer
- Explanation 80-160 chars, single sentence
- No "the answer is", no hints in options, no confessions

OUTPUT exactly:
{"questions":[{"questionText":"...","options":["A) ...","B) ...",...],"correctAnswer":"A","explanation":"Letter A is correct because ...","topic":"${suggestedTopic}","difficulty":"MEDIUM"}]}

JSON only, no markdown.`;

  let parsed;
  try { parsed = await callHaiku(SYSTEM, `Author ${count} questions on "${suggestedTopic}". Return JSON only.`); }
  catch (e) { return { inserted: 0, failed: 0, err: e.message.slice(0, 80) }; }
  const arr = parsed?.questions || [];
  if (!arr.length) return { inserted: 0, failed: 0 };

  let inserted = 0, failed = 0;
  for (const q of arr) {
    normalizeQuestion(q);
    q.course = course;
    const gate = runDeterministicGates(q);
    if (!gate.ok) { failed++; continue; }
    const id = crypto.randomUUID();
    try {
      if (isSN(course)) {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ApCourse", ${unit}::"ApUnit", ${q.topic || suggestedTopic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'claude-haiku-4-5:mirror-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      } else {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || suggestedTopic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'claude-haiku-4-5:mirror-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      }
      inserted++;
    } catch (e) { if (e.code !== "23505") failed++; }
  }
  return { inserted, failed };
}

let totIns = 0, totFail = 0;
const targetCourses = COURSES_LIST.length ? COURSES_LIST : (COURSE_FILTER ? [COURSE_FILTER] : Object.keys(audit));
for (const course of targetCourses) {
  const results = audit[course];
  if (!results) { console.log(`SKIP ${course} (no audit data)`); continue; }
  const targets = results.filter((r) => r.verdict === "GAP" || (ALL && r.verdict === "PARTIAL"));
  if (!targets.length) continue;
  console.log(`\n══ ${course} — ${targets.length} mirror targets ══`);
  for (const t of targets) {
    if (!t.stem || !t.suggested_topic || t.suggested_topic === "—") continue;
    let sampleQ = null;
    try {
      const sd = JSON.parse(readFileSync(`data/sample-questions/${course}.json`, "utf8"));
      sampleQ = sd.questions.find((q) => (q.stem || q.questionText || "").startsWith((t.stem || "").slice(0, 30)));
    } catch {}
    if (!sampleQ) continue;
    const r = await mirrorFill(course, sampleQ.stem || sampleQ.questionText, sampleQ.options, sampleQ.correctAnswer, t.suggested_topic, COUNT);
    totIns += r.inserted; totFail += r.failed;
    console.log(`  Q${t.q} "${(t.suggested_topic || "").slice(0, 60)}" → +${r.inserted} / ${r.failed} fail${r.err ? " (" + r.err + ")" : ""}`);
    await new Promise((r) => setTimeout(r, 600));
  }
}
console.log(`\n══ TOTAL ══`);
console.log(`Inserted: ${totIns} | Failed: ${totFail}`);

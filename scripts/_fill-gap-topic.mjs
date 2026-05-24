/**
 * Targeted gap-topic backfill — generates CB-style questions on a SPECIFIC
 * topic that was identified as a gap by sample-coverage-audit.
 *
 * Usage:
 *   node scripts/_fill-gap-topic.mjs --course=CLEP_BIOLOGY --topic="Meiosis outcomes and ploidy reduction" --count=6
 *   node scripts/_fill-gap-topic.mjs --from-audit=data/sample-coverage-2026-05-22.json
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

async function fillTopic(course, topic, count) {
  // Discover a valid unit for this course (preserve unit relationships)
  const dbUnits = await sql`SELECT DISTINCT unit::text AS unit FROM questions WHERE course::text = ${course} AND "isApproved" = true LIMIT 1`;
  if (dbUnits.length === 0) { console.log(`SKIP ${course}/${topic} — no units in DB`); return { inserted: 0, failed: 0 }; }
  const unit = dbUnits[0].unit;

  const numOpts = isSN(course) ? 4 : (course === "CLEP_COLLEGE_MATH" || course === "CLEP_SPANISH" ? 4 : 5);
  const optLabels = numOpts === 4 ? "A-D" : "A-E";
  const family = course.startsWith("CLEP_") ? "CLEP" : course.startsWith("AP_") ? "AP" : course.startsWith("SAT_") ? "digital SAT" : "ACT";

  const subjectName = course.replace(/^(CLEP|AP|SAT|ACT|PSAT|DSST)_/, "").replace(/_/g, " ").toLowerCase();

  const SYSTEM = `You write ${family} ${subjectName} exam questions in the exact style of College Board sample questions for this exam.

Topic to test: "${topic}"

CRITICAL CONSTRAINTS (College Board style):
1. Stem is DIRECT and CONCRETE. Real-world examples preferred ("Coal and oil...", "A researcher randomly assigns...", "After conditioning..."). Avoid overly abstract or graduate-level wording.
2. Stem length: 8-40 words (CB style — concise).
3. Exactly ${numOpts} options (${optLabels}). Each starts with "A) " prefix.
4. Options test the SAME concept, are short and parallel.
5. Explanation MUST refer to the answer by VALUE not letter. NEVER write
   "Letter X is correct" — that pattern breaks when options shuffle.
   Instead: "The answer is 8 because log₂(8)=3" or "Glucose is correct
   because plants store..."
6. Explanation 60-160 chars. Explains the CONCEPT, not just restating the answer.
7. NO confession phrases ("closest match", "given the options", "miscalculation").
8. NO hints/explanations leaked into options.
9. Mix difficulty: 40% EASY (recognition / definition / direct concept), 50% MEDIUM (apply concept), 10% HARD.
10. Foundation-level. Test what CB ACTUALLY ASKS: define terms, recognize concepts, match scientists/theories, identify processes — not just complex applications.

OUTPUT JSON:
{"questions":[{"questionText":"", "options":["A) ...", ..., "${numOpts === 4 ? 'D' : 'E'}) ..."], "correctAnswer":"A", "explanation":"<refer to answer by value, not by letter>", "topic":"${topic}", "difficulty":"EASY"}, ...]}

Return JSON only.`;

  const userPrompt = `Generate ${count} ${family} ${subjectName} questions specifically on: "${topic}". Use CB question style. JSON only.`;
  let parsed;
  try { parsed = await callGroq(SYSTEM, userPrompt); }
  catch (e) { console.log(`  ! Groq error: ${e.message.slice(0, 80)}`); return { inserted: 0, failed: 0 }; }
  const arr = parsed?.questions || (Array.isArray(parsed) ? parsed : []);
  if (!arr.length) { console.log(`  ! no questions in response`); return { inserted: 0, failed: 0 }; }

  let inserted = 0, failed = 0, dupes = 0;
  const failReasons = {};
  for (const q of arr) {
    normalizeQuestion(q);
    q.course = course;
    const gate = runDeterministicGates(q);
    if (!gate.ok) {
      failed++;
      failReasons[gate.gate] = (failReasons[gate.gate] || 0) + 1;
      continue;
    }
    const verify = await secondPassVerify(q);
    if (!verify.ok) {
      failed++;
      failReasons["second-pass-llm"] = (failReasons["second-pass-llm"] || 0) + 1;
      continue;
    }
    const id = crypto.randomUUID();
    try {
      if (isSN(course)) {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ApCourse", ${unit}::"ApUnit", ${q.topic || topic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:gap-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      } else {
        await sql`INSERT INTO questions (id, course, unit, topic, difficulty, "questionType", "questionText", stimulus, options, "correctAnswer", explanation, "isAiGenerated", "isApproved", "pipelineVetted", "auditPassed", "modelUsed", "generatedForTier", "contentHash", "timesAnswered", "timesCorrect", "reportedCount", "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ExamCourse", ${unit}::"ExamUnit", ${q.topic || topic}, ${q.difficulty}::"Difficulty", 'MCQ'::"QuestionType", ${q.questionText}, NULL, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation}, true, true, false, false, 'llama-3.3-70b-versatile:gap-fill', 'FREE'::"SubTier", ${hashText(q.questionText)}, 0, 0, 0, NOW(), NOW())`;
      }
      inserted++;
    } catch (e) {
      if (e.code === "23505") dupes++;
      else { failed++; }
    }
  }
  console.log(`  ${course} "${topic.slice(0, 50)}" → +${inserted} / ${failed} fail / ${dupes} dup`);
  return { inserted, failed, dupes, failReasons };
}

if (args["from-audit"]) {
  const auditPath = args["from-audit"];
  if (!existsSync(auditPath)) { console.error("audit file not found"); process.exit(1); }
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  const countPerGap = parseInt(args["count"] ?? "6", 10);
  let totIns = 0, totFail = 0;
  for (const [course, results] of Object.entries(audit)) {
    const gaps = results.filter((r) => r.verdict === "GAP" && r.suggested_topic !== "—");
    console.log(`\n══ ${course} — ${gaps.length} gaps to fill ══`);
    for (const g of gaps) {
      const r = await fillTopic(course, g.suggested_topic, countPerGap);
      totIns += r.inserted; totFail += r.failed;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  console.log(`\n══ TOTAL ══`);
  console.log(`Inserted: ${totIns} | Failed: ${totFail}`);
} else if (args.course && args.topic) {
  const r = await fillTopic(args.course, args.topic, parseInt(args.count ?? "6", 10));
  console.log(JSON.stringify(r, null, 2));
} else {
  console.error("Usage: --from-audit=<json> [--count=6]  OR  --course=X --topic=Y --count=N");
}

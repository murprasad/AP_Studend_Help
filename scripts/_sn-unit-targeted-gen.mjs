/**
 * SN unit-targeted gen for under-represented units flagged by CB-fidelity audit.
 *
 * Today's audit findings (2026-05-19):
 *  - ACT_ENGLISH Conventions: 4% of bank vs CB 40.5% — LARGEST gap in SN
 *  - ACT_MATH unit imbalance: Algebra 58.7% vs CB 18.5% (over);
 *    Geometry/Trig/Data correspondingly under-represented
 *
 * Run:
 *   node scripts/_sn-unit-targeted-gen.mjs --plan
 */
import "dotenv/config";
import crypto from "node:crypto";
import { normalizeQuestion, runDeterministicGates } from "./lib/_question-gates.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  if (a === "--dry") return ["dry", true];
  if (a === "--plan") return ["plan", true];
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));

const PLAN = !!args.plan;
const DRY = !!args.dry;

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const REBALANCE_PLAN = [
  { course: "ACT_ENGLISH", unit: "ACT_ENG_3_CONVENTIONS", count: 250, options: 4 },
  { course: "ACT_MATH", unit: "ACT_MATH_3_GEOMETRY", count: 50, options: 4 },
  { course: "ACT_MATH", unit: "ACT_MATH_4_DATA_PROBABILITY", count: 40, options: 4 },
];

const key = process.env.GROQ_API_KEY;
if (!key) { console.error("GROQ_API_KEY required"); process.exit(1); }

function contentHashOf(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

async function generateOne(course, unit, optCount) {
  const allowedLetters = optCount === 5 ? "ABCDE" : "ABCD";
  const optTemplate = optCount === 5
    ? `["...", "...", "...", "...", "..."]`
    : `["...", "...", "...", "..."]`;
  const unitLabel = unit.replace(/^[A-Z_]+\d+_/, "").replace(/_/g, " ").toLowerCase();
  const courseLabel = course.replace(/_/g, " ");
  const examNote = course.startsWith("ACT_")
    ? "ACT exam (redesigned 2025-2026, 4 options per question)"
    : course.startsWith("SAT_")
      ? "Digital SAT (adaptive, 4 options)"
      : "AP exam";
  const styleNote = unit === "ACT_ENG_3_CONVENTIONS"
    ? `The question MUST test sentence-level Conventions — punctuation (commas, semicolons, dashes, colons), agreement (subject-verb, pronoun, modifier), verb tense, sentence boundaries, possessives, or parallel structure. Real ACT English Conventions format: short passage with an underlined portion + the question asks which alternative is grammatically correct, including "NO CHANGE" as one option in some cases.`
    : `The question MUST test ${unitLabel}, not adjacent units.`;

  const prompt = `Write ONE original ${examNote} multiple-choice question for ${courseLabel}, UNIT: ${unitLabel}.

${styleNote}

Requirements:
- Stem self-contained (include all needed context).
- EXACTLY ${optCount} options.
- Options must be BARE answer values — NO leading "A)" / "B)" prefix; the UI adds the letter label.
- Exactly one correct answer.
- Distractors must represent specific student misconceptions.
- High-school-level rigor for college-bound students.

Reply with JSON only:
{
  "questionText": "the question stem (may include a short underlined-portion passage for ACT English)",
  "options": ${optTemplate},
  "correctAnswer": "${allowedLetters.split("").join('" | "')}",
  "explanation": "200-400 chars explanation helping a student learn from a wrong answer",
  "topic": "<3-4 word topic within ${unitLabel}>",
  "skill": "<one-word skill>"
}`;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 900,
      temperature: 0.5,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(text);
  if (!parsed.questionText || !Array.isArray(parsed.options) || parsed.options.length !== optCount) {
    throw new Error("malformed");
  }
  if (!/^[A-E]$/.test(parsed.correctAnswer)) throw new Error("bad letter");
  const idx = parsed.correctAnswer.charCodeAt(0) - 65;
  if (idx >= parsed.options.length) throw new Error("letter out of range");
  return parsed;
}

async function generateForCourseUnit({ course, unit, count, options }) {
  console.log(`\n=== ${course} / ${unit} → target ${count} new Qs, ${options} options ===`);
  let ok = 0, fail = 0, dup = 0;
  const start = Date.now();
  for (let i = 0; i < count * 2 && ok < count; i++) {
    try {
      const q = await generateOne(course, unit, options);
      // Unified gate stack — same as PL/runtime. Reject before INSERT.
      const candidate = { ...q, course };
      normalizeQuestion(candidate);
      const gate = runDeterministicGates(candidate);
      if (!gate.ok) {
        fail++;
        if (fail <= 3) console.warn(`  [gate] ${gate.gate}: ${gate.reason?.slice(0, 100)}`);
        continue;
      }
      const hash = contentHashOf(q.questionText);
      if (DRY) { console.log(`  [dry] ${q.questionText.slice(0, 80)}…`); ok++; continue; }
      const id = crypto.randomUUID();
      try {
        await sql`
          INSERT INTO questions (id, course, unit, topic, "questionText", options, "correctAnswer", explanation, "isApproved", "modelUsed", "contentHash", "questionType", difficulty, "createdAt", "updatedAt")
          VALUES (${id}, ${course}::"ApCourse", ${unit}::"ApUnit", ${q.topic || unit}, ${q.questionText}, ${JSON.stringify(q.options)}::jsonb, ${q.correctAnswer}, ${q.explanation || ""}, true, ${"sn-rebalance-2026-05-19:groq-llama-3.3-70b"}, ${hash}, ${"MCQ"}::"QuestionType", ${"MEDIUM"}::"Difficulty", NOW(), NOW())
        `;
        ok++;
      } catch (e) {
        if (/P2002|unique|duplicate/i.test(e.message)) {
          dup++;
        } else {
          fail++;
          console.error(`  insert fail: ${e.message.slice(0, 100)}`);
        }
      }
    } catch (e) {
      fail++;
      if (fail <= 3) console.error(`  gen fail: ${e.message.slice(0, 100)}`);
    }
    if ((i+1) % 10 === 0) {
      const secs = Math.round((Date.now() - start) / 1000);
      console.log(`  [${i+1}] ok=${ok} dup=${dup} fail=${fail} t=${secs}s`);
    }
  }
  console.log(`  ${course}/${unit} DONE: ok=${ok}, dup=${dup}, fail=${fail}`);
  return { course, unit, ok, dup, fail };
}

if (PLAN) {
  console.log("Running SN rebalance plan…");
  const results = [];
  for (const job of REBALANCE_PLAN) {
    const r = await generateForCourseUnit(job);
    results.push(r);
  }
  console.log("\n=== SUMMARY ===");
  for (const r of results) console.log(`  ${r.course} / ${r.unit}: ok=${r.ok} dup=${r.dup} fail=${r.fail}`);
} else {
  if (!args.course || !args.unit || !args.count) {
    console.error("usage: --course=X --unit=Y --count=N [--options=4]  OR  --plan");
    process.exit(1);
  }
  await generateForCourseUnit({
    course: args.course, unit: args.unit, count: parseInt(args.count, 10), options: parseInt(args.options || "4", 10),
  });
}

// CED-anchored AP gap-filler. Takes (course, unit, topic list, target count),
// generates MCQs grounded in the official CB CED topics, inserts into DB.
//
// Topic list MUST come from the actual CED PDF — pass via --topics-file.
// Each line of the file is one topic e.g. "7.1 Introduction to Equilibrium".
//
// Usage:
//   node scripts/ced-anchored-gap-filler.mjs \
//     --course=AP_CHEMISTRY \
//     --unit=CHEM_7_EQUILIBRIUM \
//     --target=30 \
//     --topics-file=/tmp/chem-unit7-topics.txt \
//     [--difficulty=Medium] [--source=ap-chem-equilibrium-2024-ced]
//
// Reversible — every generated question gets a modelUsed marker so we can
// undo the entire gap-fill batch if quality is poor.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";

const sql = neon(process.env.DATABASE_URL);
const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const args = Object.fromEntries(
  process.argv.slice(2).map(a => a.replace(/^--/, "").split("="))
);
const COURSE = args.course;
const UNIT = args.unit;
const TARGET = parseInt(args.target ?? "30", 10);
const DIFFICULTY = (args.difficulty ?? "MEDIUM").toUpperCase();
const TOPICS_FILE = args["topics-file"];
const SOURCE_MARKER = args.source ?? `ced-gap-fill-${Date.now()}`;
const COURSE_DESC = args["course-desc"] ?? `College Board AP exam`;

if (!COURSE || !UNIT || !TOPICS_FILE) {
  console.error("Required: --course --unit --topics-file. See header.");
  process.exit(1);
}

// Topics file may include lines in the form "[UNIT_ID] topic text" to override
// the default --unit on a per-line basis (used when generating across multiple
// units of the same course in one run).
const TOPIC_LINES = fs.readFileSync(TOPICS_FILE, "utf8").split("\n").map(l => l.trim()).filter(Boolean);
const TOPICS = TOPIC_LINES.map(line => {
  const m = line.match(/^\[([A-Z][A-Z0-9_]+)\]\s+(.*)$/);
  if (m) return { unit: m[1], topic: m[2] };
  return { unit: UNIT, topic: line };
});
console.log(`Course=${COURSE} BaseUnit=${UNIT} Target=${TARGET} TopicLines=${TOPICS.length}`);

async function callGroq(prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `You write authentic ${COURSE_DESC}-quality MCQs. Output strict JSON only.` },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "{}";
}

function buildPrompt(topicObj) {
  // Beta 9.6 bugfix (2026-04-30): topicObj is {unit, topic}; previously
  // we templated ${topic} which rendered as "[object Object]" → Groq
  // got no topic constraint and produced off-topic generic Physics Qs.
  const topicStr = typeof topicObj === "string" ? topicObj : topicObj?.topic ?? "";
  return `Generate ONE College Board ${COURSE_DESC}-style multiple-choice question on this exact topic from the official CB Course and Exam Description:

  TOPIC: ${topicStr}

CB-quality requirements:
- 4 answer options (A, B, C, D), exactly one correct
- All 4 options PLAUSIBLE — distractors should reflect common student misconceptions, not absurd values
- If the topic involves data/calculation, give ALL needed values; do NOT require external lookups
- Stimulus (if present) must provide EVIDENCE — student must SYNTHESIZE/INFER, not word-spot
- College-readiness reading level
- Difficulty: ${DIFFICULTY}

Return JSON:
{
  "questionText": "...",
  "stimulus": "..." or null,
  "options": ["...", "...", "...", "..."],
  "correctAnswer": "A" | "B" | "C" | "D",
  "explanation": "1-3 sentences why correct + why each distractor is tempting but wrong"
}`;
}

async function insertQuestion(q, topicObj) {
  const id = randomUUID();
  const now = new Date();
  const normalized = q.questionText.toLowerCase().replace(/\s+/g, " ").trim();
  const contentHash = createHash("sha256").update(normalized).digest("hex");

  const dup = await sql`SELECT id FROM questions WHERE "contentHash"=${contentHash} LIMIT 1`;
  if (dup.length > 0) return { duplicate: true };

  const optionsJson = JSON.stringify(q.options);
  const model = `groq/llama-3.3-70b-versatile|${SOURCE_MARKER}`;
  // Beta 9.6 bugfix (2026-04-30): use the per-line unit from the topic
  // object, not the base --unit arg. With multi-unit topic files (lines
  // prefixed [PHYC_M_X_NAME]), every Q was previously stored under the
  // base unit, breaking unit-targeted diagnostic + analytics.
  const unit = typeof topicObj === "string" ? UNIT : (topicObj?.unit ?? UNIT);
  const topicText = typeof topicObj === "string" ? topicObj : (topicObj?.topic ?? "");
  try {
    await sql`
      INSERT INTO questions (
        id, course, unit, topic, difficulty, "questionType",
        "questionText", stimulus, options, "correctAnswer", explanation,
        "isAiGenerated", "isApproved", "modelUsed", "generatedForTier",
        "contentHash", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${COURSE}::"ApCourse", ${unit}::"ApUnit", ${topicText}, ${DIFFICULTY}::"Difficulty", 'MCQ',
        ${q.questionText}, ${q.stimulus ?? null}, ${optionsJson}::jsonb, ${q.correctAnswer}, ${q.explanation},
        true, true, ${model}, 'PREMIUM',
        ${contentHash}, ${now.toISOString()}, ${now.toISOString()}
      )
    `;
    return { saved: true };
  } catch (e) {
    if (String(e.code) === "23505") return { duplicate: true };
    return { error: e.message };
  }
}

let added = 0, skipped = 0, errored = 0;
let topicIdx = 0;
while (added < TARGET) {
  const topic = TOPICS[topicIdx % TOPICS.length];
  topicIdx++;
  if (topicIdx > TOPICS.length * 15) break; // safety stop — allows ~15 attempts per topic for thin topic lists

  try {
    const raw = await callGroq(buildPrompt(topic));
    const q = JSON.parse(raw);
    if (!q.questionText || !Array.isArray(q.options) || q.options.length !== 4 || !q.correctAnswer) {
      errored++;
      continue;
    }
    const r = await insertQuestion(q, topic);
    if (r.saved) {
      added++;
      if (added <= 3 || added % 10 === 0) {
        console.log(`  [${added}/${TARGET}] ${topic.slice(0,40)}: ${q.questionText.slice(0,70)}…`);
      }
    } else if (r.duplicate) {
      skipped++;
    } else {
      errored++;
    }
  } catch (e) {
    errored++;
  }
  await new Promise(r => setTimeout(r, 1500));
}

console.log(`\nDone — added ${added}, skipped ${skipped}, errored ${errored}, marker=${SOURCE_MARKER}`);

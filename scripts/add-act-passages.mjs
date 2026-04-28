// Generate passages for ACT_READING and ACT_ENGLISH where 95-98% of
// approved questions reference a passage they don't have.
//
// Real ACT Reading: 4 passages × 10 Qs each (Prose Fiction, Social
// Science, Humanities, Natural Science).
// Real ACT English: 5 short passages × 15 Qs each (rhetorical + grammar).
//
// Each generated passage = 200-400 words, attribution "Adapted from..."
// matching real CB-style attribution. Passage type chosen to match the
// question stem's topic.
//
// Idempotent — uses modelUsed marker "act-passage-2026-04-28".
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "act-passage-2026-04-28";
const PACE_MS = 2200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const courseArg = args.find(a => a.startsWith("--course="))?.split("=")[1] ?? "ACT_READING";
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const PROMPTS = {
  ACT_READING: (q) => `Generate an ACT Reading passage (250-400 words) that this question can be answered from.

Question: ${q.questionText}
Options: ${(typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((o,i)=>String.fromCharCode(65+i)+") "+o).join(" | ")}
Correct: ${q.correctAnswer}

ACT Reading passage genres: Prose Fiction OR Literary Narrative OR Social Science OR Humanities OR Natural Science.
- Pick the genre that matches the question's topic
- Include a 1-line attribution at the top: "Adapted from [book/article title] by [author] (year)"
- Passage is self-contained
- Supports the correct answer through INFERENCE — do NOT state the answer verbatim
- College-readiness reading level
- Use proper paragraphs (3-5 paragraphs)

Return JSON: {"passage": "..."}`,

  ACT_ENGLISH: (q) => `Generate an ACT English passage (150-250 words) for this rhetorical or grammar question.

Question: ${q.questionText}
Options: ${(typeof q.options === "string" ? JSON.parse(q.options) : q.options).map((o,i)=>String.fromCharCode(65+i)+") "+o).join(" | ")}
Correct: ${q.correctAnswer}

ACT English passage style:
- Magazine-style or first-person essay tone
- Topic appropriate to question (history, science, personal, cultural)
- Include underlined portions where the question references "the underlined word/phrase" — wrap in __double-underscores__
- 2-3 paragraphs, college-readiness level
- Self-contained — supports the question without giving away the answer

Return JSON: {"passage": "..."}`,
};

async function genPassage(q, course) {
  const prompt = PROMPTS[course](q);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: `You write authentic ACT-style passages. Genres feel like real published material — clear narrative voice, proper paragraphs, attribution on top.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.5, max_tokens: 600, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}").passage;
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
  FROM questions
  WHERE course = ${courseArg}::"ApCourse"
    AND "isApproved" = true
    AND "questionType" = 'MCQ'
    AND (stimulus IS NULL OR LENGTH(stimulus) < 100)
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
  ORDER BY RANDOM()
  LIMIT ${LIMIT === Infinity ? 250 : LIMIT}
`;

console.log(`${courseArg} passage backfill: ${rows.length} candidates`);

let added = 0, errors = 0, invalid = 0;

for (const r of rows) {
  if (dry) { console.log(`  [DRY] ${r.id.slice(0,8)}`); continue; }
  try {
    const passage = await genPassage(r, courseArg);
    if (!passage || passage.length < 100) {
      invalid++;
      continue;
    }
    await sql`
      UPDATE questions
      SET stimulus = ${passage},
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    added++;
    if (added <= 3 || added % 25 === 0) {
      console.log(`  ✓ [${added}] ${r.id.slice(0, 8)}: ${passage.slice(0, 80)}…`);
    }
  } catch (e) {
    errors++;
  }
  await sleep(PACE_MS);
}

console.log(`\nAdded: ${added} | Invalid: ${invalid} | Errors: ${errors}`);

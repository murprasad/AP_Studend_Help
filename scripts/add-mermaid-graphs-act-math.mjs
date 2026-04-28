// Add Mermaid xychart-beta to ACT_MATH questions whose stim/Q references
// graphs, functions, or geometry but has no visual.
//
// Same approach as add-mermaid-graphs-sat-math.mjs but tuned for ACT
// Math (5-choice A-E, broader topic mix including geometry).
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "act-math-mermaid-2026-04-28";
const PACE_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : 200;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function genGraph(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const prompt = `Generate a Mermaid xychart-beta diagram for this ACT Math question.

Stim: ${q.stimulus}
Question: ${q.questionText}
Options: ${opts.map((o, i) => String.fromCharCode(65 + i) + ") " + o).join(" | ")}

Requirements:
- xychart-beta syntax
- title (short, descriptive)
- x-axis with 6-8 sample points or labels
- y-axis with appropriate range
- 'line' or 'bar' series with realistic values

Return JSON only: {"mermaid": "<mermaid code, NO triple backticks>"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You generate clean Mermaid xychart-beta code for math questions. Keep it minimal and valid." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, max_tokens: 350, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}").mermaid;
}

function validateMermaid(code) {
  if (!code) return false;
  const trimmed = code.trim();
  if (!trimmed.startsWith("xychart-beta")) return false;
  if (!/x-axis/i.test(trimmed)) return false;
  if (!/y-axis/i.test(trimmed)) return false;
  if (!/(line|bar)\s*\[/i.test(trimmed)) return false;
  const opens = (trimmed.match(/\[/g) ?? []).length;
  const closes = (trimmed.match(/\]/g) ?? []).length;
  return opens === closes;
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options
  FROM questions
  WHERE course = 'ACT_MATH'::"ApCourse"
    AND "isApproved" = true
    AND "stimulusImageUrl" IS NULL
    AND stimulus NOT LIKE '%mermaid%'
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    AND (
      "questionText" ILIKE '%graph%' OR "questionText" ILIKE '%function%' OR
      "questionText" ILIKE '%line%' OR "questionText" ILIKE '%slope%' OR
      "questionText" ILIKE '%coordinate%' OR
      stimulus ILIKE '%y =%' OR stimulus ILIKE '%f(x)%' OR
      stimulus ILIKE '%triangle%' OR stimulus ILIKE '%circle%'
    )
  ORDER BY RANDOM()
  LIMIT ${LIMIT}
`;

console.log(`Targeting ${rows.length} ACT_MATH questions for Mermaid graph injection`);

let added = 0, errors = 0, invalid = 0;

for (const r of rows) {
  if (dry) { console.log(`  [DRY] ${r.id.slice(0, 8)}`); continue; }
  try {
    const mermaid = await genGraph(r);
    if (!validateMermaid(mermaid)) {
      invalid++;
      continue;
    }
    const newStim = "```mermaid\n" + mermaid.trim() + "\n```\n\n" + (r.stimulus ?? "");
    await sql`
      UPDATE questions
      SET stimulus = ${newStim},
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    added++;
    if (added <= 3 || added % 25 === 0) {
      console.log(`  ✓ [${added}] ${r.id.slice(0, 8)}: ${mermaid.slice(0, 70).replace(/\n/g, " | ")}`);
    }
  } catch (e) {
    errors++;
  }
  await sleep(PACE_MS);
}

console.log(`\nAdded: ${added} | Invalid: ${invalid} | Errors: ${errors}`);

// Add Mermaid xychart-beta to SAT_MATH questions whose stim/Q references
// "the graph shows" / "the graph of" / scatterplot but has no visual.
//
// Strategy:
//   1. Find candidates where Q text says "the graph" + stim has a function
//      definition (y = ...) OR data points.
//   2. Ask Groq to extract the function/data and emit a Mermaid xychart-beta.
//   3. Validate: chart must start with "xychart-beta", have title + x-axis +
//      y-axis + line/bar.
//   4. Prepend to stimulus as ```mermaid ... ``` block.
//
// Idempotent — uses modelUsed marker "mermaid-graph-added-2026-04-28".
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "mermaid-graph-added-2026-04-28";
const PACE_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function genGraph(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const prompt = `Generate a Mermaid xychart-beta diagram for this SAT Math question. The student needs to see a graph to answer.

Question stim: ${q.stimulus}
Question: ${q.questionText}
Options: ${opts.map((o, i) => String.fromCharCode(65 + i) + ") " + o).join(" | ")}

Extract the function or data from the stim. Generate a Mermaid xychart-beta that visualizes it clearly:
- Use xychart-beta syntax
- Include a title (short, descriptive)
- Define x-axis range with appropriate labels
- Define y-axis range
- Use 'line' or 'bar' for the data series
- Pick 6-10 sample points if function is continuous
- Keep total < 12 lines

Example format:
xychart-beta
  title "Graph of y = 2x + 1"
  x-axis [0, 1, 2, 3, 4, 5]
  y-axis "y" 0 --> 12
  line [1, 3, 5, 7, 9, 11]

Return JSON only: {"mermaid": "<mermaid code, NO triple backticks>"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You generate clean Mermaid xychart-beta code for SAT Math questions. Keep the syntax minimal and valid." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, max_tokens: 350, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const out = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
  return out.mermaid;
}

function validateMermaid(code) {
  if (!code) return false;
  const trimmed = code.trim();
  if (!trimmed.startsWith("xychart-beta")) return false;
  if (!/x-axis/i.test(trimmed)) return false;
  if (!/y-axis/i.test(trimmed)) return false;
  if (!/(line|bar)\s*\[/i.test(trimmed)) return false;
  // Balanced [] and basic syntax checks
  const opens = (trimmed.match(/\[/g) ?? []).length;
  const closes = (trimmed.match(/\]/g) ?? []).length;
  if (opens !== closes) return false;
  return true;
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options
  FROM questions
  WHERE course = 'SAT_MATH'::"ApCourse"
    AND "isApproved" = true
    AND "stimulusImageUrl" IS NULL
    AND stimulus NOT LIKE '%mermaid%'
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    AND (
      "questionText" ILIKE '%the graph %' OR "questionText" ILIKE '%graph of%' OR
      "questionText" ILIKE '%scatterplot%' OR "questionText" ILIKE '%shown%' OR
      "questionText" ILIKE '%function%' OR "questionText" ILIKE '%line%' OR
      "questionText" ILIKE '%slope%' OR "questionText" ILIKE '%y-intercept%' OR
      stimulus ILIKE '%y =%' OR stimulus ILIKE '%f(x)%' OR
      stimulus LIKE '%=%x%' OR stimulus ILIKE '%inequality%'
    )
  ORDER BY RANDOM()
  LIMIT ${LIMIT === Infinity ? 200 : LIMIT}
`;

console.log(`Targeting ${rows.length} SAT_MATH questions for Mermaid graph injection`);

let added = 0, errors = 0, invalid = 0;
const samples = [];

for (const r of rows) {
  if (dry) {
    if (samples.length < 3) {
      console.log(`  [DRY] ${r.id.slice(0, 8)}: ${r.questionText.slice(0, 80)}…`);
      samples.push({ id: r.id });
    }
    continue;
  }

  try {
    const mermaid = await genGraph(r);
    if (!validateMermaid(mermaid)) {
      invalid++;
      if (invalid <= 3) console.log(`  ✗ invalid mermaid for ${r.id.slice(0, 8)}: ${mermaid?.slice(0, 80)}`);
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
    if (added <= 3 || added % 20 === 0) {
      console.log(`  ✓ [${added}] ${r.id.slice(0, 8)}: ${mermaid.slice(0, 80).replace(/\n/g, " | ")}…`);
    }
  } catch (e) {
    errors++;
    if (errors <= 3) console.error(`  ✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\nAdded: ${added} | Invalid: ${invalid} | Errors: ${errors}`);

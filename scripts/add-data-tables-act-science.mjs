// Add markdown data tables to ACT_SCIENCE questions whose stim describes
// an experiment but has no actual data table.
//
// ACT Science is 60%+ data-table-dependent on the real test. Students
// expect to see Tables 1, 2, 3 of experimental data. Without them, the
// "Science" experience falls flat.
//
// Strategy: ask Groq to read the stim's experiment description and
// generate plausible markdown data tables (1-3 tables, 3-6 rows each)
// that the question is asking about.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "act-sci-data-table-2026-04-28";
const PACE_MS = 2200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function genTable(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const prompt = `You are writing data tables for an ACT Science question. The student needs to see the experimental data referenced in the stim.

Current stim: ${q.stimulus}
Question: ${q.questionText}
Options: ${opts.map((o, i) => String.fromCharCode(65 + i) + ") " + o).join(" | ")}
Correct answer: ${q.correctAnswer}

Generate 1-2 markdown data tables that:
- Use realistic experimental values consistent with the scenario
- Match the table count + variable structure implied by the stim
- Have 4-6 data rows each
- Use units in column headers (°C, mL, kg, etc.)
- Support the correct answer through pattern recognition (NOT by stating it verbatim)
- Are pure markdown tables (| col | col |\\n|---|---|\\n| val | val |)

Format response as JSON: {"tables": "<markdown tables, separated by \\n\\n>"}

Example tables format:
**Table 1: Reaction rate vs temperature**
| Temperature (°C) | Rate (mol/s) |
|---|---|
| 25 | 0.012 |
| 35 | 0.024 |
| 45 | 0.048 |
| 55 | 0.096 |`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You generate realistic ACT Science data tables in markdown. Use plausible experimental values, units in headers, 4-6 data rows. Never state the answer verbatim — only the underlying data pattern." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4, max_tokens: 500, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}").tables;
}

function validateTable(md) {
  if (!md) return false;
  // Must have a markdown table separator |---|
  if (!/^\|.*\|$/m.test(md)) return false;
  if (!/\|\s*-+\s*\|/.test(md)) return false;
  // At least 3 data rows
  const rows = md.split("\n").filter(l => l.startsWith("|") && !l.match(/^\|\s*-+\s*\|/));
  return rows.length >= 4; // header + at least 3 data rows
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
  FROM questions
  WHERE course = 'ACT_SCIENCE'::"ApCourse"
    AND "isApproved" = true
    AND "stimulusImageUrl" IS NULL
    AND stimulus NOT LIKE '%mermaid%'
    AND stimulus NOT LIKE '%|%|%|%'
    AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
    AND (
      stimulus ILIKE '%experiment%' OR stimulus ILIKE '%trial%' OR stimulus ILIKE '%measure%'
      OR stimulus ILIKE '%sample%' OR stimulus ILIKE '%solution%' OR stimulus ILIKE '%data%'
      OR stimulus ILIKE '%temperature%' OR stimulus ILIKE '%concentration%' OR stimulus ILIKE '%rate%'
      OR stimulus ILIKE '%time%' OR stimulus ILIKE '%speed%'
    )
  ORDER BY RANDOM()
  LIMIT ${LIMIT === Infinity ? 200 : LIMIT}
`;

console.log(`Targeting ${rows.length} ACT_SCIENCE questions for data-table injection`);

let added = 0, errors = 0, invalid = 0;

for (const r of rows) {
  if (dry) {
    console.log(`  [DRY] ${r.id.slice(0, 8)}: ${r.questionText.slice(0, 80)}…`);
    continue;
  }
  try {
    const tables = await genTable(r);
    if (!validateTable(tables)) {
      invalid++;
      if (invalid <= 3) console.log(`  ✗ invalid table for ${r.id.slice(0, 8)}: ${tables?.slice(0, 80)}`);
      continue;
    }
    const newStim = (r.stimulus ?? "") + "\n\n" + tables;
    await sql`
      UPDATE questions
      SET stimulus = ${newStim},
          "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
    added++;
    if (added <= 3 || added % 20 === 0) {
      console.log(`  ✓ [${added}] ${r.id.slice(0, 8)}: ${tables.slice(0, 80).replace(/\n/g, " | ")}…`);
    }
  } catch (e) {
    errors++;
    if (errors <= 3) console.error(`  ✗ ${r.id.slice(0, 8)}: ${e.message?.slice(0, 80)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\nAdded: ${added} | Invalid: ${invalid} | Errors: ${errors}`);

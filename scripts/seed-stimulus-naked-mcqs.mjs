#!/usr/bin/env node
/**
 * Fix 2 (P0) per CB audit — USGov/HuGeo/APES MCQs are 99-100% naked recall stems
 * despite real CB exams in those 3 courses being 100% data-grounded
 * (graphs, tables, case studies, founding-doc excerpts).
 *
 * For each approved MCQ in those courses with stimulus IS NULL, ask Groq to
 * generate a CB-style stimulus (course-specific):
 *   - USGov: founding-doc excerpt, Pew/Gallup-style polling table, SCOTUS case summary, scenario
 *   - HuGeo: choropleth-map description, population-pyramid markdown table, von Thünen ring case study
 *   - APES: data table with Mean ± SE, ecosystem case study, environmental-impact figure description
 *
 * The new stimulus must be CONSISTENT with the existing correct answer.
 * Validator gate: LENGTH(stimulus) >= 80 AND stimulus IS NOT NULL.
 *
 * Idempotent — re-running skips MCQs that already have non-null stimulus.
 *
 * Usage:
 *   node scripts/seed-stimulus-naked-mcqs.mjs --dry --limit 5 AP_US_GOVERNMENT
 *   node scripts/seed-stimulus-naked-mcqs.mjs --limit 50           # all 3 courses
 *   node scripts/seed-stimulus-naked-mcqs.mjs                       # full sweep
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const TARGET_COURSES = ["AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY", "AP_ENVIRONMENTAL_SCIENCE"];

const STIMULUS_GUIDANCE = {
  AP_US_GOVERNMENT: `Choose ONE format that fits the question:
- Founding document excerpt (Federalist 10/51, Brutus I, Letter from Birmingham Jail, Declaration of Independence, Constitution clause). Format: "Source: [Author], [Document], [Year]\\n\\n\\"[Quoted excerpt 80-150 words]\\""
- 2-column polling/data table. Format: "Source: [Pew/Gallup/Census], [Year]\\n\\n| Group | Percentage |\\n|---|---|\\n| ... | ... |"
- SCOTUS case summary (e.g., Marbury v. Madison, McCulloch v. Maryland, Brown v. Board). Format: "Case: [Name] ([Year])\\nFacts: [2-3 sentences]\\nHolding: [1-2 sentences]"
- Political scenario (filibuster, executive order, judicial review). 80-200 words, set in current/recent context.`,
  AP_HUMAN_GEOGRAPHY: `Choose ONE format that fits the question:
- Population pyramid description as markdown table. Format: "Country [X] Population Pyramid, [Year]\\n| Age | % Male | % Female |\\n|---|---|---|\\n| 0-14 | 15% | 14% |\\n..."
- Choropleth-map description ("The map shows [variable] by country/region. High values cluster in [region], low values in [region]. Notable outliers: [country].")
- Von Thünen / Burgess / Hoyt model case study (urban land-use rings, sectors)
- Migration/diffusion case study (gentrification, suburbanization, rural-to-urban)
- Economic geography table (GDP by sector, fertility rate by HDI, etc.)`,
  AP_ENVIRONMENTAL_SCIENCE: `Choose ONE format that fits the question:
- Markdown data table with Mean ± SE. Format: "| Treatment | Mean ± SE |\\n|---|---|\\n| Control | 4.2 ± 0.3 |\\n..."
- Ecosystem case study (eutrophication, succession, food web). 100-200 words.
- Environmental-impact data (CO2 ppm by year, biodiversity index, Simpson's index).
- Figure description: "Figure 1 shows [variable] across [time/space]. Treatment X resulted in [pattern]. Control showed [pattern]."
- Pollution / sampling design scenario.`,
};

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const where = courseFilter
  ? sql`course = ${courseFilter}::"ApCourse"`
  : sql`course = ANY(${TARGET_COURSES}::"ApCourse"[])`;

const rows = courseFilter
  ? await sql`
      SELECT id, course::text as course, "questionText", options, "correctAnswer", topic, subtopic
      FROM questions
      WHERE course = ${courseFilter}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND (stimulus IS NULL OR LENGTH(stimulus) < 20)
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text as course, "questionText", options, "correctAnswer", topic, subtopic
      FROM questions
      WHERE course = ANY(${TARGET_COURSES}::"ApCourse"[])
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND (stimulus IS NULL OR LENGTH(stimulus) < 20)
      ORDER BY RANDOM()
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`Found ${rows.length} naked-stem MCQs in target courses. Will process ${target}.`);

const byCourse = {};
for (const r of rows) byCourse[r.course] = (byCourse[r.course] || 0) + 1;
console.log("By course:");
Object.entries(byCourse).sort(([, a], [, b]) => b - a).forEach(([c, n]) => console.log("  " + c + ": " + n));

let totalDone = 0, totalErr = 0, totalSkipped = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    if (dry) {
      totalDone++;
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}: "${r.questionText.slice(0, 80)}..."`);
      continue;
    }
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";
    const guidance = STIMULUS_GUIDANCE[r.course] || "";
    const prompt = `Generate a CB-style stimulus for this AP ${r.course.replace("AP_", "").replace("_", " ")} MCQ.

The stimulus must be answerable to support the EXISTING correct answer. Do not change the question or options.

Question: ${r.questionText}
${optsList ? "Options:\n" + optsList + "\n" : ""}
Correct answer: ${r.correctAnswer}
Topic: ${r.topic ?? ""}
Subtopic: ${r.subtopic ?? ""}

${guidance}

Constraints:
- 80-400 chars (target ~200)
- Must support the correct answer
- Plain markdown (tables OK, no HTML)
- No "Source: AI" or fictional citations — use real-sounding source names that are plausible

Return JSON: {"stimulus": "..."}`;

    const result = await callGroq(
      `You are an experienced CB exam writer for AP ${r.course.replace("AP_", "").replace("_", " ")}. Match real CB stimulus formats exactly.`,
      prompt,
    );
    const stim = result.stimulus?.trim();
    if (!stim || stim.length < 80) {
      totalSkipped++;
      continue;
    }
    await sql`UPDATE questions SET stimulus = ${stim}, "updatedAt" = NOW() WHERE id = ${r.id}`;
    totalDone++;
    if (totalDone <= 3 || totalDone % 25 === 0) {
      console.log(`  ✓ [${totalDone}/${target}] ${r.id.slice(0, 8)} ${r.course}: ${stim.slice(0, 80)}…`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Stimulus added: ${totalDone}`);
console.log(`  Skipped (short/empty result): ${totalSkipped}`);
console.log(`  Errors: ${totalErr}`);

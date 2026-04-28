// Fast AI-judge on a specific list of question IDs (parsed from a sample file).
// For iteration audits — judges only the freshly-sampled set without
// re-judging the full bank.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const sql = neon(process.env.DATABASE_URL);
const filePath = process.argv[2] ?? "/tmp/it10.txt";
const text = fs.readFileSync(filePath, "utf8");

// Extract IDs from "--- <id> | unit=" lines
const idMatches = [...text.matchAll(/^--- (\S+) \| unit=/gm)];
const ids = idMatches.map(m => m[1]);
console.log(`Found ${ids.length} sampled IDs`);

// Some IDs in the sample are 8-char prefixes; pad to lookup full UUIDs.
const rows = [];
for (const id of ids) {
  const r = await sql`SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer" FROM questions WHERE id LIKE ${id + '%'} LIMIT 1`;
  if (r[0]) rows.push(r[0]);
}

console.log(`Resolved ${rows.length} questions`);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
async function judge(q) {
  const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
  const correctLetter = String(q.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);
  const userPrompt = `Audit this MCQ as a CB-savvy 10-11th grader. Score 1-10.

Course: ${q.course}
${q.stimulus ? "Stimulus:\n" + q.stimulus.slice(0, 1500) + "\n" : "(No stimulus)"}
Q: ${q.questionText}
Options:
${opts.map((o, i) => "  " + String.fromCharCode(65 + i) + ") " + o).join("\n")}
Correct: ${correctLetter}

9-10: CB exam quality. 7-8: solid. 5-6: borderline. 1-4: blocker.

Flag: stimulus_gives_answer, factual_error, broken_render, hint_label, mismatched_stim, weak_distractors, meta_description, fragmentary_options, stimulus_question_disconnect.

JSON only: {"score": <1-10>, "flags": [], "reason": "<1 sentence>"}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a strict CB-savvy student auditor. 9-10 only for real CB-quality." },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2, max_tokens: 200, response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) return { score: 0, flags: ["api_error"], reason: "Groq error" };
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const results = await Promise.all(rows.map(async r => {
  try {
    const j = await judge(r);
    return { id: r.id.slice(0, 8), course: r.course, score: Number(j.score ?? 0), flags: j.flags ?? [], reason: j.reason };
  } catch (e) {
    return { id: r.id.slice(0, 8), course: r.course, score: 0, flags: ["error"], reason: e.message?.slice(0, 100) };
  }
}));

// Group by score band
const byBand = { strong: [], solid: [], borderline: [], blocker: [] };
for (const r of results) {
  if (r.score >= 9) byBand.strong.push(r);
  else if (r.score >= 7) byBand.solid.push(r);
  else if (r.score >= 5) byBand.borderline.push(r);
  else byBand.blocker.push(r);
}

console.log(`\n## Results (n=${results.length})`);
console.log(`Strong (≥9):    ${byBand.strong.length} (${(byBand.strong.length/results.length*100).toFixed(1)}%)`);
console.log(`Solid (7-8):    ${byBand.solid.length} (${(byBand.solid.length/results.length*100).toFixed(1)}%)`);
console.log(`Borderline (5-6): ${byBand.borderline.length} (${(byBand.borderline.length/results.length*100).toFixed(1)}%)`);
console.log(`Blocker (≤4):   ${byBand.blocker.length} (${(byBand.blocker.length/results.length*100).toFixed(1)}%)`);

// Per-course breakdown
const byCourse = {};
for (const r of results) {
  if (!byCourse[r.course]) byCourse[r.course] = { n: 0, sum: 0, blocker: 0 };
  byCourse[r.course].n++;
  byCourse[r.course].sum += r.score;
  if (r.score < 5) byCourse[r.course].blocker++;
}
console.log(`\n## Per-course averages:`);
for (const [c, x] of Object.entries(byCourse).sort()) {
  console.log(`${c}: avg=${(x.sum/x.n).toFixed(1)} (n=${x.n}, blockers=${x.blocker})`);
}

// Show borderline + blockers + non-9 questions (everything below 9)
console.log(`\n## Non-9 details:`);
for (const r of results.filter(x => x.score < 9).sort((a, b) => a.score - b.score)) {
  console.log(`\n${r.id} ${r.course} score=${r.score} flags=[${r.flags.join(",")}]`);
  console.log(`  reason: ${r.reason}`);
}

/**
 * Mini CB-anchored audit: 3 courses × 3 random Qs each = 9 calls.
 * Single LLM (GPT-4o) for speed. Cross-family rerun separately if needed.
 *
 * Output: data/audit-vs-cb-2026-05-04.md (per-course gap notes)
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import "dotenv/config";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) { console.error("OPENAI_API_KEY missing"); process.exit(1); }

// Pick 3 visible courses with CED text on disk.
const COURSES = [
  { course: "AP_BIOLOGY",       ced: "data/official/AP/CED/ap-biology-ced.txt" },
  { course: "AP_US_HISTORY",    ced: null }, // no AP US History CED in folder; fall through
  { course: "AP_HUMAN_GEOGRAPHY", ced: "data/official/AP/CED/ap-human-geography-ced.txt" },
  { course: "AP_CHEMISTRY",     ced: "data/official/AP/CED/ap-chemistry-ced.txt" },
];

async function gptGrade(course, question, cedSnippet) {
  const prompt = `You are auditing a practice question for ${course} against the College Board's official Course and Exam Description (CED).

CB OFFICIAL CED EXCERPT (relevant topic context, verbatim):
${cedSnippet.slice(0, 4000)}

PRACTICE QUESTION (under audit):
Stem: ${question.questionText}
Options: ${typeof question.options === 'string' ? question.options : JSON.stringify(question.options)}
Correct answer: ${question.correctAnswer}
Explanation: ${(question.explanation || "(none)").slice(0, 500)}

Grade this question A-F across these dimensions, and output JSON only:
- stem_style: does the stem read like a CB question? (length, framing, vocabulary)
- distractor_quality: are wrong options plausible student mistakes (no "all of above", no length tells)?
- topic_anchoring: does this test a topic actually in the CB CED? (vs adjacent/off-blueprint)
- factual_accuracy: any factual errors in stem/options/explanation? (CRITICAL — F if wrong)
- overall: A-F single letter

Output JSON: {"stem_style":"X","distractor_quality":"X","topic_anchoring":"X","factual_accuracy":"X","overall":"X","gap":"one-sentence top issue if any, else 'clean'"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300,
    }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}: ${await res.text()}` };
  const data = await res.json();
  try { return JSON.parse(data.choices[0].message.content); }
  catch { return { error: "JSON parse fail", raw: data.choices[0].message.content }; }
}

const report = ["# Random CB-anchored audit — 2026-05-04\n"];
report.push("Method: 3 random approved Qs per course × GPT-4o judge × CB CED snippet anchor.\n");
report.push("---\n");

const allGrades = {};

for (const { course, ced } of COURSES) {
  if (!ced || !existsSync(ced)) {
    report.push(`## ${course}\n_Skipped — no CED on disk._\n`);
    continue;
  }
  const cedText = readFileSync(ced, "utf8");

  // Pull 3 random approved Qs
  const qs = await sql`
    SELECT id, "questionText", options, "correctAnswer", explanation, unit::text AS unit
    FROM questions
    WHERE course::text = ${course} AND "isApproved" = true
    ORDER BY RANDOM()
    LIMIT 3
  `;
  if (qs.length === 0) {
    report.push(`## ${course}\n_No approved Qs found._\n`);
    continue;
  }
  console.log(`Auditing ${course} (${qs.length} Qs)...`);

  report.push(`## ${course}\n`);
  const grades = [];
  for (const q of qs) {
    const r = await gptGrade(course, q, cedText);
    grades.push({ id: q.id, unit: q.unit, ...r });
    report.push(`### Q ${q.id.slice(0,12)} — Unit: ${q.unit}\n`);
    if (r.error) {
      report.push(`- ⚠ judge error: ${r.error}\n`);
      continue;
    }
    report.push(`- Stem: ${r.stem_style}, Distractors: ${r.distractor_quality}, Topic: ${r.topic_anchoring}, Factual: ${r.factual_accuracy} → **${r.overall}**\n`);
    report.push(`- Gap: ${r.gap || '(none)'}\n`);
  }
  // Aggregate
  const overalls = grades.map(g => g.overall).filter(Boolean);
  const failing = overalls.filter(g => g === "F" || g === "D").length;
  const factualF = grades.filter(g => g.factual_accuracy === "F").length;
  report.push(`\n**${course} summary:** ${grades.length} sampled. ${failing} D/F overall. ${factualF} factual errors.\n\n`);
  allGrades[course] = grades;
}

// Top issues
report.push(`---\n## Cross-course findings\n\n`);
let factualErrors = 0, total = 0;
for (const [course, grades] of Object.entries(allGrades)) {
  for (const g of grades) {
    total++;
    if (g.factual_accuracy === "F") factualErrors++;
  }
}
report.push(`- Total Qs sampled: ${total}\n`);
report.push(`- Factual errors detected: ${factualErrors} (${total > 0 ? ((factualErrors/total*100).toFixed(0) + '%') : 'N/A'})\n`);
report.push(`- Run cost (estimated): ~$${(total * 0.01).toFixed(2)}\n`);

writeFileSync("data/audit-vs-cb-2026-05-04.md", report.join("\n"));
writeFileSync("data/audit-vs-cb-2026-05-04.json", JSON.stringify(allGrades, null, 2));
console.log(`\n✅ Audit complete. Report: data/audit-vs-cb-2026-05-04.md`);
console.log(`Total Qs: ${total}, factual errors: ${factualErrors}`);

/**
 * Wider audit + auto-fix:
 *   1. Sample 5 random approved Qs per visible course (14 courses → 70 Qs)
 *   2. GPT-4o judge against CB CED snippet (anchored, no internal rubric)
 *   3. For each Q flagged with explanation issue (B/C/D/F factual or stem) →
 *      regenerate explanation via GPT-4o (anchored to CB), save to DB
 *   4. For each Q with factual=F (real error) → unapprove (safe rollback)
 *
 * Uses OpenAI only — preserves Gemini quota for Track A (priority 1).
 * Output:
 *   - data/audit-vs-cb-2026-05-04-full.md (per-course gap tables)
 *   - data/audit-vs-cb-2026-05-04-full.json (raw grades)
 *   - data/audit-fixes-applied.json (which Qs got new explanations or were unapproved)
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import "dotenv/config";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) { console.error("OPENAI_API_KEY missing"); process.exit(1); }

const PROGRESS_LOG = "data/audit-progress.log";
function log(msg) { const line = `[${new Date().toISOString().slice(11,19)}] ${msg}`; console.log(line); appendFileSync(PROGRESS_LOG, line + "\n"); }

writeFileSync(PROGRESS_LOG, `=== Audit + Fix run ${new Date().toISOString()} ===\n`);

// 14 visible courses → CED file paths (where available).
const COURSES = [
  { course: "ACT_ENGLISH",                      ced: "data/official/ACT/preparing-for-the-act-2025.txt" },
  { course: "ACT_MATH",                         ced: "data/official/ACT/preparing-for-the-act-2025.txt" },
  { course: "AP_BIOLOGY",                       ced: "data/official/AP/CED/ap-biology-ced.txt" },
  { course: "AP_CALCULUS_AB",                   ced: "data/official/AP/CED/ap-calc-ab-bc-ced.txt" },
  { course: "AP_CALCULUS_BC",                   ced: "data/official/AP/CED/ap-calc-ab-bc-ced.txt" },
  { course: "AP_CHEMISTRY",                     ced: "data/official/AP/CED/ap-chemistry-ced.txt" },
  { course: "AP_COMPUTER_SCIENCE_PRINCIPLES",   ced: "data/official/AP/CED/ap-computer-science-principles-ced.txt" },
  { course: "AP_HUMAN_GEOGRAPHY",               ced: "data/official/AP/CED/ap-human-geography-ced.txt" },
  { course: "AP_PHYSICS_1",                     ced: "data/official/AP/CED/ap-physics-1-ced.txt" },
  { course: "AP_PRECALCULUS",                   ced: "data/official/AP/CED/ap-precalculus-ced.txt" },
  { course: "AP_PSYCHOLOGY",                    ced: "data/official/AP/CED/ap-psychology-ced.txt" },
  { course: "AP_US_GOVERNMENT",                 ced: "data/official/AP/CED/ap-us-government-and-politics-ced.txt" },
  { course: "AP_US_HISTORY",                    ced: "data/official/AP/CED/ap-us-history-ced.txt" },
  { course: "AP_WORLD_HISTORY",                 ced: "data/official/AP/CED/ap-world-history-modern-ced.txt" },
  { course: "SAT_MATH",                         ced: "data/official/SAT/digital-sat-sample-questions.txt" },
];

async function gptCall(prompt, expectJson = true) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      ...(expectJson ? { response_format: { type: "json_object" } } : {}),
      max_tokens: 800,
    }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const data = await res.json();
  const content = data.choices[0].message.content;
  if (!expectJson) return { content };
  try { return JSON.parse(content); }
  catch { return { error: "JSON parse fail", raw: content.slice(0, 200) }; }
}

async function audit(course, q, cedSnippet) {
  const optionsStr = typeof q.options === "string" ? q.options : JSON.stringify(q.options).slice(0, 600);
  const prompt = `Audit this practice question against CB's official ${course} Course and Exam Description (CED).

CB CED EXCERPT (verbatim, authoritative):
${cedSnippet.slice(0, 4000)}

PRACTICE QUESTION:
Stem: ${q.questionText}
Options: ${optionsStr}
Correct: ${q.correctAnswer}
Explanation: ${(q.explanation || "(none)").slice(0, 800)}

Grade A-F per dimension. Output ONLY JSON:
{
  "stem_style": "A|B|C|D|F",
  "distractor_quality": "A|B|C|D|F",
  "topic_anchoring": "A|B|C|D|F",
  "factual_accuracy": "A|B|C|D|F",
  "overall": "A|B|C|D|F",
  "needs_explanation_fix": true|false,
  "fix_reason": "one sentence — why explanation needs improvement, or 'clean'"
}

needs_explanation_fix is true ONLY if explanation has factual errors, missing reasoning, or off-topic reasoning. Style polish alone (slightly verbose) does NOT need fix.`;
  return await gptCall(prompt);
}

async function fixExplanation(course, q, cedSnippet, fixReason) {
  const optionsStr = typeof q.options === "string" ? q.options : JSON.stringify(q.options).slice(0, 600);
  const prompt = `Rewrite the explanation for this CB ${course} question. Anchor STRICTLY to the CED excerpt — do not invent facts.

CB CED EXCERPT:
${cedSnippet.slice(0, 4000)}

QUESTION:
Stem: ${q.questionText}
Options: ${optionsStr}
Correct: ${q.correctAnswer}

CURRENT EXPLANATION (the issue: ${fixReason}):
${(q.explanation || "(none)").slice(0, 800)}

Write a NEW explanation that:
1. States why ${q.correctAnswer} is correct, citing the CED concept by name
2. States why each wrong option is wrong (specifically — the misconception it tests)
3. Stays under 300 words
4. Is factually anchored ONLY to the CED — no invented details

Output ONLY JSON:
{ "new_explanation": "...", "anchored_to_ced_concept": "name of CED concept this draws from" }`;
  return await gptCall(prompt);
}

const allGrades = {};
const fixes = { explanationsRewritten: [], unapproved: [], skipped: [] };
const SAMPLE_PER_COURSE = 5;

for (const { course, ced } of COURSES) {
  if (!existsSync(ced)) {
    log(`⚠ ${course}: CED missing at ${ced} — skip`);
    fixes.skipped.push({ course, reason: "no CED on disk" });
    continue;
  }
  const cedText = readFileSync(ced, "utf8");
  const qs = await sql`
    SELECT id, "questionText", options, "correctAnswer", explanation, unit::text AS unit
    FROM questions
    WHERE course::text = ${course} AND "isApproved" = true
    ORDER BY RANDOM()
    LIMIT ${SAMPLE_PER_COURSE}
  `;
  if (qs.length === 0) { log(`⚠ ${course}: no approved Qs`); continue; }
  log(`▶ ${course} — auditing ${qs.length} Qs`);
  const grades = [];
  for (const q of qs) {
    const r = await audit(course, q, cedText);
    if (r.error) { log(`  Q ${q.id.slice(0,8)} judge error: ${r.error}`); grades.push({ id: q.id, ...r }); continue; }
    grades.push({ id: q.id, unit: q.unit, ...r });
    log(`  Q ${q.id.slice(0,8)} → ${r.overall} (factual=${r.factual_accuracy})${r.needs_explanation_fix ? " [FIX]" : ""}`);

    // FACTUAL F → unapprove (safest rollback)
    if (r.factual_accuracy === "F") {
      await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
      fixes.unapproved.push({ course, id: q.id, reason: r.fix_reason });
      log(`    ✗ UNAPPROVED — factual error: ${r.fix_reason}`);
      continue;
    }
    // B/C/D with explanation issue → rewrite explanation
    if (r.needs_explanation_fix && (r.factual_accuracy === "C" || r.factual_accuracy === "D" || r.factual_accuracy === "B")) {
      const fix = await fixExplanation(course, q, cedText, r.fix_reason);
      if (fix.error || !fix.new_explanation) { log(`    ⚠ fix failed: ${fix.error || "no new_explanation"}`); continue; }
      await sql`UPDATE questions SET explanation = ${fix.new_explanation} WHERE id = ${q.id}`;
      fixes.explanationsRewritten.push({ course, id: q.id, oldReason: r.fix_reason, anchored: fix.anchored_to_ced_concept });
      log(`    ✓ explanation rewritten (anchored: ${fix.anchored_to_ced_concept})`);
    }
  }
  allGrades[course] = grades;
}

// Build report
const report = ["# Random CB-anchored audit + auto-fix — 2026-05-04\n"];
report.push("Method: 5 random Qs per visible course × GPT-4o judge × CED anchor. Auto-fix: explanation rewrite if factual ≤ B and needs fix; unapprove if factual = F.\n\n---\n");
let total = 0, factualF = 0, fixed = 0;
for (const [course, grades] of Object.entries(allGrades)) {
  report.push(`## ${course}\n`);
  const overalls = grades.map(g => g.overall).filter(Boolean);
  const factuals = grades.map(g => g.factual_accuracy).filter(Boolean);
  const fxA = factuals.filter(f => f === "A").length;
  const fxF = factuals.filter(f => f === "F").length;
  total += grades.length; factualF += fxF;
  const fixedHere = fixes.explanationsRewritten.filter(f => f.course === course).length;
  fixed += fixedHere;
  report.push(`- Sampled: ${grades.length}, Overall A/B/C/D/F: ${["A","B","C","D","F"].map(g => overalls.filter(o => o === g).length).join("/")}\n`);
  report.push(`- Factual A/F: ${fxA}/${fxF}\n`);
  if (fixedHere > 0) report.push(`- 🔧 Explanations rewritten: ${fixedHere}\n`);
  if (fxF > 0) report.push(`- 🚨 Unapproved (factual error): ${fxF}\n`);
}
report.push(`\n---\n## Summary\n`);
report.push(`- Total Qs sampled: ${total}\n`);
report.push(`- Factual errors (unapproved): ${factualF} (${total > 0 ? ((factualF/total*100).toFixed(0)+'%') : 'N/A'})\n`);
report.push(`- Explanations rewritten: ${fixed}\n`);
report.push(`- Skipped courses (no CED): ${fixes.skipped.map(s => s.course).join(", ") || "none"}\n`);
report.push(`- Run cost (estimated): ~$${(total * 0.01 + fixed * 0.015).toFixed(2)}\n`);

writeFileSync("data/audit-vs-cb-2026-05-04-full.md", report.join(""));
writeFileSync("data/audit-vs-cb-2026-05-04-full.json", JSON.stringify(allGrades, null, 2));
writeFileSync("data/audit-fixes-applied.json", JSON.stringify(fixes, null, 2));
log(`\n✅ Audit + fix complete. ${total} sampled, ${factualF} unapproved, ${fixed} explanations rewritten.`);

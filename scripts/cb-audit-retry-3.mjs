/**
 * Retry pass: covers the 3 partial-coverage courses from the main audit
 * (AP_US_HISTORY, AP_WORLD_HISTORY, SAT_MATH) with 8s pacing to stay
 * under GPT-4o's 30K TPM rate limit.
 *
 * Same audit + auto-fix logic as cb-audit-and-fix.mjs, just narrower scope.
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import "dotenv/config";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const COURSES = [
  { course: "AP_US_HISTORY",     ced: "data/official/AP/CED/ap-us-history-ced.txt" },
  { course: "AP_WORLD_HISTORY",  ced: "data/official/AP/CED/ap-world-history-modern-ced.txt" },
  { course: "SAT_MATH",          ced: "data/official/SAT/digital-sat-sample-questions.txt" },
];

const PROGRESS = "data/audit-retry-progress.log";
writeFileSync(PROGRESS, `=== Retry pass ${new Date().toISOString()} ===\n`);
const log = (m) => { const l = `[${new Date().toISOString().slice(11,19)}] ${m}`; console.log(l); appendFileSync(PROGRESS, l + "\n"); };

async function gptCallWithRetry(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    if (res.status === 429) {
      const wait = (attempt + 1) * 30; // 30s, 60s, 90s
      log(`  rate-limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) return { error: `HTTP ${res.status}: ${(await res.text()).slice(0, 150)}` };
    const data = await res.json();
    try { return JSON.parse(data.choices[0].message.content); }
    catch { return { error: "JSON parse fail" }; }
  }
  return { error: "rate-limited after 3 retries" };
}

async function audit(course, q, ced) {
  const optsStr = typeof q.options === "string" ? q.options : JSON.stringify(q.options).slice(0, 600);
  return await gptCallWithRetry(`Audit this ${course} practice question against CB's CED.

CB CED EXCERPT:
${ced.slice(0, 4000)}

PRACTICE QUESTION:
Stem: ${q.questionText}
Options: ${optsStr}
Correct: ${q.correctAnswer}
Explanation: ${(q.explanation || "(none)").slice(0, 800)}

Output ONLY JSON: {"stem_style":"A-F","distractor_quality":"A-F","topic_anchoring":"A-F","factual_accuracy":"A-F","overall":"A-F","needs_explanation_fix":true|false,"fix_reason":"..."}`);
}

async function fixExpl(course, q, ced, reason) {
  const optsStr = typeof q.options === "string" ? q.options : JSON.stringify(q.options).slice(0, 600);
  return await gptCallWithRetry(`Rewrite explanation for ${course} question. Anchor to CED, no invented facts.

CED:
${ced.slice(0, 4000)}

Q: ${q.questionText}
Options: ${optsStr}
Correct: ${q.correctAnswer}
Issue with current explanation: ${reason}
Current explanation: ${(q.explanation || "").slice(0, 800)}

Write new explanation: state why correct is correct, why each wrong option is wrong, <300 words, CED-anchored.

Output JSON: {"new_explanation":"...","anchored_to_ced_concept":"..."}`);
}

const fixes = { explanationsRewritten: [], unapproved: [] };
const allGrades = {};

for (const { course, ced } of COURSES) {
  if (!existsSync(ced)) { log(`⚠ ${course}: CED missing`); continue; }
  const cedText = readFileSync(ced, "utf8");
  const qs = await sql`
    SELECT id, "questionText", options, "correctAnswer", explanation, unit::text AS unit
    FROM questions WHERE course::text = ${course} AND "isApproved" = true
    ORDER BY RANDOM() LIMIT 5
  `;
  log(`▶ ${course} — ${qs.length} Qs`);
  const grades = [];
  for (const q of qs) {
    const r = await audit(course, q, cedText);
    if (r.error) { log(`  Q ${q.id.slice(0,8)} judge error: ${r.error}`); grades.push({ id: q.id, ...r }); continue; }
    grades.push({ id: q.id, unit: q.unit, ...r });
    log(`  Q ${q.id.slice(0,8)} → ${r.overall} (factual=${r.factual_accuracy})${r.needs_explanation_fix ? " [FIX]" : ""}`);

    if (r.factual_accuracy === "F") {
      await sql`UPDATE questions SET "isApproved" = false WHERE id = ${q.id}`;
      fixes.unapproved.push({ course, id: q.id, reason: r.fix_reason });
      log(`    ✗ UNAPPROVED — factual error: ${r.fix_reason}`);
    } else if (r.needs_explanation_fix && (r.factual_accuracy === "B" || r.factual_accuracy === "C" || r.factual_accuracy === "D")) {
      const fix = await fixExpl(course, q, cedText, r.fix_reason);
      if (!fix.error && fix.new_explanation) {
        await sql`UPDATE questions SET explanation = ${fix.new_explanation} WHERE id = ${q.id}`;
        fixes.explanationsRewritten.push({ course, id: q.id, anchored: fix.anchored_to_ced_concept });
        log(`    ✓ explanation rewritten (anchor: ${fix.anchored_to_ced_concept})`);
      } else log(`    ⚠ fix failed: ${fix.error}`);
    }
    // 8s pacing to stay under 30K TPM
    await new Promise(r => setTimeout(r, 8000));
  }
  allGrades[course] = grades;
}

// Report
const report = ["# Retry pass — 2026-05-04\n\n"];
let total = 0, factualF = 0, fixed = 0;
for (const [c, gs] of Object.entries(allGrades)) {
  const overalls = gs.map(g => g.overall).filter(Boolean);
  const fxF = gs.filter(g => g.factual_accuracy === "F").length;
  const fxA = gs.filter(g => g.factual_accuracy === "A").length;
  total += gs.length; factualF += fxF;
  const fixedHere = fixes.explanationsRewritten.filter(f => f.course === c).length;
  fixed += fixedHere;
  report.push(`## ${c}\n- Sampled: ${gs.length}, A/B/C/D/F: ${["A","B","C","D","F"].map(g => overalls.filter(o => o === g).length).join("/")}\n- Factual A/F: ${fxA}/${fxF}\n`);
  if (fixedHere) report.push(`- 🔧 Explanations rewritten: ${fixedHere}\n`);
  if (fxF) report.push(`- 🚨 Unapproved: ${fxF}\n`);
  report.push("\n");
}
report.push(`---\n## Summary\n- Total: ${total}\n- Unapproved: ${factualF}\n- Rewritten: ${fixed}\n`);
writeFileSync("data/audit-retry-2026-05-04.md", report.join(""));
log(`\n✅ Retry done. ${total} sampled, ${factualF} unapproved, ${fixed} rewritten.`);

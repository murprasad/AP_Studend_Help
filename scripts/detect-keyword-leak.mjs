// Iteration 4 enhancement — detect "answer keyword in stimulus" leak.
//
// Pattern: answer is a 1-3 token term (e.g. "Possibilism", "Cooperative
// federalism", "Carrying capacity"). The term appears verbatim in the
// stimulus → student picks the answer purely by spotting the term, no
// inference needed.
//
// Algorithm:
//   1. Get correct option's text.
//   2. Strip the "A) " prefix and any trailing explanatory clause after
//      a colon, dash, or comma. Take the first phrase.
//   3. Tokenize: if 1-3 tokens AND those tokens appear verbatim in
//      stimulus → leak.
//
// More aggressive than the prior n-gram detector. Run AFTER the prior
// passes to catch what slipped through.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const MARKER = "keyword-leak-fix-2026-04-28";

const args = process.argv.slice(2);
const dry = args.includes("--dry");

function normalize(s) {
  return String(s ?? "").toLowerCase()
    // Strip option-letter prefix only when followed by ) or . (not bare letter,
    // which would eat words starting with a-e like "Disease" → "isease").
    .replace(/^[a-e][\)\.]\s*/i, "")
    .replace(/[^\w\s\-]/g, " ")
    .replace(/\s+/g, " ").trim();
}

// Extract the first short phrase from an option (before colon/dash/comma).
// Split BEFORE normalize so we don't lose the comma boundary.
function answerKeyTerm(option) {
  // Strip "B) " prefix first
  let s = String(option ?? "").replace(/^[A-E][\)\.]?\s*/i, "");
  // Take only the first clause — split on these natural-language separators
  s = s.split(/[:;,—–\-]/)[0];
  // Now normalize the first clause
  s = normalize(s);
  // Drop leading articles
  s = s.replace(/^(the |a |an )/, "");
  return s;
}

const groupArg = args.find(a => a.startsWith("--group="))?.split("=")[1] ?? "AP";
const COURSE_GROUPS = {
  AP: ["AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
       "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
       "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
       "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES"],
  SAT: ["SAT_MATH", "SAT_READING_WRITING"],
  ACT: ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"],
};
const courses = COURSE_GROUPS[groupArg] ?? COURSE_GROUPS.AP;

const totals = { byCourse: {}, scanned: 0, leak: 0 };

for (const course of courses) {
  const rows = await sql`
    SELECT id, course::text AS course, "questionText", stimulus, options, "correctAnswer"
    FROM questions
    WHERE course = ${course}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
      AND stimulus IS NOT NULL
      AND LENGTH(stimulus) > 30
      AND ("modelUsed" IS NULL OR "modelUsed" NOT LIKE ${'%' + MARKER + '%'})
  `;
  let leak = 0;
  const samples = [];

  for (const r of rows) {
    totals.scanned++;
    let opts;
    try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; } catch { continue; }
    if (!Array.isArray(opts)) continue;

    const correctLetter = String(r.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);
    const idx = "ABCDE".indexOf(correctLetter);
    if (idx < 0 || idx >= opts.length) continue;

    const keyTerm = answerKeyTerm(opts[idx]);
    const tokens = keyTerm.split(" ").filter(t => t.length > 2);
    if (tokens.length < 1 || tokens.length > 3) continue;

    const stimLower = normalize(r.stimulus);
    // Verbatim phrase match
    if (stimLower.includes(keyTerm) && keyTerm.length >= 6) {
      leak++;
      if (samples.length < 2) {
        samples.push({
          id: r.id,
          keyTerm,
          stimSnip: r.stimulus.slice(0, 150),
          answer: String(opts[idx]).slice(0, 100),
        });
      }
      // Mark for fix (unapprove these — they're broken-by-design and need full regen)
      if (!dry) {
        await sql`
          UPDATE questions
          SET "isApproved" = false,
              "modelUsed" = COALESCE("modelUsed", '') || ${'|' + MARKER + ':unapproved'},
              "updatedAt" = NOW()
          WHERE id = ${r.id}
        `;
      }
    }
  }
  totals.byCourse[course] = { total: rows.length, leak, samples };
  totals.leak += leak;
}

console.log("# Keyword-leak detection — 2026-04-28 iter 4");
console.log(`Mode: ${dry ? "DRY-RUN (no DB writes)" : "LIVE — unapproving leaks"}`);
console.log(`Scanned: ${totals.scanned} | Leaked: ${totals.leak} (${(totals.leak/totals.scanned*100).toFixed(1)}%)`);
console.log(`\nPer-course:`);
for (const c of courses) {
  const x = totals.byCourse[c];
  if (x.leak > 0) {
    console.log(`${c}: ${x.leak}/${x.total} (${((x.leak/x.total)*100).toFixed(0)}%)`);
  }
}
console.log(`\n## Sample leaks:`);
for (const c of courses) {
  for (const s of totals.byCourse[c].samples) {
    console.log(`\n${c} — ${s.id.slice(0,8)}`);
    console.log(`  KEY TERM: "${s.keyTerm}"`);
    console.log(`  STIM:     ${s.stimSnip}…`);
    console.log(`  ANSWER:   ${s.answer}`);
  }
}

// Detect MCQs where the stimulus contains a verbatim or near-verbatim
// match of the correct answer's option text. CB never does this — stimulus
// provides EVIDENCE, the question requires INFERENCE.
//
// Algorithm:
//   1. For each AP MCQ with a stimulus, get the correct option's text.
//   2. Strip the "A) " prefix and any short phrases under 4 words.
//   3. Find content tokens (3+ word substrings) from the answer.
//   4. If the stimulus contains ANY 5-word substring of the answer
//      verbatim, OR the LCS overlap is > 60% of answer words, flag it.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/^[a-e][\)\.]?\s*/i, "")  // strip "A) " prefix
    .replace(/[^\w\s]/g, " ")          // strip punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) { return normalize(s).split(" ").filter(t => t.length > 2); }

// Returns the longest verbatim N-gram match (in tokens) between a and b.
function longestNgramMatch(aTokens, bTokens) {
  const bset = new Set();
  for (let i = 0; i < bTokens.length; i++) {
    for (let j = 1; j <= Math.min(15, bTokens.length - i); j++) {
      bset.add(bTokens.slice(i, i + j).join(" "));
    }
  }
  let longest = 0;
  for (let i = 0; i < aTokens.length; i++) {
    for (let j = 1; j <= Math.min(15, aTokens.length - i); j++) {
      const phrase = aTokens.slice(i, i + j).join(" ");
      if (bset.has(phrase) && j > longest) longest = j;
    }
  }
  return longest;
}

// Fraction of answer tokens that appear in stimulus.
function tokenOverlap(aTokens, bTokens) {
  if (aTokens.length === 0) return 0;
  const bset = new Set(bTokens);
  const matched = aTokens.filter(t => bset.has(t)).length;
  return matched / aTokens.length;
}

const args = process.argv.slice(2);
const groupArg = args.find(a => a.startsWith("--group="))?.split("=")[1];
const AP_COURSES = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];
const SAT_COURSES = ["SAT_MATH", "SAT_READING_WRITING"];
const ACT_COURSES = ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"];
const CLEP_COURSES = (() => {
  // Prisma enum names — pulled from schema.prisma
  return [
    "CLEP_INTRO_PSYCHOLOGY","CLEP_INTRODUCTORY_SOCIOLOGY","CLEP_PRINCIPLES_OF_MARKETING",
    "CLEP_PRINCIPLES_OF_MANAGEMENT","CLEP_COLLEGE_ALGEBRA","CLEP_COLLEGE_COMPOSITION",
  ];
})();
const courses = (() => {
  if (groupArg === "SAT") return SAT_COURSES;
  if (groupArg === "ACT") return ACT_COURSES;
  if (groupArg === "CLEP") return CLEP_COURSES;
  if (groupArg === "ALL") return [...AP_COURSES, ...SAT_COURSES, ...ACT_COURSES, ...CLEP_COURSES];
  return AP_COURSES;
})();

const totals = { scanned: 0, leak5: 0, leak60: 0, byCourse: {} };

for (const course of courses) {
  const rows = await sql`
    SELECT id, "questionText", stimulus, options, "correctAnswer"
    FROM questions
    WHERE course = ${course}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
      AND stimulus IS NOT NULL
      AND LENGTH(stimulus) > 50
  `;
  let leak5 = 0, leak60 = 0;
  const samples = [];

  for (const r of rows) {
    totals.scanned++;
    let opts;
    try { opts = typeof r.options === "string" ? JSON.parse(r.options) : r.options; }
    catch { continue; }
    if (!Array.isArray(opts)) continue;

    // Find the correct option's text.
    const correctLetter = String(r.correctAnswer ?? "").trim().toUpperCase().slice(0, 1);
    const idx = "ABCDE".indexOf(correctLetter);
    if (idx < 0 || idx >= opts.length) continue;
    const answerText = opts[idx];

    const aTokens = tokens(answerText);
    if (aTokens.length < 4) continue;  // skip 1-2 word answers (math values)

    const sTokens = tokens(r.stimulus);
    const longest = longestNgramMatch(aTokens, sTokens);
    const overlap = tokenOverlap(aTokens, sTokens);

    if (longest >= 5) leak5++;
    if (overlap >= 0.60 && aTokens.length >= 6) {
      leak60++;
      if (samples.length < 3) {
        samples.push({
          id: r.id,
          stim: r.stimulus.slice(0, 120),
          answer: String(answerText).slice(0, 120),
          longest, overlap: overlap.toFixed(2),
        });
      }
    }
  }

  totals.leak5 += leak5;
  totals.leak60 += leak60;
  totals.byCourse[course] = { total: rows.length, leak5, leak60, samples };
}

console.log("# Stimulus-answer leak detection — 2026-04-28");
console.log(`\nScanned ${totals.scanned} MCQs with stimulus across 14 AP courses.`);
console.log(`\nLeak metrics:`);
console.log(`  ≥5-token verbatim match (n-gram leak): ${totals.leak5} (${(totals.leak5/totals.scanned*100).toFixed(1)}%)`);
console.log(`  ≥60% token overlap (paraphrase leak):  ${totals.leak60} (${(totals.leak60/totals.scanned*100).toFixed(1)}%)`);

console.log(`\nPer-course:`);
console.log(`Course | Total MCQ w/stim | n-gram≥5 leak | overlap≥60% leak`);
for (const c of courses) {
  const x = totals.byCourse[c];
  const p5 = x.total > 0 ? ((x.leak5/x.total)*100).toFixed(0) : "0";
  const p60 = x.total > 0 ? ((x.leak60/x.total)*100).toFixed(0) : "0";
  console.log(`${c} | ${x.total} | ${x.leak5} (${p5}%) | ${x.leak60} (${p60}%)`);
}

console.log(`\n## Sample leaks (worst 60%-overlap cases):`);
for (const c of courses) {
  for (const s of totals.byCourse[c].samples) {
    console.log(`\n${c} — ${s.id.slice(0,8)} (overlap=${s.overlap}, n-gram=${s.longest})`);
    console.log(`  STIM: ${s.stim}…`);
    console.log(`  ANS:  ${s.answer}`);
  }
}

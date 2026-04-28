// Content-realism audit — pull 5 random approved Qs per AP course,
// flag suspected AI-tells:
//   - Generic openers ("Which of the following best describes...")
//     when overused (CB uses sparingly).
//   - Distractor patterns (all 4 same length ± 5 chars = suspicious).
//   - "All of the above" / "None of the above" — CB doesn't use these.
//   - Stimulus too short (under 50 chars) for FRQ.
//   - Explanation reads as paraphrase instead of CB rubric (says
//     "the answer is X because Y" instead of citing concept).
//   - Test prep tells: "tricky," "the test maker wants you to"
//
// Output: ranked list of suspect questions per course.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const N_PER_COURSE = 8;

const courses = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

// Heuristic checks. Each returns null (clean) or a short reason string.
function checkAITells(q) {
  const reasons = [];
  const text = q.questionText.toLowerCase();
  const expl = (q.explanation ?? "").toLowerCase();
  const opts = Array.isArray(q.options) ? q.options : (() => {
    try { return JSON.parse(q.options ?? "[]"); } catch { return []; }
  })();

  // Banned-phrase tells
  const banned = [
    "all of the above", "none of the above",
    "the test maker", "trick question", "tricky",
    "students often choose", "this is a common mistake",
  ];
  for (const b of banned) {
    if (text.includes(b) || opts.some(o => String(o).toLowerCase().includes(b))) {
      reasons.push(`banned phrase: "${b}"`);
    }
  }

  // Distractor uniformity (same length ± 5 chars across all 4)
  if (opts.length >= 4) {
    const lens = opts.map(o => String(o).length);
    const max = Math.max(...lens), min = Math.min(...lens);
    if (max - min <= 5 && max >= 30) reasons.push(`distractors all same length (${min}-${max} chars)`);
  }

  // Generic-opener overuse
  if (/^which of the following best (describes|represents|explains)/i.test(q.questionText.trim())) {
    // CB uses this but sparingly. Flag for spot-check, not auto-fail.
    // (no reason added — just for stats)
  }

  // FRQ with short stimulus
  if (q.qt !== "MCQ" && (!q.stimulus || q.stimulus.length < 50)) {
    reasons.push(`FRQ has thin or no stimulus`);
  }

  // Explanation that's just "the answer is X because Y"
  if (expl.length > 0 && expl.length < 80) {
    reasons.push(`explanation under 80 chars`);
  }
  if (/^the (correct )?answer is [a-e]\.?\s/i.test(q.explanation ?? "")) {
    reasons.push(`explanation starts "the correct answer is X"`);
  }

  // AI-tell phrases inside explanation
  for (const b of ["as an ai", "as a language model", "i don't have", "i cannot"]) {
    if (expl.includes(b)) reasons.push(`AI-system phrase in explanation`);
  }

  return reasons.length > 0 ? reasons.join("; ") : null;
}

console.log("# AP question-realism audit — 2026-04-27");
const overall = { courses: 0, suspect: 0, clean: 0 };

for (const c of courses) {
  const r = await sql`
    SELECT id, course::text AS course, "questionType"::text AS qt,
           "questionText", stimulus, options, "correctAnswer", explanation
    FROM questions
    WHERE course = ${c}::"ApCourse"
      AND "isApproved" = true
    ORDER BY RANDOM()
    LIMIT ${N_PER_COURSE}
  `;
  console.log(`\n## ${c} (n=${r.length})`);
  let suspect = 0;
  for (const q of r) {
    const tells = checkAITells(q);
    if (tells) {
      suspect++;
      console.log(`  ⚠ ${q.id.slice(0, 8)} [${q.qt}]: ${tells}`);
      console.log(`    Q: ${q.questionText.slice(0, 100)}…`);
    }
  }
  overall.courses++;
  overall.suspect += suspect;
  overall.clean += (r.length - suspect);
  console.log(`  ${suspect}/${r.length} flagged (${((suspect/r.length)*100).toFixed(0)}%)`);
}

console.log(`\n## Summary`);
console.log(`Courses sampled: ${overall.courses}`);
console.log(`Total questions sampled: ${overall.suspect + overall.clean}`);
console.log(`Suspect (≥1 AI-tell): ${overall.suspect}`);
console.log(`Clean: ${overall.clean}`);
console.log(`Suspect rate: ${((overall.suspect/(overall.suspect+overall.clean))*100).toFixed(1)}%`);

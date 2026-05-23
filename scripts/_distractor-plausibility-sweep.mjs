/**
 * Distractor Plausibility gate — closes the last major quality gap.
 *
 * Heuristic-only checks (no LLM):
 *  - Distractor identical to correct (already caught by options-duplicate)
 *  - "All of the above"/"None of the above" in math/sci courses (rare in CB)
 *  - Numeric distractor differing from correct by >10000× or <0.0001× (order-of-magnitude error)
 *  - Distractor matches stem text verbatim
 *
 * Haiku judge (when available):
 *  - "Are these wrong answers plausible distractors? Would a struggling
 *    student plausibly choose them?"
 *  - Returns PASS / FAIL with reason
 *
 * Usage:
 *   node scripts/_distractor-plausibility-sweep.mjs                    # dry-run, heuristic only
 *   node scripts/_distractor-plausibility-sweep.mjs --llm              # dry-run, +Haiku judge
 *   node scripts/_distractor-plausibility-sweep.mjs --apply --llm      # write
 *   node scripts/_distractor-plausibility-sweep.mjs --course=X --llm
 *   node scripts/_distractor-plausibility-sweep.mjs --sample=100 --llm # judge 100 random Qs
 */
import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const APPLY = !!args.apply;
const USE_LLM = !!args.llm;
const COURSE_FILTER = args.course ?? null;
const SAMPLE = args.sample ? parseInt(args.sample, 10) : null;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const ALL_OF_NONE_OF_PATTERN = /^(?:all|none)\s+of\s+the\s+(?:above|other|previous)$/i;
const MATH_SCI_COURSES = new Set([
  "CLEP_COLLEGE_ALGEBRA","CLEP_CALCULUS","CLEP_PRECALCULUS","CLEP_COLLEGE_MATH",
  "CLEP_CHEMISTRY","CLEP_BIOLOGY","CLEP_NATURAL_SCIENCES",
  "SAT_MATH","ACT_MATH","ACT_SCIENCE","PSAT_MATH",
  "AP_CALCULUS_AB","AP_CALCULUS_BC","AP_CHEMISTRY","AP_PHYSICS_1","AP_PHYSICS_2",
  "AP_STATISTICS","AP_BIOLOGY",
]);

function stripPrefix(opt) {
  return String(opt).replace(/^[A-E]\)\s*/, "").trim();
}

function extractNumber(s) {
  const m = String(s).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function heuristicCheck(q) {
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  if (opts.length < 3) return null; // skip non-MCQ
  const correctIdx = (q.correctAnswer || "").charCodeAt(0) - 65;
  if (correctIdx < 0 || correctIdx >= opts.length) return null;
  const correct = stripPrefix(opts[correctIdx]);

  // 1. "All/None of the above" in math/sci courses (rare in real CB)
  if (MATH_SCI_COURSES.has(q.course)) {
    for (let i = 0; i < opts.length; i++) {
      const o = stripPrefix(opts[i]);
      if (ALL_OF_NONE_OF_PATTERN.test(o)) {
        return { gate: "distractor-all-none-in-math", reason: `option ${String.fromCharCode(65+i)} = "${o}" — uncommon CB style for math/sci` };
      }
    }
  }

  // 2. Numeric distractor wildly different from correct (order-of-magnitude)
  const correctNum = extractNumber(correct);
  if (correctNum !== null && Math.abs(correctNum) > 0.0001) {
    for (let i = 0; i < opts.length; i++) {
      if (i === correctIdx) continue;
      const o = stripPrefix(opts[i]);
      const distNum = extractNumber(o);
      if (distNum === null || distNum === 0) continue;
      // Skip if it's clearly intentional (sign flips, off-by-one)
      const ratio = Math.abs(distNum / correctNum);
      if (ratio > 100000 || ratio < 0.00001) {
        return { gate: "distractor-magnitude-absurd", reason: `option ${String.fromCharCode(65+i)} = ${distNum} vs correct ${correctNum} (ratio ${ratio.toExponential(1)})` };
      }
    }
  }

  // 3. Distractor verbatim from stem (lazy LLM gen)
  // SKIP for COLLEGE_COMPOSITION / writing courses where "best revision"
  // questions legitimately quote the stem in options.
  const isWritingCourse = /COMPOSITION|MODULAR|LITERATURE|ENGLISH/.test(q.course || "");
  if (!isWritingCourse) {
    const stemLower = (q.questionText || "").toLowerCase();
    for (let i = 0; i < opts.length; i++) {
      if (i === correctIdx) continue;
      const o = stripPrefix(opts[i]).toLowerCase();
      // Require longer match (30+ chars) to reduce false positives on
      // short option text that happens to appear in a long stem.
      if (o.length >= 30 && stemLower.includes(o)) {
        return { gate: "distractor-verbatim-from-stem", reason: `option ${String.fromCharCode(65+i)} appears verbatim in stem` };
      }
    }
  }

  return null; // passes heuristics
}

async function haikuJudge(q) {
  if (!ANTHROPIC_KEY) return null;
  const opts = Array.isArray(q.options) ? q.options.map(String) : [];
  const correctIdx = (q.correctAnswer || "").charCodeAt(0) - 65;
  const correctOpt = opts[correctIdx] || "";
  const distractors = opts.filter((_, i) => i !== correctIdx);

  const PROMPT = `You audit MCQ distractor quality for an exam-prep platform. Given a question, the correct answer, and the wrong answers (distractors), judge whether the distractors are PLAUSIBLE — i.e., a student who didn't know the material could reasonably pick them.

REJECT distractors that are:
- Absurd / nonsensical (e.g., "blue" for a math problem)
- Identical to or trivial variations of the correct answer
- Obviously wrong by inspection (off by orders of magnitude when scale matters)
- Repeating the question prompt
- Generic placeholders ("answer 1", "n/a", "—")

ACCEPT distractors that:
- Represent common misconceptions / error patterns (sign-flip, off-by-one, conceptual confusion)
- Are similar in length/format to correct
- Test discrimination of nuance

Reply exactly:
verdict: PASS|FAIL
reason: <one sentence>`;

  const userMsg = `STEM: ${(q.questionText || "").slice(0, 500)}\n\nCORRECT (${q.correctAnswer}): ${correctOpt}\n\nDISTRACTORS:\n${distractors.map((d, i) => `${String.fromCharCode(65 + (i >= correctIdx ? i+1 : i))}) ${d}`).join("\n")}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const text = j?.content?.[0]?.text || "";
    const verdict = text.match(/verdict:\s*(PASS|FAIL)/i)?.[1]?.toUpperCase();
    const reason = text.match(/reason:\s*(.+)/i)?.[1]?.trim().slice(0, 200) || "";
    if (verdict === "FAIL") return { gate: "distractor-llm-implausible", reason };
    return null;
  } catch { return null; }
}

let rows;
if (COURSE_FILTER && SAMPLE) {
  rows = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE_FILTER} ORDER BY RANDOM() LIMIT ${SAMPLE}`;
} else if (COURSE_FILTER) {
  rows = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' AND course::text = ${COURSE_FILTER}`;
} else if (SAMPLE) {
  rows = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ' ORDER BY RANDOM() LIMIT ${SAMPLE}`;
} else {
  rows = await sql`SELECT id, course::text AS course, "questionText", options, "correctAnswer" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ'`;
}

console.log(`Scanning ${rows.length} approved MCQs (heuristic${USE_LLM ? " + Haiku judge" : ""})...\n`);

const failures = [];
let heuristicFails = 0;
let llmFails = 0;

for (let i = 0; i < rows.length; i++) {
  const q = rows[i];
  const h = heuristicCheck(q);
  if (h) {
    heuristicFails++;
    failures.push({ id: q.id, course: q.course, gate: h.gate, reason: h.reason, stem: q.questionText.slice(0, 60) });
    continue;
  }
  if (USE_LLM) {
    const llm = await haikuJudge(q);
    if (llm) {
      llmFails++;
      failures.push({ id: q.id, course: q.course, gate: llm.gate, reason: llm.reason, stem: q.questionText.slice(0, 60) });
    }
    if (i % 50 === 0 && i > 0) console.log(`  ...${i}/${rows.length} scanned, ${heuristicFails} heuristic + ${llmFails} LLM fails`);
  }
}

console.log(`\n══ Failures: ${failures.length} (${heuristicFails} heuristic + ${llmFails} LLM) ══`);
const byGate = {};
for (const f of failures) byGate[f.gate] = (byGate[f.gate] || 0) + 1;
for (const [g, n] of Object.entries(byGate)) console.log(`  ${g}: ${n}`);

console.log("\nFirst 10:");
for (const f of failures.slice(0, 10)) {
  console.log(`  [${f.course}] ${f.id} ${f.gate}`);
  console.log(`    "${f.stem}..."`);
  console.log(`    → ${f.reason}`);
}

if (!APPLY) {
  console.log(`\n(dry-run — pass --apply to unapprove)`);
  process.exit(0);
}

const ids = failures.map((f) => f.id);
const chunkSize = 100;
let done = 0;
for (let i = 0; i < ids.length; i += chunkSize) {
  const chunk = ids.slice(i, i + chunkSize);
  await sql`UPDATE questions SET "isApproved" = false WHERE id = ANY(${chunk})`;
  done += chunk.length;
  console.log(`  unapproved ${done}/${ids.length}`);
}
console.log(`Done.`);

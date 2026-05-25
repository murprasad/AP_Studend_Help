/**
 * Sprint B-lite — Item Performance Engine (UARP §6.1).
 *
 * Computes per-question psychometric metrics from student_responses table.
 * Designed to be safe at any data scale:
 *  - n < MIN_N: skip (insufficient signal)
 *  - MIN_N <= n < DISC_N: compute basic metrics only (difficulty, distractor freq)
 *  - n >= DISC_N: also compute upper/lower discrimination index
 *
 * Output: data/question-performance-snapshot.json (no DB migration needed yet;
 * Sprint D will lift this into a real table when admin panel is built).
 *
 * Flags emitted (review-only, do NOT auto-unapprove):
 *  - dead-distractor: any wrong-answer letter chosen by < 5% of respondents
 *  - too-easy: p_correct > 0.95 with n >= 20
 *  - too-hard: p_correct < 0.10 with n >= 20
 *  - low-discrimination: discrimination < 0.10 with n >= DISC_N
 *  - time-anomaly: p75 / median time-spent > 3.0 (confusing question)
 *
 * Usage:
 *   node _item-performance-sweep.mjs            # write snapshot, report summary
 *   node _item-performance-sweep.mjs --apply    # also flag low-disc / dead-distractor in Q.metadata
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
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
const MIN_N = Number(args["min-n"] ?? 5);        // minimum responses to compute basic metrics
const DISC_N = Number(args["disc-n"] ?? 30);      // textbook minimum for discrimination
const DEAD_DISTRACTOR_PCT = 0.05;                  // < 5% of respondents = dead
const TOO_EASY = 0.95;
const TOO_HARD = 0.10;
const LOW_DISC = 0.10;
const TIME_ANOMALY = 3.0;

console.log(`Sprint B-lite — Item Performance Sweep`);
console.log(`MIN_N=${MIN_N} DISC_N=${DISC_N} dead<${DEAD_DISTRACTOR_PCT*100}%  too-easy>${TOO_EASY}  too-hard<${TOO_HARD}  low-disc<${LOW_DISC}`);

// Pull all responses joined to questions
const rows = await sql`
  SELECT
    sr."questionId" AS qid,
    sr."userId" AS uid,
    sr."studentAnswer" AS answer,
    sr."isCorrect" AS correct,
    sr."timeSpentSecs" AS time_secs,
    q.course::text AS course,
    q."correctAnswer" AS correct_letter
  FROM student_responses sr
  JOIN questions q ON q.id = sr."questionId"
  WHERE q."isApproved" = true
`;
console.log(`Loaded ${rows.length.toLocaleString()} responses`);

// Per-user total-correct (needed for discrimination split)
const userCorrect = new Map();
const userTotal = new Map();
for (const r of rows) {
  userTotal.set(r.uid, (userTotal.get(r.uid) || 0) + 1);
  if (r.correct) userCorrect.set(r.uid, (userCorrect.get(r.uid) || 0) + 1);
}
const userScore = new Map();
for (const uid of userTotal.keys()) {
  userScore.set(uid, (userCorrect.get(uid) || 0) / userTotal.get(uid));
}

// Group responses by question
const byQ = new Map();
for (const r of rows) {
  if (!byQ.has(r.qid)) byQ.set(r.qid, { course: r.course, correctLetter: r.correct_letter, responses: [] });
  byQ.get(r.qid).responses.push(r);
}

const snapshot = [];
const flags = { deadDistractor: 0, tooEasy: 0, tooHard: 0, lowDisc: 0, timeAnomaly: 0 };
const skipped = { underMinN: 0 };

for (const [qid, info] of byQ) {
  const n = info.responses.length;
  if (n < MIN_N) { skipped.underMinN++; continue; }

  const nCorrect = info.responses.filter((r) => r.correct).length;
  const pCorrect = nCorrect / n;

  // Distractor selection counts
  const letterCounts = {};
  for (const r of info.responses) letterCounts[r.answer] = (letterCounts[r.answer] || 0) + 1;
  const distractorPcts = {};
  for (const [letter, count] of Object.entries(letterCounts)) distractorPcts[letter] = count / n;

  // Dead-distractor: wrong-answer letters with < 5% selection (excluding the correct letter)
  const deadDistractors = Object.entries(distractorPcts)
    .filter(([letter, pct]) => letter !== info.correctLetter && pct < DEAD_DISTRACTOR_PCT)
    .map(([letter]) => letter);

  // Time stats
  const times = info.responses.map((r) => r.time_secs).filter((t) => t > 0).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : 0;
  const p75 = times.length ? times[Math.floor(times.length * 0.75)] : 0;
  const timeRatio = median > 0 ? p75 / median : 1;

  // Discrimination (only if n >= DISC_N)
  let discrimination = null;
  if (n >= DISC_N) {
    // Sort respondents by their overall score, split top 27% / bottom 27%
    const respondentsByScore = info.responses
      .map((r) => ({ correct: r.correct, score: userScore.get(r.uid) ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const cutoff = Math.floor(n * 0.27);
    const upper = respondentsByScore.slice(0, cutoff);
    const lower = respondentsByScore.slice(-cutoff);
    const pUpper = upper.filter((r) => r.correct).length / upper.length;
    const pLower = lower.filter((r) => r.correct).length / lower.length;
    discrimination = pUpper - pLower;
  }

  const issues = [];
  if (deadDistractors.length > 0) { issues.push(`dead-distractor:${deadDistractors.join(",")}`); flags.deadDistractor++; }
  if (n >= 20 && pCorrect > TOO_EASY) { issues.push("too-easy"); flags.tooEasy++; }
  if (n >= 20 && pCorrect < TOO_HARD) { issues.push("too-hard"); flags.tooHard++; }
  if (discrimination !== null && discrimination < LOW_DISC) { issues.push(`low-discrimination:${discrimination.toFixed(2)}`); flags.lowDisc++; }
  if (timeRatio > TIME_ANOMALY) { issues.push(`time-anomaly:${timeRatio.toFixed(1)}x`); flags.timeAnomaly++; }

  snapshot.push({
    qid, course: info.course, n, pCorrect: Number(pCorrect.toFixed(3)),
    discrimination: discrimination !== null ? Number(discrimination.toFixed(3)) : null,
    distractorPcts, deadDistractors, medianTime: median, p75Time: p75,
    issues,
  });
}

// Write snapshot
const outDir = path.join(process.cwd(), "data");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "question-performance-snapshot.json");
writeFileSync(outPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  thresholds: { MIN_N, DISC_N, DEAD_DISTRACTOR_PCT, TOO_EASY, TOO_HARD, LOW_DISC, TIME_ANOMALY },
  totals: { questionsAnalyzed: snapshot.length, skippedUnderMinN: skipped.underMinN, flags },
  questions: snapshot,
}, null, 2));

console.log(`\n══ Summary ══`);
console.log(`Questions with responses:       ${byQ.size.toLocaleString()}`);
console.log(`Analyzed (n>=${MIN_N}):              ${snapshot.length.toLocaleString()}`);
console.log(`Skipped (n<${MIN_N}):                ${skipped.underMinN.toLocaleString()}`);
console.log(`\nFlags raised (review-only):`);
for (const [flag, count] of Object.entries(flags)) {
  console.log(`  ${flag.padEnd(20)} ${count}`);
}
console.log(`\nSnapshot: ${outPath}`);

if (!APPLY) {
  console.log(`\n(dry-run — no DB changes. Use --apply to update Question.metadata with flags.)`);
  process.exit(0);
}

// Apply mode: write flags to Question table. For now, skip — schema has no metadata field.
// Sprint D will add proper column; until then snapshot file is the source of truth.
console.log(`\n--apply requested but Question table has no metadata JSON column yet.`);
console.log(`Snapshot file is the source of truth until Sprint D adds the column.`);
console.log(`To unapprove flagged Qs, pipe specific issue types through _sweep-full-gates.mjs-style logic.`);

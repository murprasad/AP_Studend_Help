/**
 * UARP §16 — Trust Certification Engine (Sprint D partial: aggregation only).
 *
 * Aggregates outputs from existing gate layers into a single per-question
 * trustScore (0-100) and certification tier (gold/silver/bronze/rejected).
 *
 * Inputs (no LLM calls; pure aggregation):
 *  - Deterministic gates pass/fail (45+ gates from _question-gates.mjs)
 *  - Stimulus presence
 *  - Time-anomaly flag from item-performance-snapshot.json
 *  - Template-collapse flag from cognitive-diversity-report.json
 *  - Render-hazard flag (already in gates)
 *
 * Outputs:
 *  - Writes trustScore + certification columns to Question table (added 2026-05-25)
 *  - JSON snapshot for admin/CEO panel
 *
 * Tiers (calibrated against today's bank quality):
 *   gold     : 90-100  — ready for premium serve, no concerns
 *   silver   : 75-89   — fine for standard serve, minor friction
 *   bronze   : 60-74   — review-only / regen candidate
 *   rejected : <60     — auto-unapprove
 */
import "dotenv/config";
import { runDeterministicGates } from "./lib/_question-gates.mjs";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const APPLY = process.argv.includes("--apply");

// Load aux data
function loadJson(p) {
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
}
const perfSnap = loadJson(path.join(process.cwd(), "data/question-performance-snapshot.json"));
const cogReport = loadJson(path.join(process.cwd(), "data/cognitive-diversity-report.json"));

// Build lookups
const timeAnomalyIds = new Set();
const lowDiscIds = new Set();
const deadDistractorIds = new Set();
if (perfSnap?.questions) {
  for (const q of perfSnap.questions) {
    if (q.issues?.some((i) => i.startsWith("time-anomaly"))) timeAnomalyIds.add(q.qid);
    if (q.issues?.some((i) => i.startsWith("low-discrimination"))) lowDiscIds.add(q.qid);
    if (q.issues?.some((i) => i.startsWith("dead-distractor"))) deadDistractorIds.add(q.qid);
  }
}
const templateClusterIds = new Set();
if (cogReport?.flaggedClusters) {
  for (const cluster of cogReport.flaggedClusters) {
    for (const id of cluster.ids) templateClusterIds.add(id);
  }
}

// Pull all approved MCQs
const rows = await sql`
  SELECT id, course::text AS course, "questionText", options, "correctAnswer",
         explanation, stimulus, unit::text AS unit, "modelUsed", difficulty::text AS difficulty
  FROM questions
  WHERE "isApproved" = true AND "questionType" = 'MCQ'
`;
console.log(`Scoring ${rows.length.toLocaleString()} approved MCQs…`);

const tiers = { gold: 0, silver: 0, bronze: 0, rejected: 0 };
const snapshot = [];

function scoreQuestion(r) {
  let score = 100;
  const debits = [];

  // Deterministic gate failures are catastrophic — should have already
  // unapproved them but be defensive.
  const opts = Array.isArray(r.options) ? r.options : JSON.parse(r.options || "[]");
  const gate = runDeterministicGates({
    questionText: r.questionText, options: opts, correctAnswer: r.correctAnswer,
    explanation: r.explanation, course: r.course,
  });
  if (!gate.ok) { score -= 50; debits.push(`gate-fail:${gate.gate}`); }

  // Has stimulus when stem implies it should
  if (/\b(figure|graph|table|passage|diagram|chart)\s+(?:above|below|shown)\b/i.test(r.questionText) && !r.stimulus) {
    score -= 20; debits.push("missing-stimulus-impl");
  }

  // Telemetry-driven debits (UARP §6.1)
  if (timeAnomalyIds.has(r.id)) { score -= 8; debits.push("time-anomaly"); }
  if (lowDiscIds.has(r.id)) { score -= 15; debits.push("low-discrimination"); }
  if (deadDistractorIds.has(r.id)) { score -= 10; debits.push("dead-distractor"); }

  // Cognitive diversity (UARP §6.4) — template-cluster member
  if (templateClusterIds.has(r.id)) { score -= 5; debits.push("template-collapse-cluster"); }

  // Explanation quality bonuses
  if ((r.explanation?.length || 0) > 150) score += 2;
  if (/\b(because|therefore|since|by|using|apply)\b/i.test(r.explanation || "")) score += 1;

  score = Math.max(0, Math.min(100, score));
  const cert = score >= 90 ? "gold" : score >= 75 ? "silver" : score >= 60 ? "bronze" : "rejected";
  return { score, cert, debits };
}

async function withRetry(fn) {
  for (let i = 0; i < 3; i++) {
    try { return await fn(); }
    catch (e) { if (i === 2 || e.code !== "ECONNRESET") throw e; await new Promise(r => setTimeout(r, 1500)); }
  }
}

let i = 0, applied = 0;
for (const r of rows) {
  const { score, cert, debits } = scoreQuestion(r);
  tiers[cert]++;
  snapshot.push({ qid: r.id, course: r.course, score, cert, debits });
  i++;
  if (i % 2000 === 0) console.log(`  scored ${i}/${rows.length}`);
  if (APPLY) {
    await withRetry(() => sql`UPDATE questions SET "trustScore" = ${score}, certification = ${cert} WHERE id = ${r.id}`);
    applied++;
  }
}

const outDir = path.join(process.cwd(), "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "trust-certification-snapshot.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  totals: { scored: rows.length, ...tiers },
  byCourse: aggregateByCourse(snapshot),
  worstOffenders: snapshot.filter(s => s.cert === "rejected").slice(0, 50),
}, null, 2));

function aggregateByCourse(snap) {
  const m = {};
  for (const s of snap) {
    if (!m[s.course]) m[s.course] = { gold: 0, silver: 0, bronze: 0, rejected: 0, total: 0, sum: 0 };
    m[s.course][s.cert]++;
    m[s.course].total++;
    m[s.course].sum += s.score;
  }
  const out = {};
  for (const [c, v] of Object.entries(m)) {
    out[c] = { ...v, avgScore: Math.round(v.sum / v.total) };
    delete out[c].sum;
  }
  return out;
}

console.log(`\n══ Trust Certification Summary ══`);
console.log(`Scored:    ${rows.length.toLocaleString()}`);
console.log(`Gold:      ${tiers.gold.toLocaleString()} (${(100*tiers.gold/rows.length).toFixed(1)}%)`);
console.log(`Silver:    ${tiers.silver.toLocaleString()} (${(100*tiers.silver/rows.length).toFixed(1)}%)`);
console.log(`Bronze:    ${tiers.bronze.toLocaleString()} (${(100*tiers.bronze/rows.length).toFixed(1)}%)`);
console.log(`Rejected:  ${tiers.rejected.toLocaleString()} (${(100*tiers.rejected/rows.length).toFixed(1)}%)`);
console.log(`\nSnapshot: data/trust-certification-snapshot.json`);
if (APPLY) console.log(`Applied: trustScore + certification written to ${applied} rows`);
else console.log(`(dry-run — use --apply to write to DB)`);

/**
 * scripts/recent-negative-feedback.mjs (PrepLion)
 *
 * Lists thumbs-down session feedback from the last 24 hours, joined with
 * the session's course. Outputs Markdown to stdout AND a JSON artifact
 * for downstream tooling.
 *
 * Run:
 *   node scripts/recent-negative-feedback.mjs
 *
 * Env: DATABASE_URL
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const HOURS = Number(process.argv[2] ?? 24);
const since = new Date(Date.now() - HOURS * 60 * 60 * 1000);

console.log(`PrepLion negative-feedback report — last ${HOURS}h (since ${since.toISOString()})`);
console.log("─".repeat(70));

const rows = await sql`
  SELECT
    sf.id,
    sf."sessionId",
    sf."userId",
    sf.rating,
    sf."feedbackText",
    sf.context,
    sf."createdAt",
    ps.course::text AS course,
    ps."sessionType"::text AS session_type,
    ps."totalQuestions",
    ps."correctAnswers",
    u.email,
    u."gradeLevel",
    u.track::text AS track
  FROM session_feedback sf
  LEFT JOIN practice_sessions ps ON ps.id = sf."sessionId"
  LEFT JOIN users u ON u.id = sf."userId"
  WHERE sf.rating = -1
    AND sf."createdAt" >= ${since}
  ORDER BY sf."createdAt" DESC
  LIMIT 200
`;

console.log(`\nThumbs-down count: ${rows.length}`);

// Per-course breakdown
const byCourse = {};
for (const r of rows) {
  const c = r.course || "(unknown)";
  byCourse[c] = (byCourse[c] || 0) + 1;
}
const sortedCourses = Object.entries(byCourse).sort((a, b) => b[1] - a[1]);
console.log("\nBy course:");
for (const [c, n] of sortedCourses) console.log(`  ${c.padEnd(40)} ${n}`);

// Comments only
console.log("\n─".repeat(70));
console.log("Comments (non-empty):");
console.log("─".repeat(70));
let withComments = 0;
for (const r of rows) {
  if (!r.feedbackText || r.feedbackText.trim().length < 3) continue;
  withComments++;
  const score = `${r.correctAnswers ?? "?"}/${r.totalQuestions ?? "?"}`;
  const stamp = new Date(r.createdAt).toISOString().slice(0, 19);
  const userTag = r.email ? r.email.split("@")[0] : r.userId.slice(0, 8);
  console.log(`\n[${stamp}] ${r.course} · ${r.sessionType} · ${score} · ${userTag} (${r.gradeLevel ?? "?"}/${r.track ?? "?"}) · ${r.context ?? "completion"}`);
  console.log(`  "${r.feedbackText.replace(/\s+/g, " ").trim()}"`);
}
console.log(`\nTotal with comments: ${withComments}/${rows.length}`);

// Write JSON artifact
const outDir = join(process.cwd(), "data", "feedback-reports");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `negative-feedback-${HOURS}h-${ts}.json`);
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), windowHours: HOURS, totalCount: rows.length, byCourse: Object.fromEntries(sortedCourses), entries: rows }, null, 2));
console.log(`\nJSON artifact: ${outFile}`);

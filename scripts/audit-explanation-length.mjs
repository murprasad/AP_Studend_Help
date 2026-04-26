#!/usr/bin/env node
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  console.log("\n=== Explanation length audit (MCQ only) ===\n");

  const stats = await sql`
    SELECT
      course,
      COUNT(*)::int AS n,
      AVG(length(explanation))::int AS avg_chars,
      MIN(length(explanation))::int AS min_chars,
      MAX(length(explanation))::int AS max_chars,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY length(explanation))::int AS p50,
      percentile_cont(0.9) WITHIN GROUP (ORDER BY length(explanation))::int AS p90,
      percentile_cont(0.95) WITHIN GROUP (ORDER BY length(explanation))::int AS p95
    FROM questions
    WHERE "questionType" = 'MCQ'
    GROUP BY course
    ORDER BY avg_chars DESC
  `;

  console.log("course                          n    avg   p50   p90   p95   max");
  console.log("─".repeat(75));
  for (const r of stats) {
    console.log(
      `${r.course.padEnd(30)} ${String(r.n).padStart(4)}  ${String(r.avg_chars).padStart(4)}  ${String(r.p50).padStart(4)}  ${String(r.p90).padStart(4)}  ${String(r.p95).padStart(4)}  ${String(r.max_chars).padStart(5)}`
    );
  }

  // 3 longest examples — what does a too-long one look like?
  console.log("\n=== 3 longest explanations (sample) ===\n");
  const longest = await sql`
    SELECT id, course, length(explanation) AS chars, explanation
    FROM questions
    WHERE "questionType" = 'MCQ'
    ORDER BY length(explanation) DESC
    LIMIT 3
  `;
  for (const q of longest) {
    console.log(`--- ${q.id.slice(0, 8)} ${q.course} (${q.chars} chars) ---`);
    console.log(q.explanation.slice(0, 500));
    console.log("...");
    console.log();
  }
})().catch(e => { console.error(e); process.exit(1); });

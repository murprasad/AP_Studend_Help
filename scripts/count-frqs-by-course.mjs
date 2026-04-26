#!/usr/bin/env node
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const rows = await sql`
    SELECT course, COUNT(*)::int AS n
    FROM free_response_questions
    WHERE "isApproved" = true
    GROUP BY course
    ORDER BY course
  `;
  console.log("\n=== FRQs in production by course ===\n");
  let total = 0;
  for (const r of rows) {
    console.log(`  ${r.course.padEnd(35)} ${String(r.n).padStart(4)}`);
    total += r.n;
  }
  console.log(`  ${"─".repeat(50)}`);
  console.log(`  ${"TOTAL".padEnd(35)} ${String(total).padStart(4)}\n`);
})().catch(e => { console.error(e); process.exit(1); });

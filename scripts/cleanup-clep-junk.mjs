// One-off: remove stale/junk CLEP_* and DSST_* rows from StudentNest.
// CLEP/DSST support sunset to PrepLion; only unapproved rows are deleted
// so any legacy student-response FK links to approved rows stay intact.
//
// Shows before-counts, prompts nothing (user pre-authorized cleanup),
// then deletes and shows after-counts.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("── Before ──");
const before = await sql`
  SELECT
    CASE
      WHEN course LIKE 'CLEP_%' THEN 'CLEP_*'
      WHEN course LIKE 'DSST_%' THEN 'DSST_*'
      ELSE 'AP/SAT/ACT'
    END AS family,
    COUNT(*) FILTER (WHERE "isApproved" = false)::int AS unapproved,
    COUNT(*) FILTER (WHERE "isApproved" = true)::int  AS approved
  FROM "questions"
  GROUP BY 1
  ORDER BY 1
`;
for (const r of before) {
  console.log(String(r.family).padEnd(14), `unapproved=${r.unapproved}`.padEnd(22), `approved=${r.approved}`);
}

// Delete unapproved CLEP_* and DSST_* rows in chunks to avoid huge single
// statements against Neon HTTP (which has a 16MB response cap).
console.log("\n── Deleting unapproved CLEP/DSST rows ──");
let deleted = 0;
let i = 0;
while (true) {
  const res = await sql`
    DELETE FROM "questions"
    WHERE id IN (
      SELECT id FROM "questions"
      WHERE "isApproved" = false
        AND (course LIKE 'CLEP_%' OR course LIKE 'DSST_%')
      LIMIT 1000
    )
  `;
  // Neon HTTP driver returns an empty array for DELETE with count via a
  // different path; easier to verify progress by re-counting each iteration.
  const remaining = await sql`
    SELECT COUNT(*)::int AS n FROM "questions"
    WHERE "isApproved" = false AND (course LIKE 'CLEP_%' OR course LIKE 'DSST_%')
  `;
  const stillLeft = remaining[0].n;
  i++;
  console.log(`  batch ${i}: ${stillLeft} unapproved CLEP/DSST rows left`);
  if (stillLeft === 0) break;
  if (i > 200) {
    console.log("  giving up after 200 batches — investigate manually");
    break;
  }
}

console.log("\n── After ──");
const after = await sql`
  SELECT
    CASE
      WHEN course LIKE 'CLEP_%' THEN 'CLEP_*'
      WHEN course LIKE 'DSST_%' THEN 'DSST_*'
      ELSE 'AP/SAT/ACT'
    END AS family,
    COUNT(*) FILTER (WHERE "isApproved" = false)::int AS unapproved,
    COUNT(*) FILTER (WHERE "isApproved" = true)::int  AS approved
  FROM "questions"
  GROUP BY 1
  ORDER BY 1
`;
for (const r of after) {
  console.log(String(r.family).padEnd(14), `unapproved=${r.unapproved}`.padEnd(22), `approved=${r.approved}`);
}

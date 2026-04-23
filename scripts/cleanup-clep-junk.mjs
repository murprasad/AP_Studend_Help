// One-off: retire stale/junk CLEP_* and DSST_* rows. CLEP/DSST sunset
// to PrepLion; StudentNest only serves AP/SAT/ACT now.
//
// NOTE: Original approach was DELETE, but those rows are referenced by
// session_questions (FK constraint) from old practice sessions. Switching
// to soft-retire: set isApproved=false, leaving the rows + FK intact.
// No user can access them since VALID_AP_COURSES filters + the route
// validators already reject CLEP_*/DSST_* on the /api/practice path.
//
// Shows before / after counts and uses ApCourse::text LIKE because
// Postgres enum columns don't support LIKE directly.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log("── Before ──");
const before = await sql`
  SELECT
    CASE
      WHEN course::text LIKE 'CLEP\_%' THEN 'CLEP_*'
      WHEN course::text LIKE 'DSST\_%' THEN 'DSST_*'
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

console.log("\n── Retiring approved CLEP/DSST rows (isApproved=false) ──");
// Soft-retire approved CLEP/DSST rows. Unapproved ones stay unapproved.
const retireRes = await sql`
  UPDATE "questions"
  SET "isApproved" = false
  WHERE "isApproved" = true
    AND (course::text LIKE 'CLEP\_%' OR course::text LIKE 'DSST\_%')
`;
console.log("  retire statement ran");

// Try to truly delete unapproved CLEP/DSST rows in chunks. Any row that
// has an FK from session_questions will raise 23503 — catch + skip.
console.log("\n── Deleting orphan unapproved CLEP/DSST rows (skip FK-referenced) ──");
let deleted = 0;
let skippedFk = 0;
for (let i = 0; i < 200; i++) {
  // Pick a batch of unapproved CLEP/DSST ids that have NO session_questions
  // reference — these are safe to delete.
  const batch = await sql`
    SELECT q.id
    FROM "questions" q
    WHERE q."isApproved" = false
      AND (q.course::text LIKE 'CLEP\_%' OR q.course::text LIKE 'DSST\_%')
      AND NOT EXISTS (SELECT 1 FROM "session_questions" sq WHERE sq."questionId" = q.id)
    LIMIT 500
  `;
  if (batch.length === 0) break;
  for (const row of batch) {
    try {
      await sql`DELETE FROM "questions" WHERE id = ${row.id}`;
      deleted++;
    } catch (e) {
      if (String(e.message || "").includes("foreign key")) skippedFk++;
      else throw e;
    }
  }
  console.log(`  batch ${i + 1}: deleted=${deleted}  skipped_fk=${skippedFk}`);
  if (batch.length < 500) break;
}

console.log("\n── After ──");
const after = await sql`
  SELECT
    CASE
      WHEN course::text LIKE 'CLEP\_%' THEN 'CLEP_*'
      WHEN course::text LIKE 'DSST\_%' THEN 'DSST_*'
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
console.log(`\nTotal deleted: ${deleted}, skipped (FK-referenced): ${skippedFk}`);

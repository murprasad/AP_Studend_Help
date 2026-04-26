#!/usr/bin/env node
/**
 * Dedupe duplicate FRQs in production.
 *
 * Beta 8.2 incident (2026-04-26): 04-seed.mjs uses crypto.randomUUID()
 * for the id field with ON CONFLICT (id) DO NOTHING — but id is always
 * unique, so the conflict clause never fires. Every re-run of seed
 * created N more duplicate rows for the same (course, year, questionNumber).
 *
 * This script keeps the OLDEST row per (course, year, questionNumber)
 * and deletes the rest. Idempotent — safe to run multiple times.
 *
 * Run dry first to confirm scale:
 *   node scripts/dedupe-frqs.mjs --dry
 *   node scripts/dedupe-frqs.mjs        # actually delete
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const dryRun = process.argv.includes("--dry");

(async () => {
  console.log(`\n🔧 FRQ dedupe ${dryRun ? "(DRY RUN)" : "(WRITE)"}\n`);

  // Find duplicates
  const dups = await sql`
    SELECT course, year, "questionNumber", COUNT(*)::int AS n
    FROM free_response_questions
    WHERE "isApproved" = true
    GROUP BY course, year, "questionNumber"
    HAVING COUNT(*) > 1
    ORDER BY course, year, "questionNumber"
  `;

  if (dups.length === 0) {
    console.log("✓ No duplicates found.\n");
    return;
  }

  const total = dups.reduce((sum, d) => sum + d.n, 0);
  const toDelete = dups.reduce((sum, d) => sum + d.n - 1, 0);
  console.log(`Found ${dups.length} (course, year, Q#) groups with duplicates`);
  console.log(`Total rows in those groups: ${total}`);
  console.log(`Rows to delete (keep oldest 1 per group): ${toDelete}\n`);

  if (dups.length <= 25) {
    for (const d of dups) {
      console.log(`  ${d.course} ${d.year} Q${d.questionNumber}: ${d.n} copies`);
    }
  } else {
    for (const d of dups.slice(0, 10)) {
      console.log(`  ${d.course} ${d.year} Q${d.questionNumber}: ${d.n} copies`);
    }
    console.log(`  ... and ${dups.length - 10} more groups`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] No deletes performed. Re-run without --dry to apply.\n");
    return;
  }

  console.log("\nDeleting duplicates...");
  // For each (course, year, Q#) group with N copies, keep the OLDEST id
  // (smallest createdAt) and delete the rest.
  let deleted = 0;
  for (const d of dups) {
    // Get all ids in the group sorted by createdAt ascending.
    const rows = await sql`
      SELECT id FROM free_response_questions
      WHERE course = ${d.course}::"ApCourse"
        AND year = ${d.year}
        AND "questionNumber" = ${d.questionNumber}
        AND "isApproved" = true
      ORDER BY "createdAt" ASC
    `;
    // Skip first (keeper), delete rest.
    for (let i = 1; i < rows.length; i++) {
      await sql`DELETE FROM free_response_questions WHERE id = ${rows[i].id}`;
      deleted++;
    }
  }

  console.log(`\n✓ Deleted ${deleted} duplicate rows.`);

  // Final count
  const [{ n: finalCount }] = await sql`
    SELECT COUNT(*)::int AS n FROM free_response_questions WHERE "isApproved" = true
  `;
  console.log(`✓ Final count: ${finalCount} unique FRQs in production.\n`);
})().catch(e => { console.error("Fatal:", e); process.exit(1); });

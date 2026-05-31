#!/usr/bin/env node
/**
 * 2026-05-31 — ACT_MATH 5-choice bank audit (#103 A3 / SN=ACT parity).
 *
 * Enhanced ACT (2025) changed Math from 5-option MCQ to 4-option. SN's
 * existing approved ACT_MATH questions were generated under the legacy
 * 5-option assumption and will now FAIL the deterministic option-count
 * gate.
 *
 * This audit reports:
 *   1. Total approved ACT_MATH questions
 *   2. How many have exactly 5 options (legacy — need regen)
 *   3. How many have exactly 4 options (already Enhanced-compliant)
 *   4. How many have other counts (data error — flag for unapprove)
 *   5. Sample IDs from each bucket so I can spot-check correctness
 *
 * Usage:
 *   cd C:/Users/akkil/project/AP_Help
 *   node scripts/audit-act-math-5choice.mjs
 *
 * Prerequisites:
 *   DATABASE_URL set in .env or env
 *
 * Safe to run multiple times — read-only.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("✗ DATABASE_URL not set. Add it to .env or export it.");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

console.log("# ACT_MATH 5-choice → 4-choice audit — 2026-05-31");
console.log("Per Enhanced ACT (2025): every ACT MCQ is 4-choice. Math used");
console.log("to be 5-choice (the only common-exam 5-choice format) — now 4.");
console.log("");

// 1. Total approved ACT_MATH
const totalRows = await sql`
  SELECT COUNT(*)::int AS n FROM questions
  WHERE course = 'ACT_MATH'::"ApCourse" AND "isApproved" = true
`;
const total = totalRows[0]?.n ?? 0;
console.log(`Total approved ACT_MATH: ${total}`);

// 2. Bucket by jsonb_array_length(options)
const byCount = await sql`
  SELECT jsonb_array_length(options) AS opt_count, COUNT(*)::int AS n
  FROM questions
  WHERE course = 'ACT_MATH'::"ApCourse" AND "isApproved" = true
  GROUP BY jsonb_array_length(options)
  ORDER BY opt_count
`;

console.log("\n## Distribution by option count\n");
console.log("opt_count | approved Qs");
console.log("----------|------------");
let bucket5 = 0;
let bucket4 = 0;
let bucketOther = 0;
for (const row of byCount) {
  const c = row.opt_count;
  const n = row.n;
  console.log(`    ${c}     |   ${n}`);
  if (c === 5) bucket5 = n;
  else if (c === 4) bucket4 = n;
  else bucketOther += n;
}

console.log("\n## Summary\n");
const fivePct = total > 0 ? ((bucket5 / total) * 100).toFixed(1) : "0";
const fourPct = total > 0 ? ((bucket4 / total) * 100).toFixed(1) : "0";
console.log(`5-choice (legacy, need regen):    ${bucket5} (${fivePct}%)`);
console.log(`4-choice (Enhanced-compliant):    ${bucket4} (${fourPct}%)`);
console.log(`Other counts (data error):        ${bucketOther}`);

// 3. Sample 5-choice IDs for spot-check
if (bucket5 > 0) {
  const samples = await sql`
    SELECT id, "questionText"
    FROM questions
    WHERE course = 'ACT_MATH'::"ApCourse"
      AND "isApproved" = true
      AND jsonb_array_length(options) = 5
    LIMIT 5
  `;
  console.log("\n## Sample 5-choice IDs (for spot-check before regen)\n");
  for (const s of samples) {
    const stem = (s.questionText ?? "").slice(0, 80).replace(/\s+/g, " ");
    console.log(`  ${s.id} — ${stem}…`);
  }
}

// 4. Recommended action
console.log("\n## Recommended next step\n");
if (bucket5 === 0) {
  console.log("✅ NO 5-choice questions in the bank — A3 is a no-op. Skip regen.");
} else if (bucket5 < 50) {
  console.log(`Small batch (${bucket5} Qs). Single-pass regen + un-approve.`);
  console.log("  Run: node scripts/_regen-act-math-4choice.mjs (script TBD)");
} else if (bucket5 < 300) {
  console.log(`Medium batch (${bucket5} Qs). Overnight regen cycle.`);
  console.log("  Run: node scripts/_regen-act-math-4choice.mjs --batch=50");
} else {
  console.log(`Large batch (${bucket5} Qs). Weekend cron + Haiku ensemble.`);
  console.log("  Schedule via GitHub Actions worker.");
}

if (bucketOther > 0) {
  console.log(`\n⚠️  ${bucketOther} questions have neither 4 nor 5 options — un-approve.`);
}

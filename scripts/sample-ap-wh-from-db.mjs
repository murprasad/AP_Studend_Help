#!/usr/bin/env node
/**
 * Sample 30 AP World History MCQs and any FRQ-type questions from prod DB.
 * Output a JSON file for analysis.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { writeFile } from "node:fs/promises";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const mcqs = await sql`
    SELECT id, "questionType", "questionText", stimulus, options, "correctAnswer",
           explanation, difficulty, unit, topic, "stimulusImageUrl", "modelUsed",
           "createdAt"
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY'
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
    ORDER BY RANDOM()
    LIMIT 30
  `;

  const frqs = await sql`
    SELECT id, "questionType", "questionText", stimulus, "correctAnswer",
           explanation, difficulty, unit, topic, "stimulusImageUrl"
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY'
      AND "isApproved" = true
      AND "questionType" IN ('SAQ','DBQ','LEQ','FRQ')
    LIMIT 30
  `;

  const totals = await sql`
    SELECT "questionType", COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "isApproved" = true
    GROUP BY "questionType"
    ORDER BY n DESC
  `;

  const byUnit = await sql`
    SELECT unit, COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "isApproved" = true
    GROUP BY unit
    ORDER BY n DESC
  `;

  const visualCount = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY'
      AND "isApproved" = true
      AND "stimulusImageUrl" IS NOT NULL
      AND "stimulusImageUrl" != ''
  `;

  const totalApproved = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "isApproved" = true
  `;

  // Stimulus length distribution for MCQs
  const stimLen = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE stimulus IS NULL OR stimulus = '')::int AS no_stimulus,
      COUNT(*) FILTER (WHERE LENGTH(stimulus) > 0 AND LENGTH(stimulus) < 80)::int AS short_stim,
      COUNT(*) FILTER (WHERE LENGTH(stimulus) >= 80 AND LENGTH(stimulus) < 200)::int AS med_stim,
      COUNT(*) FILTER (WHERE LENGTH(stimulus) >= 200 AND LENGTH(stimulus) < 500)::int AS long_stim,
      COUNT(*) FILTER (WHERE LENGTH(stimulus) >= 500)::int AS xlong_stim,
      ROUND(AVG(LENGTH(stimulus))) AS avg_stim_chars,
      ROUND(AVG(LENGTH("questionText"))) AS avg_qtext_chars,
      ROUND(AVG(LENGTH(explanation))) AS avg_expl_chars
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY'
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
  `;

  const out = {
    totals: totals,
    byUnit: byUnit,
    totalApproved: totalApproved[0].n,
    visualCount: visualCount[0].n,
    visualPct: ((visualCount[0].n / totalApproved[0].n) * 100).toFixed(1),
    mcqStats: stimLen[0],
    sampleMcqs: mcqs,
    sampleFrqs: frqs,
  };

  await writeFile(
    "C:/Users/akkil/project/AP_Help/data/cb-frqs/AP_WORLD_HISTORY/2025-our-sample.json",
    JSON.stringify(out, null, 2),
    "utf8"
  );

  console.log(`Total approved: ${out.totalApproved}`);
  console.log(`Visual stimuli (stimulusImageUrl): ${out.visualCount} (${out.visualPct}%)`);
  console.log(`\nBy questionType:`);
  for (const t of totals) console.log(`  ${t.questionType}: ${t.n}`);
  console.log(`\nBy unit (top):`);
  for (const u of byUnit.slice(0, 12)) console.log(`  ${u.unit}: ${u.n}`);
  console.log(`\nMCQ stats:`);
  console.log(JSON.stringify(out.mcqStats, null, 2));
  console.log(`\nFRQ samples found: ${frqs.length}`);
  console.log(`Sample written to data/cb-frqs/AP_WORLD_HISTORY/2025-our-sample.json`);
})();

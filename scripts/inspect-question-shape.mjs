#!/usr/bin/env node
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const rows = await sql`
    SELECT id, "questionText", options, "correctAnswer", stimulus
    FROM questions
    WHERE course = 'AP_WORLD_HISTORY' AND "questionType" = 'MCQ'
    LIMIT 3
  `;
  for (const r of rows) {
    console.log(`\nID: ${r.id.slice(0, 12)}`);
    console.log(`Q: ${r.questionText.slice(0, 100)}`);
    console.log(`Stimulus: ${r.stimulus ? r.stimulus.slice(0, 80) : 'NULL'}`);
    console.log(`Options type: ${typeof r.options}, value:`, JSON.stringify(r.options).slice(0, 300));
    console.log(`correctAnswer: "${r.correctAnswer}" (type: ${typeof r.correctAnswer})`);
  }
})().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Escape currency $ to \$ in MCQ stimuli to prevent remark-math from
 * misinterpreting it as a KaTeX delimiter.
 *
 * Pattern: $<digit> followed by space, comma, period, or end-of-string.
 * Only escape standalone occurrences — leave $...$ math expressions alone.
 *
 * Heuristic: count $ in the stimulus. If even, assume all are math
 * delimiters (don't touch). If odd, find the orphan $<digit> patterns
 * and escape them.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, stimulus FROM questions
  WHERE "isApproved" = true AND stimulus IS NOT NULL AND stimulus LIKE '%$%'
`;
console.log("Scanning", rows.length, "stimuli with $ chars...");

let fixed = 0, errors = 0;
for (const r of rows) {
  let s = r.stimulus;
  // Strip $$...$$ display-math regions to count inline $ separately
  const withoutDisplay = s.replace(/\$\$[\s\S]*?\$\$/g, "");
  const inlineDollars = (withoutDisplay.match(/\$/g) || []).length;
  if (inlineDollars % 2 === 0) continue; // balanced; don't touch

  // Odd $ — likely a currency $ mixed in. Escape $<digit> patterns where
  // the $ is followed by a digit (with optional , or .).
  // Only escape WHEN there's no obvious math context — match $<digit>{1,}
  // followed by whitespace/punctuation/EOS.
  const newS = s.replace(/(^|\s)\$(\d[\d,]*(?:\.\d+)?)([^\$\w]|$)/g, "$1\\$$$2$3");
  if (newS !== s) {
    try {
      await sql`UPDATE questions SET stimulus = ${newS} WHERE id = ${r.id}`;
      fixed++;
    } catch (e) {
      errors++;
    }
  }
}
console.log("Fixed:", fixed, "Errors:", errors);

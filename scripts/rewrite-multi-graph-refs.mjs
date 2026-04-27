#!/usr/bin/env node
/**
 * Rewrite "Four graphs showing..." stimuli to "Consider four scenarios:".
 *
 * User reported (2026-04-27): some questions show "Four graphs showing X
 * versus Y... Graph A: ... Graph B: ..." but only TEXT descriptions
 * appear — no actual visualizations rendered. Student can technically
 * answer by reading descriptions (and matching to options like "A) Linear
 * increase to saturation"), but the wording lies about non-existent visuals.
 *
 * Path 1 fix: rewrite the wording. "Four graphs showing X versus Y..." →
 * "Consider four hypothetical relationships between X and Y:". Replaces
 * "Graph A:" → "Scenario A:" so options that say "Graph A" still match
 * when re-keyed by scenario letter.
 *
 * Affects ~13 stimuli (10 AP_STATS, 3 AP_BIO).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, course, "questionText", stimulus, options FROM questions
  WHERE "isApproved" = true
    AND (stimulus ~* 'four graphs|four charts|three graphs|three charts|graph i:|graph a:|graph b:|graph c:|graph d:|graph 1:|graph 2:')
`;
console.log("Stimuli to rewrite:", rows.length);

let fixed = 0, errors = 0;
for (const r of rows) {
  let s = r.stimulus;
  // Rewrite preamble
  s = s.replace(/^(Four|Three|Five) graphs?\s+(showing|depicting|illustrating)\s+/i,
                "Consider $1 hypothetical relationships ");
  s = s.replace(/^(Four|Three|Five) charts?\s+(showing|depicting|illustrating)\s+/i,
                "Consider $1 hypothetical relationships ");
  s = s.replace(/^Four graphs are shown,/i, "Consider four hypothetical scenarios,");
  s = s.replace(/^Three graphs are shown,/i, "Consider three hypothetical scenarios,");
  // Rewrite "Graph X:" → "Scenario X:" only at line start (so we don't break
  // option text like "A) Graph I: staurosporine inhibits PKB").
  s = s.replace(/^Graph ([A-EI-V]+):/gim, "Scenario $1:");

  if (s !== r.stimulus) {
    try {
      await sql`UPDATE questions SET stimulus = ${s} WHERE id = ${r.id}`;
      fixed++;
    } catch (e) {
      errors++;
    }
  }
}
console.log("Fixed:", fixed, "Errors:", errors);

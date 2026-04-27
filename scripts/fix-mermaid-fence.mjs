#!/usr/bin/env node
/**
 * Fix two Mermaid/code-block formatting bugs found 2026-04-27:
 *   1. Closing fence ``` followed by non-newline char → block never closes
 *      → entire content renders as plain text. Fix: insert \n\n after the
 *      closing fence.
 *   2. Mermaid edge-label `-->|label|>` typo (extra `>`) — already swept
 *      but redo as a safety net.
 *
 * Idempotent. Only writes if text actually changed.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, course, stimulus FROM questions
  WHERE stimulus LIKE '%\`\`\`%' AND "isApproved" = true
`;
console.log("Scanning", rows.length, "stimuli with code blocks...");

let fixed = 0, errors = 0;
for (const r of rows) {
  let s = r.stimulus;
  // Fix Mermaid edge-label typo
  s = s.replace(/-->\|([^|\n]+)\|>/g, "-->|$1|");
  s = s.replace(/==>\|([^|\n]+)\|>/g, "==>|$1|");
  // Insert blank line after closing fence when followed by non-newline content
  // Match `\`\`\`` followed by non-newline, non-backtick, non-EOF char
  s = s.replace(/```([^`\n][^`\n]*)/g, "```\n\n$1");
  // Also: if opening fence is followed immediately by content on same line
  // (e.g. "```mermaidA[node]"), that's a different bug — language tag has
  // no newline. Skip for now.
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

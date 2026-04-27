#!/usr/bin/env node
/**
 * Revert + repair fence-newline corruption from prior fix-mermaid-fence.mjs run.
 *
 * Earlier script inserted \n\n after EVERY ``` followed by non-newline char.
 * That broke OPENING fences:
 *   `\`\`\`mermaid` → `\`\`\`\n\nmermaid` (BROKEN)
 *
 * This script:
 *   1. Reverts the broken opening-fence insertion (`\`\`\`\\n\\n<lang>` → `\`\`\`<lang>`)
 *   2. Re-applies the closing-fence newline ONLY where it's needed: after
 *      a closing ``` that's followed by content on the same line, but NOT
 *      after a language tag.
 *
 * Idempotent.
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
  const before = s;

  // 1. Revert broken opening-fence insertions (where prior fix added \n\n after ``` before language tag).
  s = s.replace(/```\s*\n\s*\n\s*(mermaid|vega-lite|vegalite|python|json|text|js|ts|sql|java|cpp|html|css|bash|xml|yaml|md)\b/gi,
                "```$1");

  // 2. Closing-fence repair: insert \n\n after a ``` that's followed by
  //    non-newline content, IF that content is not a language tag.
  //    Match: ``` followed by (1+ char that isn't backtick or newline)
  //    where the leading char is NOT alphanumeric (i.e. likely punctuation
  //    or text content, not a language tag).
  s = s.replace(/```([^`\n][^`\n]*)/g, (match, after) => {
    // If 'after' looks like a language tag (alphabetic word), don't insert
    if (/^[a-zA-Z][\w-]*$/.test(after.trim())) return match;
    // If first char is whitespace, the closing fence already has space —
    // still need newline before content.
    return "```\n\n" + after.trimStart();
  });

  if (s !== before) {
    try {
      await sql`UPDATE questions SET stimulus = ${s} WHERE id = ${r.id}`;
      fixed++;
    } catch (e) {
      errors++;
    }
  }
}
console.log("Fixed:", fixed, "Errors:", errors);

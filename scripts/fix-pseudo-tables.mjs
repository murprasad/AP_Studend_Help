#!/usr/bin/env node
/**
 * Detect and fix pseudo-tables — data with pipe separators but missing
 * the markdown-table syntax that remark-gfm needs to render.
 *
 * Pattern (user-reported 2026-04-27):
 *   Time (min) | Glucose (mM) | ATP produced | NADH produced | Pyruvate (mM)
 *   0          | 10.0         | 0            | 0             | 0
 *   5          | 8.5          | 4            | 2             | 3.2
 *
 * Issues:
 *   - Rows don't start/end with `|`
 *   - No `|---|---|...|` separator row between header and data
 *
 * Fix produces:
 *   | Time (min) | Glucose (mM) | ATP produced | NADH produced | Pyruvate (mM) |
 *   |---|---|---|---|---|
 *   | 0 | 10.0 | 0 | 0 | 0 |
 *   | 5 | 8.5 | 4 | 2 | 3.2 |
 *
 * Heuristic: 2+ consecutive lines, each with the same number of `|`
 * characters (>=2), neither line is a fenced code block, no existing
 * markdown table syntax (no leading `|` or `|---|`).
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

function fixPseudoTables(text) {
  const lines = text.split("\n");
  const out = [];
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) inFence = !inFence;
    if (inFence) { out.push(line); i++; continue; }

    // Look for a sequence of pseudo-table lines starting at i.
    const pipes = (line.match(/\|/g) || []).length;
    const startsWithPipe = line.trim().startsWith("|");
    const looksLikeRow = pipes >= 2 && !startsWithPipe;
    if (!looksLikeRow) { out.push(line); i++; continue; }

    // Collect consecutive lines with same pipe count
    const block = [line];
    let j = i + 1;
    while (j < lines.length) {
      const nxt = lines[j];
      const nxtPipes = (nxt.match(/\|/g) || []).length;
      const nxtStartsPipe = nxt.trim().startsWith("|");
      if (nxtPipes === pipes && !nxtStartsPipe && nxt.trim().length > 0) {
        block.push(nxt);
        j++;
      } else break;
    }

    if (block.length < 2) {
      // Not enough rows for a table — leave as-is.
      out.push(line);
      i++;
      continue;
    }

    // It's a pseudo-table. Convert to markdown.
    const numCols = pipes + 1;
    const formatted = [];
    block.forEach((row, idx) => {
      const cells = row.split("|").map((c) => c.trim());
      if (cells.length !== numCols) return; // safety
      formatted.push("| " + cells.join(" | ") + " |");
      if (idx === 0) {
        formatted.push("|" + " --- |".repeat(numCols));
      }
    });
    out.push(...formatted);
    i = j;
  }
  return out.join("\n");
}

const rows = await sql`
  SELECT id, course, stimulus FROM questions
  WHERE "isApproved" = true AND stimulus IS NOT NULL AND stimulus LIKE '%|%'
`;
console.log("Scanning", rows.length, "stimuli with pipes...");

let fixed = 0, errors = 0;
const samples = [];
for (const r of rows) {
  const newStim = fixPseudoTables(r.stimulus);
  if (newStim !== r.stimulus) {
    if (samples.length < 3) {
      samples.push({ id: r.id, course: r.course, before: r.stimulus.slice(0, 200), after: newStim.slice(0, 200) });
    }
    try {
      await sql`UPDATE questions SET stimulus = ${newStim} WHERE id = ${r.id}`;
      fixed++;
    } catch (e) {
      errors++;
    }
  }
}
console.log("Fixed:", fixed, "Errors:", errors);
console.log("\nSamples:");
for (const s of samples) {
  console.log("---", s.id.slice(0, 10), s.course);
  console.log("BEFORE:", s.before);
  console.log("AFTER: ", s.after);
}

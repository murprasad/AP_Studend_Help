#!/usr/bin/env node
/**
 * Find + fix Mermaid content stored without fences.
 *
 * Bug found 2026-04-27: visual seeder occasionally produced stimuli where
 * the AI returned `graph LR; ...` directly (no ```mermaid fence around it).
 * Renderer doesn't detect a code block at all → renders as plain text.
 *
 * Detection: stimulus contains a Mermaid keyword (graph LR, graph TD,
 * flowchart, sequenceDiagram, etc.) but no ``` fence.
 *
 * Fix:
 *   1. Find all such stimuli
 *   2. Wrap the Mermaid portion in ```mermaid ... ```
 *   3. Apply the |> typo fix
 *   4. Validate via parser-style regex
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const MERMAID_KW = /^(graph (?:LR|TD|RL|BT)|flowchart|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram)/im;

const rows = await sql`
  SELECT id, course, stimulus FROM questions
  WHERE "isApproved" = true
    AND stimulus IS NOT NULL
    AND stimulus NOT LIKE '%\`\`\`%'
`;
console.log("Scanning", rows.length, "fence-free stimuli...");

const candidates = rows.filter((r) => MERMAID_KW.test(r.stimulus));
console.log("Candidates with Mermaid keywords:", candidates.length);

const byCourse = {};
for (const c of candidates) byCourse[c.course] = (byCourse[c.course] || 0) + 1;
Object.entries(byCourse).sort(([, a], [, b]) => b - a)
  .forEach(([c, n]) => console.log(" ", c, n));

let fixed = 0, errors = 0;
for (const r of candidates) {
  let s = r.stimulus;
  // 1. Fix |label|> typo
  s = s.replace(/-->\|([^|\n]+)\|>/g, "-->|$1|");
  s = s.replace(/==>\|([^|\n]+)\|>/g, "==>|$1|");
  // 2. Identify the Mermaid portion + wrap in fence.
  //    Strategy: find the first match of MERMAID_KW. Wrap from there to
  //    end-of-stimulus (or to first \n\n followed by non-mermaid text).
  const m = MERMAID_KW.exec(s);
  if (!m) continue;
  const start = m.index;
  // Find end: either \n\n followed by something that doesn't look like
  // a Mermaid statement, or end of string.
  let end = s.length;
  // Look for double newline followed by non-Mermaid text after start
  const restAfter = s.slice(start);
  const splitMatch = /\n\n([^\n](?!.*-->))/m.exec(restAfter);
  if (splitMatch) {
    end = start + splitMatch.index;
  }
  const mermaidPart = s.slice(start, end).trim();
  const before = s.slice(0, start).trim();
  const after = s.slice(end).trim();
  let newStim = "";
  if (before) newStim += before + "\n\n";
  newStim += "```mermaid\n" + mermaidPart + "\n```";
  if (after) newStim += "\n\n" + after;
  if (newStim !== r.stimulus) {
    try {
      await sql`UPDATE questions SET stimulus = ${newStim} WHERE id = ${r.id}`;
      fixed++;
    } catch (e) {
      errors++;
    }
  }
}
console.log("\nFixed:", fixed, "Errors:", errors);

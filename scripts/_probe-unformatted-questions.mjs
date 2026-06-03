// Probe SAT/ACT/PSAT bank for formatting hazards reported by user 2026-06-03:
// "Few Questions arent formatted."
//
// Categories of hazards to scan:
//   A. Escape leak — literal "\n", "\t", "\\" appearing in displayed text
//   B. Unrendered LaTeX — "$\frac{...}{...}$", "\sqrt", "\pi" in raw text
//   C. JSON-shape options — "[object Object]" or stringified arrays
//   D. Truncated stems (< 20 chars) or empty options
//   E. HTML tags appearing as literal text (<sup>, <sub> not rendered)
//   F. Markdown headers / bullets in question stem (** , - ) that won't
//      render in a non-markdown panel
//
// Run: node scripts/_probe-unformatted-questions.mjs

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const COURSES = [
  "SAT_MATH", "SAT_READING_WRITING",
  "PSAT_MATH", "PSAT_READING_WRITING",
  "ACT_MATH", "ACT_ENGLISH", "ACT_READING", "ACT_SCIENCE",
];

async function countMatching(course, condition, label) {
  const r = await sql(
    `SELECT COUNT(*) AS n FROM questions WHERE course::text = $1 AND "isApproved" = true AND ${condition}`,
    [course],
  );
  return { course, label, count: parseInt(r[0].n, 10) };
}

const checks = [
  { id: "literal-newline", cond: `"questionText" LIKE '%\\\\n%'`, label: "literal \\n in stem" },
  { id: "literal-tab", cond: `"questionText" LIKE '%\\\\t%'`, label: "literal \\t in stem" },
  { id: "double-backslash", cond: `"questionText" LIKE '%\\\\\\\\%'`, label: "double-backslash in stem" },
  { id: "raw-latex-frac", cond: `"questionText" LIKE '%\\frac%' AND "questionText" NOT LIKE '%$%'`, label: "raw \\frac without $ delimiter" },
  { id: "raw-latex-sqrt", cond: `"questionText" LIKE '%\\sqrt%' AND "questionText" NOT LIKE '%$%'`, label: "raw \\sqrt without $ delimiter" },
  { id: "html-sup", cond: `"questionText" LIKE '%<sup>%'`, label: "literal <sup> tag" },
  { id: "html-sub", cond: `"questionText" LIKE '%<sub>%'`, label: "literal <sub> tag" },
  { id: "obj-leak-opts", cond: `options::text LIKE '%[object Object]%'`, label: "[object Object] in options" },
  { id: "empty-opts", cond: `options::text = '[]' OR options IS NULL`, label: "empty options array" },
  { id: "trunc-stem", cond: `LENGTH("questionText") < 20`, label: "stem under 20 chars" },
  { id: "md-header-in-stem", cond: `"questionText" LIKE '#%' OR "questionText" LIKE '%## %'`, label: "markdown header in stem" },
];

console.log("\n═══ Format hazard scan — SAT/ACT/PSAT approved bank ═══\n");
const all = [];
for (const course of COURSES) {
  for (const c of checks) {
    const r = await countMatching(course, c.cond, c.label);
    if (r.count > 0) all.push(r);
  }
}
console.table(all);

// Sample worst offenders for review
console.log("\n═══ Top-10 sample of worst offenders ═══");
for (const c of checks) {
  for (const course of COURSES) {
    const rows = await sql(
      `SELECT id, LEFT("questionText", 180) AS preview, LEFT(options::text, 160) AS opts
       FROM questions WHERE course::text = $1 AND "isApproved" = true AND ${c.cond}
       LIMIT 2`,
      [course],
    );
    if (rows.length) {
      console.log(`\n  ${course} · ${c.label} (${rows.length} sampled)`);
      for (const row of rows) {
        console.log(`    ${row.id.slice(0, 8)}: ${row.preview.replace(/\n/g, " ").slice(0, 140)}...`);
        if (row.opts && row.opts.includes("[object")) {
          console.log(`      OPTS: ${row.opts.slice(0, 100)}`);
        }
      }
    }
  }
}

console.log("\nDone.\n");

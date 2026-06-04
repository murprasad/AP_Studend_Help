// Comprehensive stimulus-claim audit. Finds questions whose stem promises
// some context (figure / passage / table / underlined text) but doesn't
// have the corresponding payload (stimulusImageUrl or stimulus).
//
// Root cause class: generator + validator never enforced this invariant.
// Multiple gen paths (auto-populate, admin bulk, LLM-judge sweep re-approve)
// produced rows where the stem references a figure but stimulusImageUrl is
// null, OR references a passage but stimulus is null/too short.
//
// Reported by user 2026-06-04 on SAT_MATH bar chart + scatterplot Qs.
// First fix unapproved 41 SAT/PSAT/ACT math Qs. This audit goes wider.
//
// Run:
//   node scripts/_audit-stimulus-claims.mjs                  # dry-run all SN
//   node scripts/_audit-stimulus-claims.mjs --apply          # unapprove fails

import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const APPLY = process.argv.includes("--apply");

console.log(`\n═══ Stimulus-claim audit — ${APPLY ? "WRITE" : "DRY-RUN"} ═══\n`);

// CLASSES
//   image_claim — stem references a figure/chart/diagram → stimulusImageUrl must be non-empty
//   passage_claim — stem references "the passage" / "according to" / "lines N" → stimulus must be non-empty + >= 50 chars
//   table_claim — stem references a table of values → stimulus OR stimulusImageUrl must exist
//   not_drawn_to_scale_claim — disclaimer text without an image
//
// We use SQL ~* (regex case-insensitive) so a single PG predicate per class.

const CLASSES = [
  {
    id: "image-claim-no-image",
    label: "stem claims a figure/chart/diagram/graph/plot but no stimulusImageUrl",
    matchSql: `"questionText" ~* '(bar chart|scatterplot|scatter plot|line graph|histogram|figure below|figure above|the chart|the graph|the diagram|the figure|the histogram|shown in the figure|shown in the diagram|shown in the chart|shown in the graph|refer to the figure|refer to the diagram)'`,
    failSql: `("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')`,
  },
  {
    id: "passage-claim-no-stimulus",
    label: "stem refers to the passage/text but stimulus is missing or trivially short",
    matchSql: `"questionText" ~* '(based on the passage|according to the passage|the passage above|the passage below|in the passage|in lines? [0-9]|the underlined|the text above|the text below)'`,
    failSql: `(stimulus IS NULL OR stimulus = '' OR LENGTH(stimulus) < 50)`,
  },
  {
    id: "table-claim-no-payload",
    label: "stem references a table of values but neither stimulus nor stimulusImageUrl present",
    matchSql: `"questionText" ~* '(the table shows|table shows the|values in the table|table represents|table below shows|table above shows|in the table)'`,
    failSql: `((stimulus IS NULL OR stimulus = '' OR LENGTH(stimulus) < 30) AND ("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = ''))`,
  },
  {
    id: "scale-disclaimer-no-image",
    label: "stem includes 'figure not drawn to scale' disclaimer but no image",
    matchSql: `"questionText" ~* '(figure not drawn to scale|not drawn to scale)'`,
    failSql: `("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')`,
  },
];

const SCOPE = `course::text LIKE 'SAT_%' OR course::text LIKE 'PSAT_%' OR course::text LIKE 'ACT_%' OR course::text LIKE 'AP_%' OR course::text LIKE 'CLEP_%' OR course::text LIKE 'DSST_%'`;

let totalFlagged = 0;
const allIds = new Set();
for (const cls of CLASSES) {
  const rows = await sql(`
    SELECT id, course::text AS course, LEFT("questionText", 140) AS stem, "modelUsed"
    FROM questions
    WHERE (${SCOPE})
      AND "isApproved" = true
      AND ${cls.matchSql}
      AND ${cls.failSql}
    LIMIT 5000
  `);
  console.log(`\n── ${cls.id} ──`);
  console.log(`  matches: ${rows.length}`);
  // breakdown by course
  const byCourse = {};
  const byModel = {};
  for (const r of rows) {
    byCourse[r.course] = (byCourse[r.course] ?? 0) + 1;
    byModel[r.modelUsed ?? "(unknown)"] = (byModel[r.modelUsed ?? "(unknown)"] ?? 0) + 1;
    allIds.add(r.id);
  }
  if (Object.keys(byCourse).length) {
    console.log(`  by course: ${Object.entries(byCourse).sort((a,b) => b[1]-a[1]).slice(0,8).map(([c,n]) => c+'='+n).join(', ')}`);
  }
  if (Object.keys(byModel).length) {
    console.log(`  by generator model: ${Object.entries(byModel).sort((a,b) => b[1]-a[1]).slice(0,5).map(([m,n]) => m+'='+n).join(', ')}`);
  }
  totalFlagged += rows.length;
}

console.log(`\n═══ Total unique Qs flagged: ${allIds.size} ═══`);

if (!APPLY) {
  console.log(`\n(dry-run) Pass --apply to unapprove all flagged Qs.`);
  process.exit(0);
}

console.log(`\nUnapproving ${allIds.size} questions...`);
const idArray = Array.from(allIds);
const chunkSize = 200;
let written = 0;
for (let i = 0; i < idArray.length; i += chunkSize) {
  const chunk = idArray.slice(i, i + chunkSize);
  const placeholders = chunk.map((_, j) => `$${j + 1}`).join(",");
  await sql(`UPDATE questions SET "isApproved" = false, "updatedAt" = NOW() WHERE id IN (${placeholders})`, chunk);
  written += chunk.length;
}
console.log(`  → unapproved ${written} questions.\n`);

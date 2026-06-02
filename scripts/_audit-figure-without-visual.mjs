// Find SN questions that mention "Figure:" in their text but have no
// stimulus image. These are the "claim a visual that doesn't render"
// pattern the user hit in journey diagnostic. Reports per-course count
// and prints sample stems.
import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

// First — what columns does Question have for images/stimuli?
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name='questions' AND (column_name ILIKE '%stim%' OR column_name ILIKE '%image%' OR column_name ILIKE '%figure%' OR column_name ILIKE '%diagram%' OR column_name ILIKE '%svg%')`;
console.log(`Image/stim columns: ${cols.map((c) => c.column_name).join(", ") || "(none)"}\n`);

// Patterns to search for — questions claiming a figure exists.
const PATTERNS = [
  "Figure:",
  "Figure shows",
  "shown in the figure",
  "as shown above",
  "as shown below",
  "the diagram",
  "the graph below",
  "the graph above",
  "shown in the graph",
];

console.log(`Counting questions with "claim a figure" patterns:\n`);
let total = 0;
for (const p of PATTERNS) {
  const r = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE "isApproved" = true
      AND "questionText" ILIKE ${'%' + p + '%'}
  `;
  total += Number(r[0].n);
  console.log(`  "${p.padEnd(25)}" → ${r[0].n} approved questions`);
}
console.log(`\nNote: a single question can match multiple patterns (sum is upper bound).\n`);

// Per-course breakdown of "Figure:" specifically (the most explicit case).
const byCourse = await sql`
  SELECT course::text AS course, COUNT(*)::int AS n
  FROM questions
  WHERE "isApproved" = true AND "questionText" ILIKE '%Figure:%'
  GROUP BY course
  ORDER BY n DESC
`;
console.log(`Per-course "Figure:" count:`);
for (const r of byCourse) console.log(`  ${r.course.padEnd(40)} ${r.n}`);

// Sample 5 stems
console.log(`\nSample 5 stems (course → first 150 chars):`);
const samples = await sql`
  SELECT id, course::text AS course, LEFT("questionText", 200) AS stem
  FROM questions
  WHERE "isApproved" = true AND "questionText" ILIKE '%Figure:%'
  ORDER BY RANDOM()
  LIMIT 5
`;
for (const s of samples) {
  console.log(`\n  [${s.id.slice(0, 12)}] ${s.course}`);
  console.log(`    ${s.stem.replace(/\n/g, " | ")}`);
}

// Cross-check: do ANY of these have a populated stimulusImageUrl?
// (column may or may not exist — guard.)
const hasImageCol = cols.some((c) => c.column_name === "stimulusImageUrl");
if (hasImageCol) {
  const withImage = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE "isApproved" = true
      AND "questionText" ILIKE '%Figure:%'
      AND "stimulusImageUrl" IS NOT NULL
      AND "stimulusImageUrl" != ''
  `;
  console.log(`\n"Figure:" questions WITH stimulusImageUrl: ${withImage[0].n}`);
  const withoutImage = await sql`
    SELECT COUNT(*)::int AS n
    FROM questions
    WHERE "isApproved" = true
      AND "questionText" ILIKE '%Figure:%'
      AND ("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')
  `;
  console.log(`"Figure:" questions WITHOUT stimulusImageUrl: ${withoutImage[0].n} ← these are the bug class`);
}

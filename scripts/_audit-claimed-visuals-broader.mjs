// Sample the broader "claims a visual" patterns to see which need a
// real image vs which are answerable from the text description.
import { config } from "dotenv";
config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const PATTERNS = [
  "Figure shows",
  "shown in the figure",
  "the diagram",
  "the graph below",
  "shown in the graph",
];

for (const p of PATTERNS) {
  console.log(`\n═══ Pattern: "${p}" ═══`);
  // Counts: has-image vs no-image
  const counts = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "stimulusImageUrl" IS NOT NULL AND "stimulusImageUrl" != '')::int AS with_img,
      COUNT(*) FILTER (WHERE "stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')::int AS no_img,
      COUNT(*) FILTER (WHERE stimulus IS NOT NULL AND stimulus != '')::int AS with_stim_text
    FROM questions
    WHERE "isApproved" = true AND "questionText" ILIKE ${'%' + p + '%'}
  `;
  const c = counts[0];
  console.log(`  Total: ${c.total}  with_img: ${c.with_img}  no_img: ${c.no_img}  with_stim_text: ${c.with_stim_text}`);
  // Sample 3 no-img stems by course
  const samples = await sql`
    SELECT id, course::text AS course, LEFT("questionText", 220) AS stem
    FROM questions
    WHERE "isApproved" = true AND "questionText" ILIKE ${'%' + p + '%'}
      AND ("stimulusImageUrl" IS NULL OR "stimulusImageUrl" = '')
    ORDER BY RANDOM()
    LIMIT 3
  `;
  for (const s of samples) {
    console.log(`  [${s.id.slice(0, 12)} ${s.course}]`);
    console.log(`    ${s.stem.replace(/\n/g, " | ")}`);
  }
}

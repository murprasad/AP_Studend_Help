// Fix broken \frac LaTeX where the leading \f was lost. Pattern in DB:
//   "rac{numerator}{denominator}"  →  "\frac{numerator}{denominator}"
// Be careful — words like "character" contain "rac" too. Only replace
// "rac{" preceded by non-letter (space, start, ()$, etc.).
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");

// rac{ when preceded by non-word character (or start of string)
const RACK = /(^|[^a-zA-Z])rac\{/g;
function fix(s) {
  if (!s) return s;
  return s.replace(RACK, "$1\\frac{");
}

const rows = await sql`
  SELECT id, course::text AS course, "questionText", stimulus, explanation
  FROM questions
  WHERE "isApproved" = true
    AND (stimulus LIKE '%rac{%' OR explanation LIKE '%rac{%' OR "questionText" LIKE '%rac{%')
`;

console.log(`Scanning ${rows.length} candidates for broken \\frac…`);
let fixed = 0;
const samples = [];

for (const r of rows) {
  const orig = { qt: r.questionText ?? "", st: r.stimulus ?? "", ex: r.explanation ?? "" };
  const next = { qt: fix(orig.qt), st: fix(orig.st), ex: fix(orig.ex) };
  if (next.qt === orig.qt && next.st === orig.st && next.ex === orig.ex) continue;
  fixed++;
  if (samples.length < 3) samples.push({
    id: r.id.slice(0, 8), course: r.course,
    diff: orig.st !== next.st ? `S: ...${(orig.st.match(/.{0,30}rac\{.{0,40}/) ?? [""])[0]}... → ${(next.st.match(/.{0,30}\\frac\{.{0,40}/) ?? [""])[0]}` : "expl/qt"
  });
  if (!dry) {
    await sql`
      UPDATE questions
      SET "questionText" = ${next.qt},
          stimulus = ${next.st === "" ? null : next.st},
          explanation = ${next.ex},
          "updatedAt" = NOW()
      WHERE id = ${r.id}
    `;
  }
}

console.log(`Fixed: ${fixed}`);
for (const s of samples) console.log(`\n${s.id} ${s.course}\n  ${s.diff}`);

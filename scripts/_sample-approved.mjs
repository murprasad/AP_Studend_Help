import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const course = process.argv[2];
const n = parseInt(process.argv[3] ?? "3", 10);
if (!course) { console.log("usage: _sample-approved.mjs COURSE [N=3]"); process.exit(1); }

// Random-ish sample by ordering on hash of id; reproducibly grabs a spread
const rows = await sql`
  SELECT id, "questionText", stimulus, options, "correctAnswer", explanation, difficulty, topic
  FROM questions
  WHERE course::text = ${course} AND "isApproved" = true AND "questionType" = 'MCQ'
  ORDER BY md5(id)
  LIMIT ${n}
`;

const stripPrefix = (s) => String(s).replace(/^[A-E]\s*\)\s*/, "");

for (let i = 0; i < rows.length; i++) {
  const q = rows[i];
  console.log(`\n══ Q${i + 1} (${q.id.slice(0,8)}, diff=${q.difficulty}, topic=${q.topic}) ══`);
  if (q.stimulus) console.log(`STIMULUS: ${q.stimulus.slice(0, 280)}${q.stimulus.length > 280 ? "..." : ""}`);
  console.log(`Q: ${q.questionText}`);
  const opts = Array.isArray(q.options) ? q.options : [];
  for (let j = 0; j < opts.length; j++) {
    console.log(`  ${String.fromCharCode(65 + j)}) ${stripPrefix(opts[j])}`);
  }
  console.log(`CORRECT: ${q.correctAnswer}`);
  console.log(`EXPL: ${(q.explanation || "").slice(0, 320)}${(q.explanation || "").length > 320 ? "..." : ""}`);
}

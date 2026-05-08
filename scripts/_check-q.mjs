import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const id = process.argv[2];
const r = await sql`SELECT "questionText", options, "correctAnswer", explanation FROM questions WHERE id LIKE ${id + '%'} LIMIT 1`;
if (!r.length) { console.log("not found"); process.exit(0); }
console.log("Q:", r[0].questionText.slice(0, 180));
console.log("OPTIONS:");
const opts = Array.isArray(r[0].options) ? r[0].options : [];
for (const o of opts) console.log("  >", JSON.stringify(o).slice(0, 140));
console.log("CORRECT:", r[0].correctAnswer);
console.log("EXPL:", (r[0].explanation || "").slice(0, 220));

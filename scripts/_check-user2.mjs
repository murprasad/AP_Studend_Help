import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const email = process.argv[2] ?? "murprasad+free@gmail.com";
const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
console.log("users columns:", cols.map(c=>c.column_name).join(", "));
const r = await sql`SELECT * FROM users WHERE email = ${email}`;
if (!r.length) { console.log("User not found:", email); process.exit(0); }
console.log("\nFound user:");
for (const [k,v] of Object.entries(r[0])) {
  const s = typeof v === 'string' ? v.slice(0, 80) : JSON.stringify(v);
  console.log(" ", k.padEnd(28), s);
}

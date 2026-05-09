import "dotenv/config";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);
const r = await sql`SELECT key, value FROM site_settings WHERE key = 'visible_courses'`;
if (!r.length) {
  console.log("visible_courses: NOT SET → no restriction (all courses visible per code default)");
} else {
  const v = r[0].value;
  if (!v || v === "all") {
    console.log("visible_courses:", JSON.stringify(v), "→ no restriction");
  } else {
    try {
      const arr = JSON.parse(v);
      console.log(`visible_courses: ${arr.length} courses listed:`);
      for (const c of arr) console.log(`  - ${c}`);
    } catch {
      console.log("visible_courses (raw):", v);
    }
  }
}

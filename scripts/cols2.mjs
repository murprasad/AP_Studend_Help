import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
for (const t of ["session_feedback", "dashboard_events", "events"]) {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=${t}`;
  if (cols.length > 0) console.log(t + ":", cols.map(c => c.column_name).join(", "));
  else console.log(t + ": NOT FOUND");
}

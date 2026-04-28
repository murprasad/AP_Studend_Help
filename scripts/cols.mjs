import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
for (const t of ["student_responses", "practice_sessions", "tutor_conversations", "session_feedback"]) {
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=${t}`;
  console.log(t + ":", cols.map(c => c.column_name).join(", "));
}

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const t = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%user%'`;
console.log("Tables:", t);

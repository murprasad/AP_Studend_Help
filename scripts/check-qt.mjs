import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const labels = await sql`SELECT enum_range(NULL::"QuestionType")::text as labels`;
console.log(labels);

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const types = await sql`
  SELECT typname FROM pg_type WHERE typtype='e' AND typname ILIKE ANY(ARRAY['%difficulty%','%questiontype%','%apcourse%','%apunit%'])
`;
console.log("enum types:", types);
const sampleQ = await sql`SELECT difficulty::text FROM questions LIMIT 1`;
console.log("sample:", sampleQ);
const enumLabel = await sql`SELECT enum_range(NULL::"Difficulty")::text as labels`;
console.log("Difficulty labels:", enumLabel);

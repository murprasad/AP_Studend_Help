// Add lastLogin* location columns to users table.
// Additive, NULL-able — safe on a live prod table with existing rows.
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

console.log("Adding lastLogin* location columns to users table...");
await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginCountry" TEXT`;
await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginRegion" TEXT`;
await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginCity" TEXT`;
await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginPostalCode" TEXT`;
await sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginLocationAt" TIMESTAMP(3)`;

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users' AND column_name LIKE 'lastLogin%'
  ORDER BY column_name
`;
console.log("\nVerification — lastLogin* columns on users:");
for (const c of cols) console.log(`  ${c.column_name}`);

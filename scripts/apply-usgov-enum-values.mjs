// Apply AP_US_GOVERNMENT + 5 USGOV_* unit enum values to prod Postgres.
// Idempotent — ADD VALUE IF NOT EXISTS. See apply-hugeo-enum-values.mjs
// for the HTTP-adapter rationale.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log(`Adding AP_US_GOVERNMENT to "ApCourse"...`);
await sql`ALTER TYPE "ApCourse" ADD VALUE IF NOT EXISTS 'AP_US_GOVERNMENT'`;

console.log(`Adding 5 USGOV_* values to "ApUnit"...`);
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'USGOV_1_FOUNDATIONS'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'USGOV_2_INTERACTIONS_BRANCHES'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'USGOV_3_CIVIL_LIBERTIES_RIGHTS'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'USGOV_4_IDEOLOGIES_BELIEFS'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'USGOV_5_POLITICAL_PARTICIPATION'`;

const usgov = await sql`
  SELECT enumlabel FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApUnit')
  AND enumlabel LIKE 'USGOV%'
  ORDER BY enumlabel
`;
console.log(`\nVerification — "ApUnit" USGOV_* values:`);
for (const r of usgov) console.log(`  ${r.enumlabel}`);

const courseCheck = await sql`
  SELECT 1 FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApCourse')
  AND enumlabel = 'AP_US_GOVERNMENT'
`;
console.log(`\n"ApCourse" contains AP_US_GOVERNMENT: ${courseCheck.length === 1 ? "YES" : "NO"}`);

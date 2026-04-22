// Apply AP_HUMAN_GEOGRAPHY + 7 HUGEO unit enum values to prod Postgres.
// Same HTTP-adapter workaround as apply-funnel-event-table.mjs since the
// Neon pooler rejects TCP/5432 from most networks.
//
// Idempotent — uses ADD VALUE IF NOT EXISTS so re-runs are no-ops.
// Values are hardcoded string literals so direct embedding is safe (no
// user input surface for SQL injection). ALTER TYPE also runs outside
// a transaction, matching Neon HTTP's autocommit default.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

console.log(`Adding AP_HUMAN_GEOGRAPHY to "ApCourse"...`);
await sql`ALTER TYPE "ApCourse" ADD VALUE IF NOT EXISTS 'AP_HUMAN_GEOGRAPHY'`;

console.log(`Adding 7 HUGEO_* values to "ApUnit"...`);
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_1_THINKING_GEOGRAPHICALLY'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_2_POPULATION_MIGRATION'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_3_CULTURAL_PATTERNS'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_4_POLITICAL_PATTERNS'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_5_AGRICULTURE_RURAL'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_6_URBAN_LAND_USE'`;
await sql`ALTER TYPE "ApUnit" ADD VALUE IF NOT EXISTS 'HUGEO_7_INDUSTRIAL_ECONOMIC'`;

// Verify — read back the enum label set so the user sees what actually
// landed (rather than trusting the ADD VALUE statements silently succeeded).
const hugeoUnits = await sql`
  SELECT enumlabel
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApUnit')
  AND enumlabel LIKE 'HUGEO%'
  ORDER BY enumlabel
`;
console.log(`\nVerification — "ApUnit" HUGEO_* values in DB:`);
for (const r of hugeoUnits) console.log(`  ${r.enumlabel}`);

const courseCheck = await sql`
  SELECT 1 AS present
  FROM pg_enum
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ApCourse')
  AND enumlabel = 'AP_HUMAN_GEOGRAPHY'
`;
console.log(`\n"ApCourse" contains AP_HUMAN_GEOGRAPHY: ${courseCheck.length === 1 ? "YES" : "NO"}`);

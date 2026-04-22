// One-off: create funnel_events table via Neon HTTP adapter.
// Used because `prisma db push` requires TCP 5432 which isn't reachable
// from some environments (e.g. sandboxed CI); the app itself uses the
// HTTP adapter in production so this is the same transport.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS "funnel_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "course" TEXT,
    "impressionId" TEXT,
    "ctaType" TEXT,
    "roughScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
  )
`;
await sql`CREATE INDEX IF NOT EXISTS "funnel_events_userId_createdAt_idx" ON "funnel_events"("userId", "createdAt")`;
await sql`CREATE INDEX IF NOT EXISTS "funnel_events_event_createdAt_idx" ON "funnel_events"("event", "createdAt")`;

const check = await sql`SELECT COUNT(*)::int AS n FROM "funnel_events"`;
console.log(`funnel_events table ready. current row count: ${check[0].n}`);

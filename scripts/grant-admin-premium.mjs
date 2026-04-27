import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Discover module_subscriptions table
const ms = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='module_subscriptions'
`;
console.log("module_subscriptions cols:", ms.map(c => c.column_name).join(", "));

const admins = await sql`
  SELECT id, email, role, "subscriptionTier"::text as tier
  FROM users
  WHERE role = 'ADMIN'
`;
console.log(`\nAdmin user(s):`);
admins.forEach(a => console.log(`  ${a.id} ${a.email} role=${a.role} tier=${a.tier}`));

const MODULES = ["ap", "sat", "act", "clep", "dsst"];
let inserted = 0, kept = 0;

for (const a of admins) {
  // Ensure subscriptionTier on User is PREMIUM (legacy compat)
  await sql`UPDATE users SET "subscriptionTier" = 'PREMIUM'::"SubTier", "updatedAt" = NOW() WHERE id = ${a.id}`;

  // Check existing ModuleSubscription rows
  const existing = await sql`SELECT module FROM module_subscriptions WHERE "userId" = ${a.id}`;
  const existingMods = new Set(existing.map(r => r.module));

  for (const mod of MODULES) {
    if (existingMods.has(mod)) {
      // Force status to active in case it was canceled
      await sql`
        UPDATE module_subscriptions
        SET status = 'active', "updatedAt" = NOW()
        WHERE "userId" = ${a.id} AND module = ${mod} AND status != 'active'
      `;
      kept++;
      continue;
    }
    await sql`
      INSERT INTO module_subscriptions (id, "userId", module, status, "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}::text, ${a.id}, ${mod}, 'active', NOW(), NOW())
    `;
    inserted++;
    console.log(`  + ${a.email}: ${mod} module → active`);
  }
}

console.log(`\nInserted ${inserted} new module subscriptions, kept/refreshed ${kept}.`);
console.log("Note: admin will need to log out + back in for JWT to refresh tier (or token refresh on next request).");

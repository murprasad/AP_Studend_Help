import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const EMAIL = "Murprasad+Std@gmail.com";
const u = await sql`SELECT id, email FROM users WHERE LOWER(email) = LOWER(${EMAIL})`;
if (u.length === 0) { console.log("not found"); process.exit(0); }
const id = u[0].id;

// Set onboardingCompletedAt so the dashboard's onboarding-redirect (→
// /practice/quickstart) is bypassed. Combined with no UserJourney row
// (already cleared), this routes them straight to /journey on next
// /dashboard visit.
await sql`UPDATE users SET "onboardingCompletedAt" = NOW() WHERE id = ${id}`;
console.log(`✓ Set onboardingCompletedAt=NOW for ${u[0].email}`);

// Verify journey row is still cleared
const j = await sql`SELECT * FROM user_journeys WHERE "userId" = ${id}`;
console.log(`UserJourney rows: ${j.length} (should be 0 for journey to fire)`);
console.log(`\nNext sign-in:`);
console.log(`  /dashboard → onboarding-redirect SKIPPED (onboardingCompletedAt set)`);
console.log(`  /dashboard → journey-redirect FIRES (no UserJourney row) → /journey Step 0`);
console.log(`\nBrowser: clear localStorage + cookies first (DevTools → Application → Clear site data).`);

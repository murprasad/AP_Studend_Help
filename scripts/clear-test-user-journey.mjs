import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const EMAIL = "Murprasad+Std@gmail.com";

const userRows = await sql`SELECT id, email, "firstName" FROM users WHERE LOWER(email) = LOWER(${EMAIL})`;
if (userRows.length === 0) {
  console.log(`User ${EMAIL} not found in DB`);
  process.exit(0);
}
const user = userRows[0];
console.log(`Found: ${user.email} (id ${user.id}, firstName ${user.firstName})`);

// Show current journey state before clearing
const before = await sql`SELECT * FROM user_journeys WHERE "userId" = ${user.id}`;
console.log(`Existing UserJourney: ${before.length === 0 ? "none" : JSON.stringify(before[0])}`);

// Clear UserJourney → next dashboard visit triggers redirect to /journey
const j = await sql`DELETE FROM user_journeys WHERE "userId" = ${user.id}`;
console.log(`Deleted UserJourney rows`);

// Also clear DashboardImpressions so AutoLaunchNudge doesn't fire
const di = await sql`DELETE FROM dashboard_impressions WHERE "userId" = ${user.id}`;
console.log(`Cleared DashboardImpressions`);

// Optionally also clear practice sessions + responses for true fresh-user feel
const r = await sql`DELETE FROM student_responses WHERE "userId" = ${user.id}`;
console.log(`Cleared StudentResponses`);
const ps = await sql`DELETE FROM practice_sessions WHERE "userId" = ${user.id}`;
console.log(`Cleared PracticeSessions`);

console.log(`\nDone. Next /dashboard visit will redirect ${user.email} to /journey.`);
console.log(`Browser-side: clear localStorage OR open incognito to drop the journey_status_v1 cache.`);

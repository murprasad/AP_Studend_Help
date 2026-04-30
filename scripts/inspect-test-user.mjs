import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const u = await sql`
  SELECT id, email, "firstName", "subscriptionTier", "onboardingCompletedAt",
         "createdAt", "totalXp", "streakDays"
  FROM users WHERE LOWER(email) = LOWER('Murprasad+Std@gmail.com')
`;
if (u.length === 0) { console.log("not found"); process.exit(0); }
console.log("USER:", JSON.stringify(u[0], null, 2));

const id = u[0].id;
const j = await sql`SELECT * FROM user_journeys WHERE "userId" = ${id}`;
console.log("\nUserJourney:", j.length === 0 ? "NONE (correct for fresh state)" : JSON.stringify(j[0], null, 2));

const ms = await sql`SELECT module, status FROM module_subscriptions WHERE "userId" = ${id}`;
console.log("\nModuleSubscriptions:", ms.length === 0 ? "NONE" : JSON.stringify(ms, null, 2));

const r = await sql`SELECT COUNT(*)::int AS n FROM student_responses WHERE "userId" = ${id}`;
const ps = await sql`SELECT COUNT(*)::int AS n FROM practice_sessions WHERE "userId" = ${id}`;
const di = await sql`SELECT COUNT(*)::int AS n FROM dashboard_impressions WHERE "userId" = ${id}`;
console.log(`\nResidual rows: responses=${r[0].n}, sessions=${ps[0].n}, impressions=${di[0].n}`);

const cohortAgeDays = Math.floor((Date.now() - new Date(u[0].createdAt).getTime()) / (1000 * 60 * 60 * 24));
console.log(`\nCohortAgeDays: ${cohortAgeDays}`);
console.log(`isMature signal would be: cohortAgeDays(${cohortAgeDays}) > 14 && hasDiag(false) = ${cohortAgeDays > 14 && false}`);
console.log(`Therefore useJourneyForcing should return forcing=true (unless premium).`);

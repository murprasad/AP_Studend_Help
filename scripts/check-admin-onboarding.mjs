import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const u = await sql`SELECT id, email, role, "subscriptionTier", "onboardingCompletedAt" FROM users WHERE LOWER(email) = LOWER('Murprasad@yahoo.com')`;
console.log(JSON.stringify(u[0], null, 2));

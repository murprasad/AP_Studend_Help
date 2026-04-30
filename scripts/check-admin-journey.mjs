import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
const u = await sql`SELECT id, email, role, "subscriptionTier" FROM users WHERE LOWER(email) = LOWER('Murprasad@yahoo.com')`;
if (u.length === 0) { console.log("not found"); process.exit(0); }
console.log("Admin user:", JSON.stringify(u[0], null, 2));
const j = await sql`SELECT * FROM user_journeys WHERE "userId" = ${u[0].id}`;
console.log("UserJourney:", j.length === 0 ? "NONE" : JSON.stringify(j[0], null, 2));

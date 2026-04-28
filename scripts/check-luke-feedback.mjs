import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const email = "lukehagood612@gmail.com";

const users = await sql`
  SELECT id, email, "createdAt", role, "subscriptionTier"
  FROM users WHERE email = ${email}
`;
console.log("USER:", JSON.stringify(users[0], null, 2));

if (!users[0]) { console.log("No user found"); process.exit(0); }
const userId = users[0].id;

const feedback = await sql`
  SELECT id, rating, "feedbackText", context, "sessionId", "createdAt"
  FROM session_feedback WHERE "userId" = ${userId}
  ORDER BY "createdAt" DESC
`;
console.log(`\nFEEDBACK (${feedback.length} records):`);
for (const f of feedback) {
  console.log(JSON.stringify(f, null, 2));
}

const sessions = await sql`
  SELECT id, course::text AS course, "totalQuestions", "correctAnswers", "completedAt", "startedAt"
  FROM practice_sessions WHERE "userId" = ${userId}
  ORDER BY "startedAt" DESC LIMIT 10
`;
console.log(`\nRECENT SESSIONS (${sessions.length}):`);
for (const s of sessions) console.log(JSON.stringify(s));

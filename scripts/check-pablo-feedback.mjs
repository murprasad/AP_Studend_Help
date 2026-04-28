import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const email = "pablosarkar22@gmail.com";

const u = await sql`SELECT id, email, "createdAt", role, "subscriptionTier", "onboardingCompletedAt" FROM users WHERE email = ${email}`;
console.log("USER:", JSON.stringify(u[0], null, 2));
if (!u[0]) { console.log("not found"); process.exit(0); }

const sessions = await sql`
  SELECT id, course::text AS course, "totalQuestions", "correctAnswers",
    "startedAt", "completedAt", status::text AS status
  FROM practice_sessions WHERE "userId" = ${u[0].id}
  ORDER BY "startedAt" DESC
`;
console.log(`\n${sessions.length} sessions:`);
for (const s of sessions) {
  const dur = s.completedAt
    ? Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 1000)
    : null;
  console.log(`  ${s.course.padEnd(35)} ${s.totalQuestions}Qs  ${s.correctAnswers}/${s.totalQuestions} correct  status=${s.status}  duration=${dur ?? "—"}s  started=${s.startedAt}`);
}

const fb = await sql`
  SELECT rating, "feedbackText", context, "sessionId", "createdAt"
  FROM session_feedback WHERE "userId" = ${u[0].id}
  ORDER BY "createdAt" DESC
`;
console.log(`\n${fb.length} feedback records:`);
for (const f of fb) console.log(JSON.stringify(f));

// How many sessions match the trigger thresholds [1, 5, 10, 25, 50, 100, 200]?
// Feedback popup logic: TRIGGER_SESSIONS = [1, 5, 10, 25, 50, 100, 200] per (source, course, context)
// Triggers when localStorage session count for that (source, course, context) hits a milestone.
console.log(`\nFeedback-trigger logic: popup fires at session # 1, 5, 10, 25, 50, 100, 200 per (source, course, context).`);
console.log(`Pablo's completed-session count by course:`);
const byCourse = {};
for (const s of sessions) {
  if (s.status === "COMPLETED") {
    byCourse[s.course] = (byCourse[s.course] || 0) + 1;
  }
}
for (const [c, n] of Object.entries(byCourse)) console.log(`  ${c}: ${n}`);

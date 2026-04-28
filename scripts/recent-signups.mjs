import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const users = await sql`
  SELECT u.id, u.email, u."createdAt", u.role::text as role, u."subscriptionTier"::text as tier,
    u."onboardingCompletedAt", u.track
  FROM users u
  WHERE u.role = 'STUDENT'
  ORDER BY u."createdAt" DESC
  LIMIT 20
`;

const now = Date.now();
console.log("Email                                  | AgeHrs | Onboard | Sess(C) | Answers(R%) | Tutor | Min2lastAct");
console.log("-".repeat(120));

for (const u of users) {
  const [s] = await sql`SELECT
    (SELECT COUNT(*)::int FROM practice_sessions WHERE "userId" = ${u.id}) as sessions,
    (SELECT COUNT(*)::int FROM practice_sessions WHERE "userId" = ${u.id} AND "completedAt" IS NOT NULL) as completed,
    (SELECT COUNT(*)::int FROM student_responses WHERE "userId" = ${u.id}) as answers,
    (SELECT COUNT(*)::int FROM student_responses WHERE "userId" = ${u.id} AND "isCorrect"=true) as correct,
    (SELECT COUNT(*)::int FROM tutor_conversations WHERE "userId" = ${u.id}) as chats,
    (SELECT MAX("answeredAt") FROM student_responses WHERE "userId" = ${u.id}) as last_act
  `;
  const created = new Date(u.createdAt);
  const lastAct = s.last_act ? new Date(s.last_act) : null;
  const minsToLast = lastAct ? Math.round((lastAct - created) / 60000) : -1;
  const ageHours = Math.round((now - created.getTime()) / 3600000);
  const correctPct = s.answers > 0 ? Math.round((s.correct / s.answers) * 100) : 0;
  const onb = u.onboardingCompletedAt ? "✓" : "✗";
  console.log(`  ${u.email.padEnd(38)} ${String(ageHours).padStart(5)}h | ${onb.padStart(5)} | ${(s.sessions+'('+s.completed+')').padEnd(7)} | ${(s.answers+'('+correctPct+'%)').padEnd(11)} | ${String(s.chats).padEnd(5)} | ${minsToLast >= 0 ? minsToLast + 'm' : '—'}`);
}

const fb = await sql`
  SELECT COUNT(*)::int as total_fb,
    COUNT(*) FILTER (WHERE rating = 1)::int as positive,
    COUNT(*) FILTER (WHERE rating = -1)::int as negative,
    COUNT(*) FILTER (WHERE "feedbackText" IS NOT NULL AND LENGTH("feedbackText") > 0)::int as with_text,
    COUNT(*) FILTER (WHERE context = 'abandon')::int as abandon_ctx
  FROM session_feedback
`;
console.log("\n── Feedback collected (all-time) ──");
console.log("Total:", fb[0].total_fb, "| 👍", fb[0].positive, "| 👎", fb[0].negative, "| With text:", fb[0].with_text, "| Abandon-ctx:", fb[0].abandon_ctx);

// Funnel — separate counts
const totalSignups = await sql`SELECT COUNT(*)::int as n FROM users WHERE "createdAt" > NOW() - INTERVAL '30 days' AND role = 'STUDENT'`;
const onboarded = await sql`SELECT COUNT(*)::int as n FROM users WHERE "createdAt" > NOW() - INTERVAL '30 days' AND role = 'STUDENT' AND "onboardingCompletedAt" IS NOT NULL`;
const startedPractice = await sql`SELECT COUNT(DISTINCT "userId")::int as n FROM practice_sessions ps JOIN users u ON ps."userId" = u.id WHERE u."createdAt" > NOW() - INTERVAL '30 days' AND u.role = 'STUDENT'`;
const answeredQ1 = await sql`SELECT COUNT(DISTINCT "userId")::int as n FROM student_responses sr JOIN users u ON sr."userId" = u.id WHERE u."createdAt" > NOW() - INTERVAL '30 days' AND u.role = 'STUDENT'`;
const answered5 = await sql`SELECT COUNT(*)::int as n FROM (SELECT sr."userId" FROM student_responses sr JOIN users u ON sr."userId" = u.id WHERE u."createdAt" > NOW() - INTERVAL '30 days' AND u.role = 'STUDENT' GROUP BY sr."userId" HAVING COUNT(*) >= 5) x`;
const gaveFeedback = await sql`SELECT COUNT(DISTINCT ps."userId")::int as n FROM session_feedback sf JOIN practice_sessions ps ON sf."sessionId" = ps.id JOIN users u ON ps."userId" = u.id WHERE u."createdAt" > NOW() - INTERVAL '30 days' AND u.role = 'STUDENT'`;

const t = totalSignups[0].n || 1;
console.log("\n── 30d signup funnel ──");
console.log(`  Signups:           ${totalSignups[0].n}`);
console.log(`  Completed onboard: ${onboarded[0].n} (${Math.round(onboarded[0].n/t*100)}%)`);
console.log(`  Started practice:  ${startedPractice[0].n} (${Math.round(startedPractice[0].n/t*100)}%)`);
console.log(`  Answered 1+ Q:     ${answeredQ1[0].n} (${Math.round(answeredQ1[0].n/t*100)}%)`);
console.log(`  Answered 5+ Q:     ${answered5[0].n} (${Math.round(answered5[0].n/t*100)}%)`);
console.log(`  Gave feedback:     ${gaveFeedback[0].n} (${Math.round(gaveFeedback[0].n/t*100)}%)`);

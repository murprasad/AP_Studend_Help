import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// Last 24 hours of activity
const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

const recentUsers = await sql`
  SELECT u.id, u.email, u."createdAt", u."subscriptionTier",
    COUNT(DISTINCT ps.id) FILTER (WHERE ps."startedAt" >= ${since.toISOString()}) AS sessions_24h,
    COUNT(DISTINCT ps.id) FILTER (WHERE ps."completedAt" IS NOT NULL AND ps."startedAt" >= ${since.toISOString()}) AS completed_24h
  FROM users u
  LEFT JOIN practice_sessions ps ON ps."userId" = u.id
  WHERE u."createdAt" >= ${since.toISOString()} OR EXISTS (
    SELECT 1 FROM practice_sessions ps2 WHERE ps2."userId" = u.id AND ps2."startedAt" >= ${since.toISOString()}
  )
  GROUP BY u.id ORDER BY u."createdAt" DESC
  LIMIT 20
`;

console.log(`## Recent users (last 24h, ${recentUsers.length}):`);
for (const u of recentUsers) {
  const isNew = new Date(u.createdAt) >= since;
  console.log(`  ${u.email.padEnd(40)} ${isNew ? "[NEW]" : "      "} sessions=${u.sessions_24h} completed=${u.completed_24h} tier=${u.subscriptionTier}`);
}

const recentFeedback = await sql`
  SELECT sf.rating, sf."feedbackText", sf.context, sf."createdAt", u.email, ps.course::text AS course
  FROM session_feedback sf
  JOIN users u ON u.id = sf."userId"
  JOIN practice_sessions ps ON ps.id = sf."sessionId"
  WHERE sf."createdAt" >= ${since.toISOString()}
  ORDER BY sf."createdAt" DESC LIMIT 20
`;
console.log(`\n## Recent feedback (last 24h, ${recentFeedback.length}):`);
for (const f of recentFeedback) {
  const sym = f.rating === 1 ? "👍" : "👎";
  console.log(`  ${sym} ${f.email.padEnd(35)} ${f.course.padEnd(20)} ctx=${f.context}`);
  if (f.feedbackText) console.log(`     "${f.feedbackText.slice(0, 100)}"`);
}

const recentSessions = await sql`
  SELECT ps.course::text AS course, ps."totalQuestions", ps."correctAnswers",
    ps."startedAt", ps."completedAt", u.email
  FROM practice_sessions ps
  JOIN users u ON u.id = ps."userId"
  WHERE ps."startedAt" >= ${since.toISOString()}
  ORDER BY ps."startedAt" DESC LIMIT 20
`;
console.log(`\n## Recent sessions (last 24h, ${recentSessions.length}):`);
for (const s of recentSessions) {
  const completed = s.completedAt ? "✓" : "abandoned";
  const acc = s.totalQuestions > 0 ? Math.round(100 * s.correctAnswers / s.totalQuestions) + "%" : "—";
  console.log(`  ${s.email.padEnd(35)} ${s.course.padEnd(28)} ${s.totalQuestions}Qs ${acc} ${completed}`);
}

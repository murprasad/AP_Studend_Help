import "dotenv/config";
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const EMAIL = "Murprasad+Std@gmail.com";

const userRows = await sql`SELECT id, email, "firstName" FROM users WHERE LOWER(email) = LOWER(${EMAIL})`;
if (userRows.length === 0) {
  console.log(`User ${EMAIL} not found`);
  process.exit(0);
}
const user = userRows[0];
const id = user.id;
console.log(`Resetting ${user.email} (id ${id}) to fresh-user state\n`);

// Each table needs its own tagged-template call (neon HTTP doesn't allow
// dynamic table names in tagged templates — security guardrail).
async function tryDel(label, fn) {
  try {
    await fn();
    console.log(`  ✓ Cleared ${label}`);
  } catch (e) {
    console.log(`  - Skipped ${label}: ${e.message?.slice(0, 80)}`);
  }
}

await tryDel("UserJourney",          () => sql`DELETE FROM user_journeys WHERE "userId" = ${id}`);
await tryDel("DashboardImpressions", () => sql`DELETE FROM dashboard_impressions WHERE "userId" = ${id}`);
await tryDel("StudentResponses",     () => sql`DELETE FROM student_responses WHERE "userId" = ${id}`);
await tryDel("PracticeSessions",     () => sql`DELETE FROM practice_sessions WHERE "userId" = ${id}`);
await tryDel("TutorConversations",   () => sql`DELETE FROM tutor_conversations WHERE "userId" = ${id}`);
await tryDel("TutorKnowledgeChecks", () => sql`DELETE FROM tutor_knowledge_checks WHERE "userId" = ${id}`);
await tryDel("DiagnosticResults",    () => sql`DELETE FROM diagnostic_results WHERE "userId" = ${id}`);
await tryDel("MasteryScores",        () => sql`DELETE FROM mastery_scores WHERE "userId" = ${id}`);
await tryDel("MasteryGoals",         () => sql`DELETE FROM mastery_goals WHERE "userId" = ${id}`);
await tryDel("MasteryTierUps",       () => sql`DELETE FROM mastery_tier_ups WHERE "userId" = ${id}`);
await tryDel("StudyPlans",           () => sql`DELETE FROM study_plans WHERE "userId" = ${id}`);
await tryDel("FrqAttempts",          () => sql`DELETE FROM frq_attempts WHERE "userId" = ${id}`);
await tryDel("FlashcardReviews",     () => sql`DELETE FROM flashcard_reviews WHERE "userId" = ${id}`);
await tryDel("SessionFeedback",      () => sql`DELETE FROM session_feedback WHERE "userId" = ${id}`);
await tryDel("UserAchievements",     () => sql`DELETE FROM user_achievements WHERE "userId" = ${id}`);
await tryDel("QuestionReports",      () => sql`DELETE FROM question_reports WHERE "userId" = ${id}`);
await tryDel("SageCoachSessions",    () => sql`DELETE FROM sage_coach_sessions WHERE "userId" = ${id}`);
await tryDel("TrialReengagements",   () => sql`DELETE FROM trial_reengagements WHERE "userId" = ${id}`);
await tryDel("DailyQuizSends",       () => sql`DELETE FROM daily_quiz_sends WHERE "userId" = ${id}`);

await sql`
  UPDATE users SET
    "onboardingCompletedAt" = NULL,
    "freeTrialCourse" = NULL,
    "freeTrialExpiresAt" = NULL,
    "trialEmailsSent" = 0,
    "streakDays" = 0,
    "longestStreak" = 0,
    "lastActiveDate" = NULL,
    "totalXp" = 0,
    "level" = 1,
    "examDate" = NULL
  WHERE id = ${id}
`;
console.log(`  ✓ Reset User flags (onboardingCompletedAt=NULL, streaks=0, xp=0)`);

console.log(`\n✅ ${user.email} is fresh.`);
console.log(`Browser: clear localStorage OR use incognito → sign in → auto-redirect to /journey Step 0.`);

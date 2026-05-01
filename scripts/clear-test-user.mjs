/**
 * scripts/clear-test-user.mjs — wipe all data for a single test-alias user.
 *
 * Use case: you have a `+std` (or similar) test alias on prod and want to
 * walk the full first-time-user experience again. This script finds the
 * user by email and either resets their state (--reset) OR deletes the
 * user row entirely so they can re-register from scratch (--delete).
 *
 * Defaults to --dry-run so you see exactly what would be touched before
 * any rows disappear.
 *
 * Usage:
 *   node scripts/clear-test-user.mjs <email>                    # dry-run preview
 *   node scripts/clear-test-user.mjs <email> --reset            # keep User row, wipe progress
 *   node scripts/clear-test-user.mjs <email> --delete           # delete User row entirely
 *
 * Safety:
 *   - Refuses to run on emails without "+" or "test" or "std" — prevents
 *     accidental deletion of real student accounts.
 *   - Requires explicit --reset or --delete flag.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const mode = args.includes("--delete") ? "delete" : args.includes("--reset") ? "reset" : "dry-run";

if (!email) {
  console.error("Usage: node scripts/clear-test-user.mjs <email> [--reset | --delete]");
  process.exit(1);
}

// Safety: only allow test-alias emails.
const isTestAlias = email.includes("+") || /test|std|qa/i.test(email);
if (!isTestAlias) {
  console.error(`✗ Refusing — "${email}" doesn't look like a test alias.`);
  console.error(`  Allowed patterns: contains "+" (gmail alias) OR "test" / "std" / "qa".`);
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    console.error(`✗ User not found: ${email}`);
    process.exit(1);
  }

  console.log(`\n📋 Target user`);
  console.log(`   email:                  ${user.email}`);
  console.log(`   id:                     ${user.id}`);
  console.log(`   role:                   ${user.role}`);
  console.log(`   subscriptionTier:       ${user.subscriptionTier}`);
  console.log(`   onboardingCompletedAt:  ${user.onboardingCompletedAt ?? "NULL"}`);
  console.log(`   examDate:               ${user.examDate ?? "NULL"}`);
  console.log(`   createdAt:              ${user.createdAt.toISOString()}`);

  // Inventory of data attached to this user.
  const counts = await Promise.all([
    prisma.studentResponse.count({ where: { userId: user.id } }),
    prisma.practiceSession.count({ where: { userId: user.id } }),
    prisma.frqAttempt.count({ where: { userId: user.id } }),
    prisma.diagnosticResult.count({ where: { userId: user.id } }),
    prisma.masteryScore.count({ where: { userId: user.id } }),
    prisma.dashboardImpression.count({ where: { userId: user.id } }),
    prisma.tutorConversation.count({ where: { userId: user.id } }),
    prisma.tutorKnowledgeCheck.count({ where: { userId: user.id } }),
    prisma.flashcardReview.count({ where: { userId: user.id } }),
    prisma.userJourney.count({ where: { userId: user.id } }),
    prisma.userAchievement.count({ where: { userId: user.id } }),
    prisma.moduleSubscription.count({ where: { userId: user.id } }),
    prisma.account.count({ where: { userId: user.id } }),
    prisma.session.count({ where: { userId: user.id } }),
    prisma.sageCoachSession.count({ where: { userId: user.id } }),
    prisma.questionReport.count({ where: { userId: user.id } }),
    prisma.discussionThread.count({ where: { userId: user.id } }),
    prisma.discussionReply.count({ where: { userId: user.id } }),
  ]);
  const [
    sr, ps, fa, dr, ms, di, tc, tkc, fr, uj, ua, modSub, acc, sess, scs, qr, dt, dRep,
  ] = counts;

  console.log(`\n📊 Attached rows`);
  console.log(`   StudentResponse:        ${sr}`);
  console.log(`   PracticeSession:        ${ps}`);
  console.log(`   FrqAttempt:             ${fa}`);
  console.log(`   DiagnosticResult:       ${dr}`);
  console.log(`   MasteryScore:           ${ms}`);
  console.log(`   DashboardImpression:    ${di}`);
  console.log(`   TutorConversation:      ${tc}`);
  console.log(`   TutorKnowledgeCheck:    ${tkc}`);
  console.log(`   FlashcardReview:        ${fr}`);
  console.log(`   UserJourney:            ${uj}`);
  console.log(`   UserAchievement:        ${ua}`);
  console.log(`   ModuleSubscription:     ${modSub}`);
  console.log(`   Account (OAuth):        ${acc}`);
  console.log(`   Session:                ${sess}`);
  console.log(`   SageCoachSession:       ${scs}`);
  console.log(`   QuestionReport:         ${qr}`);
  console.log(`   DiscussionThread:       ${dt}`);
  console.log(`   DiscussionReply:        ${dRep}`);

  if (mode === "dry-run") {
    console.log(`\n🟡 DRY RUN — nothing deleted. Re-run with --reset or --delete to act.`);
    return;
  }

  console.log(`\n⚡ Executing: ${mode.toUpperCase()}`);

  // Neon HTTP doesn't support transactions, so we delete in dependency
  // order one table at a time. Order matters: leaf tables first.
  // (Cascade FKs cover most of this for User-delete, but we run explicit
  // deletes too to be safe across schema drift.)
  const ops = [
    ["TutorKnowledgeCheck",  () => prisma.tutorKnowledgeCheck.deleteMany({ where: { userId: user.id } })],
    ["StudentResponse",      () => prisma.studentResponse.deleteMany({ where: { userId: user.id } })],
    ["SessionQuestion",      async () => {
      const sessIds = await prisma.practiceSession.findMany({ where: { userId: user.id }, select: { id: true } });
      if (!sessIds.length) return { count: 0 };
      return prisma.sessionQuestion.deleteMany({ where: { sessionId: { in: sessIds.map((s) => s.id) } } });
    }],
    ["SessionFeedback",      () => prisma.sessionFeedback.deleteMany({ where: { userId: user.id } })],
    ["PracticeSession",      () => prisma.practiceSession.deleteMany({ where: { userId: user.id } })],
    ["FrqAttempt",           () => prisma.frqAttempt.deleteMany({ where: { userId: user.id } })],
    ["DiagnosticResult",     () => prisma.diagnosticResult.deleteMany({ where: { userId: user.id } })],
    ["MasteryScore",         () => prisma.masteryScore.deleteMany({ where: { userId: user.id } })],
    ["MasteryTierUp",        () => prisma.masteryTierUp.deleteMany({ where: { userId: user.id } })],
    ["MasteryGoal",          () => prisma.masteryGoal.deleteMany({ where: { userId: user.id } })],
    ["DashboardImpression",  () => prisma.dashboardImpression.deleteMany({ where: { userId: user.id } })],
    ["FunnelEvent",          () => prisma.funnelEvent.deleteMany({ where: { userId: user.id } })],
    ["TutorConversation",    () => prisma.tutorConversation.deleteMany({ where: { userId: user.id } })],
    ["FlashcardReview",      () => prisma.flashcardReview.deleteMany({ where: { userId: user.id } })],
    ["UserJourney",          () => prisma.userJourney.deleteMany({ where: { userId: user.id } })],
    ["UserAchievement",      () => prisma.userAchievement.deleteMany({ where: { userId: user.id } })],
    ["ModuleSubscription",   () => prisma.moduleSubscription.deleteMany({ where: { userId: user.id } })],
    ["StudyPlan",            () => prisma.studyPlan.deleteMany({ where: { userId: user.id } })],
    ["TrialReengagement",    () => prisma.trialReengagement.deleteMany({ where: { userId: user.id } })],
    ["DailyQuizSend",        () => prisma.dailyQuizSend.deleteMany({ where: { userId: user.id } })],
    ["QuestionReport",       () => prisma.questionReport.deleteMany({ where: { userId: user.id } })],
    ["DiscussionReply",      () => prisma.discussionReply.deleteMany({ where: { userId: user.id } })],
    ["DiscussionThread",     () => prisma.discussionThread.deleteMany({ where: { userId: user.id } })],
    ["SageCoachSession",     () => prisma.sageCoachSession.deleteMany({ where: { userId: user.id } })],
    ["VerificationToken",    () => prisma.verificationToken.deleteMany({ where: { userId: user.id } })],
    ["PasswordResetToken",   () => prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })],
    ["Account",              () => prisma.account.deleteMany({ where: { userId: user.id } })],
    ["Session",              () => prisma.session.deleteMany({ where: { userId: user.id } })],
  ];

  for (const [label, op] of ops) {
    try {
      const r = await op();
      console.log(`   ✓ ${label.padEnd(24)} deleted ${r.count}`);
    } catch (err) {
      console.warn(`   ⚠ ${label.padEnd(24)} skipped (${err.message?.slice(0, 80)})`);
    }
  }

  if (mode === "delete") {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`\n✅ Deleted User row. ${email} can now re-register from scratch.`);
  } else {
    // Reset key User fields so the next login starts at the journey rail.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingCompletedAt: null,
        examDate: null,
        streakDays: 0,
        longestStreak: 0,
        streakFreezes: 0,
        totalXp: 0,
        level: 1,
        lastActiveDate: null,
        freeTrialCourse: null,
        freeTrialExpiresAt: null,
        subscriptionTier: "FREE",
      },
    });
    console.log(`\n✅ Reset User. ${email} will see the fresh first-time experience next login.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

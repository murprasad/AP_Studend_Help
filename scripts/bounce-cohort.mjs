#!/usr/bin/env node
/**
 * Bounce-cohort dashboard query — StudentNest
 *
 * Quantifies the Scarlett & Shaadana class: Free users who signed up,
 * tried 0-1 activity, and never came back. This is the activation
 * bottleneck identified in the 2026-05-31 forensic.
 *
 * Run weekly: `node scripts/bounce-cohort.mjs`
 *
 * Output:
 *   - Cohort size (users in window)
 *   - Bounce count (0-1 session, never returned, no trial)
 *   - Bounce rate %
 *   - Score distribution of bounced users
 *   - Top 10 by recency (for manual outreach if desired)
 *
 * No writes. Read-only.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WINDOW_DAYS = parseInt(process.argv[2] || "7", 10);
const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000);

async function main() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  SN BOUNCE-COHORT DASHBOARD — last ${WINDOW_DAYS} days`);
  console.log(`  Window: ${since.toISOString()} → ${new Date().toISOString()}`);
  console.log("══════════════════════════════════════════════════════════\n");

  // 1. Cohort: every user who signed up in the window
  const cohort = await prisma.user.findMany({
    where: {
      createdAt: { gte: since },
      role: "STUDENT",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      track: true,
      gradeLevel: true,
      freeTrialExpiresAt: true,
      freeTrialCourse: true,
      onboardingCompletedAt: true,
    },
  });

  console.log(`Cohort size (signups): ${cohort.length}`);
  if (cohort.length === 0) {
    console.log("\nNo signups in window. Done.");
    return;
  }

  // 2. For each, count their sessions + last session score
  const enriched = await Promise.all(
    cohort.map(async (u) => {
      const [sessionCount, lastSession] = await Promise.all([
        prisma.practiceSession.count({ where: { userId: u.id } }),
        prisma.practiceSession.findFirst({
          where: { userId: u.id },
          orderBy: { startedAt: "desc" },
          select: {
            course: true,
            sessionType: true,
            totalQuestions: true,
            correctAnswers: true,
            completedAt: true,
            status: true,
          },
        }),
      ]);
      const accuracy = lastSession && lastSession.totalQuestions > 0
        ? Math.round(((lastSession.correctAnswers ?? 0) / lastSession.totalQuestions) * 100)
        : null;
      return { ...u, sessionCount, lastSession, accuracy };
    }),
  );

  // 3. Define a "bounce": 0-1 sessions, no trial, no return signal
  const bounced = enriched.filter((u) => u.sessionCount <= 1 && !u.freeTrialExpiresAt);
  const activated = enriched.filter((u) => u.sessionCount >= 2);
  const trialStarted = enriched.filter((u) => u.freeTrialExpiresAt !== null);

  const bounceRate = cohort.length > 0 ? Math.round((bounced.length / cohort.length) * 100) : 0;

  console.log("\n── Funnel ─────────────────────────────────────────────────");
  console.log(`  Signed up:                 ${cohort.length}`);
  console.log(`  Completed onboarding:      ${cohort.filter(u => u.onboardingCompletedAt).length}`);
  console.log(`  Started a session:         ${enriched.filter(u => u.sessionCount >= 1).length}`);
  console.log(`  Returned (≥ 2 sessions):   ${activated.length}`);
  console.log(`  Started a trial:           ${trialStarted.length}`);
  console.log(`  ──────────────────────────────────────`);
  console.log(`  Bounced (0-1 sess, no trial): ${bounced.length}  (${bounceRate}%)`);

  // 4. Score distribution of bounced users with a recorded last-session accuracy
  const bouncedWithScore = bounced.filter((u) => u.accuracy !== null);
  if (bouncedWithScore.length > 0) {
    const buckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0 };
    for (const u of bouncedWithScore) {
      const a = u.accuracy;
      if (a <= 25) buckets["0-25%"]++;
      else if (a <= 50) buckets["26-50%"]++;
      else if (a <= 75) buckets["51-75%"]++;
      else buckets["76-100%"]++;
    }
    console.log("\n── Last-session score distribution (bounced users) ────────");
    for (const [k, v] of Object.entries(buckets)) {
      const pct = Math.round((v / bouncedWithScore.length) * 100);
      const bar = "█".repeat(Math.floor(pct / 2));
      console.log(`  ${k.padEnd(8)} ${String(v).padStart(3)}  ${bar} ${pct}%`);
    }
    console.log(`  (n=${bouncedWithScore.length} bounced with a recorded session)`);
  }

  // 5. Top 10 most-recent bounces — for manual outreach signal
  const recentBounces = bounced
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
  console.log("\n── 10 most recent bounces ────────────────────────────────");
  for (const u of recentBounces) {
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "(no name)";
    const score = u.accuracy !== null ? `${u.accuracy}%` : "n/a";
    const course = u.lastSession?.course ?? "—";
    const hoursAgo = Math.round((Date.now() - u.createdAt.getTime()) / 3_600_000);
    console.log(
      `  ${u.email.padEnd(40)} ${name.padEnd(25)} G${u.gradeLevel ?? "?"}  ${(u.track ?? "?").padEnd(4)} ${course.padEnd(18)} score:${score.padStart(5)}  ${hoursAgo}h ago`,
    );
  }

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  Insight: bounced users with score < 50% are the highest-");
  console.log("  intent recovery target. Wire them to a 1-hour bounce email.");
  console.log("══════════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

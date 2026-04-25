#!/usr/bin/env node
/**
 * Last 48 real users — funnel snapshot.
 *
 * Excludes test/internal accounts. For each user shows:
 *   - When they signed up
 *   - Whether they finished onboarding
 *   - Whether they answered a question (first action)
 *   - How many sessions / responses they have
 *   - Tier
 *
 * Aggregate at the end: signup→onboard→first-question→retention funnel.
 *
 * READ ONLY — no DB writes. Safe to run any time.
 *
 * Usage:
 *   node scripts/last-48-users.mjs
 *   node scripts/last-48-users.mjs --csv      # CSV format for spreadsheets
 */

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const CSV = process.argv.includes("--csv");
const N = 48;

// Anything matching these is excluded as test/internal.
const EXCLUDE_PATTERNS = [
  /functional-test-runner/i,
  /@test\.studentnest\.ai$/i,
  /^murprasad\+e2e/i,             // e2e test users (murprasad+e2e-test1..N@gmail.com)
  /\+e2e-test/i,
  /test\.invalid$/i,
];

function isTestUser(email) {
  return EXCLUDE_PATTERNS.some((re) => re.test(email));
}

const candidates = await prisma.user.findMany({
  orderBy: { createdAt: "desc" },
  take: 200, // pull more, we'll filter
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    createdAt: true,
    emailVerified: true,
    onboardingCompletedAt: true,
    subscriptionTier: true,
    track: true,
    stripeSubscriptionId: true,
    stripeCurrentPeriodEnd: true,
  },
});

const real = candidates.filter((u) => !isTestUser(u.email)).slice(0, N);

if (real.length === 0) {
  console.log("No real users found.");
  process.exit(0);
}

// Per-user activity counts
const ids = real.map((u) => u.id);
const [responses, sessions, tutors] = await Promise.all([
  prisma.studentResponse.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
    _max: { answeredAt: true },
  }),
  prisma.practiceSession.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  }),
  prisma.tutorConversation.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  }),
]);

const respMap = new Map(responses.map((r) => [r.userId, { count: r._count._all, lastAt: r._max.answeredAt }]));
const sessMap = new Map(sessions.map((r) => [r.userId, r._count._all]));
const tutorMap = new Map(tutors.map((r) => [r.userId, r._count._all]));

if (CSV) {
  console.log("createdAt,email,firstName,verified,onboardCompleted,tier,track,sessions,responses,tutorChats,lastAnsweredAt,stripeSubId");
  for (const u of real) {
    const r = respMap.get(u.id) ?? { count: 0, lastAt: null };
    const s = sessMap.get(u.id) ?? 0;
    const t = tutorMap.get(u.id) ?? 0;
    console.log([
      u.createdAt.toISOString(),
      u.email,
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
      u.emailVerified ? "yes" : "no",
      u.onboardingCompletedAt ? "yes" : "no",
      u.subscriptionTier,
      u.track ?? "",
      s,
      r.count,
      t,
      r.lastAt ? r.lastAt.toISOString() : "",
      u.stripeSubscriptionId ?? "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  }
  process.exit(0);
}

// Pretty printout
console.log(`\nLast ${real.length} real users (test accounts excluded):\n`);
console.log("│ Created   │ Email                              │ Onboard │ Tier     │ Sess │ Resp │ Tutor │ Last Activity      │");
console.log("├───────────┼────────────────────────────────────┼─────────┼──────────┼──────┼──────┼───────┼────────────────────┤");
for (const u of real) {
  const r = respMap.get(u.id) ?? { count: 0, lastAt: null };
  const s = sessMap.get(u.id) ?? 0;
  const t = tutorMap.get(u.id) ?? 0;
  const created = u.createdAt.toISOString().slice(0, 10);
  const email = u.email.length > 34 ? u.email.slice(0, 31) + "..." : u.email.padEnd(34);
  const onb = u.onboardingCompletedAt ? "✅      " : "❌      ";
  const tier = (u.subscriptionTier || "").padEnd(8);
  const last = r.lastAt ? r.lastAt.toISOString().slice(0, 16).replace("T", " ") : "—".padEnd(16);
  console.log(`│ ${created} │ ${email} │ ${onb}│ ${tier} │ ${String(s).padStart(4)} │ ${String(r.count).padStart(4)} │ ${String(t).padStart(5)} │ ${last.padEnd(18)} │`);
}

// ── Aggregate funnel ─────────────────────────────────────────────────
const total = real.length;
const verified = real.filter((u) => u.emailVerified).length;
const onboarded = real.filter((u) => u.onboardingCompletedAt).length;
const answered = real.filter((u) => (respMap.get(u.id)?.count ?? 0) > 0).length;
const sessioned = real.filter((u) => (sessMap.get(u.id) ?? 0) > 0).length;
const usedTutor = real.filter((u) => (tutorMap.get(u.id) ?? 0) > 0).length;
const premium = real.filter((u) => u.subscriptionTier !== "FREE").length;
const stuckAtSignup = real.filter((u) => !u.emailVerified).length;
const stuckPostVerify = real.filter((u) => u.emailVerified && !u.onboardingCompletedAt).length;
const stuckPostOnboard = real.filter((u) => u.onboardingCompletedAt && (respMap.get(u.id)?.count ?? 0) === 0).length;
const dau24h = real.filter((u) => {
  const last = respMap.get(u.id)?.lastAt;
  if (!last) return false;
  return Date.now() - last.getTime() < 24 * 60 * 60 * 1000;
}).length;
const wau7d = real.filter((u) => {
  const last = respMap.get(u.id)?.lastAt;
  if (!last) return false;
  return Date.now() - last.getTime() < 7 * 24 * 60 * 60 * 1000;
}).length;

const tracks = real.reduce((acc, u) => {
  const k = u.track ?? "(none)";
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

console.log(`\n── Funnel (${total} real users) ──`);
console.log(`  Total signups:           ${total}`);
console.log(`  Email verified:          ${verified}  (${pct(verified, total)})`);
console.log(`  Onboarding complete:     ${onboarded}  (${pct(onboarded, total)} of signups)`);
console.log(`  Answered ≥1 question:    ${answered}  (${pct(answered, onboarded)} of onboarded)`);
console.log(`  Started ≥1 session:      ${sessioned}  (${pct(sessioned, onboarded)} of onboarded)`);
console.log(`  Used Sage tutor:         ${usedTutor}  (${pct(usedTutor, onboarded)} of onboarded)`);
console.log(`  Premium:                 ${premium}  (${pct(premium, total)} of total)`);
console.log(`  Active in last 24h:      ${dau24h}`);
console.log(`  Active in last 7d:       ${wau7d}`);
console.log("\n── Drop-off points ──");
console.log(`  Stuck pre-verify:        ${stuckAtSignup}  (${pct(stuckAtSignup, total)})`);
console.log(`  Stuck pre-onboard:       ${stuckPostVerify}  (${pct(stuckPostVerify, total)})`);
console.log(`  Stuck pre-first-Q:       ${stuckPostOnboard}  (${pct(stuckPostOnboard, total)})`);

console.log("\n── Track distribution ──");
for (const [k, v] of Object.entries(tracks).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(8)} ${v}  (${pct(v, total)})`);
}

function pct(part, whole) {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

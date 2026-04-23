#!/usr/bin/env node
// Last-5-users engagement snapshot — post conversion overhaul (2026-04-22).
// Reports per-user activity + funnel events + conversion to PREMIUM.
import "dotenv/config";
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, neonConfig, types } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true;
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v);

const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeonHTTP(sql);
const p = new PrismaClient({ adapter });

function fmt(d) {
  return d ? new Date(d).toISOString().replace("T", " ").slice(0, 19) + "Z" : "—";
}

function ago(d) {
  if (!d) return "—";
  const hrs = (Date.now() - new Date(d).getTime()) / 3600000;
  if (hrs < 1) return `${Math.round(hrs * 60)}m ago`;
  if (hrs < 48) return `${hrs.toFixed(1)}h ago`;
  return `${(hrs / 24).toFixed(1)}d ago`;
}

const users = await p.user.findMany({
  orderBy: { createdAt: "desc" },
  take: 5,
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    createdAt: true,
    subscriptionTier: true,
    stripeSubscriptionStatus: true,
    stripeCurrentPeriodEnd: true,
    track: true,
    freeTrialExpiresAt: true,
    freeTrialCourse: true,
    onboardingCompletedAt: true,
    lastActiveDate: true,
    lastLoginCountry: true,
    lastLoginRegion: true,
    lastLoginCity: true,
    totalXp: true,
    streakDays: true,
    examDate: true,
  },
});

console.log("━".repeat(90));
console.log(`LAST 5 SIGN-UPS — engagement since conversion overhaul (2026-04-22)`);
console.log(`Generated at: ${new Date().toISOString()}`);
console.log("━".repeat(90));

const rows = [];
for (const u of users) {
  const [
    psAll,
    psDone,
    srAll,
    srCorrect,
    tcCount,
    diCount,
    diLastAt,
  ] = await Promise.all([
    p.practiceSession.count({ where: { userId: u.id } }),
    p.practiceSession.count({ where: { userId: u.id, status: "COMPLETED" } }),
    p.studentResponse.count({ where: { userId: u.id } }),
    p.studentResponse.count({ where: { userId: u.id, isCorrect: true } }),
    p.tutorConversation.count({ where: { userId: u.id } }),
    p.dashboardImpression.count({ where: { userId: u.id } }),
    p.dashboardImpression.findFirst({
      where: { userId: u.id },
      orderBy: { dashboardLoadedAt: "desc" },
      select: { dashboardLoadedAt: true, coachPlanCtaClickedAt: true },
    }),
  ]);
  rows.push({
    u,
    psAll,
    psDone,
    srAll,
    srCorrect,
    tcCount,
    diCount,
    diLast: diLastAt?.dashboardLoadedAt,
    ctaClick: diLastAt?.coachPlanCtaClickedAt,
  });
}

// Per-user detail
for (const r of rows) {
  const u = r.u;
  const loc =
    [u.lastLoginCity, u.lastLoginRegion, u.lastLoginCountry].filter(Boolean).join(", ") || "—";
  const acc = r.srAll ? ((100 * r.srCorrect) / r.srAll).toFixed(0) + "%" : "—";
  const onboarded = u.onboardingCompletedAt ? "yes" : "NO";
  const trial =
    u.freeTrialExpiresAt && new Date(u.freeTrialExpiresAt) > new Date()
      ? `active (${u.freeTrialCourse ?? "?"})`
      : u.freeTrialCourse
      ? "expired"
      : "—";
  console.log("");
  console.log(
    `${u.firstName ?? "?"} ${u.lastName ?? ""}   <${u.email}>   signed up ${ago(u.createdAt)}  (${fmt(u.createdAt)})`
  );
  console.log(
    `  track=${u.track}   tier=${u.subscriptionTier}${
      u.stripeSubscriptionStatus ? ` (${u.stripeSubscriptionStatus})` : ""
    }   location=${loc}`
  );
  console.log(
    `  onboarded=${onboarded}   trial=${trial}   examDate=${u.examDate ? fmt(u.examDate).slice(0, 10) : "—"}   xp=${u.totalXp}   streak=${u.streakDays}`
  );
  console.log(
    `  dashboardImpressions=${r.diCount}   lastDashLoad=${ago(r.diLast)}   coachCtaClicked=${r.ctaClick ? "yes" : "no"}`
  );
  console.log(
    `  practiceSessions: ${r.psAll} total / ${r.psDone} completed   responses: ${r.srAll} (${r.srCorrect} correct, ${acc})   tutorConversations: ${r.tcCount}`
  );
  console.log(`  lastActive=${ago(u.lastActiveDate)}`);
}

// Summary table
console.log("\n" + "━".repeat(90));
console.log("SUMMARY TABLE");
console.log("━".repeat(90));
const hdr = [
  "Name".padEnd(20),
  "Tier".padEnd(8),
  "Signed up".padEnd(12),
  "Dash".padEnd(5),
  "Sess".padEnd(5),
  "Comp".padEnd(5),
  "Resp".padEnd(5),
  "Acc%".padEnd(5),
  "Tutor".padEnd(5),
  "Onbd".padEnd(5),
].join(" ");
console.log(hdr);
console.log("-".repeat(hdr.length));
for (const r of rows) {
  const acc = r.srAll ? Math.round((100 * r.srCorrect) / r.srAll) + "" : "—";
  console.log(
    [
      `${(r.u.firstName ?? "?").slice(0, 10)} ${(r.u.lastName ?? "").slice(0, 8)}`.padEnd(20),
      (r.u.subscriptionTier ?? "—").padEnd(8),
      ago(r.u.createdAt).padEnd(12),
      String(r.diCount).padEnd(5),
      String(r.psAll).padEnd(5),
      String(r.psDone).padEnd(5),
      String(r.srAll).padEnd(5),
      String(acc).padEnd(5),
      String(r.tcCount).padEnd(5),
      (r.u.onboardingCompletedAt ? "y" : "n").padEnd(5),
    ].join(" ")
  );
}

// Conversion answer
const upgraded = rows.filter(
  (r) => r.u.subscriptionTier && r.u.subscriptionTier !== "FREE"
);
console.log("\n" + "━".repeat(90));
console.log(`CONVERSION: ${upgraded.length} of last 5 upgraded to non-FREE tier`);
if (upgraded.length) {
  for (const r of upgraded) {
    console.log(
      `  ${r.u.firstName} ${r.u.lastName} → ${r.u.subscriptionTier} (${r.u.stripeSubscriptionStatus ?? "no stripe status"})`
    );
  }
}
console.log("━".repeat(90));

// Funnel events last 24h aggregate
console.log("\nFUNNEL EVENTS — last 24h aggregate");
console.log("-".repeat(50));
try {
  const since24 = new Date(Date.now() - 24 * 3600 * 1000);
  const fe = await p.funnelEvent.groupBy({
    by: ["event"],
    where: { createdAt: { gte: since24 } },
    _count: { _all: true },
    orderBy: { event: "asc" },
  });
  if (fe.length === 0) {
    console.log("  (no events in last 24h)");
  } else {
    for (const row of fe) {
      console.log(`  ${row.event.padEnd(20)} ${row._count._all}`);
    }
  }
  // Unique users & synthetic
  const uniq = await p.funnelEvent.findMany({
    where: { createdAt: { gte: since24 } },
    select: { userId: true, impressionId: true },
  });
  const uniqUsers = new Set(uniq.map((x) => x.userId)).size;
  const synth = uniq.filter(
    (x) => x.impressionId?.startsWith("fallback_") || x.impressionId?.startsWith("client_")
  ).length;
  console.log(`  -- unique users: ${uniqUsers}   synthetic ids: ${synth} of ${uniq.length}`);
} catch (e) {
  console.log(`  (funnel_events read error: ${e.message})`);
}

// Funnel events attributable to our 5 users
console.log("\nFUNNEL EVENTS — attributable to these 5 users (all time)");
console.log("-".repeat(50));
try {
  const ids = rows.map((r) => r.u.id);
  const fe = await p.funnelEvent.groupBy({
    by: ["userId", "event"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });
  if (fe.length === 0) {
    console.log("  (no funnel events for any of the 5)");
  } else {
    // pivot by user
    const byUser = new Map();
    for (const row of fe) {
      if (!byUser.has(row.userId)) byUser.set(row.userId, {});
      byUser.get(row.userId)[row.event] = row._count._all;
    }
    for (const r of rows) {
      const m = byUser.get(r.u.id);
      if (!m) continue;
      const entries = Object.entries(m)
        .map(([k, v]) => `${k}=${v}`)
        .join("  ");
      console.log(`  ${(r.u.firstName ?? "?").padEnd(12)} ${entries}`);
    }
  }
} catch (e) {
  console.log(`  (error: ${e.message})`);
}

await p.$disconnect();

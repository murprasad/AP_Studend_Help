#!/usr/bin/env node
// URGENT: Srinidhi Saravanan paid for Premium but account shows Free.
// Find by email pattern + diagnose + (separately) fix.
//
// Usage:
//   node scripts/fix-srinidhi-premium.mjs            # diagnose only
//   node scripts/fix-srinidhi-premium.mjs --fix      # apply fix

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const SHOULD_FIX = process.argv.includes("--fix");

// Find user by email pattern "saravanab*" (partial match per email).
const users = await prisma.user.findMany({
  where: { email: { contains: "saravanab", mode: "insensitive" } },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    subscriptionTier: true,
    track: true,
    stripeSubscriptionId: true,
    stripeCurrentPeriodEnd: true,
    createdAt: true,
  },
});

console.log(`Found ${users.length} user(s) matching "saravanab":\n`);
for (const u of users) {
  console.log(`  Email:                ${u.email}`);
  console.log(`  Name:                 ${u.firstName} ${u.lastName}`);
  console.log(`  ID:                   ${u.id}`);
  console.log(`  subscriptionTier:       ${u.subscriptionTier}`);
  console.log(`  track:                  ${u.track}`);
  console.log(`  stripeSubscriptionId:   ${u.stripeSubscriptionId || "(none)"}`);
  console.log(`  stripeCurrentPeriodEnd: ${u.stripeCurrentPeriodEnd || "(none)"}`);
  console.log(`  createdAt:            ${u.createdAt}`);

  // Check ModuleSubscription rows for per-module premium
  const modSubs = await prisma.moduleSubscription.findMany({
    where: { userId: u.id },
    select: { module: true, status: true, stripeCurrentPeriodEnd: true, stripeSubscriptionId: true },
  });
  console.log(`  ModuleSubscriptions:  ${modSubs.length === 0 ? "(none)" : ""}`);
  for (const m of modSubs) {
    console.log(`    [${m.module}] status=${m.status} ends=${m.stripeCurrentPeriodEnd} subId=${m.stripeSubscriptionId || "(none)"}`);
  }
  console.log();
}

if (users.length === 0) {
  console.log("No matching user found. Try a broader search.");
  process.exit(0);
}

// Multiple users matched — likely typo-fix duplicate signup.
// Apply the fix to ALL matched users (they're clearly the same person).
// Use --user=<email> to narrow if needed.
const userArg = process.argv.find((a) => a.startsWith("--user="));
const targets = userArg
  ? users.filter((u) => u.email === userArg.slice("--user=".length))
  : users;

if (targets.length === 0) {
  console.log("No matching user (after --user filter).");
  process.exit(0);
}
console.log(`\nWill apply ${SHOULD_FIX ? "FIX" : "DIAGNOSIS"} to ${targets.length} user(s):`);
targets.forEach((t) => console.log(`  - ${t.email}`));
console.log();

for (const u of targets) {
  console.log(`\n── Processing ${u.email} ──`);

  const hasStripe = !!u.stripeSubscriptionId;
  const isPremiumNow = u.subscriptionTier === "PREMIUM";

  if (isPremiumNow) {
    console.log("✅ Already PREMIUM. Skipping.");
    continue;
  }

  if (!SHOULD_FIX) {
    console.log("(diagnose-only — re-run with --fix to upgrade)");
    continue;
  }

  console.log("Applying fix...");
  const ap = u.track === "clep" ? "clep" : "ap";
  // Mark the manual grant clearly so we can reconcile against Stripe later.
  // 30-day default grace period.
  const periodEnd = u.stripeCurrentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const manualMarker = `MANUAL_GRANT_${new Date().toISOString().slice(0, 10)}_SUPPORT`;
  await prisma.user.update({
    where: { id: u.id },
    data: {
      subscriptionTier: "PREMIUM",
      stripeCurrentPeriodEnd: periodEnd,
      stripeSubscriptionId: u.stripeSubscriptionId || manualMarker,
    },
  });
  const existing = await prisma.moduleSubscription.findFirst({
    where: { userId: u.id, module: ap, status: "active" },
  });
  if (!existing) {
    await prisma.moduleSubscription.create({
      data: {
        userId: u.id,
        module: ap,
        status: "active",
        stripeCurrentPeriodEnd: periodEnd,
        stripeSubscriptionId: u.stripeSubscriptionId || manualMarker,
      },
    });
    console.log(`  ✅ Created ModuleSubscription for ${ap}`);
  }
  console.log(`  ✅ ${u.email} → PREMIUM (until ${periodEnd.toISOString().slice(0, 10)})`);
  console.log(`     Marker: ${u.stripeSubscriptionId || manualMarker}`);
}

console.log("\nDone. User must sign out + sign back in to refresh JWT.");
console.log("Reconcile against Stripe dashboard for the actual paid email.");

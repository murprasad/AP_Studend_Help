#!/usr/bin/env node
/**
 * Comp Premium access for akshaymuraliprasad2010@gmail.com (tester).
 *
 * Grants:
 *   - User.subscriptionTier = PREMIUM
 *   - ModuleSubscription rows for ap, sat, act, clep, dsst (all modules
 *     supported on StudentNest), status=active, periodEnd=NOW+1yr
 *   - stripeSubscriptionId = "COMP_TESTER_<YYYY-MM-DD>" so it's clearly
 *     a comp and can be reconciled against Stripe (won't match any real
 *     subscription) without false-positive "paid but not credited" alarms.
 *
 * Mirrors the pattern in scripts/fix-srinidhi-premium.mjs.
 *
 * Usage:
 *   node scripts/comp-akshay-premium.mjs            # diagnose only
 *   node scripts/comp-akshay-premium.mjs --fix      # apply
 */

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const SHOULD_FIX = process.argv.includes("--fix");
const TARGET_EMAIL = "akshaymuraliprasad2010@gmail.com";
const MODULES = ["ap", "sat", "act", "clep", "dsst"];
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const user = await prisma.user.findUnique({
  where: { email: TARGET_EMAIL },
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
    emailVerified: true,
  },
});

if (!user) {
  console.log(`❌ User not found: ${TARGET_EMAIL}`);
  console.log("   They need to sign up first via /register before we can comp them.");
  process.exit(1);
}

console.log("Found user:");
console.log(`  Email:                ${user.email}`);
console.log(`  Name:                 ${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
console.log(`  ID:                   ${user.id}`);
console.log(`  emailVerified:        ${user.emailVerified ? "yes" : "no"}`);
console.log(`  subscriptionTier:     ${user.subscriptionTier}`);
console.log(`  track:                ${user.track ?? "(none)"}`);
console.log(`  stripeSubscriptionId: ${user.stripeSubscriptionId || "(none)"}`);
console.log(`  stripeCurrentPeriodEnd: ${user.stripeCurrentPeriodEnd || "(none)"}`);
console.log(`  createdAt:            ${user.createdAt}`);

const modSubs = await prisma.moduleSubscription.findMany({
  where: { userId: user.id },
  select: { module: true, status: true, stripeCurrentPeriodEnd: true, stripeSubscriptionId: true },
});
console.log(`  ModuleSubscriptions:  ${modSubs.length === 0 ? "(none)" : ""}`);
for (const m of modSubs) {
  console.log(`    [${m.module}] status=${m.status} ends=${m.stripeCurrentPeriodEnd} subId=${m.stripeSubscriptionId || "(none)"}`);
}

if (!SHOULD_FIX) {
  console.log("\n(diagnose-only — re-run with --fix to comp)");
  console.log(`Would do: tier=PREMIUM, ModuleSubscription rows for [${MODULES.join(", ")}], periodEnd=+1y, marker=COMP_TESTER`);
  process.exit(0);
}

console.log("\nApplying comp...");
const periodEnd = new Date(Date.now() + ONE_YEAR_MS);
const marker = `COMP_TESTER_${new Date().toISOString().slice(0, 10)}`;

await prisma.user.update({
  where: { id: user.id },
  data: {
    subscriptionTier: "PREMIUM",
    stripeCurrentPeriodEnd: periodEnd,
    stripeSubscriptionId: user.stripeSubscriptionId || marker,
  },
});
console.log(`  ✅ User.subscriptionTier = PREMIUM (until ${periodEnd.toISOString().slice(0, 10)})`);

let created = 0;
let updated = 0;
for (const mod of MODULES) {
  const existing = await prisma.moduleSubscription.findFirst({
    where: { userId: user.id, module: mod },
  });
  if (existing) {
    await prisma.moduleSubscription.update({
      where: { id: existing.id },
      data: {
        status: "active",
        stripeCurrentPeriodEnd: periodEnd,
        stripeSubscriptionId: existing.stripeSubscriptionId || marker,
      },
    });
    updated++;
    console.log(`  ✅ Updated ModuleSubscription[${mod}] → active`);
  } else {
    await prisma.moduleSubscription.create({
      data: {
        userId: user.id,
        module: mod,
        status: "active",
        stripeCurrentPeriodEnd: periodEnd,
        stripeSubscriptionId: marker,
      },
    });
    created++;
    console.log(`  ✅ Created ModuleSubscription[${mod}]`);
  }
}

console.log(`\nDone. ${created} module(s) created, ${updated} module(s) updated.`);
console.log("Next: ask the tester to sign out + sign back in to refresh JWT.");
console.log("Reconcile note: marker is COMP_TESTER_*; will not match any Stripe sub.");

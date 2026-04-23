#!/usr/bin/env node
// Verify Srinidhi (saravanab*) accounts have full Premium access.
// Read-only.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();

const users = await prisma.user.findMany({
  where: { email: { contains: "saravanab", mode: "insensitive" } },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    subscriptionTier: true,
    stripeSubscriptionId: true,
    stripeCurrentPeriodEnd: true,
    stripeSubscriptionStatus: true,
    track: true,
  },
});

console.log(`Found ${users.length} Srinidhi account(s):\n`);

for (const u of users) {
  const isPremium = u.subscriptionTier !== "FREE";
  const periodEndDate = u.stripeCurrentPeriodEnd;
  const daysRemaining = periodEndDate
    ? Math.ceil((periodEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  console.log(`── ${u.email} ──`);
  console.log(`   id:                       ${u.id}`);
  console.log(`   subscriptionTier:           ${u.subscriptionTier}  ${isPremium ? "✅" : "❌ STILL FREE"}`);
  console.log(`   track:                      ${u.track ?? "(none)"}`);
  console.log(`   stripeSubscriptionId:       ${u.stripeSubscriptionId ?? "(none)"}`);
  console.log(`   stripeCurrentPeriodEnd:     ${periodEndDate?.toISOString() ?? "(none)"} ${daysRemaining !== null ? `(${daysRemaining} days remaining)` : ""}`);
  console.log(`   stripeSubscriptionStatus:   ${u.stripeSubscriptionStatus ?? "(none)"}`);

  const mods = await prisma.moduleSubscription.findMany({
    where: { userId: u.id },
    select: { module: true, status: true, stripeCurrentPeriodEnd: true },
  });
  console.log(`   ModuleSubscriptions:        ${mods.length === 0 ? "❌ NONE" : ""}`);
  for (const m of mods) {
    const mDays = m.stripeCurrentPeriodEnd
      ? Math.ceil((m.stripeCurrentPeriodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      : null;
    console.log(`     [${m.module}] status=${m.status} ends=${m.stripeCurrentPeriodEnd?.toISOString().slice(0, 10) ?? "-"} (${mDays ?? "?"}d)`);
  }
  console.log();
}

console.log(`── Verdict ──`);
const allPremium = users.every((u) => u.subscriptionTier !== "FREE");
const allHaveModSub = await Promise.all(
  users.map(async (u) => {
    const c = await prisma.moduleSubscription.count({ where: { userId: u.id, status: "active" } });
    return c > 0;
  }),
);
const allModulesActive = allHaveModSub.every(Boolean);
const allInFuture = users.every(
  (u) => u.stripeCurrentPeriodEnd && u.stripeCurrentPeriodEnd > new Date(),
);

if (allPremium && allModulesActive && allInFuture) {
  console.log(`   ✅ Both accounts have full Premium access. Active subscriptions, in-future period end.`);
} else {
  console.log(`   ⚠️  Some accounts not fully Premium:`);
  if (!allPremium) console.log(`        - Not all subscriptionTier are non-FREE`);
  if (!allModulesActive) console.log(`        - Some accounts missing active ModuleSubscription`);
  if (!allInFuture) console.log(`        - Some stripeCurrentPeriodEnd is in the past or null`);
}

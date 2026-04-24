#!/usr/bin/env node
// Verify post-payment state for the second E2E test user. Read-only.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const EMAIL = "murprasad+e2e-test2@gmail.com";

const user = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: {
    id: true,
    email: true,
    subscriptionTier: true,
    stripeSubscriptionId: true,
    stripeCurrentPeriodEnd: true,
    stripeSubscriptionStatus: true,
    updatedAt: true,
  },
});

if (!user) {
  console.log(`❌ User ${EMAIL} not found.`);
  process.exit(1);
}

const isPremium = user.subscriptionTier !== "FREE";
console.log(`\n── User row ──`);
console.log(`   email:                   ${user.email}`);
console.log(`   subscriptionTier:          ${user.subscriptionTier}  ${isPremium ? "✅ PREMIUM" : "❌ STILL FREE"}`);
console.log(`   stripeSubscriptionId:      ${user.stripeSubscriptionId ?? "(none)"}`);
console.log(`   stripeCurrentPeriodEnd:    ${user.stripeCurrentPeriodEnd?.toISOString() ?? "(none)"}`);
console.log(`   stripeSubscriptionStatus:  ${user.stripeSubscriptionStatus ?? "(none)"}`);
console.log(`   updatedAt:                 ${user.updatedAt.toISOString()}`);

const mods = await prisma.moduleSubscription.findMany({
  where: { userId: user.id },
  select: { module: true, status: true, stripeSubscriptionId: true, stripeCurrentPeriodEnd: true, createdAt: true },
});
console.log(`\n── ModuleSubscription rows (${mods.length}) ──`);
for (const m of mods) {
  console.log(`   [${m.module}] status=${m.status} ends=${m.stripeCurrentPeriodEnd?.toISOString() ?? "-"}`);
  console.log(`            sub_id=${m.stripeSubscriptionId ?? "(none)"}`);
}

console.log(`\n── Verdict ──`);
if (isPremium && mods.some((m) => m.status === "active")) {
  console.log(`   ✅ End-to-end Premium flow WORKS.`);
  console.log(`      Webhook fired, DB updated, ModuleSubscription created.`);
} else if (isPremium) {
  console.log(`   ⚠️  User row updated but no active ModuleSubscription.`);
} else if (mods.some((m) => m.status === "active")) {
  console.log(`   ⚠️  ModuleSubscription created but User.subscriptionTier still FREE.`);
} else {
  console.log(`   ❌ Webhook did not update the user yet (or hasn't fired).`);
  console.log(`      If you just paid, wait 5-15s and re-run.`);
  console.log(`      If still FREE after 60s, the email-fallback may have failed —`);
  console.log(`      check the Stripe customer email matches "${EMAIL}".`);
}

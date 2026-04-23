#!/usr/bin/env node
// Verify the post-payment state for the E2E test user.
// Read-only — no modifications.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const EMAIL = "murprasad+e2e-test1@gmail.com";

const user = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: {
    id: true,
    email: true,
    subscriptionTier: true,
    stripeSubscriptionId: true,
    stripeCurrentPeriodEnd: true,
    stripeSubscriptionStatus: true,
    createdAt: true,
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
console.log(`   id:                      ${user.id}`);
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
  console.log(`   [${m.module}] status=${m.status}`);
  console.log(`            stripeSubscriptionId=${m.stripeSubscriptionId ?? "(none)"}`);
  console.log(`            stripeCurrentPeriodEnd=${m.stripeCurrentPeriodEnd?.toISOString() ?? "(none)"}`);
  console.log(`            createdAt=${m.createdAt.toISOString()}`);
}

console.log(`\n── Verdict ──`);
if (isPremium && mods.some(m => m.status === "active")) {
  console.log(`   ✅ End-to-end Premium flow WORKS.`);
  console.log(`      Webhook fired, DB updated, ModuleSubscription created.`);
} else if (isPremium) {
  console.log(`   ⚠️  User row updated but no active ModuleSubscription.`);
  console.log(`      checkout.session.completed succeeded, customer.subscription.created may have failed.`);
} else if (mods.some(m => m.status === "active")) {
  console.log(`   ⚠️  ModuleSubscription created but User.subscriptionTier still FREE.`);
} else {
  console.log(`   ❌ Webhook did not update the user.`);
  console.log(`      Either webhook delivery failed (check Stripe dashboard for 500s),`);
  console.log(`      or it's still in-flight (Stripe webhooks usually arrive within seconds).`);
  console.log(`      Wait 30s and re-run this script. If still FREE, the cron will catch it within 60 min.`);
}

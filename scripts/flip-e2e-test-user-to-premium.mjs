#!/usr/bin/env node
// Restore PREMIUM access for the E2E test user who paid twice
// (real $19.98 charged) but webhook failed to credit them.
// Manual restoration of the state their payments paid for.
import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const USER_ID = "cmoc3vo720000uung94mu3qf7";
const EMAIL = "murprasad+e2e-test1@gmail.com";

const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
const marker = `MANUAL_GRANT_${new Date().toISOString().slice(0, 10)}_E2E_TEST`;

const updated = await prisma.user.update({
  where: { id: USER_ID },
  data: {
    subscriptionTier: "AP_PREMIUM",
    stripeSubscriptionId: marker,
    stripeCurrentPeriodEnd: periodEnd,
    stripeSubscriptionStatus: "active",
  },
  select: { email: true, subscriptionTier: true, stripeCurrentPeriodEnd: true },
});

console.log(`✅ User updated:`);
console.log(`   email:                 ${updated.email}`);
console.log(`   subscriptionTier:        ${updated.subscriptionTier}`);
console.log(`   stripeCurrentPeriodEnd:  ${updated.stripeCurrentPeriodEnd?.toISOString()}`);

// Create the matching ModuleSubscription for AP
const existing = await prisma.moduleSubscription.findFirst({
  where: { userId: USER_ID, module: "ap", status: "active" },
});
if (!existing) {
  await prisma.moduleSubscription.create({
    data: {
      userId: USER_ID,
      module: "ap",
      status: "active",
      stripeSubscriptionId: marker,
      stripeCurrentPeriodEnd: periodEnd,
    },
  });
  console.log(`✅ ModuleSubscription created: ap (active, ends ${periodEnd.toISOString().slice(0, 10)})`);
} else {
  console.log(`ℹ️  ModuleSubscription already exists for ap`);
}

console.log(`\nMarker: ${marker}`);
console.log(`User must sign out + sign back in to refresh JWT.`);

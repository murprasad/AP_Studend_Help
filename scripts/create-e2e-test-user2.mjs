#!/usr/bin/env node
// Create the second E2E payment-verification test user.
// Same pattern as create-e2e-test-user.mjs but with a different email so
// we can re-test the post-deploy payment flow from a clean FREE state.
//
// Email:    murprasad+e2e-test2@gmail.com
// Password: TestE2E-2026!
import "dotenv/config";
import bcrypt from "bcryptjs";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const EMAIL = "murprasad+e2e-test2@gmail.com";
const PASSWORD = "TestE2E-2026!";

const existing = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: { id: true, email: true, subscriptionTier: true, emailVerified: true },
});

const passwordHash = bcrypt.hashSync(PASSWORD, 12);

if (existing) {
  console.log(`User exists. Resetting to clean FREE state + refreshing password.`);
  // Wipe any prior payment state so the test is meaningful
  await prisma.moduleSubscription.deleteMany({ where: { userId: existing.id } });
  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash,
      emailVerified: existing.emailVerified ?? new Date(),
      subscriptionTier: "FREE",
      stripeSubscriptionId: null,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionStatus: null,
    },
    select: { id: true, email: true, subscriptionTier: true, emailVerified: true },
  });
  console.log(`\n✅ Reset:`);
  console.log(`   id:                ${updated.id}`);
  console.log(`   email:             ${updated.email}`);
  console.log(`   subscriptionTier:    ${updated.subscriptionTier}`);
  console.log(`   emailVerified:       ${updated.emailVerified?.toISOString()}`);
  console.log(`   ModuleSubscriptions: 0 (cleared)`);
} else {
  const created = await prisma.user.create({
    data: {
      email: EMAIL,
      firstName: "E2E2",
      lastName: "TestUser",
      passwordHash,
      emailVerified: new Date(),
      role: "STUDENT",
      subscriptionTier: "FREE",
      track: "ap",
      gradeLevel: "11",
    },
    select: { id: true, email: true, subscriptionTier: true, emailVerified: true },
  });
  console.log(`\n✅ Created:`);
  console.log(`   id:                ${created.id}`);
  console.log(`   email:             ${created.email}`);
  console.log(`   subscriptionTier:    ${created.subscriptionTier}`);
  console.log(`   emailVerified:       ${created.emailVerified?.toISOString()}`);
}

console.log(`\nLogin:`);
console.log(`   URL:      https://studentnest.ai/login`);
console.log(`   Email:    ${EMAIL}`);
console.log(`   Password: ${PASSWORD}`);
console.log(`\nAfter signup → buy Premium → verify with: node scripts/verify-e2e-payment2.mjs`);

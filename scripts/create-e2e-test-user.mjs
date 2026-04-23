#!/usr/bin/env node
// Create the E2E payment-verification test user.
// Sets passwordHash + emailVerified so user can sign in immediately
// without going through the verification email loop.
//
// Email:    murprasad+e2e-test1@gmail.com
// Password: TestE2E-2026!
import "dotenv/config";
import bcrypt from "bcryptjs";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const EMAIL = "murprasad+e2e-test1@gmail.com";
const PASSWORD = "TestE2E-2026!";

const existing = await prisma.user.findUnique({
  where: { email: EMAIL },
  select: { id: true, email: true, passwordHash: true, emailVerified: true, subscriptionTier: true },
});

const passwordHash = bcrypt.hashSync(PASSWORD, 12);

if (existing) {
  console.log(`User exists. Updating passwordHash + emailVerified...`);
  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash,
      emailVerified: existing.emailVerified ?? new Date(),
    },
    select: { id: true, email: true, subscriptionTier: true, emailVerified: true },
  });
  console.log(`\n✅ Updated:`);
  console.log(`   id:                ${updated.id}`);
  console.log(`   email:             ${updated.email}`);
  console.log(`   subscriptionTier:    ${updated.subscriptionTier}`);
  console.log(`   emailVerified:       ${updated.emailVerified?.toISOString()}`);
} else {
  console.log(`Creating new user...`);
  const created = await prisma.user.create({
    data: {
      email: EMAIL,
      firstName: "E2E",
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

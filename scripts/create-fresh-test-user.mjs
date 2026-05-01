/**
 * scripts/create-fresh-test-user.mjs — recreate a test alias as
 * registered + email-verified + no journey row.
 *
 * State after run:
 *   - User row exists with known password (bcrypt hash)
 *   - emailVerified set (login not blocked)
 *   - onboardingCompletedAt: null  → middleware redirects to /journey
 *   - No UserJourney row            → /journey shows Step 0 (course pick)
 *   - No FunnelEvent / impression rows
 *
 * Usage:
 *   node scripts/create-fresh-test-user.mjs <email> [password]
 */

import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcrypt-ts";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const email = args[0];
const password = args[1] ?? "TestStd2026!";

if (!email) {
  console.error("Usage: node scripts/create-fresh-test-user.mjs <email> [password]");
  process.exit(1);
}

const isTestAlias = email.includes("+") || /test|std|qa/i.test(email);
if (!isTestAlias) {
  console.error(`✗ Refusing — "${email}" doesn't look like a test alias.`);
  process.exit(1);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.error(`✗ User already exists: ${email} (id ${existing.id})`);
    console.error(`  Run 'node scripts/clear-test-user.mjs ${email} --delete' first if you want to recreate.`);
    process.exit(1);
  }

  const passwordHash = hashSync(password, 10);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      emailVerified: new Date(),
      passwordHash,
      firstName: "Test",
      lastName: "Student",
      gradeLevel: "11",
      role: "STUDENT",
      subscriptionTier: "FREE",
      track: "ap",
      onboardingCompletedAt: null, // ← fresh-user state for journey rail
    },
  });

  console.log(`\n✅ Created fresh test user`);
  console.log(`   email:    ${user.email}`);
  console.log(`   password: ${password}`);
  console.log(`   id:       ${user.id}`);
  console.log(`   verified: yes`);
  console.log(`   journey:  none (will land on Step 0)`);
  console.log(`\n🌐 Login at https://studentnest.ai/login`);
  console.log(`   → middleware redirects /dashboard → /journey`);
  console.log(`   → /journey renders Step 0 (course pick)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

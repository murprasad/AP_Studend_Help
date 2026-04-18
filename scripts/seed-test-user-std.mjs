#!/usr/bin/env node
/**
 * Seed StudentNest test user (mirrors PrepLion's seed-test-user-acc.mjs).
 *
 * Upserts murprasad+std@gmail.com with password TestStd@329, track=ap,
 * emailVerified set (so login works immediately). Safe to run repeatedly.
 *
 * Usage:
 *   node scripts/seed-test-user-std.mjs
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcrypt-ts";

const EMAIL = "murprasad+std@gmail.com";
const PASSWORD = "TestStd@329";
const FIRST_NAME = "Test";
const LAST_NAME = "StudentNest";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  const passwordHash = hashSync(PASSWORD, 12);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        track: "ap",
        emailVerified: existing.emailVerified ?? new Date(),
      },
    });
    console.log(`Updated ${EMAIL} (id: ${existing.id}) — password reset, track=ap`);
  } else {
    const created = await prisma.user.create({
      data: {
        email: EMAIL,
        passwordHash,
        firstName: FIRST_NAME,
        lastName: LAST_NAME,
        gradeLevel: "college",
        track: "ap",
        emailVerified: new Date(),
      },
    });
    console.log(`Created ${EMAIL} (id: ${created.id}) — track=ap`);
  }

  console.log(`\nLogin: ${EMAIL} / ${PASSWORD}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

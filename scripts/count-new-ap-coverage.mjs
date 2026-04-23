#!/usr/bin/env node
// Quick count of approved MCQ questions per new AP course (the 5 hidden
// courses added in 2026-04). Used to decide which to flip hidden→false.
import "dotenv/config";
import { PrismaClient } from "@prisma/client/wasm";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, neonConfig } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true;
const sql = neon(process.env.DATABASE_URL);
const adapter = new PrismaNeonHTTP(sql);
const prisma = new PrismaClient({ adapter });

const courses = [
  "AP_HUMAN_GEOGRAPHY",
  "AP_ENVIRONMENTAL_SCIENCE",
  "AP_US_GOVERNMENT",
  "AP_PRECALCULUS",
  "AP_ENGLISH_LANGUAGE",
];

// Visibility threshold lowered from 500 → 300+ on 2026-04-23 per user.
// Continuing to grow the bank past 300 is still desirable (more variety,
// less repetition) but the course can be exposed to students at 300+.
const VISIBLE_AT = 300;
const TARGET = 500;
console.log(`Coverage of new AP courses (visible at ${VISIBLE_AT}+, target ${TARGET}):\n`);
for (const c of courses) {
  const count = await prisma.question.count({
    where: { course: c, isApproved: true, questionType: "MCQ" },
  });
  const status = count >= TARGET
    ? "✅ AT TARGET"
    : count >= VISIBLE_AT
      ? `✅ VISIBLE (${count}/${TARGET} → still growing)`
      : `⏳ ${count}/${VISIBLE_AT} (${VISIBLE_AT - count} below visibility threshold)`;
  console.log(`  ${c.padEnd(30)} ${String(count).padStart(4)} — ${status}`);
}

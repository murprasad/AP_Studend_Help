#!/usr/bin/env node
// Restore two specific questions wrongly quarantined on 2026-04-22 as
// "equivalent distractors". They were actually unit-discrimination
// questions (testing whether the student knows the right UNIT, not the
// right numeric value) — the scan stripped units before comparing, so
// "1.23 kPa" and "1.23 atm" looked identical.
//
// Restoring these by setting isApproved=true. A separate fix to the
// scan script makes future scans skip unit-mismatch pairs.
//
// Usage: node scripts/restore-quarantined-unit-questions.mjs
//        node scripts/restore-quarantined-unit-questions.mjs --dry-run

import "dotenv/config";
import { makePrisma } from "./_prisma-http.mjs";

const prisma = makePrisma();
const DRY_RUN = process.argv.includes("--dry-run");

const IDS_TO_RESTORE = [
  // AP_BIOLOGY — osmosis, 1.23 kPa vs 1.23 atm (units differ, not a bug)
  "cmo1m55tk00pytb0qa0v3r16z",
  // AP_PHYSICS_1 — grav PE, 78.4 J vs 78.4 N (units differ, not a bug)
  "cmo1shc5j000asj0t67b7tknb",
];

console.log(`Restoring ${IDS_TO_RESTORE.length} unit-discrimination questions${DRY_RUN ? " (dry-run)" : ""}…\n`);

for (const id of IDS_TO_RESTORE) {
  const q = await prisma.question.findUnique({
    where: { id },
    select: {
      id: true, course: true, unit: true, questionText: true,
      options: true, correctAnswer: true, isApproved: true,
    },
  });
  if (!q) {
    console.log(`  ${id} — not found, skipping`);
    continue;
  }
  console.log(`  ${q.course} / ${q.unit}`);
  console.log(`    question: ${(q.questionText || "").slice(0, 80)}`);
  console.log(`    options:  ${JSON.stringify(q.options).slice(0, 120)}`);
  console.log(`    isApproved before: ${q.isApproved}`);
  if (q.isApproved) {
    console.log(`    already approved — skipping`);
    continue;
  }
  if (DRY_RUN) {
    console.log(`    (dry-run) would set isApproved=true\n`);
    continue;
  }
  await prisma.question.update({
    where: { id },
    data: { isApproved: true },
  });
  console.log(`    ✅ restored\n`);
}

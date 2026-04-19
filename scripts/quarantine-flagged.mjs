// Quarantine all questions flagged by audit-all-quality.mjs.
//
// Sets isApproved=false on every flagged row so students never see a
// broken question. Writes a backup log with the affected IDs so the
// change is fully reversible (rollback by re-running with --restore).
//
// Usage:
//   node scripts/quarantine-flagged.mjs           # dry-run
//   node scripts/quarantine-flagged.mjs --apply   # actually unapprove
//   node scripts/quarantine-flagged.mjs --restore scripts/logs/quarantine-<stamp>.json
//
// The repair-explanation-letters.mjs script should be run FIRST so we
// don't quarantine questions that are cheaply fixable.

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const RESTORE = args.includes("--restore");
const restoreFile = RESTORE ? args[args.indexOf("--restore") + 1] : null;

async function restore(fromFile) {
  const ids = JSON.parse(fs.readFileSync(fromFile, "utf8"));
  console.log(`Restoring ${ids.length} questions from ${fromFile}...`);
  let done = 0;
  for (const id of ids) {
    await prisma.question.update({ where: { id }, data: { isApproved: true } });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${ids.length}`);
  }
  console.log(`Restored ${done}.`);
  await prisma.$disconnect();
}

async function main() {
  if (RESTORE) return restore(restoreFile);

  // Load latest audit report
  const logDir = "scripts/logs";
  const audits = fs.readdirSync(logDir).filter((f) => f.startsWith("quality-audit-all-") && f.endsWith(".json")).sort().reverse();
  if (audits.length === 0) {
    console.error("No audit report found. Run audit-all-quality.mjs first.");
    process.exit(1);
  }
  const auditFile = path.join(logDir, audits[0]);
  const audit = JSON.parse(fs.readFileSync(auditFile, "utf8"));
  console.log(`Loaded audit: ${auditFile}`);

  const flaggedIds = new Set();
  for (const result of Object.values(audit.results)) {
    for (const bucket of Object.values(result.buckets)) {
      for (const row of bucket) flaggedIds.add(row.id);
    }
  }
  const ids = Array.from(flaggedIds);
  console.log(`Distinct flagged IDs: ${ids.length}`);

  if (!APPLY) {
    console.log("\nDry-run. Pass --apply to quarantine.");
    // Stats: how many would become unapproved per course
    const byCourse = {};
    for (const result of Object.values(audit.results)) {
      if (result.flagged > 0) byCourse[result.course] = result.flagged;
    }
    console.log("\nBy course (top 20):");
    for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      console.log(`  ${c.padEnd(40)} ${n}`);
    }
    await prisma.$disconnect();
    return;
  }

  // Apply: unapprove + save backup
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = path.join(logDir, `quarantine-${stamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(ids, null, 2));
  console.log(`Backup: ${backupFile}`);

  let done = 0;
  for (const id of ids) {
    await prisma.question.update({
      where: { id },
      data: { isApproved: false },
    });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${ids.length}`);
  }
  console.log(`Quarantined ${done} questions.`);
  console.log(`Restore: node scripts/quarantine-flagged.mjs --restore ${backupFile}`);

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });

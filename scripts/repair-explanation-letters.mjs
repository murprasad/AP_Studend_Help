// Deterministic repair for explanation-letter-mismatch bugs.
//
// Bug class: the `correctAnswer` field is right, but the first assertion in
// the explanation text uses a WRONG letter (common AI drift pattern). The
// surrounding prose still describes the actually-correct option.
//
// Fix: rewrite the first "X is correct" / "correct answer is X" /
// "the answer is X" / "choice X is" occurrence in the first 220 chars of
// the explanation to use `correctAnswer`. Does NOT touch "Option X is
// incorrect" / "Distractor X" phrases (those discuss wrong answers
// legitimately).
//
// Usage:
//   node scripts/repair-explanation-letters.mjs            # dry-run (no writes)
//   node scripts/repair-explanation-letters.mjs --apply    # write changes

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// First-assertion patterns. Capture the claimed letter so we can rewrite it.
// Keep these tight — we only want to match at the START of the assertion,
// before the prose about why it's correct.
const FIRST_ASSERTIONS = [
  /^(\s*(?:The\s+)?correct\s+answer\s+is\s+)([A-E])(?=[\s).:,\u00A0])/i,
  /^(\s*(?:The\s+)?answer\s+is\s+)([A-E])(?=[\s).:,\u00A0])/i,
  /^(\s*Option\s+)([A-E])(\s+is\s+(?:the\s+)?correct)/i,
  /^(\s*Choice\s+)([A-E])(\s+is\s+(?:the\s+)?correct)/i,
  /^(\s*)([A-E])(\s+is\s+(?:the\s+)?correct\b)/i,
];

function detectAndRepair(explanation, correct) {
  if (!explanation || !correct) return null;
  const head = explanation.slice(0, 220);
  for (const re of FIRST_ASSERTIONS) {
    const m = head.match(re);
    if (m) {
      const claimedLetter = (m[2] || "").toUpperCase();
      if (!claimedLetter || claimedLetter === correct) return null;
      // Rebuild the head by swapping just that letter
      const before = m[1];
      const after = m[3] || "";
      const matchStart = head.indexOf(m[0]);
      const matchEnd = matchStart + m[0].length;
      const newHead = head.slice(0, matchStart) + before + correct + after + head.slice(matchEnd);
      return {
        claimed: claimedLetter,
        correct,
        before: head,
        after: newHead,
        repaired: newHead + explanation.slice(220),
      };
    }
  }
  return null;
}

async function main() {
  const courseArg = process.argv.find((a) => a.startsWith("--course="));
  const filter = courseArg ? { course: courseArg.slice("--course=".length) } : {};
  const rows = await prisma.question.findMany({
    where: { isApproved: true, ...filter },
    select: { id: true, course: true, correctAnswer: true, explanation: true },
  });

  console.log(`Scanning ${rows.length} approved questions...`);

  const repairs = [];
  for (const q of rows) {
    const correct = (q.correctAnswer || "").trim().toUpperCase();
    if (!/^[A-E]$/.test(correct)) continue;
    const r = detectAndRepair(q.explanation, correct);
    if (r) repairs.push({ id: q.id, course: q.course, ...r });
  }

  console.log(`\nRepair candidates: ${repairs.length}`);

  // Show 5 samples so user can eyeball safety
  for (const s of repairs.slice(0, 5)) {
    console.log("\n----", s.id, "|", s.course, "----");
    console.log(`CLAIMED: ${s.claimed}  CORRECT: ${s.correct}`);
    console.log("BEFORE:", s.before.slice(0, 180));
    console.log("AFTER: ", s.after.slice(0, 180));
  }

  // By-course rollup
  const byCourse = {};
  for (const r of repairs) byCourse[r.course] = (byCourse[r.course] || 0) + 1;
  console.log("\nBy course:");
  for (const [c, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(40)} ${n}`);
  }

  if (!APPLY) {
    console.log("\nDry-run. Pass --apply to write.");
    await prisma.$disconnect();
    return;
  }

  // Backup originals BEFORE writing so we can roll back if needed.
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `scripts/logs/explanation-repair-backup-${stamp}.json`;
  const backup = await prisma.question.findMany({
    where: { id: { in: repairs.map((r) => r.id) } },
    select: { id: true, explanation: true },
  });
  const fs = await import("fs");
  fs.mkdirSync("scripts/logs", { recursive: true });
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\nBackup written to ${backupFile} (${backup.length} originals).`);

  console.log("Applying repairs...");
  let done = 0;
  for (const r of repairs) {
    await prisma.question.update({
      where: { id: r.id },
      data: { explanation: r.repaired },
    });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${repairs.length}`);
  }
  console.log(`Done. Repaired ${done} questions.`);
  console.log(`Rollback: node -e "const fs=require('fs'),P=new (require('@prisma/client').PrismaClient)();Promise.all(JSON.parse(fs.readFileSync('${backupFile}')).map(r=>P.question.update({where:{id:r.id},data:{explanation:r.explanation}}))).then(()=>P.$disconnect());"`);

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });

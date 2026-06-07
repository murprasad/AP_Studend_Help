/**
 * Retroactive quarantine — unapprove approved questions that REQUIRE a figure or
 * passage but have none (unanswerable). Uses the SAME precise detector as the
 * Validation-Engine gate (verify-don't-assume — no optics-"image"/"table salt"
 * false positives). DRY by default; APPLY=1 to unapprove. Floor-safe (≥200/course).
 *
 *   node scripts/_quarantine-figure-missing.mjs            # dry
 *   APPLY=1 node scripts/_quarantine-figure-missing.mjs    # execute
 *
 * Quarantine = stop serving unanswerable items NOW; restoring figures/passages
 * (to lift figureIntegrity → ≥95) is the follow-up.
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) {
  for (const f of [".env.local", ".env"]) {
    if (existsSync(f)) for (const l of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
const APPLY = process.env.APPLY === "1";
const FLOOR = 200;

const FIGURE_REQUIRED = [
  /\b(figure|fig\.?|table|graph|diagram|chart|exhibit)\s*\d+\b/i,
  /\bbased on (the )?(figure|graph|table|diagram|chart|data (in|shown))/i,
  /\brefer to the (figure|graph|table|diagram|chart)/i,
  /\b(shown|depicted|illustrated) in the (figure|graph|diagram|chart|table)/i,
  /\bthe (following|above|below|adjacent) (figure|graph|diagram|chart|data table)/i,
  /\bthe (figure|graph|diagram) (above|below|shown)/i,
];
const PASSAGE_REQUIRED = /\b(the|this) passage\b|\bin the passage\b|\bpassage (suggests|states|author|implies)\b/i;
const requiresAsset = (t) => FIGURE_REQUIRED.some((re) => re.test(t || "")) || PASSAGE_REQUIRED.test(t || "");
const hasAsset = (q) => Boolean((q.stimulus && q.stimulus.trim().length >= 20) || (q.stimulusImageUrl && q.stimulusImageUrl.trim()));

const prisma = new PrismaClient();
try {
  const qs = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ" },
    select: { id: true, course: true, questionText: true, stimulus: true, stimulusImageUrl: true },
  });
  const approvedByCourse = {};
  for (const q of qs) approvedByCourse[q.course] = (approvedByCourse[q.course] ?? 0) + 1;

  const violators = qs.filter((q) => requiresAsset(q.questionText) && !hasAsset(q));
  const byCourse = {};
  for (const q of violators) byCourse[q.course] = (byCourse[q.course] ?? 0) + 1;

  console.log(`Unanswerable (figure/passage-required, none present): ${violators.length}\n`);
  let blocked = 0;
  const toUnapprove = [];
  for (const [course, n] of Object.entries(byCourse).sort((a, b) => b[1] - a[1])) {
    const after = (approvedByCourse[course] ?? 0) - n;
    const ok = after >= FLOOR;
    console.log(`  ${course.padEnd(38)} ${String(n).padStart(4)}  ${approvedByCourse[course]}→${after} ${ok ? "" : "⚠ BELOW FLOOR — SKIP"}`);
    if (ok) toUnapprove.push(...violators.filter((v) => v.course === course));
    else blocked += n;
  }
  console.log(`\nTo unapprove: ${toUnapprove.length}${blocked ? ` (skipped ${blocked} to protect the ${FLOOR} floor)` : ""}`);
  console.log("Sample:");
  for (const v of toUnapprove.slice(0, 4)) console.log(`  • [${v.course}] ${(v.questionText || "").replace(/\s+/g, " ").slice(0, 110)}`);

  if (!APPLY) {
    console.log(`\nDRY RUN — no changes. Re-run with APPLY=1.`);
  } else {
    let done = 0;
    for (const v of toUnapprove) { await prisma.question.update({ where: { id: v.id }, data: { isApproved: false } }); done++; }
    console.log(`\n✅ Quarantined (unapproved) ${done} unanswerable questions.`);
  }
} catch (e) {
  console.error("Quarantine failed:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

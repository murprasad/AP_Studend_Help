/**
 * scripts/sweep-leaks-and-audit.ts (PrepLion)
 *
 * Mirrors StudentNest's two-stage approach:
 *   1. Distractor-leak sweep across all approved MCQs → unapprove matches
 *   2. Deep all-gate audit → per-course "high-quality approved" count
 *
 * Then prints which courses meet the ≥200 high-quality threshold.
 *
 * Run:
 *   npx tsx scripts/sweep-leaks-and-audit.ts            # read-only
 *   npx tsx scripts/sweep-leaks-and-audit.ts --unapprove # writes
 */

import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type ApCourse as ApCourse } from "@prisma/client";

import { validateMcqStructure } from "../src/lib/options";
import { validateExplanationMath, validateAnswerNumericMatch } from "../src/lib/math-validator";
import { validateDistractorIntegrity, findLeakPhrase } from "../src/lib/distractor-leak-validator";
import { validateStimulus } from "../src/lib/stimulus-validator";
import { validateAttribution } from "../src/lib/source-attribution-validator";
import { validateFigure } from "../src/lib/figure-validator";
import { getContract, getStimulusRequirement } from "../src/lib/course-contracts";

const prisma = new PrismaClient();
const SHOULD_UNAPPROVE = process.argv.includes("--unapprove");

const QUALITY_THRESHOLD = 200;

type GateResult = { passed: boolean; failedGate?: string; detail?: string };

function runAllGates(q: any): GateResult {
  let opts = q.options;
  if (typeof opts === "string") {
    try { opts = JSON.parse(opts); } catch { opts = []; }
  }
  if (!Array.isArray(opts)) {
    return { passed: false, failedGate: "structural", detail: "options not array" };
  }
  const ca = String(q.correctAnswer ?? "");

  const structErr = validateMcqStructure(opts, ca);
  if (structErr) return { passed: false, failedGate: "structural", detail: structErr };
  const mathErr = validateExplanationMath(q.explanation);
  if (mathErr) return { passed: false, failedGate: "math", detail: mathErr };
  const matchErr = validateAnswerNumericMatch(opts, ca, q.explanation);
  if (matchErr) return { passed: false, failedGate: "answer-match", detail: matchErr };
  const leakErr = validateDistractorIntegrity(opts, ca);
  if (leakErr) return { passed: false, failedGate: "distractor", detail: leakErr };
  const stimReq = getStimulusRequirement(q.course, q.unit, q.topic);
  const stimErr = validateStimulus(q.questionText, q.stimulus, stimReq);
  if (stimErr) return { passed: false, failedGate: "stimulus", detail: stimErr };
  const contract = getContract(q.course, q.unit, q.topic);
  const figErr = validateFigure(q.stimulus, contract?.requiredStimulusType ?? null, q.stimulusImageUrl);
  if (figErr) return { passed: false, failedGate: "figure", detail: figErr };
  const attrErr = validateAttribution(q.stimulus, q.explanation);
  if (attrErr) return { passed: false, failedGate: "attribution", detail: attrErr };

  return { passed: true };
}

async function step1_leakSweep() {
  console.log("");
  console.log("─── Step 1: Distractor-leak sweep ───────────────────────");
  const all = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ" },
    select: { id: true, course: true, options: true },
  });
  console.log(`  Loaded ${all.length} approved MCQs.`);
  const flagged: { id: string; course: string }[] = [];
  for (const q of all) {
    let opts: any = q.options;
    if (typeof opts === "string") {
      try { opts = JSON.parse(opts); } catch { opts = []; }
    }
    if (!Array.isArray(opts)) continue;
    for (let i = 0; i < opts.length; i++) {
      if (findLeakPhrase(String(opts[i]))) {
        flagged.push({ id: q.id, course: q.course });
        break;
      }
    }
  }
  console.log(`  Flagged: ${flagged.length} questions with leak patterns.`);
  if (SHOULD_UNAPPROVE && flagged.length > 0) {
    const ids = flagged.map((f) => f.id);
    let updated = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const r = await prisma.question.updateMany({
        where: { id: { in: ids.slice(i, i + 500) } },
        data: { isApproved: false },
      });
      updated += r.count;
    }
    console.log(`  ✓ Unapproved ${updated}.`);
  }
  return flagged.length;
}

async function step2_deepAudit() {
  console.log("");
  console.log("─── Step 2: Deep audit (all 7 gates) ────────────────────");
  // Get all approved MCQs
  const all = await prisma.question.findMany({
    where: { isApproved: true, questionType: "MCQ" },
    select: {
      id: true, course: true, unit: true, topic: true, options: true,
      correctAnswer: true, questionText: true, stimulus: true,
      stimulusImageUrl: true, explanation: true,
    },
  });
  console.log(`  Loaded ${all.length} approved MCQs (post leak-sweep).`);

  const perCourse = new Map<string, { total: number; passed: number; failedByGate: Record<string, number> }>();
  const failedQuestions: { id: string; course: string; gate: string; detail: string }[] = [];

  for (const q of all) {
    const c = q.course;
    if (!perCourse.has(c)) perCourse.set(c, { total: 0, passed: 0, failedByGate: {} });
    const stats = perCourse.get(c)!;
    stats.total++;
    const r = runAllGates(q);
    if (r.passed) stats.passed++;
    else {
      const gate = r.failedGate ?? "unknown";
      stats.failedByGate[gate] = (stats.failedByGate[gate] || 0) + 1;
      failedQuestions.push({ id: q.id, course: c, gate, detail: (r.detail || "").slice(0, 200) });
    }
  }

  // Print summary, sorted by passing count desc
  const rows = Array.from(perCourse.entries()).map(([course, s]) => ({
    course, total: s.total, passed: s.passed, failed: s.total - s.passed, failedByGate: s.failedByGate,
  })).sort((a, b) => b.passed - a.passed);

  console.log("");
  console.log("Course".padEnd(40) + "Total".padStart(8) + "Pass".padStart(8) + "Fail".padStart(8) + "Pass%".padStart(8) + "  Status");
  console.log("─".repeat(82));
  const visible: string[] = [];
  for (const r of rows) {
    const passPct = r.total ? Math.round((r.passed / r.total) * 100) : 0;
    let status: string;
    if (r.passed >= QUALITY_THRESHOLD) { status = "✓ KEEP VISIBLE"; visible.push(r.course); }
    else status = "✗ HIDE";
    console.log(
      r.course.padEnd(40)
      + String(r.total).padStart(8)
      + String(r.passed).padStart(8)
      + String(r.failed).padStart(8)
      + (passPct + "%").padStart(8)
      + "  " + status,
    );
  }
  console.log("");
  console.log(`Visible (≥${QUALITY_THRESHOLD} high-quality passing): ${visible.length}`);
  console.log(`Hidden:  ${rows.length - visible.length}`);

  // Save artifacts
  const outDir = join(process.cwd(), "data");
  mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    join(outDir, `preplion-audit-${ts}.json`),
    JSON.stringify({ rows, visible, failedCount: failedQuestions.length }, null, 2),
  );
  writeFileSync(
    join(outDir, `preplion-audit-failures-${ts}.csv`),
    ["id,course,gate,detail",
     ...failedQuestions.map((f) => `${f.id},${f.course},${f.gate},"${f.detail.replace(/"/g, '""')}"`)].join("\n"),
  );
  console.log("");
  console.log(`Saved: data/preplion-audit-${ts}.json + .csv`);

  if (SHOULD_UNAPPROVE && failedQuestions.length > 0) {
    console.log(`Unapproving ${failedQuestions.length} failing questions...`);
    const ids = failedQuestions.map((f) => f.id);
    let updated = 0;
    for (let i = 0; i < ids.length; i += 500) {
      const r = await prisma.question.updateMany({
        where: { id: { in: ids.slice(i, i + 500) } },
        data: { isApproved: false },
      });
      updated += r.count;
    }
    console.log(`✓ Unapproved ${updated}.`);
  } else if (failedQuestions.length > 0) {
    console.log(`To unapprove the ${failedQuestions.length} failing, re-run with --unapprove.`);
  }

  return { visible, hidden: rows.length - visible.length };
}

async function main() {
  console.log(SHOULD_UNAPPROVE ? "MODE: WRITE — failing questions will be unapproved" : "MODE: READ-ONLY (pass --unapprove to write)");
  await step1_leakSweep();
  const audit = await step2_deepAudit();
  console.log("");
  console.log("Done. Review the visible list above; if happy, run set-visible-courses.mjs to apply.");
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

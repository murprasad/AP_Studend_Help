// Batch 5.17 — Haiku 4.5 sweep over existing Question rows.
//
// Runs the Batch 1 AI validator on every approved Question already in the DB.
// Rows that fail Haiku review (disagree on answer, factual errors, ambiguity,
// or below college-level rigor) are UN-APPROVED (isApproved=false) with a
// reason tag so they can be regenerated via the grounded pipeline.
//
// Idempotent — skips rows already swept (tracked by `modelUsed` suffix).
//
// Usage:
//   node scripts/sweep-validate.mjs --course=AP_BIOLOGY --limit=100
//   node scripts/sweep-validate.mjs --all --batch=200
//   node scripts/sweep-validate.mjs --all --resume
//
// Flags:
//   --course=CODE     single course (omit with --all)
//   --all             every course with approved Qs
//   --limit=N         cap rows processed per course per run (default 500)
//   --batch=N         concurrent reviews per wave (default 5)
//   --resume          skip rows already swept (modelUsed ends with ":swept")
//   --dry-run         don't write isApproved changes to DB
//
// Output: scripts/logs/sweep-validate-{ts}.jsonl with one row per review.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import "dotenv/config";
import { validateAi } from "./ai-validator.mjs";

const prisma = new PrismaClient();

function parseArgs() {
  const a = { course: null, all: false, limit: 500, batch: 5, resume: true, dryRun: false };
  for (const x of process.argv.slice(2)) {
    if (x === "--all") a.all = true;
    else if (x === "--dry-run") a.dryRun = true;
    else if (x === "--no-resume") a.resume = false;
    else if (x.startsWith("--course=")) a.course = x.slice(9);
    else if (x.startsWith("--limit=")) a.limit = parseInt(x.slice(8), 10);
    else if (x.startsWith("--batch=")) a.batch = parseInt(x.slice(8), 10);
  }
  return a;
}

async function sweepCourse(course, args, logStream) {
  const where = {
    course,
    isApproved: true,
    // Postgres treats `null NOT endsWith X` as UNKNOWN (excludes null rows).
    // Need explicit null-OR to include un-swept rows whose modelUsed is null.
    ...(args.resume ? {
      OR: [
        { modelUsed: null },
        { AND: [
          { NOT: { modelUsed: { endsWith: ":swept" } } },
          { NOT: { modelUsed: { endsWith: ":swept_rejected" } } },
        ]},
      ],
    } : {}),
  };
  const rows = await prisma.question.findMany({
    where,
    take: args.limit,
    orderBy: { createdAt: "asc" },
  });
  if (rows.length === 0) {
    console.log(`  ${course}: nothing to sweep`);
    return { course, processed: 0, rejected: 0, approved: 0 };
  }
  console.log(`  ${course}: sweeping ${rows.length} rows`);

  let processed = 0, rejected = 0, approved = 0, errored = 0;

  // Batched parallel reviews — Haiku API tolerates ~5 concurrent.
  for (let i = 0; i < rows.length; i += args.batch) {
    const slice = rows.slice(i, i + args.batch);
    const results = await Promise.all(slice.map(async (q) => {
      const question = {
        questionText: q.questionText,
        stimulus: q.stimulus,
        options: Array.isArray(q.options) ? q.options : null,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      };
      const ai = await validateAi(question, q.course);
      return { q, ai };
    }));

    for (const { q, ai } of results) {
      processed++;
      const entry = {
        course,
        id: q.id,
        ts: new Date().toISOString(),
        severity: ai.severity,
        reason: ai.reason,
        agreesWithCandidate: ai.agreesWithCandidate,
        ambiguity: ai.ambiguity,
        factualErrors: ai.factualErrors,
        collegeLevelRigor: ai.collegeLevelRigor,
      };

      if (ai.severity === "reject") {
        rejected++;
        if (!args.dryRun) {
          await prisma.question.update({
            where: { id: q.id },
            data: { isApproved: false, modelUsed: (q.modelUsed || "unknown") + ":swept_rejected" },
          });
        }
      } else {
        approved++;
        if (!args.dryRun) {
          await prisma.question.update({
            where: { id: q.id },
            data: { modelUsed: (q.modelUsed || "unknown") + ":swept" },
          });
        }
      }
      logStream.write(JSON.stringify(entry) + "\n");

      if (processed % 20 === 0) {
        console.log(`    ${processed}/${rows.length}  (rejected ${rejected}, approved ${approved})`);
      }
    }
  }

  console.log(`  ${course}: done — ${approved} retained, ${rejected} unapproved`);
  return { course, processed, rejected, approved, errored };
}

async function main() {
  const args = parseArgs();
  const logDir = path.resolve("scripts/logs");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, `sweep-validate-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`);
  const logStream = fs.createWriteStream(logPath);
  console.log(`Log: ${logPath}`);
  console.log(`Mode: limit=${args.limit} batch=${args.batch} dryRun=${args.dryRun} resume=${args.resume}`);

  let courses;
  if (args.all) {
    const g = await prisma.question.groupBy({
      by: ["course"],
      where: { isApproved: true },
      _count: true,
    });
    courses = g.filter(r => r._count > 0).sort((a, b) => b._count - a._count).map(r => r.course);
  } else if (args.course) {
    courses = [args.course];
  } else {
    console.error("Specify --course=CODE or --all");
    process.exit(1);
  }

  let totalProcessed = 0, totalRejected = 0, totalApproved = 0;
  for (const c of courses) {
    const r = await sweepCourse(c, args, logStream);
    totalProcessed += r.processed;
    totalRejected += r.rejected;
    totalApproved += r.approved;
  }

  console.log("\n==== SWEEP SUMMARY ====");
  console.log(`Processed: ${totalProcessed}`);
  console.log(`Retained (passed Haiku): ${totalApproved}`);
  console.log(`Un-approved (failed Haiku): ${totalRejected}`);
  console.log(`Rejection rate: ${(100 * totalRejected / Math.max(1, totalProcessed)).toFixed(1)}%`);

  logStream.end();
  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });

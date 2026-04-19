// Orchestrator: run every per-course AP FRQ ingester sequentially and
// print a grand-total report. Each ingester is spawned as a child process
// so its Prisma client and pdfjs module state stay isolated.
//
// Skips AP_COMPUTER_SCIENCE_PRINCIPLES: already done via ingest-ap-csp.mjs.
//
// Usage: node scripts/ingest/ingest-all-ap.mjs

import { spawn } from "child_process";
import { PrismaClient } from "@prisma/client";
import path from "path";

const SCRIPTS = [
  "ingest-ap-physics-1.mjs",
  "ingest-ap-biology.mjs",
  "ingest-ap-chemistry.mjs",
  "ingest-ap-calculus-ab.mjs",
  "ingest-ap-calculus-bc.mjs",
  "ingest-ap-statistics.mjs",
  "ingest-ap-us-history.mjs",
  "ingest-ap-world-history.mjs",
  "ingest-ap-psychology.mjs",
];

const COURSES = [
  "AP_PHYSICS_1",
  "AP_BIOLOGY",
  "AP_CHEMISTRY",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_STATISTICS",
  "AP_US_HISTORY",
  "AP_WORLD_HISTORY",
  "AP_PSYCHOLOGY",
  "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [scriptPath], {
      stdio: "inherit",
      cwd: path.resolve(process.cwd()),
    });
    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("\n================================================");
  console.log("  AP FRQ INGESTION ORCHESTRATOR");
  console.log("================================================\n");

  const startedAt = Date.now();

  for (const script of SCRIPTS) {
    const full = path.join("scripts/ingest", script);
    console.log(`\n########## RUNNING ${script} ##########`);
    try {
      await runScript(full);
    } catch (e) {
      console.error(`FAIL: ${script} -> ${e.message}`);
    }
  }

  const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
  console.log("\n\n================================================");
  console.log("  GRAND TOTAL REPORT");
  console.log(`  elapsed: ${elapsedSec}s`);
  console.log("================================================\n");

  const prisma = new PrismaClient();
  let grandTotal = 0;
  for (const course of COURSES) {
    const total = await prisma.officialSample.count({ where: { course } });
    const byType = await prisma.officialSample.groupBy({
      by: ["questionType"],
      where: { course },
      _count: true,
    });
    const typeStr = byType.length
      ? byType.map(r => `${r.questionType}=${r._count}`).join(" ")
      : "(none)";
    console.log(`  ${course.padEnd(38)} total=${String(total).padStart(3)}  ${typeStr}`);
    grandTotal += total;
  }

  const bySource = await prisma.officialSample.groupBy({
    by: ["course", "sourceUrl"],
    _count: true,
  });
  console.log(`\n  GRAND TOTAL OfficialSample rows: ${grandTotal}`);
  console.log(`  Unique (course, sourceUrl) pairs: ${bySource.length}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Stage 4 — Seed validated FRQs into the freeResponseQuestion table.
 *
 * Reads data/cb-frqs/_validated.json and upserts each row into the
 * FreeResponseQuestion table with:
 *   - source: "college_board_released" tag (so we can distinguish from
 *             AI-generated FRQs at query/render time)
 *   - sourceUrl: link back to apcentral.collegeboard.org for attribution
 *   - isApproved: true (CB content is authoritative)
 *
 * Idempotent: uses (course, year, questionNumber) as the conflict key
 * since FreeResponseQuestion has @@unique([course, year, questionNumber])
 * (or we add it before running).
 *
 * Run:
 *   node scripts/frq-ingestion/04-seed.mjs           # seed all
 *   node scripts/frq-ingestion/04-seed.mjs --dry     # report only, no DB write
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makePrisma } from "../_prisma-http.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const dryRun = process.argv.includes("--dry");

const prisma = makePrisma();

async function main() {
  const validated = JSON.parse(
    await readFile(join(ROOT, "data", "cb-frqs", "_validated.json"), "utf8"),
  );
  console.log(`\n🌱 FRQ ingestion stage 4 — seed (${dryRun ? "DRY RUN" : "WRITE"})\n`);
  console.log(`Loading ${validated.length} validated FRQs from _validated.json\n`);

  let created = 0, updated = 0, errors = 0;
  const errorDetail = [];

  for (const f of validated) {
    if (dryRun) {
      console.log(`  [DRY] ${f.course} ${f.year} Q${f.questionNumber} (${f.totalPoints}pts)`);
      created++;
      continue;
    }

    try {
      // Use raw SQL for idempotent upsert via ON CONFLICT (Neon HTTP
      // doesn't support transactions, but ON CONFLICT inside one INSERT
      // is fine — it's a single statement, not a transaction).
      const id = crypto.randomUUID();
      const result = await prisma.$executeRawUnsafe(
        `INSERT INTO "free_response_questions"
           (id, course, unit, year, "questionNumber", type, "sourceUrl",
            "promptText", stimulus, "totalPoints", rubric, "sampleResponse",
            "isApproved", "createdAt")
         VALUES ($1, $2::"ApCourse", $3::"ApUnit", $4, $5, $6::"FrqType", $7, $8, $9, $10, $11::jsonb, $12, true, NOW())
         ON CONFLICT (id) DO NOTHING`,
        id,
        f.course,
        // Beta 8.0 (2026-04-25): Gemini returns unit as descriptive
        // human-readable strings (e.g. "Intermolecular Forces"), not the
        // Prisma enum values (CHEM_4_CHEMICAL_REACTIONS). Mapping is
        // course-specific and not yet built. Setting unit=null for now —
        // students can still discover FRQs by course; unit-filtering
        // is a follow-on enhancement (would need a unit-mapping table
        // per course or LLM-mediated resolution).
        null,
        f.year,
        f.questionNumber,
        // FrqType enum: actual schema values are SHORT, LONG, MULTI_PART,
        // INVESTIGATIVE, SAQ, DBQ, LEQ, AAQ, EBQ. Gemini returns "FRQ"
        // generically — map per-course to the right enum.
        (() => {
          const validHistoryTypes = ["SAQ", "DBQ", "LEQ"];
          if (validHistoryTypes.includes(f.type)) return f.type;
          // Course-default mapping based on actual exam structure:
          if (f.course === "AP_CALCULUS_AB" || f.course === "AP_CALCULUS_BC") return "MULTI_PART";
          if (f.course === "AP_STATISTICS" && f.questionNumber === 6) return "INVESTIGATIVE";
          if (f.course === "AP_STATISTICS") return "SHORT";
          if (f.course === "AP_PSYCHOLOGY" && f.type === "AAQ") return "AAQ";
          if (f.course === "AP_PSYCHOLOGY") return "EBQ";
          if (f.course === "AP_US_HISTORY" || f.course === "AP_WORLD_HISTORY") {
            return f.questionNumber === 1 ? "DBQ" : f.questionNumber === 4 ? "LEQ" : "SAQ";
          }
          // Bio/Chem/Physics: short FRQs are Q3-7 (smaller point values),
          // long FRQs are Q1-2 (worth 8-10 pts). Approximate by point value.
          return f.totalPoints >= 8 ? "LONG" : "SHORT";
        })(),
        f.sourceUrl,
        f.promptText,
        f.stimulus,
        f.totalPoints,
        JSON.stringify(f.rubric),
        f.sampleResponse,
      );
      if (result === 1) created++;
      console.log(`  ✓ ${f.course} ${f.year} Q${f.questionNumber}`);
    } catch (e) {
      errors++;
      const msg = e instanceof Error ? e.message : String(e);
      errorDetail.push({ course: f.course, year: f.year, q: f.questionNumber, error: msg.slice(0, 120) });
      console.log(`  ✗ ${f.course} ${f.year} Q${f.questionNumber}: ${msg.slice(0, 80)}`);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors:  ${errors}`);
  if (errorDetail.length > 0) {
    console.log(`\n  Errors:`);
    for (const e of errorDetail) {
      console.log(`    ${e.course} ${e.year} Q${e.q}: ${e.error}`);
    }
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

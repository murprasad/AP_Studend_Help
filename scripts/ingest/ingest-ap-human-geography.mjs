// Ingest OFFICIAL AP Human Geography FRQ content from College Board PDFs.
// HuGeo has 3 FRQs per year (Q1 no-stim, Q2 single-stim, Q3 two-stim).
// URL pattern: https://apcentral.collegeboard.org/media/pdf/ap{YY}-frq-human-geography.pdf
//
// Usage:
//   node --env-file=.env scripts/ingest/ingest-ap-human-geography.mjs
//
// Writes rows into OfficialSample (course=AP_HUMAN_GEOGRAPHY) via upsert.
// Re-runs are idempotent (matches on course/year/sourceUrl/questionType prefix).

import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, tryDownload, genericFrqParse, upsertSample, removeHandAuthored, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

// HTTP adapter: matches prod behavior and avoids the TCP/5432 Neon pooler
// issue that blocks the default driver from many networks.
const prisma = makePrisma();
const COURSE = "AP_HUMAN_GEOGRAPHY";
const RAW_DIR = "data/raw/ap-human-geography";

// CB URL convention (confirmed 2026-04-21 from CB past-exam index page):
// Set 1 = early test date, Set 2 = international/late. AP Central publishes
// only the 3 most recent years.
const SOURCES = [
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-human-geography-set-1.pdf"], year: 2025, label: "2025 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-human-geography-set-2.pdf"], year: 2025, label: "2025 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-human-geography-set-1.pdf"], year: 2024, label: "2024 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-human-geography-set-2.pdf"], year: 2024, label: "2024 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-human-geography-set-1.pdf"], year: 2023, label: "2023 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-human-geography-set-2.pdf"], year: 2023, label: "2023 Set 2" },
];

/**
 * HuGeo FRQ structure per released booklet:
 *   Q1: concept Q — prompt with parts A through F (no stimulus)
 *   Q2: single-stimulus analysis — map/chart/excerpt + parts A-D
 *   Q3: two-stimulus comparison — two visuals + parts A-E
 *
 * The generic "1. ... 2. ... 3. ..." parser in _shared.mjs usually picks
 * all three out cleanly. For anything that lands under 120 chars or has
 * fragmented layout, genericFrqParse drops it silently. minLen=100 here
 * is slightly relaxed to retain concept-only Q1s.
 */
async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);

  // HuGeo PDFs put Section I (MCQ directions) before Section II (FRQs).
  // The generic parser starts from "SECTION II" or the first "1." it
  // finds — works for HuGeo.
  const prompts = genericFrqParse(fullText, { minLen: 100, maxQ: 3 });
  console.log(`  parsed ${prompts.length} FRQ prompts from ${source.label}`);

  let created = 0, updated = 0;
  for (const p of prompts) {
    const res = await upsertSample(prisma, {
      course: COURSE,
      unit: null,            // FRQs cross units by design; leave null
      year: source.year,
      sourceUrl: url,
      sourceName: `College Board AP Central — Past FRQ ${source.label}`,
      questionText: p.prompt,
      stimulus: null,
      options: null,
      correctAnswer: null,
      explanation: null,
      questionType: "FRQ",
      licenseNotes: LICENSE,
    });
    created += res.created;
    updated += res.updated;
  }
  return { created, updated, url };
}

async function main() {
  console.log(`\n==== Ingesting OFFICIAL ${COURSE} FRQs from CB ====\n`);

  const deleted = await removeHandAuthored(prisma, COURSE);
  console.log(`Removed ${deleted} hand-authored reference rows.\n`);

  let totalCreated = 0, totalUpdated = 0, downloadedSets = 0;
  for (const src of SOURCES) {
    console.log(`-- ${src.label} --`);
    const { created, updated, url } = await ingestSet(src);
    totalCreated += created;
    totalUpdated += updated;
    if (url) downloadedSets++;
    console.log(`  +${created} new  ~${updated} updated\n`);
  }

  const { total, byType } = await summarizeCourse(prisma, COURSE);
  console.log(`==== Summary ====`);
  console.log(`Downloaded ${downloadedSets}/${SOURCES.length} FRQ sets`);
  console.log(`Created ${totalCreated} new, updated ${totalUpdated} existing`);
  console.log(`Total ${COURSE} OfficialSample rows: ${total}`);
  for (const row of byType) {
    console.log(`  ${row.questionType}: ${row._count}`);
  }
  console.log();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

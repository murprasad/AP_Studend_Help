// Ingest OFFICIAL AP Physics 1 FRQ content from College Board PDFs.
// See ingest-ap-csp.mjs for the overall pattern.
// Usage: node scripts/ingest/ingest-ap-physics-1.mjs

import { PrismaClient } from "@prisma/client";
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import {
  LICENSE,
  tryDownload,
  genericFrqParse,
  upsertSample,
  removeHandAuthored,
  summarizeCourse,
} from "./_shared.mjs";

const prisma = new PrismaClient();
const COURSE = "AP_PHYSICS_1";
const RAW_DIR = "data/raw/ap-physics-1";

// URLs discovered via apcentral past-exam-questions page. AP Physics 1
// publishes a single-set PDF each year (no "set-1" suffix in 2023+).
// Pattern reshuffled across years: filename uses "ap{YY}-frq-physics-1.pdf".
const SOURCES = [
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-physics-1.pdf",
    ], year: 2025, label: "2025" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-physics-1.pdf",
    ], year: 2024, label: "2024" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-physics-1.pdf",
    ], year: 2023, label: "2023" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap22-frq-physics-1.pdf",
    ], year: 2022, label: "2022" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap19-frq-physics-1.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-frq-2019.pdf",
    ], year: 2019, label: "2019" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) {
    console.log(`  SKIP ${source.label}: no URL worked`);
    return { created: 0, updated: 0, url: null };
  }
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  const prompts = genericFrqParse(fullText, { minLen: 150, maxQ: 8 });
  console.log(`  parsed ${prompts.length} FRQ prompts from ${source.label}`);

  let created = 0, updated = 0;
  for (const p of prompts) {
    const res = await upsertSample(prisma, {
      course: COURSE,
      unit: null,
      year: source.year,
      sourceUrl: url,
      sourceName: `College Board AP Central \u2014 Past FRQ ${source.label}`,
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

  let totalCreated = 0, totalUpdated = 0;
  const urlsUsed = [];
  for (const source of SOURCES) {
    console.log(`\n\u2014 ${source.label} \u2014`);
    const { created, updated, url } = await ingestSet(source);
    totalCreated += created;
    totalUpdated += updated;
    if (url) urlsUsed.push(url);
  }

  const { total, byType } = await summarizeCourse(prisma, COURSE);
  console.log(`\n==== ${COURSE} INGESTION COMPLETE ====`);
  console.log(`Created: ${totalCreated}  Updated: ${totalUpdated}`);
  console.log(`Total ${COURSE} OfficialSamples: ${total}`);
  console.log(`By type: ${byType.map(r => `${r.questionType}=${r._count}`).join("  ")}`);
  console.log(`URLs used: ${urlsUsed.length}`);
  for (const u of urlsUsed) console.log(`  ${u}`);

  await prisma.$disconnect();
  return { course: COURSE, totalCreated, totalUpdated, total, urlsUsed };
}

// Allow use as a module (for the orchestrator) and as a standalone script.
const isDirect = import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` ||
  import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
export { main };

// Ingest OFFICIAL AP World History: Modern FRQ content from College Board PDFs.
// Parses SAQs (Section I Part B) and DBQ + LEQs (Section II).
// Usage: node scripts/ingest/ingest-ap-world-history.mjs

import { PrismaClient } from "@prisma/client";
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import {
  LICENSE,
  tryDownload,
  parseHistoryFrq,
  upsertSample,
  removeHandAuthored,
  summarizeCourse,
} from "./_shared.mjs";

const prisma = new PrismaClient();
const COURSE = "AP_WORLD_HISTORY";
const RAW_DIR = "data/raw/ap-world-history";

// World History: Modern is Set 1 + Set 2. URL slug varies between years:
// 2025 uses "world-history-modern", 2024 uses "world-history", 2023 uses "world-history-modern".
const SOURCES = [
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-modern-set-1.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-set-1.pdf",
    ], year: 2025, label: "2025 Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-modern-set-2.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-set-2.pdf",
    ], year: 2025, label: "2025 Set 2" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-set-1.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-modern-set-1.pdf",
    ], year: 2024, label: "2024 Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-set-2.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-modern-set-2.pdf",
    ], year: 2024, label: "2024 Set 2" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-modern-set-1.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-set-1.pdf",
    ], year: 2023, label: "2023 Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-modern-set-2.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-set-2.pdf",
    ], year: 2023, label: "2023 Set 2" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  const prompts = parseHistoryFrq(fullText);
  const byType = prompts.reduce((a, p) => { a[p.questionType] = (a[p.questionType] || 0) + 1; return a; }, {});
  console.log(`  parsed ${prompts.length} prompts from ${source.label} (${JSON.stringify(byType)})`);

  let created = 0, updated = 0;
  for (const p of prompts) {
    const res = await upsertSample(prisma, {
      course: COURSE, unit: null, year: source.year,
      sourceUrl: url,
      sourceName: `College Board AP Central \u2014 Past FRQ ${source.label}`,
      questionText: p.prompt,
      stimulus: null, options: null, correctAnswer: null, explanation: null,
      questionType: p.questionType,
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
    totalCreated += created; totalUpdated += updated;
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

const isDirect = import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
export { main };

// Ingest OFFICIAL AP Psychology FRQ content from College Board PDFs.
// The AP Psychology exam redesign in 2024-25 introduced a new format:
//   - 2025+: Question 1 = Article Analysis Question (AAQ),
//            Question 2 = Evidence-Based Question (EBQ).
//   - 2023-2024: 2 traditional FRQs (scenario + multi-term application).
// We tag samples accordingly by year.
// Usage: node scripts/ingest/ingest-ap-psychology.mjs

import { PrismaClient } from "@prisma/client";
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import {
  LICENSE,
  tryDownload,
  parsePsychFrqOld,
  parsePsychFrqNew,
  upsertSample,
  removeHandAuthored,
  summarizeCourse,
} from "./_shared.mjs";

const prisma = new PrismaClient();
const COURSE = "AP_PSYCHOLOGY";
const RAW_DIR = "data/raw/ap-psychology";

const SOURCES = [
  // 2025+ is the NEW format (AAQ + EBQ).
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-psychology-set-1.pdf"],
    year: 2025, label: "2025 Set 1", format: "new" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-psychology-set-2.pdf"],
    year: 2025, label: "2025 Set 2", format: "new" },
  // 2024 is the LAST year of the legacy format.
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-psychology-set-1.pdf"],
    year: 2024, label: "2024 Set 1", format: "old" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-psychology-set-2.pdf"],
    year: 2024, label: "2024 Set 2", format: "old" },
  // 2023 legacy.
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-psychology-set-1.pdf"],
    year: 2023, label: "2023 Set 1", format: "old" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-psychology-set-2.pdf"],
    year: 2023, label: "2023 Set 2", format: "old" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  const parseFn = source.format === "new" ? parsePsychFrqNew : parsePsychFrqOld;
  const prompts = parseFn(fullText);
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
    console.log(`\n\u2014 ${source.label} (${source.format}) \u2014`);
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

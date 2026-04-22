// Ingest OFFICIAL AP US Government and Politics FRQ content from CB PDFs.
// Format (CED 2019): 4 FRQs — Concept Application, Quantitative Analysis,
// SCOTUS Case Comparison, Argument Essay. 100 min total.
//
// Usage: node --env-file=.env scripts/ingest/ingest-ap-us-government.mjs
// URL pattern: ap{YY}-frq-us-gov-pol-set-{1,2}.pdf (2023-2025).

import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, tryDownload, genericFrqParse, upsertSample, removeHandAuthored, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

const prisma = makePrisma();
const COURSE = "AP_US_GOVERNMENT";
const RAW_DIR = "data/raw/ap-us-government";

const SOURCES = [
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-gov-pol-set-1.pdf"], year: 2025, label: "2025 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-us-gov-pol-set-2.pdf"], year: 2025, label: "2025 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-us-gov-pol-set-1.pdf"], year: 2024, label: "2024 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-us-gov-pol-set-2.pdf"], year: 2024, label: "2024 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-us-gov-pol-set-1.pdf"], year: 2023, label: "2023 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-us-gov-pol-set-2.pdf"], year: 2023, label: "2023 Set 2" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);

  // US Gov Section II has 4 FRQs numbered 1-4. genericFrqParse handles
  // simple "1. ... 2. ..." structure. Some Argument Essay prompts are long
  // and span multiple pages — minLen=150 keeps short Concept Application
  // prompts while filtering page headers.
  const prompts = genericFrqParse(fullText, { minLen: 150, maxQ: 4 });
  console.log(`  parsed ${prompts.length} FRQ prompts from ${source.label}`);

  let created = 0, updated = 0;
  for (const p of prompts) {
    const res = await upsertSample(prisma, {
      course: COURSE,
      unit: null,
      year: source.year,
      sourceUrl: url,
      sourceName: `College Board AP Central — Past FRQ ${source.label}`,
      questionText: p.prompt,
      stimulus: null, options: null, correctAnswer: null, explanation: null,
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
  for (const row of byType) console.log(`  ${row.questionType}: ${row._count}`);
  console.log();
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });

// Ingest OFFICIAL AP Environmental Science FRQ content from CB PDFs.
// Format (CED 2020): 3 FRQs / 70 min: Design Investigation, Analyze Problem
// and Propose Solution, Analyze & Propose + Calculations. 2 sets per year.
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, tryDownload, genericFrqParse, upsertSample, removeHandAuthored, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

const prisma = makePrisma();
const COURSE = "AP_ENVIRONMENTAL_SCIENCE";
const RAW_DIR = "data/raw/ap-environmental-science";

const SOURCES = [
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-environmental-science-set-1.pdf"], year: 2025, label: "2025 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-environmental-science-set-2.pdf"], year: 2025, label: "2025 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-environmental-science-set-1.pdf"], year: 2024, label: "2024 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-environmental-science-set-2.pdf"], year: 2024, label: "2024 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-environmental-science-set-1.pdf"], year: 2023, label: "2023 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-environmental-science-set-2.pdf"], year: 2023, label: "2023 Set 2" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  const prompts = genericFrqParse(fullText, { minLen: 150, maxQ: 3 });
  console.log(`  parsed ${prompts.length} FRQ prompts from ${source.label}`);
  let created = 0, updated = 0;
  for (const p of prompts) {
    const res = await upsertSample(prisma, {
      course: COURSE, unit: null, year: source.year, sourceUrl: url,
      sourceName: `College Board AP Central — Past FRQ ${source.label}`,
      questionText: p.prompt, stimulus: null, options: null, correctAnswer: null, explanation: null,
      questionType: "FRQ", licenseNotes: LICENSE,
    });
    created += res.created; updated += res.updated;
  }
  return { created, updated, url };
}

async function main() {
  console.log(`\n==== Ingesting OFFICIAL ${COURSE} FRQs from CB ====\n`);
  await removeHandAuthored(prisma, COURSE);
  let totalCreated = 0, totalUpdated = 0, ok = 0;
  for (const src of SOURCES) {
    console.log(`-- ${src.label} --`);
    const { created, updated, url } = await ingestSet(src);
    totalCreated += created; totalUpdated += updated;
    if (url) ok++;
    console.log(`  +${created}\n`);
  }
  const { total } = await summarizeCourse(prisma, COURSE);
  console.log(`==== ${COURSE}: ${ok}/${SOURCES.length} PDFs, +${totalCreated} new, ~${totalUpdated} updated, total ${total} rows ====\n`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

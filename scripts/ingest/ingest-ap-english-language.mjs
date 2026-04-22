// Ingest OFFICIAL AP English Language FRQ content from CB PDFs.
// Format: 3 FRQs per exam (Synthesis, Rhetorical Analysis, Argument) in 135 min.
// 2 sets per year.
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, tryDownload, genericFrqParse, upsertSample, removeHandAuthored, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

const prisma = makePrisma();
const COURSE = "AP_ENGLISH_LANGUAGE";
const RAW_DIR = "data/raw/ap-english-language";

const SOURCES = [
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-english-language-set-1.pdf"], year: 2025, label: "2025 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-english-language-set-2.pdf"], year: 2025, label: "2025 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-english-language-set-1.pdf"], year: 2024, label: "2024 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-english-language-set-2.pdf"], year: 2024, label: "2024 Set 2" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-english-language-set-1.pdf"], year: 2023, label: "2023 Set 1" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap23-frq-english-language-set-2.pdf"], year: 2023, label: "2023 Set 2" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  // Eng Lang FRQs include long passages/source sets. Relax minLen so
  // the Synthesis and Rhetorical Analysis prompts (which include setup
  // text and source list) are fully captured.
  const prompts = genericFrqParse(fullText, { minLen: 200, maxQ: 3 });
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
  console.log(`==== ${COURSE}: ${ok}/${SOURCES.length} PDFs, +${totalCreated} new, total ${total} rows ====\n`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });

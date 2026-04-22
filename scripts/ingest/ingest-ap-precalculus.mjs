// Ingest OFFICIAL AP Precalculus FRQ content from CB PDFs.
// AP Precalc: 4 FRQs per exam (2 no-calc + 2 calc), 60 min total. Single
// set per year (no -set-1/-set-2 split); exam debuted 2024 so only 2 years
// of material exist.
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, tryDownload, genericFrqParse, upsertSample, removeHandAuthored, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

const prisma = makePrisma();
const COURSE = "AP_PRECALCULUS";
const RAW_DIR = "data/raw/ap-precalculus";

const SOURCES = [
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap25-frq-precalculus.pdf"], year: 2025, label: "2025" },
  { candidates: ["https://apcentral.collegeboard.org/media/pdf/ap24-frq-precalculus.pdf"], year: 2024, label: "2024" },
];

async function ingestSet(source) {
  const dir = ensureRawDir(RAW_DIR);
  const result = await tryDownload(source.candidates, dir);
  if (!result) return { created: 0, updated: 0, url: null };
  const { url, pdfPath } = result;
  const { fullText } = await extractPdfText(pdfPath);
  // Precalc FRQs are long with parts (a)(b)(c)(d); allow up to 4, minLen
  // lower because math prompts are sometimes concise.
  const prompts = genericFrqParse(fullText, { minLen: 80, maxQ: 4 });
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

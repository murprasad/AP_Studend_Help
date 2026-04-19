// Ingest OFFICIAL AP CSP content from College Board public PDFs.
//
// Sources:
//   - Past FRQ prompts (2019–2024, Set 1 & Set 2 where applicable)
//   - Corresponding scoring guidelines (when available as separate PDFs)
//   - Course and Exam Description (CED) PDF if downloadable — contains
//     the official Exam Reference Sheet pseudocode + practice MCQs
//
// Legal note: College Board publishes these FRQ prompts and scoring
// commentaries for educational use. We ingest them as OfficialSample
// rows with full attribution (sourceUrl to the CB PDF, sourceName
// identifying the publication, licenseNotes making fair-use scope
// explicit). We use them as RAG-grounding exemplars, not as content
// served verbatim to students.
//
// FIRST: clears any existing hand-authored OfficialSample rows for
// AP_COMPUTER_SCIENCE_PRINCIPLES so the real ingested content replaces
// the placeholder hand-authored rows.
//
// Usage: node scripts/ingest/ingest-ap-csp.mjs

import { PrismaClient } from "@prisma/client";
import { downloadPdf, extractPdfText, ensureRawDir } from "./pdf-utils.mjs";

const prisma = new PrismaClient();

const COURSE = "AP_COMPUTER_SCIENCE_PRINCIPLES";
const LICENSE =
  "© College Board — used as AI training/grounding reference under fair " +
  "use. Not redistributed verbatim to students. This OfficialSample is " +
  "stored for RAG retrieval during question generation only.";

// FRQ PDFs — College Board publishes these publicly on apcentral.
// Each PDF contains 1-2 FRQs with multi-part prompts.
// College Board changes URL conventions per year. For each year we try
// multiple known URL patterns; the first one that responds 200 is used.
const FRQ_SOURCES = [
  // 2025 — long-form filename
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-1.pdf",
    ], year: 2025, label: "2025 Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-2.pdf",
    ], year: 2025, label: "2025 Set 2" },
  // 2024 — short "csp" filename
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-csp-set-1.pdf",
    ], year: 2024, label: "2024 Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-frq-csp-set-2.pdf",
    ], year: 2024, label: "2024 Set 2" },
  // 2023 — try both conventions
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-computer-science-principles.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-csp.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap23-frq-csp-set-1.pdf",
    ], year: 2023, label: "2023 FRQ" },
  // 2022
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-frq-2022.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap22-frq-computer-science-principles.pdf",
    ], year: 2022, label: "2022 FRQ" },
  // 2021
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-frq-2021.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap21-frq-computer-science-principles.pdf",
    ], year: 2021, label: "2021 FRQ" },
  // 2019 (2020 skipped — modified pandemic exams)
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-frq-2019.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap19-frq-csp.pdf",
    ], year: 2019, label: "2019 FRQ" },
];

// Scoring guidelines — same URL pattern but with "sg" instead of "frq"
const SCORING_SOURCES = [
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-sg-computer-science-principles-set-1.pdf",
    ], year: 2025, label: "2025 Scoring Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap25-sg-computer-science-principles-set-2.pdf",
    ], year: 2025, label: "2025 Scoring Set 2" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-sg-csp-set-1.pdf",
    ], year: 2024, label: "2024 Scoring Set 1" },
  { candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap24-sg-csp-set-2.pdf",
    ], year: 2024, label: "2024 Scoring Set 2" },
];

// Parse an FRQ PDF's text into question prompts. The CB format is:
//   "1.Programs accept input..." — leading "N." begins each question
//   "(a)", "(b)" — sub-parts
// Extract one OfficialSample row per top-level question (sub-parts are
// kept inside the prompt to preserve context).
function parseFrqPrompts(fullText) {
  // Split on top-level question number at line start (e.g., "1." "2." at beginning of body)
  // Remove header boilerplate (pages 1, STOP END OF EXAM page)
  // Locate the directions block, then extract anything after.
  const directions = fullText.match(/Directions:[\s\S]*?(?=\d\.\s*[A-Z])/);
  const startIdx = directions ? fullText.indexOf(directions[0]) + directions[0].length : 0;
  const body = fullText.slice(startIdx);

  // Split on /(\d+)\.\s+([A-Z])/ where N is 1-8 (AP CSP has 2 FRQs, but for
  // older years might have more). Capture question number.
  const parts = [];
  const regex = /(?:^|\n)(\d+)\.\s*([A-Z][\s\S]*?)(?=\n\d+\.\s*[A-Z]|\n\s*STOP\b|\nEND OF EXAM|$)/g;
  let m;
  while ((m = regex.exec(body)) !== null) {
    const qNum = parseInt(m[1], 10);
    let prompt = m[2].trim();
    // Strip "Write your responses... booklet" footer
    prompt = prompt.replace(/_+[\s\S]*?Written Response booklet[^.]*\./g, "").trim();
    prompt = prompt.replace(/GO ON TO THE NEXT PAGE\..*$/gm, "").trim();
    prompt = prompt.replace(/© \d{4} College Board\.[\s\S]*$/g, "").trim();
    // Collapse whitespace
    prompt = prompt.replace(/\s+/g, " ").trim();
    if (prompt.length < 30) continue;
    if (qNum < 1 || qNum > 8) continue;
    parts.push({ qNum, prompt });
  }
  return parts;
}

async function tryDownload(candidates, destDir) {
  for (const url of candidates) {
    const filename = url.split("/").pop();
    const pdfPath = `${destDir}/${filename}`;
    try {
      await downloadPdf(url, pdfPath);
      return { url, pdfPath };
    } catch (e) {
      console.log(`    miss ${url.split("/").pop()}: ${e.message.slice(0, 40)}`);
    }
  }
  return null;
}

async function ingestFrqSet(source) {
  const { candidates, year, label } = source;
  const dir = ensureRawDir("data/raw/ap-csp");
  const result = await tryDownload(candidates, dir);
  if (!result) {
    console.log(`  SKIP ${label}: no URL worked`);
    return 0;
  }
  const { url, pdfPath } = result;

  const { fullText } = await extractPdfText(pdfPath);
  const prompts = parseFrqPrompts(fullText);
  console.log(`  parsed ${prompts.length} FRQ prompts from ${label}`);

  let created = 0;
  for (const p of prompts) {
    const existingKey = `${COURSE}-${year}-Q${p.qNum}-${label}`;
    const existing = await prisma.officialSample.findFirst({
      where: {
        course: COURSE,
        year,
        sourceUrl: url,
        questionText: { startsWith: p.prompt.slice(0, 60) },
      },
    });

    const data = {
      course: COURSE,
      unit: null,
      year,
      sourceUrl: url,
      sourceName: `College Board AP Central — Past FRQ ${label}`,
      questionText: p.prompt,
      stimulus: null,
      options: null,
      correctAnswer: null,
      explanation: null, // scoring guide fetched separately if available
      questionType: "FRQ",
      licenseNotes: LICENSE,
    };

    if (existing) {
      await prisma.officialSample.update({ where: { id: existing.id }, data });
    } else {
      await prisma.officialSample.create({ data });
      created++;
    }
  }
  return created;
}

async function main() {
  console.log("\n==== Ingesting OFFICIAL AP CSP content from CB ====\n");

  // STEP 1: Remove old hand-authored AP CSP OfficialSamples.
  // The hand-authored rows are "CB-Style Reference" and should be replaced
  // with actual CB content per the user's no-compromise directive.
  const deleted = await prisma.officialSample.deleteMany({
    where: {
      course: COURSE,
      sourceName: { contains: "CB-Style Reference" },
    },
  });
  console.log(`Removed ${deleted.count} hand-authored CSP reference rows.\n`);

  // STEP 2: Ingest FRQs from all available years.
  let totalCreated = 0;
  for (const source of FRQ_SOURCES) {
    console.log(`\n— ${source.label} —`);
    const count = await ingestFrqSet(source);
    totalCreated += count;
  }

  // STEP 3: Report final counts.
  const total = await prisma.officialSample.count({ where: { course: COURSE } });
  const byType = await prisma.officialSample.groupBy({
    by: ["questionType"],
    where: { course: COURSE },
    _count: true,
  });
  const bySource = await prisma.officialSample.groupBy({
    by: ["sourceName"],
    where: { course: COURSE },
    _count: true,
  });

  console.log("\n==== INGESTION COMPLETE ====");
  console.log(`Newly created this run: ${totalCreated}`);
  console.log(`Total AP CSP OfficialSamples: ${total}`);
  console.log("By type:");
  for (const r of byType) console.log(`  ${r.questionType.padEnd(8)} ${r._count}`);
  console.log("By source:");
  for (const r of bySource) console.log(`  ${r._count} × ${r.sourceName}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

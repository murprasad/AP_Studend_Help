// Ingest OFFICIAL ACT content from ACT.org public practice booklets.
//
// Sources (verified 2026-04):
//   https://www.act.org/content/dam/act/unsecured/documents/Preparing-for-the-ACT.pdf
//   https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf
//
// Each booklet contains the full ACT (2025 Enhanced format):
//   - ENGLISH TEST        50 questions (5 passages × 10 questions)
//   - MATHEMATICS TEST    45 questions
//   - READING TEST        36 questions (4 passages × 9 questions)
//   - SCIENCE TEST        40 questions (optional section)
//
// ACT multiple-choice convention:
//   - Odd-numbered questions: A / B / C / D
//   - Even-numbered questions: F / G / H / J
//
// Section layout in PDFs:
//   - English:   passage on left column, questions on right column
//   - Math:      single column with questions; right column is scratch ("DO YOUR FIGURING HERE")
//   - Reading:   2 columns of questions (both contain questions)
//   - Science:   2 columns of questions (both contain questions)
//
// Answer key location (shared across sections, pages 73-76 in Test 1):
//   "English Scoring Key" / "Mathematics Scoring Key" / "Reading Scoring Key"
//   / "Science Scoring Key". Inside each, the answer table has columns:
//     [Number] [Correct Answer] [Mark 1] [Reporting Category]
//   We extract via raw x,y coordinates (number at x~60, answer at x~115,
//   category at x~220).
//
// Usage: node scripts/ingest/ingest-act.mjs

import { PrismaClient } from "@prisma/client";
import { downloadPdf, extractPdfTextColumns, ensureRawDir } from "./pdf-utils.mjs";

const prisma = new PrismaClient();

const COURSES = {
  ENGLISH: "ACT_ENGLISH",
  MATH: "ACT_MATH",
  READING: "ACT_READING",
  SCIENCE: "ACT_SCIENCE",
};

const LICENSE =
  "© ACT, Inc. — used as AI training/grounding reference under fair use. " +
  "Not redistributed verbatim to students. This OfficialSample is stored " +
  "for RAG retrieval during ACT question generation only.";

const YEAR = 2025;

const TESTS = [
  {
    label: "Preparing for the ACT (2025-2026)",
    url: "https://www.act.org/content/dam/act/unsecured/documents/Preparing-for-the-ACT.pdf",
    file: "Preparing-for-the-ACT.pdf",
  },
  {
    label: "ACT Test Prep Practice Test 2 (2025-2026)",
    url: "https://www.act.org/content/dam/act/unsecured/documents/ACT-Test-Prep-ACT-Practice-Test-2-Form.pdf",
    file: "ACT-Test-Prep-Practice-Test-2.pdf",
  },
];

// ===== Section detection =====
// Page has "ENGLISH TEST" / "MATHEMATICS TEST" / "READING TEST" / "SCIENCE TEST"
// headers on the opening page. Otherwise page header shows the section as a
// digit in the top-left: 1=English, 2=Math, 3=Reading, 4=Science.

function detectSection(pageFullText) {
  if (/\bENGLISH\s+TEST\b/i.test(pageFullText)) return "english";
  if (/\bMATHEMATICS\s+TEST\b/i.test(pageFullText)) return "math";
  if (/\bREADING\s+TEST\b/i.test(pageFullText)) return "reading";
  if (/\bSCIENCE\s+TEST\b/i.test(pageFullText)) return "science";
  return null;
}

// ===== ACT-specific parsing =====
//
// ACT questions start with `{N}.` on a new line. Options are listed on
// subsequent lines as `A.` `B.` `C.` `D.` (odd) or `F.` `G.` `H.` `J.` (even).
// We extract one question per block delimited by the next `{N}.` occurrence.

const ODD_OPTS = ["A", "B", "C", "D"];
const EVEN_OPTS = ["F", "G", "H", "J"];

/**
 * Extract question blocks from a block of ACT text. Returns
 * Array<{qNum, stem, options: {X,Y,Z,W}}>.
 */
function extractActQuestions(text, { maxQ = 50 } = {}) {
  // Split by question starts. The pattern "{N}." at line start marks the
  // boundary. Use a DOTALL-like capture: allow multi-line content until next
  // "{N}." or end.
  const lines = text.split("\n");
  const blocks = [];
  let current = null;
  // Question number regex: allow 1-75 (max across all ACT sections).
  // It can be on its own line ("12.") or at the start of a longer line ("12.The ...").
  const startRe = /^\s*(\d{1,2})\.\s*(.*)$/;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Skip common footers/headers
    if (/^©\s*\d{4}/i.test(line)) continue;
    if (/^Page\s+\d+\s+of/i.test(line)) continue;
    if (/GO ON TO THE NEXT PAGE/i.test(line)) continue;
    if (/END OF TEST/i.test(line)) continue;
    if (/DO YOUR FIGURING HERE/i.test(line)) continue;
    if (/^\d+\s*$/.test(line) && line.length <= 3) continue; // stray page-header digit
    const m = startRe.exec(line);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= maxQ) {
        if (current) blocks.push(current);
        current = { qNum: n, body: m[2] || "" };
        continue;
      }
    }
    if (current) current.body += " " + line;
  }
  if (current) blocks.push(current);

  const results = [];
  for (const b of blocks) {
    const raw = b.body.replace(/\s+/g, " ").trim();
    // Choose option set based on parity (ACT convention).
    const set = b.qNum % 2 === 1 ? ODD_OPTS : EVEN_OPTS;
    const [o1, o2, o3, o4] = set;
    // Build regex to capture options.
    // Options format: "A. text" with a period after the letter.
    const optRe = new RegExp(
      `^(.*?)\\b${o1}\\.\\s*(.+?)\\s*\\b${o2}\\.\\s*(.+?)\\s*\\b${o3}\\.\\s*(.+?)\\s*\\b${o4}\\.\\s*(.+?)$`
    );
    const m = optRe.exec(raw);
    if (!m) continue;
    const [, stemRaw, v1, v2, v3, v4] = m;
    const scrub = (s) =>
      s
        .replace(/-{3,}~?/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const stem = scrub(stemRaw);
    if (stem.length < 10) continue;
    // Build options object using standard A-D mapping so the rest of the
    // pipeline (mock exams, renderers) can treat all MCQs uniformly.
    // Even-numbered ACT items (F/G/H/J) get mapped to A/B/C/D.
    const options = { A: scrub(v1), B: scrub(v2), C: scrub(v3), D: scrub(v4) };
    results.push({ qNum: b.qNum, stem, options, originalOpts: set });
  }
  return results;
}

/**
 * Parse the ACT test body and return questions per section.
 * `pages` comes from extractPdfTextColumns.
 */
function parseActTest(pages) {
  // Walk pages, track current section, accumulate section-specific text buckets.
  const sectionText = { english: "", math: "", reading: "", science: "" };
  let currentSection = null;
  for (const p of pages) {
    const detected = detectSection(p.full);
    if (detected) currentSection = detected;
    if (!currentSection) continue;

    // English: passage on left, questions on right. Only include right column.
    // Math: content in left column, right is scratch. Only include left column.
    // Reading / Science: both columns contain questions.
    let chunk;
    if (currentSection === "english") chunk = p.right;
    else if (currentSection === "math") chunk = p.left;
    else chunk = `${p.left}\n${p.right}`;
    sectionText[currentSection] += "\n" + chunk;
  }

  return {
    english: extractActQuestions(sectionText.english, { maxQ: 75 }),
    math: extractActQuestions(sectionText.math, { maxQ: 60 }),
    reading: extractActQuestions(sectionText.reading, { maxQ: 40 }),
    science: extractActQuestions(sectionText.science, { maxQ: 40 }),
  };
}

// ===== Answer key extraction =====
//
// Pages 73-76 (Test 1) / equivalent in Test 2 contain per-section scoring keys.
// Table columns (x-coord approx):
//   x=60-70    question number
//   x=115-120  correct answer letter (A/B/C/D/F/G/H/J)
//   x=220-230  reporting category code
// We group items by rounded Y to assemble rows.

function parseAnswerKeyPage(items, whichSection) {
  // Group by Y (±4 tolerance).
  // Items are already sorted by y desc, then x asc.
  const rows = [];
  let currentRow = null;
  let lastY = null;
  for (const it of items) {
    if (lastY === null || Math.abs(lastY - it.y) > 4) {
      if (currentRow) rows.push(currentRow);
      currentRow = { y: it.y, cells: [] };
      lastY = it.y;
    }
    currentRow.cells.push(it);
  }
  if (currentRow) rows.push(currentRow);

  const answers = new Map();
  const numXMin = 60,
    numXMax = 80;
  const ansXMin = 110,
    ansXMax = 150;
  for (const row of rows) {
    const numCell = row.cells.find((c) => c.x >= numXMin && c.x <= numXMax);
    const ansCell = row.cells.find((c) => c.x >= ansXMin && c.x <= ansXMax);
    if (!numCell || !ansCell) continue;
    const nStr = numCell.s.trim();
    const aStr = ansCell.s.trim();
    const n = parseInt(nStr, 10);
    if (!Number.isInteger(n) || n < 1 || n > 200) continue;
    if (!/^[A-DFGHJ]$/.test(aStr)) continue;
    answers.set(n, aStr);
  }
  return answers;
}

/**
 * Find the answer-key pages and extract per-section answer maps.
 * Returns { english: Map<n, letter>, math: Map, reading: Map, science: Map }.
 */
function parseAnswerKeys(pages) {
  const keys = { english: new Map(), math: new Map(), reading: new Map(), science: new Map() };
  for (const p of pages) {
    // Identify answer-key pages by their title strings.
    if (/English\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.english.set(n, v);
    } else if (/Mathematics\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.math.set(n, v);
    } else if (/Reading\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.reading.set(n, v);
    } else if (/Science\s+Scoring\s+Key/i.test(p.full)) {
      for (const [n, v] of parseAnswerKeyPage(p.items).entries()) keys.science.set(n, v);
    }
  }
  return keys;
}

/**
 * Map an ACT answer letter (possibly F/G/H/J) to the normalized A/B/C/D
 * we stored under options.{A,B,C,D}.
 */
function normalizeAnswerLetter(letter, qNum) {
  const isOdd = qNum % 2 === 1;
  if (isOdd) return letter; // A/B/C/D directly
  // Even: F=A, G=B, H=C, J=D
  const m = { F: "A", G: "B", H: "C", J: "D" };
  return m[letter] || letter;
}

async function ingestOneTest(test) {
  const dir = ensureRawDir("data/raw/act");
  const pdfPath = `${dir}/${test.file}`;
  console.log(`\n— ${test.label} —`);
  try {
    await downloadPdf(test.url, pdfPath);
  } catch (e) {
    console.log(`  SKIP: download failed — ${e.message}`);
    return { perSection: {} };
  }

  const { pages } = await extractPdfTextColumns(pdfPath);
  const qs = parseActTest(pages);
  const keys = parseAnswerKeys(pages);

  console.log(
    `  parsed questions: E=${qs.english.length} M=${qs.math.length}` +
      ` R=${qs.reading.length} S=${qs.science.length}`
  );
  console.log(
    `  answer keys:      E=${keys.english.size} M=${keys.math.size}` +
      ` R=${keys.reading.size} S=${keys.science.size}`
  );

  const sectionMap = [
    { key: "english", course: COURSES.ENGLISH, sectionName: "English" },
    { key: "math", course: COURSES.MATH, sectionName: "Math" },
    { key: "reading", course: COURSES.READING, sectionName: "Reading" },
    { key: "science", course: COURSES.SCIENCE, sectionName: "Science" },
  ];

  const perSection = {};
  for (const { key, course, sectionName } of sectionMap) {
    const questions = qs[key];
    const answers = keys[key];
    const sourceName = `${test.label} — ${sectionName}`;
    let created = 0;
    let skipped = 0;
    for (const q of questions) {
      const rawAns = answers.get(q.qNum);
      if (!rawAns) {
        skipped++;
        continue;
      }
      const answerLetter = normalizeAnswerLetter(rawAns, q.qNum);
      if (!["A", "B", "C", "D"].includes(answerLetter)) {
        skipped++;
        continue;
      }
      const data = {
        course,
        unit: null,
        year: YEAR,
        sourceUrl: test.url,
        sourceName,
        questionText: q.stem,
        stimulus: null,
        options: q.options,
        correctAnswer: answerLetter,
        explanation: null,
        questionType: "MCQ",
        licenseNotes: LICENSE,
      };
      const existing = await prisma.officialSample.findFirst({
        where: {
          course,
          sourceName,
          questionText: { startsWith: q.stem.slice(0, 80) },
        },
      });
      if (existing) {
        await prisma.officialSample.update({ where: { id: existing.id }, data });
      } else {
        await prisma.officialSample.create({ data });
        created++;
      }
    }
    perSection[course] = { created, skipped, parsed: questions.length };
    console.log(`  ${course}: created=${created} skipped=${skipped} parsed=${questions.length}`);
  }
  return { perSection };
}

async function main() {
  console.log("\n==== Ingesting OFFICIAL ACT content from ACT.org ====\n");

  const deleted = await prisma.officialSample.deleteMany({
    where: {
      course: { in: Object.values(COURSES) },
      sourceName: { contains: "Style Reference" },
    },
  });
  console.log(`Removed ${deleted.count} prior hand-authored ACT reference rows.\n`);

  for (const t of TESTS) {
    try {
      await ingestOneTest(t);
    } catch (e) {
      console.log(`  ERROR on ${t.label}: ${e.message}`);
    }
  }

  const totals = {};
  for (const course of Object.values(COURSES)) {
    totals[course] = await prisma.officialSample.count({ where: { course } });
  }
  console.log("\n==== ACT INGESTION COMPLETE ====");
  for (const [course, n] of Object.entries(totals)) {
    console.log(`  ${course}: ${n}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

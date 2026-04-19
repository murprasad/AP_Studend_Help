// Ingest OFFICIAL SAT content from College Board public practice tests.
//
// Sources:
//   https://satsuite.collegeboard.org/media/pdf/sat-practice-test-{N}-digital.pdf
//   https://satsuite.collegeboard.org/media/pdf/sat-practice-test-{N}-answers-digital.pdf
//
//   Tests 4-11 are currently posted on satsuite.collegeboard.org/practice.
//   (Tests 1-3 were retired when the Digital SAT format changed.)
//
// Each practice-test PDF has four sections:
//   - Module 1 Reading and Writing  (33 questions)
//   - Module 2 Reading and Writing  (33 questions)
//   - Module 1 Math                 (27 questions, mixed MCQ + student-produced)
//   - Module 2 Math                 (27 questions, mixed MCQ + student-produced)
//
// We only ingest MCQs (with 4 lettered options). Student-produced response
// questions (SPR / numeric-entry) are skipped because they have no option list.
//
// Parsing approach:
//   1. Use extractPdfTextColumns to get left/right columns per page.
//   2. Walk columns in reading order (left then right) page by page.
//   3. In each column, the layout is: [question number line] ... [stimulus]
//      [stem] A)... B)... C)... D).
//   4. Track which section we're in via page headers:
//      "Module 1 Reading and Writing" / "Module 2 Reading and Writing" /
//      "Module 1 Math" / "Module 2 Math" (actually "Module 1 / Math" split).
//   5. After parsing, match each question to the answer-explanations PDF
//      via `QUESTION {N}\nChoice {X}is the best answer` regex.
//
// Legal: we store CB questions as OfficialSample rows with full attribution
// (sourceUrl, sourceName, licenseNotes) for use as RAG grounding. We do not
// redistribute CB content verbatim to students via the question bank; these
// rows feed the AI generator's few-shot prompt.
//
// Usage: node scripts/ingest/ingest-sat.mjs

import { PrismaClient } from "@prisma/client";
import { downloadPdf, extractPdfTextColumns, ensureRawDir } from "./pdf-utils.mjs";

const prisma = new PrismaClient();

const COURSES = {
  RW: "SAT_READING_WRITING",
  MATH: "SAT_MATH",
};

const LICENSE =
  "© College Board — used as AI training/grounding reference under fair use. " +
  "Not redistributed verbatim to students. Stored for RAG retrieval during " +
  "question generation only.";

// Tests 4-11 are currently live on CB. Tests 1-3 were retired when the
// Digital SAT format changed. Scope for this ingestion pass: just 2 tests
// to hit ~200 real MCQs. Tests 4 + 5 chosen (test 4 already cached locally).
const TEST_NUMBERS = [4, 5];

const YEAR = 2024; // CB released Digital SAT practice tests in 2022-2024; conservative year stamp.

function urlFor(n) {
  return {
    test: `https://satsuite.collegeboard.org/media/pdf/sat-practice-test-${n}-digital.pdf`,
    answers: `https://satsuite.collegeboard.org/media/pdf/sat-practice-test-${n}-answers-digital.pdf`,
  };
}

/**
 * Parse an answers PDF into a Map<qNum, {letter, explanation}> for each
 * of the four sections. Returns { rw1, rw2, math1, math2 } each being a Map.
 *
 * The answer-explanations PDF header format changes per section:
 *   "READING AND WRITING: MODULE 1"
 *   "READING AND WRITING: MODULE 2"
 *   "MATH: MODULE 1"
 *   "MATH: MODULE 2"
 * followed by `QUESTION {N}` blocks. Within each block:
 *   "Choice Xis the best answer because ..."
 */
function parseAnswersPdf(pagesText) {
  const sections = { rw1: new Map(), rw2: new Map(), math1: new Map(), math2: new Map() };
  let currentSection = null;

  // Concatenate all pages, preserving page breaks so we can track section headers.
  for (const pageText of pagesText) {
    // Detect section switch from repeated header.
    if (/READING AND WRITING:?\s*MODULE 1/i.test(pageText)) currentSection = "rw1";
    else if (/READING AND WRITING:?\s*MODULE 2/i.test(pageText)) currentSection = "rw2";
    else if (/MATH:?\s*MODULE 1/i.test(pageText)) currentSection = "math1";
    else if (/MATH:?\s*MODULE 2/i.test(pageText)) currentSection = "math2";

    if (!currentSection) continue;

    // Extract QUESTION N blocks.
    const blockRegex = /QUESTION\s+(\d+)([\s\S]*?)(?=QUESTION\s+\d+|$)/g;
    let m;
    while ((m = blockRegex.exec(pageText)) !== null) {
      const qNum = parseInt(m[1], 10);
      const block = m[2];
      // Match first "Choice Xis the best answer" (R&W) or "Choice Xis correct" (Math).
      // The PDF extractor occasionally produces "Xis" with no space (glyph spacing quirk),
      // so we allow \s* between the letter and "is".
      const choiceMatch = block.match(
        /Choice\s+([A-D])\s*is\s+(?:the\s+best\s+answer|correct)/i
      );
      if (!choiceMatch) continue;
      const letter = choiceMatch[1].toUpperCase();
      // Grab first ~600 chars of explanation (trim boilerplate).
      let explanation = block
        .replace(/Choice\s+[A-D]\s*is\s+the\s+best\s+answer\s*/i, "")
        .replace(/\d+\s*SAT PRACTICE TEST.*$/gim, "")
        .replace(/SAT ANSWER EXPLANATIONS.*$/gim, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 800);
      sections[currentSection].set(qNum, { letter, explanation });
    }
  }
  return sections;
}

/**
 * Given an array of column-text-blocks (one per column across all pages in
 * reading order), walk through and detect which section we're currently in
 * and extract question blocks.
 *
 * Returns Array<{section, qNum, stem, options: {A,B,C,D}}>
 */
function parseTestPdf(pages) {
  // Flatten all columns in reading order: for each page, left then right.
  const columnBlocks = [];
  let currentSection = null;
  for (const p of pages) {
    // Detect section from page's "full" text. The page header says
    // "Module\nN\nReading and Writing" or "Module\nN\nMath".
    // The first R&W module 1 page shows "Reading and Writing" and "33 QUESTIONS";
    // subsequent pages just say "Module\n1".
    const full = p.full;
    if (/Reading\s+and\s+Writing\s*\n?\s*33\s*QUESTIONS/i.test(full)) {
      // First R&W section appears; decide if 1 or 2 based on current.
      currentSection = currentSection === "rw1" ? "rw2" : "rw1";
    } else if (/^\s*Math\s*\n?\s*27\s*QUESTIONS/im.test(full) || /\bMath\b\s*\n?\s*27\s*QUESTIONS/i.test(full)) {
      currentSection = currentSection === "math1" ? "math2" : "math1";
    }

    // Keep tracking via Module header too so we don't lose state on subsequent pages.
    // (The columns still belong to the last-declared section.)
    columnBlocks.push({ col: p.left, section: currentSection, page: p });
    columnBlocks.push({ col: p.right, section: currentSection, page: p });
  }

  const results = [];
  for (const { col, section } of columnBlocks) {
    if (!section || !col) continue;
    // Split column into "question blocks" delimited by lone-number lines.
    // Accept 1..99 as question number. Our section has 27 or 33 questions,
    // so filter by that range when emitting.
    const lines = col.split("\n");
    const maxQ = section.startsWith("rw") ? 33 : 27;

    // Build blocks: scan lines, when we hit a line that is JUST an integer
    // between 1..maxQ, treat as start of a question block.
    let current = null;
    const blocks = [];
    const numRegex = /^\s*(\d{1,2})\s*$/;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      // Skip page footer boilerplate
      if (/^Unauthorized copying/i.test(line)) continue;
      if (/CO\s*NTI\s*N\s*U\s*E/i.test(line)) continue;
      if (/^Module$/i.test(line)) continue;
      if (/^DIRECTIONS$/i.test(line)) continue;
      if (/^NOTES$/i.test(line)) continue;
      const m = numRegex.exec(line);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 1 && n <= maxQ) {
          if (current) blocks.push(current);
          current = { qNum: n, lines: [] };
          continue;
        }
      }
      if (current) current.lines.push(line);
    }
    if (current) blocks.push(current);

    for (const b of blocks) {
      const raw = b.lines.join(" ").replace(/\s+/g, " ").trim();
      // Parse options A-D. Options appear in format "A)text B)text C)text D)text".
      // Require all four to be present; if not, skip (student-produced or unparseable).
      const optMatch = raw.match(
        /^(.*?)\bA\)\s*(.+?)\s*B\)\s*(.+?)\s*C\)\s*(.+?)\s*D\)\s*(.+?)$/
      );
      if (!optMatch) continue;
      const [, stemRaw, A, B, C, D] = optMatch;
      // Scrub PDF artifacts: underline glyphs ("---------~"), repeated dashes,
      // fill-in-the-blank underscores collapsed, stray footer fragments.
      const scrub = (s) =>
        s
          .replace(/-{3,}~?/g, "")
          .replace(/_{3,}/g, "______")
          .replace(/\s+/g, " ")
          .trim();
      const stem = scrub(stemRaw);
      if (stem.length < 15) continue;
      const clean = (s) => scrub(s);
      results.push({
        section,
        qNum: b.qNum,
        stem,
        options: { A: clean(A), B: clean(B), C: clean(C), D: clean(D) },
      });
    }
  }
  return results;
}

async function ingestTest(n) {
  const urls = urlFor(n);
  const dir = ensureRawDir("data/raw/sat");
  const testPath = `${dir}/sat-practice-test-${n}-digital.pdf`;
  const answersPath = `${dir}/sat-practice-test-${n}-answers-digital.pdf`;

  console.log(`\n— SAT Practice Test ${n} —`);
  try {
    await downloadPdf(urls.test, testPath);
    await downloadPdf(urls.answers, answersPath);
  } catch (e) {
    console.log(`  SKIP: download failed — ${e.message}`);
    return { created: 0, skipped: 0 };
  }

  const { pages: testPages } = await extractPdfTextColumns(testPath);
  const { pages: ansPages } = await extractPdfTextColumns(answersPath);

  const questions = parseTestPdf(testPages);
  const answers = parseAnswersPdf(ansPages.map((p) => p.full));

  console.log(
    `  parsed: rw1=${questions.filter((q) => q.section === "rw1").length}` +
      ` rw2=${questions.filter((q) => q.section === "rw2").length}` +
      ` math1=${questions.filter((q) => q.section === "math1").length}` +
      ` math2=${questions.filter((q) => q.section === "math2").length}`
  );
  console.log(
    `  answers: rw1=${answers.rw1.size} rw2=${answers.rw2.size}` +
      ` math1=${answers.math1.size} math2=${answers.math2.size}`
  );

  let created = 0;
  let skipped = 0;
  for (const q of questions) {
    const ans = answers[q.section]?.get(q.qNum);
    if (!ans) {
      skipped++;
      continue;
    }
    const course = q.section.startsWith("rw") ? COURSES.RW : COURSES.MATH;
    const sourceName = `College Board SAT Practice Test ${n} (Digital)`;
    const data = {
      course,
      unit: null,
      year: YEAR,
      sourceUrl: urls.test,
      sourceName,
      questionText: q.stem,
      stimulus: null,
      options: q.options,
      correctAnswer: ans.letter,
      explanation: ans.explanation || null,
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
  console.log(`  created ${created} new (skipped ${skipped} with no answer match)`);
  return { created, skipped, parsed: questions.length };
}

async function main() {
  console.log("\n==== Ingesting OFFICIAL SAT content from College Board ====\n");

  // STEP 1: Remove prior hand-authored "Style Reference" rows.
  const deleted = await prisma.officialSample.deleteMany({
    where: {
      course: { in: [COURSES.RW, COURSES.MATH] },
      sourceName: { contains: "Style Reference" },
    },
  });
  console.log(`Removed ${deleted.count} prior hand-authored SAT reference rows.\n`);

  let totalCreated = 0;
  let totalParsed = 0;
  let totalSkipped = 0;
  for (const n of TEST_NUMBERS) {
    try {
      const r = await ingestTest(n);
      totalCreated += r.created;
      totalParsed += r.parsed || 0;
      totalSkipped += r.skipped || 0;
    } catch (e) {
      console.log(`  ERROR on test ${n}: ${e.message}`);
    }
  }

  const rwTotal = await prisma.officialSample.count({ where: { course: COURSES.RW } });
  const mathTotal = await prisma.officialSample.count({ where: { course: COURSES.MATH } });

  console.log("\n==== SAT INGESTION COMPLETE ====");
  console.log(`Parsed questions: ${totalParsed}`);
  console.log(`Created OfficialSample rows: ${totalCreated}`);
  console.log(`Skipped (no matching answer): ${totalSkipped}`);
  console.log(`Total SAT_READING_WRITING OfficialSamples now: ${rwTotal}`);
  console.log(`Total SAT_MATH OfficialSamples now: ${mathTotal}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

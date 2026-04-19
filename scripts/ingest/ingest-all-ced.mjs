// Ingest REAL AP MCQs from College Board Course and Exam Description (CED) PDFs.
//
// Each AP course CED contains a "Sample Exam Questions" chapter near the end
// of the PDF (usually 15-30 MCQs) plus an answer key in the appendix.
// We parse the MCQ stems + (A)/(B)/(C)/(D) options and pair them with the
// correct answer from the answer key, then store as OfficialSample rows with
// questionType = "MCQ".
//
// These rows serve as RAG-grounding exemplars for our AP question generator.
// They're stored for internal retrieval only, never served verbatim to
// students. See licenseNotes for fair-use scope.
//
// Idempotent: before inserting, deletes any existing MCQ-type OfficialSample
// rows where sourceName matches "CED Sample Questions" for each course.
//
// Usage: node scripts/ingest/ingest-all-ced.mjs [--course=AP_PHYSICS_1]

import { PrismaClient } from "@prisma/client";
import { downloadPdf, extractPdfText, ensureRawDir } from "./pdf-utils.mjs";
import { cleanPrompt } from "./_shared.mjs";

const prisma = new PrismaClient();

const LICENSE =
  "\u00a9 College Board \u2014 used as AI training/grounding reference under " +
  "fair use. Not redistributed verbatim to students. Stored for RAG " +
  "retrieval during question generation only.";

// CEDs: { course enum value, slug used in filename, course display name, CED URL }.
// URLs verified via WebFetch against the course main pages on 2026-04-18.
const CEDS = [
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    slug: "computer-science-principles",
    name: "AP Computer Science Principles",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-computer-science-principles-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_PHYSICS_1",
    slug: "physics-1",
    name: "AP Physics 1",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_US_HISTORY",
    slug: "us-history",
    name: "AP U.S. History",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-us-history-course-and-exam-description.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap-united-states-history-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_CALCULUS_AB",
    slug: "calculus-ab",
    name: "AP Calculus AB",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_CALCULUS_BC",
    slug: "calculus-bc",
    name: "AP Calculus BC",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap-calculus-bc-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_BIOLOGY",
    slug: "biology",
    name: "AP Biology",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_CHEMISTRY",
    slug: "chemistry",
    name: "AP Chemistry",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_STATISTICS",
    slug: "statistics",
    name: "AP Statistics",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_PSYCHOLOGY",
    slug: "psychology",
    name: "AP Psychology",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-psychology-course-and-exam-description.pdf",
    ],
  },
  {
    course: "AP_WORLD_HISTORY",
    slug: "world-history-modern",
    name: "AP World History: Modern",
    urls: [
      "https://apcentral.collegeboard.org/media/pdf/ap-world-history-modern-course-and-exam-description.pdf",
      "https://apcentral.collegeboard.org/media/pdf/ap-world-history-course-and-exam-description.pdf",
    ],
  },
];

// Priority order for time-boxed runs (see task spec).
const PRIORITY = [
  "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "AP_PHYSICS_1",
  "AP_US_HISTORY",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_BIOLOGY",
  "AP_CHEMISTRY",
  "AP_STATISTICS",
  "AP_PSYCHOLOGY",
  "AP_WORLD_HISTORY",
];

function sortedCeds() {
  const byCourse = new Map(CEDS.map((c) => [c.course, c]));
  return PRIORITY.map((c) => byCourse.get(c)).filter(Boolean);
}

async function tryDownload(urls, destPath) {
  for (const url of urls) {
    try {
      await downloadPdf(url, destPath);
      return url;
    } catch (e) {
      const msg = (e && e.message ? e.message : String(e)).slice(0, 80);
      console.log(`    miss ${url.split("/").pop()}: ${msg}`);
    }
  }
  return null;
}

/**
 * Locate the range of pages holding the Sample Exam Questions chapter.
 * Returns { startPage, endPage } (1-indexed, inclusive) or null if absent.
 *
 * Strategy: find the first page whose text contains "Sample Exam Questions"
 * (usually just the chapter cover). The chapter typically ends where the
 * answer key starts ("Answer Key" or "Answers to Multiple-Choice ...").
 */
function locateSampleChapter(pages) {
  // Cover + TOC reference the "Sample Exam Questions" chapter by name, so
  // a naive first-match picks up the cover page. We restrict the start
  // search to the BACK HALF of the PDF, where the chapter actually lives
  // in every CED we've inspected.
  const backHalf = Math.floor(pages.length * 0.45);
  let startPage = -1;
  let answerPage = -1;
  const startRe = /Sample\s+Exam\s+Questions|Section\s+I:\s*Multiple-?Choice|Sample\s+Multiple-?Choice\s+Questions/i;
  // "Section I: Multiple-Choice" is a strong signal the chapter body begins.
  const sectionStartRe = /Section\s+I:\s*Multiple-?Choice/i;
  const endRe = /Answer\s+Key|Answers\s+to\s+Multiple-?Choice|Multiple-?Choice\s+Answer\s+Key/i;

  for (let i = backHalf; i < pages.length; i++) {
    const p = pages[i];
    // Prefer a page where a "Section I: Multiple-Choice" heading AND a
    // numbered question "1." both appear together — that's the real start.
    if (startPage < 0 && sectionStartRe.test(p) && /\n\s*1\s*\.\s*\S/.test("\n" + p)) {
      startPage = i;
    }
    if (startPage < 0 && startRe.test(p)) startPage = i;
    if (startPage >= 0 && answerPage < 0 && endRe.test(p) && i > startPage) {
      answerPage = i;
      break;
    }
  }
  if (startPage < 0) return null;
  const endPage = answerPage >= 0 ? answerPage : Math.min(pages.length - 1, startPage + 50);
  return { startPage, endPage, answerPage };
}

/**
 * Strip obvious page-footer noise that appears on every CED page:
 *   "AP <Course> Course and Exam Description ExamInformation V.1|<pg>"
 *   "Return to Table of Contents"
 *   "© 202X College Board"
 */
function stripPageNoise(text) {
  let s = text;
  s = s.replace(/AP\s+[A-Za-z0-9:\s,\.-]+Course\s+and\s+Exam\s+Description[^\n]*\|\s*\d+/gi, " ");
  s = s.replace(/Return to Table of Contents/gi, " ");
  s = s.replace(/©\s*\d{4}\s*College Board[^\n]*/gi, " ");
  s = s.replace(/GO ON TO THE NEXT PAGE\.?/gi, " ");
  s = s.replace(/END OF SECTION [IVX]+/gi, " ");
  return s;
}

/**
 * Parse MCQs from the sample-questions chapter text. Returns
 *   [{ qNum, stem, options: { A, B, C, D } }].
 *
 * CED MCQs use:
 *   - Leading "N." (1., 2., ...) at the start of a question
 *   - Options on their own lines beginning "(A)", "(B)", "(C)", "(D)"
 *   - Sometimes "(E)" in older CEDs (Calculus/Stats pre-2019) -- we accept.
 *
 * We treat everything from the question number up to the first "(A)" as the
 * stem, and everything between option markers as that option's body.
 * "Questions X through Y refer to the following" is attached to the FIRST
 * question's stem as a shared stimulus.
 */
function parseMcqs(text) {
  const clean = stripPageNoise(text);
  const out = [];

  // Track shared stimuli so "Questions 5 through 7 refer to ..." gets attached.
  const sharedRe =
    /Questions?\s+(\d+)\s+(?:through|to|-|and)\s+(\d+)\s+refer\s+to\s+the\s+following[.:]?\s*([\s\S]*?)(?=\n\s*\d+\s*\.\s*\S|$)/gi;
  const sharedStims = [];
  let sm;
  while ((sm = sharedRe.exec(clean)) !== null) {
    const start = parseInt(sm[1], 10);
    const end = parseInt(sm[2], 10);
    sharedStims.push({ start, end, text: sm[3].trim() });
  }

  // Split at each "N." that starts a question. Questions can go up to ~60
  // in some CEDs but we cap at 80 defensively.
  const qRe = /(?:^|\n)\s*(\d{1,3})\s*\.\s*(\S[\s\S]*?)(?=\n\s*\d{1,3}\s*\.\s*\S|Section\s+II|$)/g;
  let m;
  while ((m = qRe.exec(clean)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 80) continue;
    const body = m[2];

    // Split body into stem + options on (A)/(B)/(C)/(D)[/E] markers.
    // Options run until the next option letter or end-of-body.
    const optRe = /\(([A-E])\)([\s\S]*?)(?=\([A-E]\)|$)/g;
    const opts = {};
    let optMatch;
    let firstOptIdx = -1;
    while ((optMatch = optRe.exec(body)) !== null) {
      if (firstOptIdx < 0) firstOptIdx = optMatch.index;
      const letter = optMatch[1];
      const val = cleanPrompt(optMatch[2]);
      if (val.length > 0 && val.length < 1200) opts[letter] = val;
    }
    if (!opts.A || !opts.B || !opts.C || !opts.D) continue;

    let stem = firstOptIdx > 0 ? body.slice(0, firstOptIdx) : body;
    stem = cleanPrompt(stem);
    if (stem.length < 15) continue;

    // Attach shared stimulus if this qNum falls inside a shared range.
    const stim = sharedStims.find((s) => qNum >= s.start && qNum <= s.end);
    const stimulus = stim ? cleanPrompt(stim.text) : null;

    out.push({ qNum, stem, options: opts, stimulus });
  }

  // De-dupe by qNum (keep longest stem).
  const byNum = new Map();
  for (const q of out) {
    const ex = byNum.get(q.qNum);
    if (!ex || q.stem.length > ex.stem.length) byNum.set(q.qNum, q);
  }
  return [...byNum.values()].sort((a, b) => a.qNum - b.qNum);
}

/**
 * Parse the answer-key table. The CED formats it as concatenated lines
 * "1B 2D 3B 4D ..." or row-per-question like "1  B  1.A  3.7.A".
 * We extract (qNum -> letter) pairs where letter is one of A-E.
 */
function parseAnswerKey(text) {
  const answers = new Map();
  const clean = stripPageNoise(text);

  // CED answer keys typically have one question per LINE, formatted like
  //   "1B1.A3.7.A3.7.A.2"
  //   "2D2.C5.4.B*5.4.B.2*"
  // i.e. the LINE starts with the question number immediately followed by
  // the answer letter. Parsing line-by-line is the most reliable approach
  // because other letters later on the line (skill codes like "1.A", LO
  // codes like "3.7.A.2") can confuse a global regex.
  const lines = clean.split(/\r?\n/);
  const lineRe = /^\s*(\d{1,3})\s*([A-E])(?:\b|[^A-Z])/;
  for (const line of lines) {
    const m = line.match(lineRe);
    if (!m) continue;
    const qNum = parseInt(m[1], 10);
    const letter = m[2];
    if (qNum < 1 || qNum > 80) continue;
    if (!answers.has(qNum)) answers.set(qNum, letter);
  }

  // Fallback: if line-based parsing caught nothing (some CEDs print the
  // key in a single long flow), try a pair-wise scan for runs like
  // "1B2D3B4D..." where digit+letter alternate.
  if (answers.size === 0) {
    const re = /(\d{1,3})\s*([A-E])/g;
    let m;
    while ((m = re.exec(clean)) !== null) {
      const qNum = parseInt(m[1], 10);
      const letter = m[2];
      if (qNum < 1 || qNum > 80) continue;
      if (!answers.has(qNum)) answers.set(qNum, letter);
    }
  }
  return answers;
}

async function ingestCourse(ced) {
  const { course, slug, name, urls } = ced;
  console.log(`\n==== ${name} (${course}) ====`);
  const destDir = ensureRawDir(`data/raw/ced`);
  const destPath = `${destDir}/${slug}-ced.pdf`;

  const urlUsed = await tryDownload(urls, destPath);
  if (!urlUsed) {
    console.log(`  SKIP ${course}: no CED URL worked`);
    return { course, mcqCount: 0, attempted: 0, parseRate: 0 };
  }

  let pages;
  try {
    const r = await extractPdfText(destPath);
    pages = r.pages;
    console.log(`  extracted ${pages.length} pages`);
  } catch (e) {
    console.log(`  SKIP ${course}: extract failed: ${e.message.slice(0, 80)}`);
    return { course, mcqCount: 0, attempted: 0, parseRate: 0 };
  }

  const loc = locateSampleChapter(pages);
  if (!loc) {
    console.log(`  SKIP ${course}: no Sample Exam Questions chapter found`);
    return { course, mcqCount: 0, attempted: 0, parseRate: 0 };
  }
  console.log(
    `  sample chapter pages ${loc.startPage + 1}..${loc.endPage + 1}` +
      (loc.answerPage >= 0 ? ` (answer key at page ${loc.answerPage + 1})` : "")
  );

  // Combine the sample-questions pages into one big text blob.
  const questionPages = pages.slice(loc.startPage, loc.endPage + 1);
  const questionText = questionPages.join("\n");
  let mcqs = parseMcqs(questionText);

  // Calculus AB+BC share a single CED. The MCQ section has "PART B (BC ONLY)"
  // and "PART B (AB OR BC)" markers. For the AB course, strip questions that
  // appear in the BC-only block. For BC, keep them all. We detect BC-only
  // questions by scanning pages in order: once we see "BC ONLY", all
  // subsequently-numbered questions on that page (and following pages until
  // a new PART marker) are BC-exclusive.
  if (course === "AP_CALCULUS_AB" || course === "AP_CALCULUS_BC") {
    const bcOnlyNums = new Set();
    let inBcOnly = false;
    // Only scan MCQ pages. The FRQ section begins when we see "Section II:
    // Free-Response" on a page that's close to the answer key (usually
    // 3-4 pages before). Earlier occurrences of that phrase are in the
    // intro paragraphs that describe the exam format. Use page proximity
    // to the answer key as the disambiguator.
    let mcqEndPage = loc.endPage;
    const answerRef = loc.answerPage >= 0 ? loc.answerPage : loc.endPage;
    for (let i = loc.startPage; i <= loc.endPage; i++) {
      const pg = pages[i] || "";
      // Real FRQ section heading is within ~6 pages of the answer key.
      if (
        /Section\s+II\s*:\s*Free-Response/i.test(pg) &&
        answerRef - i <= 6 &&
        i > loc.startPage + 2
      ) {
        mcqEndPage = i - 1;
        break;
      }
    }
    for (let i = loc.startPage; i <= mcqEndPage; i++) {
      const pg = pages[i] || "";
      // New PART marker resets the section flag. Check the STRONGER signal
      // first: "AB OR BC" always means include for both courses.
      if (/PART\s+[AB]\s*\(\s*AB\s+OR\s+BC\s*\)/i.test(pg)) inBcOnly = false;
      else if (/PART\s+[AB]\s*\(\s*AB\s+ONLY\s*\)/i.test(pg)) inBcOnly = false;
      else if (/PART\s+[AB]\s*\(\s*BC\s+ONLY\s*\)/i.test(pg)) inBcOnly = true;
      if (!inBcOnly) continue;
      const nums = [...pg.matchAll(/(?:^|\n)\s*(\d{1,3})\s*\.\s*\S/g)].map((m) =>
        parseInt(m[1], 10)
      );
      for (const n of nums) if (n >= 1 && n <= 80) bcOnlyNums.add(n);
    }
    if (bcOnlyNums.size > 0) {
      console.log(`  detected BC-only question numbers: ${[...bcOnlyNums].sort((a, b) => a - b).join(",")}`);
      if (course === "AP_CALCULUS_AB") {
        const before = mcqs.length;
        mcqs = mcqs.filter((q) => !bcOnlyNums.has(q.qNum));
        console.log(`  filtered ${before - mcqs.length} BC-only questions out of AB set`);
      }
    }
  }

  console.log(`  parsed ${mcqs.length} MCQ candidates`);

  // Answer key: take pages from answer-key page onward (up to +4 pages to
  // cover multi-page keys).
  let answers = new Map();
  if (loc.answerPage >= 0) {
    const keyPages = pages
      .slice(loc.answerPage, Math.min(pages.length, loc.answerPage + 4))
      .join("\n");
    answers = parseAnswerKey(keyPages);
    console.log(`  parsed ${answers.size} answer-key entries`);
  }

  // Idempotency: drop existing CED-sourced MCQs so re-runs replace them.
  const deleted = await prisma.officialSample.deleteMany({
    where: {
      course,
      questionType: "MCQ",
      sourceName: { contains: "CED Sample Questions" },
    },
  });
  if (deleted.count > 0) console.log(`  removed ${deleted.count} prior CED MCQ rows`);

  // Insert one OfficialSample row per parsed MCQ. Insertions are sequential;
  // Neon HTTP doesn't support transactions.
  let inserted = 0;
  let skippedNoAnswer = 0;
  for (const q of mcqs) {
    const ans = answers.get(q.qNum) || null;
    if (!ans) {
      skippedNoAnswer++;
      // Still store the question without a correct answer so RAG can see
      // the stem/options; downstream filters can exclude answerless rows.
    }
    const optsJson = { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D };
    if (q.options.E) optsJson.E = q.options.E;

    const data = {
      course,
      unit: null,
      year: null,
      sourceUrl: urlUsed,
      sourceName: `College Board AP Central \u2014 CED Sample Questions: ${name}`,
      questionText: q.stem,
      stimulus: q.stimulus || null,
      options: optsJson,
      correctAnswer: ans,
      explanation: null,
      questionType: "MCQ",
      licenseNotes: LICENSE,
    };
    try {
      await prisma.officialSample.create({ data });
      inserted++;
    } catch (e) {
      console.log(`    insert failed Q${q.qNum}: ${e.message.slice(0, 80)}`);
    }
  }

  console.log(
    `  inserted ${inserted} MCQs (${skippedNoAnswer} without answer key match)`
  );
  return {
    course,
    mcqCount: inserted,
    attempted: mcqs.length,
    parseRate: mcqs.length === 0 ? 0 : Math.round((inserted / mcqs.length) * 100),
    withAnswer: inserted - skippedNoAnswer,
  };
}

async function main() {
  const onlyArg = process.argv.find((a) => a.startsWith("--course="));
  const only = onlyArg ? onlyArg.split("=")[1] : null;

  console.log("\n==== Ingesting OFFICIAL AP MCQs from CED PDFs ====");
  if (only) console.log(`(filtered to ${only})`);

  const list = sortedCeds().filter((c) => !only || c.course === only);
  const results = [];
  for (const ced of list) {
    try {
      const r = await ingestCourse(ced);
      results.push(r);
    } catch (e) {
      console.log(`  FAIL ${ced.course}: ${e.message.slice(0, 120)}`);
      results.push({ course: ced.course, mcqCount: 0, attempted: 0, parseRate: 0 });
    }
  }

  console.log("\n\n==== INGESTION SUMMARY ====");
  console.log("course".padEnd(36) + "inserted".padStart(10) + "parsed".padStart(10) + "rate".padStart(8));
  let total = 0;
  for (const r of results) {
    console.log(
      r.course.padEnd(36) +
        String(r.mcqCount).padStart(10) +
        String(r.attempted).padStart(10) +
        `${r.parseRate}%`.padStart(8)
    );
    total += r.mcqCount;
  }
  console.log(`TOTAL`.padEnd(36) + String(total).padStart(10));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});

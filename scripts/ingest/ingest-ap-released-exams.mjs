// Ingest OFFICIAL AP "Public Practice Exam" MCQs from College Board PDFs.
//
// These are the multi-year full-exam PDFs that CB has historically published
// on secure-media.collegeboard.org / apcentral.collegeboard.org. Unlike the
// annual FRQ PDFs (which we already ingest), these contain Section I
// Multiple Choice with a proper answer key at the end.
//
// The "Released Exam" label is used loosely by CB across the years — some
// PDFs are titled "Practice Exam from the 2012 Administration", others are
// "Released Exam {YEAR}". Both are treated the same: full exams with MCQs
// and FRQs plus an answer key.
//
// Note: Most recent AP courses keep their MCQs locked inside AP Classroom.
// Only older / selected public practice-exam PDFs are accessible. For
// courses without a publicly available exam we skip and report 0 MCQs —
// that is expected and correct behavior.
//
// Parser strategy
// ---------------
// 1. Download PDF via pdf-utils.
// 2. Locate the answer key page (contains "Answer Key for AP ..." header).
// 3. Parse answer key into a Map<qNum, letter>. Two formats:
//      a) stacked pairs:  "1\nB\n2\nC\n..." (flows down a single column,
//         column-aware extraction gives us left-column then right-column).
//      b) row-per-Q:      "Question 1: B" ... "Question 18: A".
// 4. Locate MCQ pages between SECTION I "Directions:" and either
//    SECTION II, "STOP END OF" or the answer-key header.
// 5. For each page, try column-aware left then right extraction; fall back
//    to single-column "full" text for math/stats pages.
// 6. Parse questions via a regex that expects "N. <stem> (A) <a> (B) <b>
//    (C) <c> (D) <d> [(E) <e>]".
// 7. Only retain Qs whose number appears in the answer key.
// 8. Upsert each into OfficialSample (course, year, sourceUrl,
//    questionText-prefix) matching the same dedupe strategy used by
//    the SAT/ACT ingesters.
//
// Usage:
//   node scripts/ingest/ingest-ap-released-exams.mjs
//
// Budget: 45 min.  No commits, no deploys.

import { PrismaClient } from "@prisma/client";
import { extractPdfText, extractPdfTextColumns, downloadPdf, ensureRawDir } from "./pdf-utils.mjs";
import { LICENSE, cleanPrompt } from "./_shared.mjs";

const prisma = new PrismaClient();
const RAW_DIR = "data/raw/released-exams";

// ---- Source registry ---------------------------------------------------
// Each entry is a course with its candidate public-practice-exam URLs.
// When multiple URLs are listed we try each in order until one returns a
// live PDF (HTTP 200 + content-type application/pdf).
//
// label = human-readable { "Practice Exam 2012" | "Released Exam 1999" } etc.
// numOptions = number of answer options on the MCQ (4 or 5). Many modern
//   AP courses (Biology post-2013, World History post-2013, CSP) use 4
//   options (A-D). Older ones and psych/stats use 5 (A-E).
const SOURCES = [
  {
    course: "AP_PSYCHOLOGY",
    label: "Public Practice Exam 2012",
    year: 2012,
    numOptions: 5,
    candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-psychology-practice-exam-2012.pdf",
    ],
  },
  // 1999 Psych Released Exam is a scanned image PDF — 0 extractable text
  // without OCR. Skipped. URL:
  //   https://secure-media.collegeboard.org/apc/psychology-released-exam-1999.pdf
  {
    course: "AP_STATISTICS",
    label: "Public Practice Exam 2012",
    year: 2012,
    numOptions: 5,
    candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-statistics-practice-exam-2012.pdf",
      "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-statistics-practice-exam-2012.pdf",
    ],
  },
  // 1997 Statistics Released Exam is a scanned image PDF — 0 extractable
  // text without OCR. Skipped. URL:
  //   https://secure-media.collegeboard.org/apc/255123_1997_Statistics_RE.pdf
  {
    course: "AP_CALCULUS_AB",
    label: "Public Practice Exam 2012",
    year: 2012,
    numOptions: 5,
    candidates: [
      "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-calculus-ab-practice-exam-2012.pdf",
    ],
  },
  {
    course: "AP_WORLD_HISTORY",
    label: "Public Practice Exam 2013",
    year: 2013,
    numOptions: 4,
    candidates: [
      "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-world-history-practice-exam-2013.pdf",
    ],
  },
  {
    course: "AP_BIOLOGY",
    label: "Public Practice Exam 2013",
    year: 2013,
    numOptions: 4,
    candidates: [
      "https://secure-media.collegeboard.org/digitalServices/pdf/ap/ap-biology-practice-exam-2013.pdf",
    ],
  },
  {
    course: "AP_US_HISTORY",
    label: "CED Practice Exam",
    year: 2020,
    numOptions: 4,
    candidates: [
      "https://apcentral.collegeboard.org/media/pdf/ap-united-states-history-ced-practice-exam.pdf",
    ],
  },
  // AP Chemistry, AP Physics 1, and AP CSP do not have publicly-hosted
  // full Practice Exam PDFs on collegeboard.org domains (confirmed via
  // 2026-04-18 search). MCQs live in AP Classroom only.
  // Physics 1 has the 2020 "Sample Questions" PDF which is short and
  // covered elsewhere; not ingested here to avoid double-counting.
];

// ---- Download with candidate fallback ----------------------------------

async function tryDownloadCandidates(candidates, destDir) {
  // CB content-type headers are unreliable (some error HTML pages are
  // served with Content-Type: application/pdf). The only reliable check
  // is to fetch the bytes and verify the %PDF magic header.
  const fs = await import("node:fs");
  const path = await import("node:path");
  for (const url of candidates) {
    const filename = url.split("/").pop();
    const pdfPath = path.resolve(`${destDir}/${filename}`);
    // If a previously-good copy is already on disk and starts with %PDF,
    // reuse it (matches downloadPdf's caching behavior but with a magic check).
    try {
      if (fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 1024) {
        const head = fs.readFileSync(pdfPath, { encoding: null }).slice(0, 5);
        if (head.toString("utf8").startsWith("%PDF-")) {
          console.log(`    [cached] ${filename} (${(fs.statSync(pdfPath).size / 1024).toFixed(0)} KB)`);
          return { url, pdfPath };
        }
      }
    } catch {}
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
          Accept: "application/pdf,*/*",
        },
      });
      if (!res.ok) {
        console.log(`    miss ${filename}: HTTP ${res.status}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024 || !buf.slice(0, 5).toString("utf8").startsWith("%PDF-")) {
        console.log(
          `    miss ${filename}: not-a-pdf (${buf.length} bytes, leading: ${buf
            .slice(0, 16)
            .toString("utf8")
            .replace(/[\r\n]/g, " ")})`
        );
        continue;
      }
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
      fs.writeFileSync(pdfPath, buf);
      console.log(`    saved ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
      return { url, pdfPath };
    } catch (e) {
      console.log(`    err ${filename}: ${(e.message || "").slice(0, 100)}`);
    }
  }
  return null;
}

// ---- Answer-key parsing ------------------------------------------------

/**
 * Locate the page range that contains the Multiple-Choice Answer Key and
 * extract it as a Map<qNum, letter>. Returns empty map if not found.
 *
 * Supports both known layouts:
 *   A) stacked "Nletter" pairs (2012 Psychology/Stats/Calc AB style),
 *      where numbers flow down the left col then jump to right col.
 *   B) "Question N: letter" rows (2013 Biology / World History style).
 */
function parseAnswerKey(pagesFull, pagesColumns) {
  const map = new Map();

  // 1. Find the REAL answer-key page — not the table of contents. We
  //    scan ALL pages, score each by how many "answer-key-like" tokens
  //    it contains, and pick the highest scorer + any immediately
  //    following pages.
  const scored = pagesFull.map((text, i) => {
    let score = 0;
    // Strong signals
    if (/Answer\s+Key\s+for\s+AP/i.test(text)) score += 50;
    if (/Answer Key and Question Alignment/i.test(text)) score += 50;
    // Format A tokens: digit-then-letter pairs. We do NOT use \b on the
    // letter side because some keys place a skill word right after the
    // letter with no whitespace ("1CCausation"). Instead we require the
    // letter is NOT followed by a lowercase char (so it's either the end
    // of line OR the next token is a capitalized word like "Causation").
    const fmtA = text.match(/(?:^|[^A-Za-z0-9])(\d{1,3})\s*([A-E])(?![a-z])/g);
    if (fmtA) score += fmtA.length;
    // Format B tokens: "Question N: Letter"
    const fmtB = text.match(/Question\s*\d{1,3}\s*:\s*[A-E]/g);
    if (fmtB) score += fmtB.length * 2;
    // Weak negative: if this looks like a TOC or scoring guidelines,
    // downgrade it to avoid matching on the table of contents entry
    // "Multiple-Choice Answer Key ............ 39".
    if (/Contents\s*$/im.test(text) ||
        /Section II: Free-Response Questions/i.test(text) ||
        (/Scoring Worksheet/i.test(text) && /Exam Instructions/i.test(text))) {
      score -= 30;
    }
    return { i, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const keyStart = scored[0]?.score >= 10 ? scored[0].i : -1;
  if (keyStart < 0) return map;

  // 2. Try format B ("Question N: X") anywhere from keyStart onwards —
  //    it's unambiguous when present.
  const tail = pagesFull.slice(keyStart, keyStart + 4).join("\n");
  const fmtB = /Question\s*(\d{1,3})\s*:\s*([A-E])/g;
  let m;
  let matchesB = 0;
  while ((m = fmtB.exec(tail)) !== null) {
    const n = parseInt(m[1], 10);
    const letter = m[2];
    if (n >= 1 && n <= 200) {
      map.set(n, letter);
      matchesB++;
    }
  }
  if (matchesB >= 10) return map;

  // 3. Format A (stacked). Use column-aware extraction: walk through each
  //    answer-key-ish page (up to 4 after the header) and concatenate the
  //    left column then the right column.
  map.clear();
  const stackText = [];
  for (let i = keyStart; i < Math.min(pagesFull.length, keyStart + 4); i++) {
    const page = pagesColumns[i];
    if (!page) continue;
    stackText.push(page.left || "");
    stackText.push(page.right || "");
  }
  const blob = stackText.join("\n");

  // Grab each line; a line is valid if it's "N" then next-line is a single letter,
  // OR a single line of form "NLetter" or "N Letter".
  const lines = blob.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // (a) one-line pattern: "12 C" or "12C"  (letter is the whole rest)
    let inline = line.match(/^(\d{1,3})\s*([A-E])$/);
    if (inline) {
      const n = parseInt(inline[1], 10);
      if (n >= 1 && n <= 200) map.set(n, inline[2]);
      continue;
    }
    // (b) two-line pattern: number then letter on next line
    if (/^\d{1,3}$/.test(line) && i + 1 < lines.length && /^[A-E]$/.test(lines[i + 1])) {
      const n = parseInt(line, 10);
      if (n >= 1 && n <= 200) map.set(n, lines[i + 1]);
      i++; // skip letter line
      continue;
    }
    // (c) USH CED table-row pattern: "1CCausationCUL-1.02.2.I.B"
    //     Q# then letter then skill word (Causation, Contextualization, etc.)
    //     The letter is followed by a CAPITAL letter (uppercase word start).
    const row = line.match(/^(\d{1,3})([A-E])[A-Z][a-z]/);
    if (row) {
      const n = parseInt(row[1], 10);
      if (n >= 1 && n <= 200) map.set(n, row[2]);
      continue;
    }
  }
  return map;
}

// ---- MCQ parsing -------------------------------------------------------

/**
 * Parse the Section I MCQ region of the PDF. We take every page that is
 * part of Section I (between "SECTION I" directions page and either
 * SECTION II / answer-key header).
 *
 * For each page we try left column, right column, and full-page text as
 * parse candidates and merge results by question number.
 */
function extractQuestionsFromPage(pageText, numOptions) {
  // Strip page footer boilerplate before parsing.
  const text = pageText
    .replace(/Unauthorized copying or reuse of[\s\S]*?illegal\./gi, " ")
    .replace(/GO ON TO THE NEXT PAGE\.?/gi, " ")
    .replace(/SECTION\s+I[^\n]*\n/gi, " ")
    .replace(/-\s*\d+\s*-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Find all question-start positions: a digit sequence at word boundary,
  // followed by ". " and uppercase/letter.
  // We rely on the (A) ... marker cadence to segment options.
  const out = [];
  // Start marker: "(non-alnum)(N).(non-digit)" — N is question number,
  // followed by stem text and the (A) option marker. We allow N. to be
  // directly followed by a letter (no space) because some USH/CED pages
  // are laid out "4.Which of the following..." without spaces.
  const qRegex = /(?:^|[^A-Za-z0-9])(\d{1,3})\.(?=[A-Za-z"'\(\u201c\s])([\s\S]*?)(?=\s*\(A\))/g;
  let startMatch;
  const qStarts = [];
  while ((startMatch = qRegex.exec(text)) !== null) {
    const qn = parseInt(startMatch[1], 10);
    if (qn < 1 || qn > 200) continue;
    const stemStart = startMatch.index + startMatch[0].indexOf(startMatch[1]);
    const afterDotIdx = startMatch.index + startMatch[0].length;
    qStarts.push({ qn, stemStart, optsStart: afterDotIdx });
  }

  for (let i = 0; i < qStarts.length; i++) {
    const q = qStarts[i];
    const next = qStarts[i + 1];
    const endIdx = next ? next.stemStart : text.length;
    const block = text.slice(q.stemStart, endIdx);
    // Now split into stem (before first "(A)") and options segment.
    const aIdx = block.search(/\(A\)/);
    if (aIdx < 0) continue;
    const stem = block
      .slice(0, aIdx)
      .replace(/^\d{1,3}\.\s*/, "")
      .trim();
    const optsRaw = block.slice(aIdx);
    const opts = parseOptions(optsRaw, numOptions);
    if (!opts) continue;
    if (stem.length < 15) continue;
    out.push({ qNum: q.qn, stem, options: opts });
  }
  return out;
}

function parseOptions(raw, numOptions) {
  // Expect "(A) foo (B) bar (C) baz (D) qux [(E) quux]".
  const letters = numOptions === 4 ? ["A", "B", "C", "D"] : ["A", "B", "C", "D", "E"];
  const markers = [];
  for (const L of letters) {
    const re = new RegExp(`\\(${L}\\)\\s*`);
    const m = raw.match(re);
    if (!m) return null;
    markers.push({ L, idx: raw.indexOf(m[0]) + m[0].length, markerIdx: raw.indexOf(m[0]) });
  }
  // Strictly increasing markerIdx
  for (let i = 1; i < markers.length; i++) {
    if (markers[i].markerIdx <= markers[i - 1].markerIdx) return null;
  }
  const opts = {};
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].idx;
    const end = i + 1 < markers.length ? markers[i + 1].markerIdx : raw.length;
    opts[markers[i].L] = raw.slice(start, end).trim().replace(/\s+/g, " ");
  }
  // Sanity: each option should have at least 1 char
  for (const L of letters) {
    if (!opts[L] || opts[L].length < 1) return null;
  }
  return opts;
}

function findSectionOneRange(pagesFull) {
  // Start = first page containing an actual numbered MCQ ("1." + "(A)" + "(B)")
  //         AND some SECTION I marker appeared recently (last 4 pages).
  // End   = first page AFTER start that matches a Section-II or answer-key marker.
  // We NO LONGER end at "Part B" because some exams (Calc AB) keep MCQs
  // in Section I, Part B — only Section II signifies end of MCQs. USH Part B
  // is short-answer (FRQ-style) which IS end-of-MCQ, but USH Part B pages
  // consistently show "Section I, Part B" + no "(A)" options, and the
  // question-parsing regex will naturally drop them.
  let sectionIEnteredAt = -1;
  let start = -1;
  let end = pagesFull.length;
  for (let i = 0; i < pagesFull.length; i++) {
    const t = pagesFull[i];
    if (/Section\s+I\b/i.test(t) && !/Section\s+II\b/i.test(t)) {
      sectionIEnteredAt = i;
    }
    if (start < 0) {
      if (sectionIEnteredAt >= 0 && i - sectionIEnteredAt <= 6) {
        // Real MCQ start: page contains any numbered question (N. or N.X)
        // followed by (A) ... (B) option markers.
        // USH CED and some other PDFs omit the space after the dot
        // ("4.Which of the following..."), so we don't require \s after "\.".
        const m = t.match(/(^|[^0-9])\d{1,3}\.[A-Z\s][\s\S]{0,600}?\(A\)[\s\S]{0,300}?\(B\)/);
        if (m) {
          start = i;
          continue;
        }
      }
    } else {
      if (/SECTION\s+II\b/i.test(t) ||
          /Section\s+II[\s,:]/.test(t) ||
          /Multiple-Choice Answer Key/i.test(t) ||
          /Answer Key and Question Alignment/i.test(t) ||
          /Section I, Part B.*Short-Answer/i.test(t) ||
          /Part B: Short-Answer/i.test(t)) {
        end = i;
        break;
      }
    }
  }
  return { start, end };
}

// ---- Upsert ------------------------------------------------------------

async function upsertMcq(data) {
  const existing = await prisma.officialSample.findFirst({
    where: {
      course: data.course,
      year: data.year,
      sourceUrl: data.sourceUrl,
      questionType: "MCQ",
      questionText: { startsWith: data.questionText.slice(0, 60) },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.officialSample.update({ where: { id: existing.id }, data });
    return { created: 0, updated: 1 };
  }
  await prisma.officialSample.create({ data });
  return { created: 1, updated: 0 };
}

// ---- Per-source ingest -------------------------------------------------

async function ingestSource(source) {
  console.log(`\n--- ${source.course} / ${source.label} ---`);
  const dir = ensureRawDir(RAW_DIR);
  const dl = await tryDownloadCandidates(source.candidates, dir);
  if (!dl) {
    console.log("  SKIP: no candidate PDF was reachable");
    return { course: source.course, label: source.label, mcqs: 0, url: null };
  }
  const { url, pdfPath } = dl;

  // Extract both full and column representations once.
  const { pages: pagesFull } = await extractPdfText(pdfPath);
  const { pages: pagesColumns } = await extractPdfTextColumns(pdfPath);

  const key = parseAnswerKey(pagesFull, pagesColumns);
  console.log(`  answer-key entries: ${key.size}`);
  if (key.size === 0) {
    console.log("  SKIP: answer key not parseable — cannot ingest MCQs without keys");
    return { course: source.course, label: source.label, mcqs: 0, url };
  }

  const { start, end } = findSectionOneRange(pagesFull);
  if (start < 0) {
    console.log("  SKIP: could not find SECTION I Directions page");
    return { course: source.course, label: source.label, mcqs: 0, url };
  }
  console.log(`  Section I pages: ${start + 1}..${end}`);

  // Merge parse attempts per page: left col, right col, full.
  const qMap = new Map();
  for (let i = start; i < end; i++) {
    const col = pagesColumns[i];
    const candidates = [];
    if (col?.left) candidates.push(col.left);
    if (col?.right) candidates.push(col.right);
    if (pagesFull[i]) candidates.push(pagesFull[i]);
    for (const txt of candidates) {
      const qs = extractQuestionsFromPage(txt, source.numOptions);
      for (const q of qs) {
        // Only accept q if we have an answer key entry.
        if (!key.has(q.qNum)) continue;
        // Prefer longer / more-complete variants.
        const prev = qMap.get(q.qNum);
        const size = q.stem.length + Object.values(q.options).join("").length;
        const prevSize = prev
          ? prev.stem.length + Object.values(prev.options).join("").length
          : 0;
        if (!prev || size > prevSize) {
          qMap.set(q.qNum, q);
        }
      }
    }
  }

  console.log(`  parsed ${qMap.size} MCQs (of ${key.size} keyed)`);

  let created = 0;
  let updated = 0;
  for (const [qNum, q] of qMap) {
    const correct = key.get(qNum);
    const data = {
      course: source.course,
      unit: null,
      year: source.year,
      sourceUrl: url,
      sourceName: `College Board AP Central \u2014 ${source.label}: ${source.course.replace("AP_", "AP ").replace(/_/g, " ")}`,
      questionText: cleanPrompt(q.stem),
      stimulus: null,
      options: q.options,
      correctAnswer: correct,
      explanation: null,
      questionType: "MCQ",
      licenseNotes: LICENSE,
    };
    // Skip very short stems likely to be parse errors
    if (data.questionText.length < 20) continue;
    const r = await upsertMcq(data);
    created += r.created;
    updated += r.updated;
  }
  console.log(`  upsert: created=${created} updated=${updated}`);
  return {
    course: source.course,
    label: source.label,
    mcqs: qMap.size,
    created,
    updated,
    url,
  };
}

// ---- Main --------------------------------------------------------------

async function main() {
  console.log("\n==== Ingesting AP Released / Public Practice Exam MCQs ====\n");
  const results = [];
  for (const src of SOURCES) {
    try {
      const r = await ingestSource(src);
      results.push(r);
    } catch (e) {
      console.log(`  ERROR on ${src.course} ${src.label}: ${e.message}`);
      results.push({
        course: src.course,
        label: src.label,
        mcqs: 0,
        error: e.message,
      });
    }
  }

  console.log("\n==== SUMMARY ====");
  const byCourse = new Map();
  for (const r of results) {
    if (!byCourse.has(r.course)) byCourse.set(r.course, []);
    byCourse.get(r.course).push(r);
  }
  for (const [course, rs] of byCourse) {
    const totalMcq = rs.reduce((a, b) => a + (b.mcqs || 0), 0);
    console.log(`  ${course}: ${totalMcq} MCQs across ${rs.length} source(s)`);
    for (const r of rs) {
      console.log(
        `     \u2022 ${r.label}: mcqs=${r.mcqs} created=${r.created ?? "-"} updated=${r.updated ?? "-"} url=${r.url || "none"}`
      );
    }
  }

  await prisma.$disconnect();
  return results;
}

const isDirect =
  import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` ||
  import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main };

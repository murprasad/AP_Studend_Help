// Parse ACT Practice Test 2 (2025 official ACT release) into structured
// JSON corpus for stylometric calibration of the ACT generator.
//
// Source: data/raw/act/ACT-Test-Prep-Practice-Test-2.pdf
// Extract: data/official/ACT/act-practice-test-2-noLayout.txt
// Output: data/cb-corpus/act-practice-test-2.json
//
// Section boundaries detected by header text:
//   ENGLISH TEST 35 Minutes--50 Questions   → ACT_ENGLISH
//   MATHEMATICS TEST 50 Minutes--45 Q       → ACT_MATH
//   READING TEST                            → ACT_READING
//   SCIENCE TEST                            → ACT_SCIENCE

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const TXT = path.join(REPO, "data", "official", "ACT", "act-practice-test-2-noLayout.txt");
const OUT_DIR = path.join(REPO, "data", "cb-corpus");
mkdirSync(OUT_DIR, { recursive: true });
const OUT = path.join(OUT_DIR, "act-practice-test-2.json");

const raw = readFileSync(TXT, "utf8");

// Split by section
const sectionMarkers = [
  { re: /\bENGLISH TEST\b/i, section: "ACT_ENGLISH" },
  { re: /\bMATHEMATICS TEST\b/i, section: "ACT_MATH" },
  { re: /\bREADING TEST\b/i, section: "ACT_READING" },
  { re: /\bSCIENCE TEST\b/i, section: "ACT_SCIENCE" },
  { re: /\bPractice Writing Test Prompt\b/i, section: "END" },
];

const sectionRanges = [];
for (const m of sectionMarkers) {
  const match = raw.match(m.re);
  if (match) sectionRanges.push({ section: m.section, start: match.index });
}
sectionRanges.sort((a, b) => a.start - b.start);
for (let i = 0; i < sectionRanges.length; i++) {
  sectionRanges[i].end = sectionRanges[i + 1]?.start ?? raw.length;
}

console.log("\n═══ Parsing ACT Practice Test 2 ═══");
const modules = [];
for (const r of sectionRanges) {
  if (r.section === "END") continue;
  const sectionText = raw.slice(r.start, r.end);
  const questions = parseQuestions(sectionText, r.section);
  console.log(`  ${r.section}: ${questions.length} questions parsed`);
  modules.push({ section: r.section, module: 1, questions });
}

const out = {
  test: "ACT Practice Test 2 (2025 official ACT release)",
  source_pdf: "data/raw/act/ACT-Test-Prep-Practice-Test-2.pdf",
  source_url: "https://www.act.org",
  license: "ACT practice tests are made available for student preparation use",
  accessed: "2026-06-03",
  total_questions_parsed: modules.reduce((s, m) => s + m.questions.length, 0),
  modules,
};
writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
console.log(`\nWrote ${path.relative(REPO, OUT)} (${out.total_questions_parsed} total questions).`);

function parseQuestions(text, section) {
  // ACT format: question number followed by stem then options.
  // Options can be either:
  //   compressed inline: "A. 3 B. 4 C. 10 D. 19" all on one line
  //   multi-line: "A. 3\nB. 4\nC. 10\nD. 19" each on own line
  //
  // Strategy: split into Q blocks by leading "N. " pattern at line start
  // (where N is a digit), then within each block extract options.
  const blockRe = /(?:^|\n)\s*(\d{1,2})\.\s+(.+?)(?=\n\s*\d{1,2}\.\s+|\nGO ON|\n�|$)/gs;
  const questions = [];
  let qIdx = 0;
  let match;
  while ((match = blockRe.exec(text)) !== null) {
    const qNum = parseInt(match[1], 10);
    const block = match[2];
    // Extract options from block. Try compressed pattern first.
    const opts = extractOptions(block);
    if (Object.keys(opts).length < 4) continue;
    // Stem is the text BEFORE the first option label
    const firstOptIdx = findFirstOptionPos(block);
    const stem = firstOptIdx > 0 ? block.slice(0, firstOptIdx) : block;
    qIdx++;
    questions.push({
      n: qIdx,
      questionNumber: qNum,
      section,
      stem: cleanStem(stem),
      options: opts,
    });
  }
  return questions;
}

function findFirstOptionPos(block) {
  // First match of "[AF]." at start of token (preceded by whitespace or start)
  const m = block.match(/(?:^|\s)([AF])\.\s+/);
  return m ? m.index + (m[0].startsWith(" ") ? 1 : 0) : -1;
}

function extractOptions(block) {
  // ACT options use A-E (odd Q) or F-K (even Q).
  // Compressed inline: "A. text1 B. text2 C. text3 D. text4"
  // Try this first; the regex captures each option's text up to the next
  // option label or end of block.
  const map = {};
  // Determine letter set
  const useFGH = /(?:^|\s)F\.\s/.test(block);
  const letters = useFGH ? ["F", "G", "H", "J", "K"] : ["A", "B", "C", "D", "E"];
  for (let i = 0; i < letters.length; i++) {
    const L = letters[i];
    const next = letters[i + 1];
    // Match: "<L>. <text>" up to next letter or end. Permit short captures.
    const pattern = next
      ? new RegExp(`(?:^|\\s)${L}\\.\\s+([^\\n]*?)(?=\\s+${next}\\.\\s|$)`, "s")
      : new RegExp(`(?:^|\\s)${L}\\.\\s+([^\\n]+)`, "");
    const m = block.match(pattern);
    if (m) {
      map[L] = m[1].trim().replace(/\s+/g, " ").slice(0, 200);
    }
    if (Object.keys(map).length >= 5) break;
  }
  return map;
}

function cleanStem(s) {
  return s
    .replace(/Page \d+ of \d+.*$/g, "")
    .replace(/� \d{4} by ACT[^\n]*/g, "")
    .replace(/GO ON TO THE NEXT PAGE\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

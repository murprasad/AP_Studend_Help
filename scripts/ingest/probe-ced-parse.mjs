// Dry-run CED parser on a single course without touching the DB. Used for
// tuning the MCQ extraction heuristics before running the full orchestrator.
//
// Usage: node scripts/ingest/probe-ced-parse.mjs data/raw/ced/psychology-ced.pdf

import { extractPdfText } from "./pdf-utils.mjs";
import { cleanPrompt } from "./_shared.mjs";

function stripPageNoise(text) {
  let s = text;
  s = s.replace(/AP\s+[A-Za-z0-9:\s,\.-]+Course\s+and\s+Exam\s+Description[^\n]*\|\s*\d+/gi, " ");
  s = s.replace(/Return to Table of Contents/gi, " ");
  s = s.replace(/©\s*\d{4}\s*College Board[^\n]*/gi, " ");
  s = s.replace(/GO ON TO THE NEXT PAGE\.?/gi, " ");
  s = s.replace(/END OF SECTION [IVX]+/gi, " ");
  return s;
}

function locateSampleChapter(pages) {
  const backHalf = Math.floor(pages.length * 0.45);
  let startPage = -1;
  let answerPage = -1;
  const startRe = /Sample\s+Exam\s+Questions|Section\s+I:\s*Multiple-?Choice|Sample\s+Multiple-?Choice\s+Questions/i;
  const sectionStartRe = /Section\s+I:\s*Multiple-?Choice/i;
  const endRe = /Answer\s+Key|Answers\s+to\s+Multiple-?Choice|Multiple-?Choice\s+Answer\s+Key/i;
  for (let i = backHalf; i < pages.length; i++) {
    const p = pages[i];
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

function parseMcqs(text) {
  const clean = stripPageNoise(text);
  const out = [];
  const sharedRe =
    /Questions?\s+(\d+)\s+(?:through|to|-|and)\s+(\d+)\s+refer\s+to\s+the\s+following[.:]?\s*([\s\S]*?)(?=\n\s*\d+\s*\.\s*\S|$)/gi;
  const sharedStims = [];
  let sm;
  while ((sm = sharedRe.exec(clean)) !== null) {
    sharedStims.push({
      start: parseInt(sm[1], 10),
      end: parseInt(sm[2], 10),
      text: sm[3].trim(),
    });
  }

  const qRe = /(?:^|\n)\s*(\d{1,3})\s*\.\s*(\S[\s\S]*?)(?=\n\s*\d{1,3}\s*\.\s*\S|Section\s+II|$)/g;
  let m;
  while ((m = qRe.exec(clean)) !== null) {
    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 80) continue;
    const body = m[2];
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

    const stim = sharedStims.find((s) => qNum >= s.start && qNum <= s.end);
    out.push({ qNum, stem, options: opts, stimulus: stim ? cleanPrompt(stim.text) : null });
  }

  const byNum = new Map();
  for (const q of out) {
    const ex = byNum.get(q.qNum);
    if (!ex || q.stem.length > ex.stem.length) byNum.set(q.qNum, q);
  }
  return [...byNum.values()].sort((a, b) => a.qNum - b.qNum);
}

function parseAnswerKey(text) {
  const answers = new Map();
  const clean = stripPageNoise(text);
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

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node scripts/ingest/probe-ced-parse.mjs <pdf-path>");
    process.exit(1);
  }
  const { pages } = await extractPdfText(path);
  console.log(`pages: ${pages.length}`);
  const loc = locateSampleChapter(pages);
  if (!loc) {
    console.log("NO sample chapter located");
    return;
  }
  console.log(`sample chapter: pages ${loc.startPage + 1}..${loc.endPage + 1}`);
  if (loc.answerPage >= 0) console.log(`answer key page: ${loc.answerPage + 1}`);

  const chapterText = pages.slice(loc.startPage, loc.endPage + 1).join("\n");
  const mcqs = parseMcqs(chapterText);
  console.log(`MCQs parsed: ${mcqs.length}`);

  const keyText = loc.answerPage >= 0
    ? pages.slice(loc.answerPage, Math.min(pages.length, loc.answerPage + 4)).join("\n")
    : "";
  const ans = parseAnswerKey(keyText);
  console.log(`answer keys: ${ans.size}`);

  for (const q of mcqs.slice(0, 3)) {
    console.log(`\n--- Q${q.qNum} (ans=${ans.get(q.qNum) || "?"}) ---`);
    console.log("stem:", q.stem.slice(0, 160));
    if (q.stimulus) console.log("stim:", q.stimulus.slice(0, 80));
    console.log("  A:", (q.options.A || "").slice(0, 80));
    console.log("  B:", (q.options.B || "").slice(0, 80));
    console.log("  C:", (q.options.C || "").slice(0, 80));
    console.log("  D:", (q.options.D || "").slice(0, 80));
  }

  const matched = mcqs.filter((q) => ans.has(q.qNum)).length;
  console.log(`\nmatched w/ answer key: ${matched}/${mcqs.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

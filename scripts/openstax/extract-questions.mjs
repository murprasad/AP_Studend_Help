/**
 * scripts/openstax/extract-questions.mjs
 *
 * Phase 2 of OpenStax ingest — extracts end-of-chapter questions from
 * the downloaded textbook PDFs.
 *
 * OpenStax EOC sections vary by book. Common headers:
 *   "Multiple Choice"
 *   "Critical Thinking Questions"
 *   "Section Quiz"
 *   "Test Prep for AP Courses" (in AP-aligned books)
 *   "Conceptual Questions"
 *   "Numerical Problems"
 *
 * Strategy:
 *   1. pdf-parse → extract raw text per page
 *   2. Locate EOC headers
 *   3. For each EOC block, parse question pattern:
 *      "<num>. <stem text>"
 *      "  a. <option>"
 *      "  b. <option>"
 *      ... (or A./B./numbered list)
 *   4. Find the answers — sometimes in a separate "Answer Key" section
 *      at end of book, sometimes inline.
 *
 * NOTE: PDF extraction is messy — character order, ligatures, line
 * breaks vary. This script is best-effort + needs per-book tuning.
 *
 * Output: data/openstax/<slug>/extracted.json — array of:
 *   { stem, options: ["A) ...", "B) ...", ...], answer, sourcePage, sourceChapter }
 *
 * Usage:
 *   node scripts/openstax/extract-questions.mjs --book=biology-ap-courses
 *   node scripts/openstax/extract-questions.mjs --book=biology-ap-courses --dry --limit=5
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const BOOK = args.book;
const DRY = !!args.dry;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;

if (!BOOK) {
  console.error("usage: --book=<slug> [--dry] [--limit=N]");
  process.exit(1);
}

const dir = join(process.cwd(), "data", "openstax", BOOK);
const pdfPath = join(dir, "textbook.pdf");
if (!existsSync(pdfPath)) {
  console.error(`PDF not found: ${pdfPath}. Run download-textbooks.mjs first.`);
  process.exit(2);
}

console.log(`Extracting from ${pdfPath}...`);

// pdf-parse v2 uses a PDFParse class
const { PDFParse } = await import("pdf-parse");
const buf = readFileSync(pdfPath);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
const text = result.text;
console.log(`  pages: ${result.pages?.length ?? "?"}, total text: ${text.length} chars`);

// Per-book tuning: look for headers per book pattern
// Biology AP Courses uses "Test Prep for AP® Courses" sections per chapter
const EOC_HEADER_PATTERNS = [
  /Test Prep for AP\s*®?\s*Courses/i,
  /Multiple Choice/i,
  /Critical Thinking Questions/i,
  /Section Quiz/i,
  /Conceptual Questions/i,
  /Numerical Problems/i,
  /Section Summary/i,
  /Review Questions/i,
];

// Find candidate sections in the text. Use offsets so we can extract
// the text BETWEEN consecutive section headers as the question pool.
const sections = [];
for (const rx of EOC_HEADER_PATTERNS) {
  let m;
  const grx = new RegExp(rx.source, "gi");
  while ((m = grx.exec(text)) !== null) {
    sections.push({ index: m.index, header: m[0] });
  }
}
sections.sort((a, b) => a.index - b.index);
console.log(`  found ${sections.length} candidate EOC headers`);

// Question detection — find all question-START positions, then slice between them
const QUESTION_START_RX = /^\s*(\d{1,3})\.\s+/gm;
const OPTION_START_RX = /^\s*([a-eA-E])\.\s+/gm;

const extracted = [];
const sectionSpans = sections.map((s, i) => ({
  start: s.index,
  end: i + 1 < sections.length ? sections[i + 1].index : Math.min(s.index + 10000, text.length),
  header: s.header,
}));

for (const span of sectionSpans) {
  const block = text.slice(span.start, span.end);
  if (block.length < 100) continue;
  // Find question-start positions in this block
  const starts = [];
  let qm;
  const qrx = new RegExp(QUESTION_START_RX.source, "gm");
  while ((qm = qrx.exec(block)) !== null) {
    starts.push({ index: qm.index, headerEnd: qm.index + qm[0].length, num: qm[1] });
  }
  // For each question, body = from headerEnd to next question's index (or end of block)
  for (let i = 0; i < starts.length; i++) {
    const s = starts[i];
    const next = i + 1 < starts.length ? starts[i + 1].index : block.length;
    const body = block.slice(s.headerEnd, next);
    if (body.length < 50 || body.length > 5000) continue;
    // Extract options from body
    const optStarts = [];
    let om;
    const orx = new RegExp(OPTION_START_RX.source, "gm");
    while ((om = orx.exec(body)) !== null) {
      optStarts.push({ index: om.index, headerEnd: om.index + om[0].length, letter: om[1].toUpperCase() });
    }
    if (optStarts.length < 4 || optStarts.length > 5) continue;
    // Stem = body[0:firstOptionStart]; options[k] = body[opt[k].headerEnd:opt[k+1].index OR body.length]
    const stem = body.slice(0, optStarts[0].index).trim().replace(/\s+/g, " ");
    if (stem.length < 20 || stem.length > 800) continue;
    const options = [];
    for (let k = 0; k < optStarts.length; k++) {
      const optStart = optStarts[k].headerEnd;
      const optEnd = k + 1 < optStarts.length ? optStarts[k + 1].index : body.length;
      const txt = body.slice(optStart, optEnd).trim().replace(/\s+/g, " ");
      if (txt.length === 0 || txt.length > 400) { options.length = 0; break; }
      options.push({ letter: optStarts[k].letter, text: txt });
    }
    if (options.length < 4 || options.length > 5) continue;
    extracted.push({
      num: s.num,
      sectionHeader: span.header,
      stem,
      options: options.map((o) => `${o.letter}) ${o.text}`),
      sourcePage: null,
    });
    if (LIMIT && extracted.length >= LIMIT) break;
  }
  if (LIMIT && extracted.length >= LIMIT) break;
}

console.log(`  extracted ${extracted.length} candidate questions`);

if (DRY) {
  console.log("\nFirst 3 candidates:");
  for (const q of extracted.slice(0, 3)) {
    console.log(`\n[${q.sectionHeader}] Q${q.num}: ${q.stem.slice(0, 150)}...`);
    for (const o of q.options) console.log(`  ${o.slice(0, 100)}`);
  }
} else {
  const outPath = join(dir, "extracted.json");
  writeFileSync(outPath, JSON.stringify({
    book: BOOK,
    sourceLicense: "CC BY 4.0",
    extractedAt: new Date().toISOString(),
    count: extracted.length,
    questions: extracted,
  }, null, 2));
  console.log(`Wrote ${outPath}`);
}

console.log(`\nNote: extracted JSON has stems + options but NO answer keys yet.`);
console.log(`Next step: build extract-answer-keys.mjs (parses answer key sections)`);
console.log(`OR: run questions through validateMcqStructure + LLM judge to identify`);
console.log(`the correct answer post-hoc (less reliable but doable).`);

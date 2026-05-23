/**
 * Extract MCQs from CB SAT digital practice test PDFs.
 *
 * Input: data/raw/sat/sat-practice-test-{N}-digital.pdf + answers PDF
 * Output: data/sample-questions/SAT_MATH.json, SAT_READING_WRITING.json
 *         (appends/merges, doesn't overwrite)
 *
 * The digital SAT PDFs have a consistent structure:
 *   - Module 1 and Module 2 per section
 *   - Reading/Writing: 27 questions per module × 2 = 54
 *   - Math: 22 questions per module × 2 = 44
 *   - Each MCQ has 4 options (A, B, C, D)
 *
 * Heuristic parsing — regex over extracted text. Not perfect, but pulls
 * the majority. Sends each candidate through Haiku for cleanup +
 * categorization (math vs reading-writing).
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) { console.error("ANTHROPIC_API_KEY required"); process.exit(1); }

const PDFS = [
  { test: "sat-practice-test-4-digital.pdf", answers: "sat-practice-test-4-answers-digital.pdf", dir: "data/raw/sat" },
  { test: "sat-practice-test-5-digital.pdf", answers: "sat-practice-test-5-answers-digital.pdf", dir: "data/raw/sat" },
  { test: "sat-practice-test-6.pdf", answers: "sat-practice-test-6-answers.pdf", dir: "data/raw/sat-extra" },
];

async function pdfToText(path) {
  const buf = readFileSync(path);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const result = await parser.getText();
  return result.text;
}

// Use Haiku to extract structured MCQs from a chunk of PDF text
async function haikuExtractFromChunk(text, sectionHint, testNum) {
  const PROMPT = `You are extracting College Board SAT digital practice test multiple-choice questions from raw PDF text.

The text below is from a CB SAT practice test, section: ${sectionHint}.
Find every MCQ. Each has a question stem (or passage + question) and 4 options (A, B, C, D).

Return a JSON array. For each MCQ:
{
  "stem": "<question text, including any passage/context>",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "section": "math" or "reading_writing"
}

If text doesn't contain clear MCQs, return []. Skip directions/instructions.
Return ONLY the JSON array. No markdown fences.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: PROMPT,
        messages: [{ role: "user", content: text.slice(0, 12000) }],
      }),
    });
    if (!res.ok) return [];
    const j = await res.json();
    const out = j?.content?.[0]?.text || "[]";
    const m = out.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try { return JSON.parse(m[0]); } catch { return []; }
  } catch (e) { return []; }
}

// Use Haiku to extract correct answer key from answers PDF text
async function haikuExtractAnswerKey(text) {
  const PROMPT = `Extract the answer key from this CB SAT practice test answers PDF. Return JSON: {"reading_writing": ["A","B","C",...], "math": ["A","B","C",...]} where each array is the letters in question order. If the PDF lists modules separately, concatenate module 1 + module 2 per section. Return ONLY JSON.`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: PROMPT,
        messages: [{ role: "user", content: text.slice(0, 10000) }],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const out = j?.content?.[0]?.text || "{}";
    const m = out.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  } catch { return null; }
}

const allMath = [];
const allRW = [];

for (const { test, answers, dir } of PDFS) {
  console.log(`\n══ ${test} ══`);
  const testPath = `${dir}/${test}`;
  const answerPath = `${dir}/${answers}`;
  if (!existsSync(testPath)) { console.log("MISSING:", testPath); continue; }

  const testText = await pdfToText(testPath);
  console.log(`  test text: ${testText.length} chars`);

  // Chunk the text and ask Haiku to extract per chunk
  // SAT PDFs are large — split into ~10000-char chunks
  const CHUNK = 10000;
  const chunks = [];
  for (let i = 0; i < testText.length; i += CHUNK) chunks.push(testText.slice(i, i + CHUNK));
  console.log(`  chunks: ${chunks.length}`);

  for (let idx = 0; idx < chunks.length; idx++) {
    const c = chunks[idx];
    // Skip obviously non-question chunks
    if (!/\b[A-D]\)/.test(c) && !/\bChoose/i.test(c)) continue;
    const sectionHint = idx < chunks.length / 2 ? "reading_writing" : "math";
    const mcqs = await haikuExtractFromChunk(c, sectionHint, test);
    for (const q of mcqs) {
      if (q.section === "math" && q.options?.length === 4) allMath.push(q);
      else if (q.section === "reading_writing" && q.options?.length === 4) allRW.push(q);
    }
    console.log(`    chunk ${idx+1}/${chunks.length}: +${mcqs.length}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

console.log(`\n══ Extracted: ${allMath.length} Math + ${allRW.length} Reading/Writing ══`);

// Write to sample-questions dir
if (allMath.length > 0) {
  const path = "data/sample-questions/SAT_MATH.json";
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { source: "CB SAT digital practice tests", questions: [] };
  const combined = (existing.questions || []).concat(allMath.map((q, i) => ({ q: i + 1, stem: q.stem, options: q.options, correctAnswer: "?" })));
  writeFileSync(path, JSON.stringify({ ...existing, fetched: "2026-05-23", questions: combined }, null, 2));
  console.log(`Saved ${combined.length} total Math Qs → ${path}`);
}
if (allRW.length > 0) {
  const path = "data/sample-questions/SAT_READING_WRITING.json";
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { source: "CB SAT digital practice tests", questions: [] };
  const combined = (existing.questions || []).concat(allRW.map((q, i) => ({ q: i + 1, stem: q.stem, options: q.options, correctAnswer: "?" })));
  writeFileSync(path, JSON.stringify({ ...existing, fetched: "2026-05-23", questions: combined }, null, 2));
  console.log(`Saved ${combined.length} total R/W Qs → ${path}`);
}

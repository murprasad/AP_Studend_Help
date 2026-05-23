/**
 * Extract MCQs from ACT practice test PDFs.
 * Outputs to data/sample-questions/ACT_{ENGLISH,MATH,READING,SCIENCE}.json
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { PDFParse } from "pdf-parse";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) { console.error("ANTHROPIC_API_KEY required"); process.exit(1); }

const PDFS = [
  { path: "data/raw/act/ACT-Test-Prep-Practice-Test-2.pdf" },
  { path: "data/raw/act/Preparing-for-the-ACT.pdf" },
  { path: "data/raw/act-extra/act-test-2.pdf" },
];

async function pdfToText(path) {
  const buf = readFileSync(path);
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  const r = await parser.getText();
  return r.text;
}

async function haikuExtract(text, hint) {
  const PROMPT = `Extract every ACT MCQ from this text chunk.

Each ACT MCQ has:
- Section: english / math / reading / science
- Question stem (or passage + question)
- Options (English/Reading have A-D or F-J; Math has A-E or F-K)
- May have a correctAnswer indicator

Return JSON array. For each MCQ:
{
  "section": "english"|"math"|"reading"|"science",
  "stem": "...",
  "options": ["A) ...","B) ...","C) ...","D) ..."],
  "correctAnswer": "A" or null
}

ACT note: Math has 5 options (A-E for odd-numbered, F-K for even). English/Reading/Science use 4 options.
Skip directions/passages-only/section-headers. Only return MCQs that have a clear question + options.

Hint: this chunk is likely from section: ${hint}.
Return ONLY the JSON array, no markdown.`;

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
  } catch { return []; }
}

const buckets = { english: [], math: [], reading: [], science: [] };

for (const { path } of PDFS) {
  if (!existsSync(path)) { console.log("SKIP:", path); continue; }
  console.log(`\n══ ${path} ══`);
  const text = await pdfToText(path);
  console.log(`  text: ${text.length} chars`);
  const CHUNK = 9000;
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));
  for (let idx = 0; idx < chunks.length; idx++) {
    const c = chunks[idx];
    if (!/\b[A-J]\)/.test(c) && !/\bChoose|Which|What|How\b/i.test(c)) continue;
    // Crude section guess by position
    const pct = idx / chunks.length;
    const hint = pct < 0.25 ? "english" : pct < 0.5 ? "math" : pct < 0.75 ? "reading" : "science";
    const mcqs = await haikuExtract(c, hint);
    for (const q of mcqs) {
      const sec = q.section?.toLowerCase();
      if (buckets[sec] && q.options?.length >= 3) buckets[sec].push(q);
    }
    console.log(`    chunk ${idx+1}/${chunks.length}: +${mcqs.length}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

console.log(`\nExtracted: English ${buckets.english.length}, Math ${buckets.math.length}, Reading ${buckets.reading.length}, Science ${buckets.science.length}`);

mkdirSync("data/sample-questions", { recursive: true });
const mapping = {
  english: "ACT_ENGLISH",
  math: "ACT_MATH",
  reading: "ACT_READING",
  science: "ACT_SCIENCE",
};
for (const [sec, qs] of Object.entries(buckets)) {
  if (!qs.length) continue;
  const courseKey = mapping[sec];
  const path = `data/sample-questions/${courseKey}.json`;
  const data = {
    source: "ACT.org practice tests (PDF extract)",
    fetched: "2026-05-23",
    questions: qs.map((q, i) => ({ q: i + 1, stem: q.stem, options: q.options, correctAnswer: q.correctAnswer || "?" })),
  };
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(`Saved ${qs.length} → ${path}`);
}

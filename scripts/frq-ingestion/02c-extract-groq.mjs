#!/usr/bin/env node
/**
 * Stage 2c — extract FRQ + scoring guide PDFs with Groq (free fallback).
 *
 * When Gemini quota and Anthropic credits are both exhausted, this is
 * the always-free fallback. Trade-off: text-only — loses image content
 * (maps, charts, photographs). Acceptable for History/English Lit FRQs
 * which are text-heavy. Not ideal for Calc/Physics with diagrams.
 *
 * Pipeline:
 *   1. pdf-parse extracts text from FRQ + SG PDFs locally
 *   2. Concatenate text + send to Groq with extraction prompt
 *   3. Parse JSON, write to extracted-{filename}.json
 *
 * Usage:
 *   node scripts/frq-ingestion/02c-extract-groq.mjs                   # all
 *   node scripts/frq-ingestion/02c-extract-groq.mjs AP_WORLD_HISTORY  # one
 */

import "dotenv/config";
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const PDF_ROOT = join(ROOT, "data", "cb-frqs");

const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error("Missing GROQ_API_KEY in .env");
  process.exit(1);
}

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
// Groq free tier: 30 req/min for llama-3.3, ~6000 token output max.
// We target 1 PDF pair per minute to stay well under.
const PACE_MS = 2_000;

const SYSTEM_PROMPT = `You are extracting AP exam Free Response Questions (FRQs) and their official scoring guidelines into structured JSON.

The user provides:
  - FRQ text (raw text extracted from the exam booklet PDF)
  - Scoring guide text (raw text extracted from the rubric PDF)

Output STRICT JSON only — no commentary, no markdown fences. Schema:
{
  "year": <int>,
  "questions": [
    {
      "questionNumber": <int>,
      "type": "FRQ" | "SAQ" | "LEQ" | "DBQ" | "AAQ" | "EBQ" | "SHORT" | "LONG" | "MULTI_PART" | "INVESTIGATIVE",
      "promptText": "<exact student-facing prompt, all parts (a)(b)(c)>",
      "stimulus": "<full source documents, data tables, passages — empty string if none>",
      "totalPoints": <int>,
      "rubric": [{ "step": "<criterion>", "points": <int>, "keywords": ["..."] }],
      "sampleResponse": "<highest-scoring sample if shown>",
      "unit": "<course unit name if confidently identifiable, else empty string>"
    }
  ]
}

Rules:
- Preserve EXACT prompt wording — do NOT paraphrase
- Include FULL stimulus content
- rubric.points must sum to totalPoints
- type: AP US/World History uses SAQ/LEQ/DBQ; AP Bio/Chem/Physics use SHORT/LONG/MULTI_PART; AP Stats use SHORT/INVESTIGATIVE; AP Psych uses AAQ/EBQ`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function pdfToText(filepath) {
  const buf = await readFile(filepath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  return result.text;
}

async function callGroq(frqText, sgText, year, course) {
  const userMessage = `Course: ${course.replace(/^AP_/, "AP ").replace(/_/g, " ")}
Year: ${year}

=== FRQ EXAM TEXT ===
${frqText.slice(0, 30_000)}

=== SCORING GUIDE TEXT ===
${sgText.slice(0, 30_000)}

Extract into the JSON schema. Return JSON only.`;

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.1,
    max_tokens: 8192,
    response_format: { type: "json_object" },
  };

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJsonLenient(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function extractPair(course, year, setN, frqPath, sgPath, outPath) {
  if (await exists(outPath)) {
    return { course, year, setN, status: "cached" };
  }

  let frqText, sgText;
  try {
    [frqText, sgText] = await Promise.all([pdfToText(frqPath), pdfToText(sgPath)]);
  } catch (e) {
    return { course, year, setN, status: "pdf_parse_fail", error: e.message.slice(0, 200) };
  }

  let parsed;
  try {
    const text = await callGroq(frqText, sgText, year, course);
    parsed = parseJsonLenient(text);
  } catch (e) {
    return { course, year, setN, status: "extract_fail", error: e.message.slice(0, 200) };
  }

  if (!parsed.year) parsed.year = year;
  parsed._set = setN;
  parsed._sourceFrq = frqPath.split(/[\\/]/).pop();
  parsed._sourceSg = sgPath.split(/[\\/]/).pop();
  parsed._extractor = "groq";

  await writeFile(outPath, JSON.stringify(parsed, null, 2));
  return { course, year, setN, status: "extracted", questionCount: parsed.questions?.length ?? 0 };
}

async function findPairsFor(course) {
  const dir = join(PDF_ROOT, course);
  const files = await readdir(dir).catch(() => []);
  const pairs = [];

  // Pattern A: apYY-frq-{slug}-set-N.pdf (multi-set courses like World History)
  for (const f of files) {
    const m = f.match(/^ap(\d{2})-frq-[\w-]+-set-(\d+)\.pdf$/);
    if (!m) continue;
    const yy = m[1];
    const setN = m[2];
    const year = 2000 + Number(yy);
    const sgFile = files.find((x) => x.match(new RegExp(`^ap${yy}-sg-[\\w-]+-set-${setN}\\.pdf$`)));
    if (sgFile) {
      pairs.push({
        year, setN,
        frqPath: join(dir, f),
        sgPath: join(dir, sgFile),
        outPath: join(dir, `extracted-ap${yy}-set-${setN}.json`),
      });
    }
  }

  // Pattern B: apYY-frq-{slug}.pdf (single-set courses like Physics 2,
  // Precalculus, CS-A, Art History — no per-set split). Match if no
  // -set-N suffix AND a corresponding ap{yy}-sg-{slug}.pdf exists.
  for (const f of files) {
    const m = f.match(/^ap(\d{2})-frq-[\w-]+\.pdf$/);
    if (!m) continue;
    if (f.includes("-set-")) continue; // already handled by Pattern A
    const yy = m[1];
    const year = 2000 + Number(yy);
    const slug = f.replace(/^ap\d{2}-frq-/, "").replace(/\.pdf$/, "");
    const sgFile = `ap${yy}-sg-${slug}.pdf`;
    if (files.includes(sgFile)) {
      const setN = "main";
      const outName = `extracted-ap${yy}-${slug}.json`;
      pairs.push({
        year, setN,
        frqPath: join(dir, f),
        sgPath: join(dir, sgFile),
        outPath: join(dir, outName),
      });
    }
  }

  // Legacy naming.
  for (const f of files) {
    const m = f.match(/^(\d{4})-frq\.pdf$/);
    if (!m) continue;
    const year = Number(m[1]);
    const sgFile = `${year}-sg.pdf`;
    if (files.includes(sgFile)) {
      pairs.push({
        year, setN: "0",
        frqPath: join(dir, f),
        sgPath: join(dir, sgFile),
        outPath: join(dir, `${year}-extracted.json`),
      });
    }
  }
  return pairs;
}

async function main() {
  const onlyCourse = process.argv[2];
  const entries = await readdir(PDF_ROOT, { withFileTypes: true });
  const courses = entries
    .filter((e) => e.isDirectory() && e.name.startsWith("AP_") && (!onlyCourse || e.name === onlyCourse))
    .map((e) => e.name);

  console.log(`\n📄 Groq FRQ extractor (text-only fallback) — model: ${MODEL}\n`);
  console.log(`Scanning ${courses.length} course(s)...\n`);

  const summary = [];
  for (const course of courses) {
    const pairs = await findPairsFor(course);
    if (pairs.length === 0) {
      console.log(`  ${course}: no FRQ/SG pairs`);
      continue;
    }
    console.log(`\n${course}: ${pairs.length} pair(s)`);
    for (const p of pairs) {
      const result = await extractPair(course, p.year, p.setN, p.frqPath, p.sgPath, p.outPath);
      const tag = result.status === "extracted" ? "✓"
                : result.status === "cached" ? "⏭"
                : "✗";
      const detail = result.questionCount != null ? ` (${result.questionCount} Qs)`
                   : result.error ? ` — ${result.error}`
                   : "";
      console.log(`  ${tag} ${p.year} set ${p.setN}: ${result.status}${detail}`);
      summary.push(result);
      if (result.status === "extracted") await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  const extracted = summary.filter((s) => s.status === "extracted").length;
  const cached = summary.filter((s) => s.status === "cached").length;
  const failed = summary.filter((s) => s.status.endsWith("fail")).length;
  const totalQs = summary.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  console.log(`  Newly extracted: ${extracted} (${totalQs} questions)`);
  console.log(`  Cached:          ${cached}`);
  console.log(`  Failed:          ${failed}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });

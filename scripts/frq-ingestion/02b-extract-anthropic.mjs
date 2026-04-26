#!/usr/bin/env node
/**
 * Stage 2b — extract FRQ + scoring guide PDFs with Anthropic Claude.
 *
 * Drop-in replacement for 02-extract.mjs (Gemini) when the Gemini free
 * tier is exhausted. Reads pairs of PDFs from data/cb-frqs/{COURSE}/
 * matching the new CB naming pattern:
 *   ap{YY}-frq-{slug}-set-{N}.pdf      (the FRQ booklet)
 *   ap{YY}-sg-{slug}-set-{N}.pdf       (the scoring guide)
 *
 * Sends both PDFs to Claude in a single message with a structured
 * extraction prompt, parses the returned JSON, writes to
 *   {COURSE}/extracted-ap{YY}-set-{N}.json
 *
 * Idempotent — skips year/set pairs whose extracted JSON already exists.
 *
 * Usage:
 *   node scripts/frq-ingestion/02b-extract-anthropic.mjs                 # all courses, all year/set pairs
 *   node scripts/frq-ingestion/02b-extract-anthropic.mjs AP_WORLD_HISTORY # one course
 */

import "dotenv/config";
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const PDF_ROOT = join(ROOT, "data", "cb-frqs");

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env");
  process.exit(1);
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const SYSTEM_PROMPT = `You are a curriculum specialist extracting AP exam Free Response Questions (FRQs) and their official scoring guidelines into structured JSON.

You will receive TWO PDFs:
  1. The FRQ exam paper (questions only)
  2. The scoring guidelines (rubric + sample responses)

Output STRICT JSON only — no commentary, no markdown fences. Schema:
{
  "year": <int>,
  "questions": [
    {
      "questionNumber": <int>,
      "type": "FRQ" | "SAQ" | "LEQ" | "DBQ" | "AAQ" | "EBQ" | "SHORT" | "LONG" | "MULTI_PART" | "INVESTIGATIVE",
      "promptText": "<exact student-facing prompt, all parts (a)(b)(c) included>",
      "stimulus": "<source documents, data tables, graphs, passages — full text. Empty string if none>",
      "totalPoints": <int>,
      "rubric": [
        { "step": "<what part of answer>", "points": <int>, "keywords": ["..."] }
      ],
      "sampleResponse": "<highest-scoring sample from the scoring guide, if shown>",
      "unit": "<course unit name if confidently identifiable, else empty string>"
    }
  ]
}

Rules:
- Preserve EXACT prompt wording — do NOT paraphrase questions
- Include FULL stimulus content (transcribe primary source documents word-for-word)
- rubric.points must sum to totalPoints for each question
- sampleResponse: copy the highest-scoring sample from the scoring guide
- type: AP US/World History uses SAQ/LEQ/DBQ; AP Bio/Chem/Physics use SHORT/LONG/MULTI_PART; AP Stats use SHORT/INVESTIGATIVE; AP Psych uses AAQ/EBQ`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function callAnthropic(frqBuf, sgBuf, year, course) {
  const body = {
    model: MODEL,
    max_tokens: 32768,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: frqBuf.toString("base64") } },
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: sgBuf.toString("base64") } },
          { type: "text", text: `Extract the ${year} ${course.replace(/^AP_/, "AP ").replace(/_/g, " ")} FRQs + rubrics into the JSON schema. Return JSON only.` },
        ],
      },
    ],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return text;
}

function parseJsonLenient(text) {
  // Trim markdown fences if present.
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function extractPair(course, year, setN, frqPath, sgPath, outPath) {
  if (await exists(outPath)) {
    return { course, year, setN, status: "cached" };
  }
  const [frqBuf, sgBuf] = await Promise.all([readFile(frqPath), readFile(sgPath)]);

  let parsed;
  try {
    const text = await callAnthropic(frqBuf, sgBuf, year, course);
    parsed = parseJsonLenient(text);
  } catch (e) {
    return { course, year, setN, status: "extract_fail", error: e.message.slice(0, 200) };
  }

  // Tag the year + setN if Claude omitted year.
  if (!parsed.year) parsed.year = year;
  parsed._set = setN;
  parsed._sourceFrq = frqPath.split(/[\\/]/).pop();
  parsed._sourceSg = sgPath.split(/[\\/]/).pop();

  await writeFile(outPath, JSON.stringify(parsed, null, 2));
  return { course, year, setN, status: "extracted", questionCount: parsed.questions?.length ?? 0 };
}

async function findPairsFor(course) {
  const dir = join(PDF_ROOT, course);
  const files = await readdir(dir).catch(() => []);
  const pairs = [];

  // Match new pattern: ap{YY}-frq-{slug}-set-{N}.pdf
  for (const f of files) {
    const m = f.match(/^ap(\d{2})-frq-[\w-]+-set-(\d+)\.pdf$/);
    if (!m) continue;
    const yy = m[1];
    const setN = m[2];
    const year = 2000 + Number(yy);
    // Find matching SG file with same year + set.
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

  // Also handle legacy naming: {YYYY}-frq.pdf + {YYYY}-sg.pdf
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

  console.log(`\n📄 Anthropic FRQ extractor — model: ${MODEL}\n`);
  console.log(`Scanning ${courses.length} course(s)...\n`);

  const summary = [];
  for (const course of courses) {
    const pairs = await findPairsFor(course);
    if (pairs.length === 0) {
      console.log(`  ${course}: no FRQ/SG pairs found`);
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
      // Polite pacing — Anthropic rate limits per minute.
      if (result.status === "extracted") await sleep(2000);
    }
  }

  console.log(`\n── Summary ──`);
  const extracted = summary.filter((s) => s.status === "extracted").length;
  const cached = summary.filter((s) => s.status === "cached").length;
  const failed = summary.filter((s) => s.status === "extract_fail").length;
  const totalQs = summary.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  console.log(`  Newly extracted: ${extracted} (${totalQs} questions)`);
  console.log(`  Cached:          ${cached}`);
  console.log(`  Failed:          ${failed}`);
  if (failed > 0) {
    console.log(`\n  Failures:`);
    for (const s of summary.filter((s) => s.status === "extract_fail")) {
      console.log(`    ${s.course} ${s.year} set ${s.setN}: ${s.error}`);
    }
  }
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });

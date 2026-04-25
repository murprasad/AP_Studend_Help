#!/usr/bin/env node
/**
 * Stage 2 of the FRQ ingestion pipeline.
 *
 * For every {course}/{year}-frq.pdf + {course}/{year}-sg.pdf pair on disk
 * (downloaded by 01-download.mjs), uploads both PDFs to Gemini 1.5 Pro and
 * asks for a structured JSON extraction matching the FreeResponseQuestion
 * Prisma schema. Writes output to data/cb-frqs/{course}/{year}-extracted.json.
 *
 * Idempotent: skips year-pairs whose -extracted.json already exists.
 * Throttled: 1 Gemini request at a time, 2s pause between (free-tier safety).
 *
 * Why Gemini 1.5 Pro: handles PDFs natively (no separate OCR step), 1M
 * context window so we can pass FRQ + scoring guide together, structured
 * JSON mode is reliable.
 *
 * Run:
 *   node scripts/frq-ingestion/02-extract.mjs              # all courses
 *   node scripts/frq-ingestion/02-extract.mjs AP_BIOLOGY   # one course
 *
 * Next stage:
 *   node scripts/frq-ingestion/03-validate.mjs (rubric points sum, etc)
 *   node scripts/frq-ingestion/04-seed.mjs (write to FreeResponseQuestion)
 */

import "dotenv/config";
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const PDF_ROOT = join(ROOT, "data", "cb-frqs");
const API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error("Missing GOOGLE_AI_API_KEY in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Strict JSON schema — Gemini will produce output matching this shape.
// Mirrors the FreeResponseQuestion Prisma model + a `questions` array
// since each year contains multiple FRQs.
const SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    year: { type: SchemaType.INTEGER, description: "Exam year, e.g. 2023" },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionNumber: { type: SchemaType.INTEGER, description: "Q1, Q2, etc." },
          type: {
            type: SchemaType.STRING,
            description: "FRQ for general free response, SAQ for short answer, LEQ for long essay, DBQ for document-based question",
          },
          promptText: {
            type: SchemaType.STRING,
            description: "Full student-facing question prompt including all parts (a), (b), etc. Preserve the exact wording.",
          },
          stimulus: {
            type: SchemaType.STRING,
            description: "Any data tables, graphs, source documents, or contextual passages provided WITH the question. Empty string if none.",
          },
          totalPoints: { type: SchemaType.INTEGER, description: "Total points the question is worth per scoring guidelines" },
          rubric: {
            type: SchemaType.ARRAY,
            description: "Scoring rubric, each item being a scoring criterion. Sum of points must equal totalPoints.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                step: { type: SchemaType.STRING, description: "What part of the answer this criterion evaluates" },
                points: { type: SchemaType.INTEGER, description: "Points awarded if criterion met" },
                keywords: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: "Specific terms/phrases scorers look for",
                },
                note: { type: SchemaType.STRING, description: "Brief explanation of what earns full vs partial credit" },
              },
              required: ["step", "points", "note"],
            },
          },
          sampleResponse: {
            type: SchemaType.STRING,
            description: "A high-scoring student response or model answer from the scoring guidelines. Used to teach students what excellence looks like.",
          },
          unit: {
            type: SchemaType.STRING,
            description: "Best-fit unit from the AP course curriculum (e.g. 'BIO_1_CHEMISTRY' or 'CALC_AB_3_DERIVATIVES'). Empty string if spans multiple units.",
          },
          skill: {
            type: SchemaType.STRING,
            description: "Primary cognitive skill the question tests, drawn from the College Board CED skill categories. Use one of: 'Argue', 'Calculate', 'Justify', 'Design experiment', 'Interpret data', 'Apply concepts', 'Analyze sources', 'Construct argument'. Empty if unclear.",
          },
        },
        required: ["questionNumber", "type", "promptText", "totalPoints", "rubric"],
      },
    },
  },
  required: ["year", "questions"],
};

const SYSTEM_PROMPT = `You are extracting structured FRQ data from official College Board AP exam PDFs.

You will receive TWO PDFs:
  1. The FRQ exam paper (questions only)
  2. The scoring guidelines (rubric + sample student responses)

Your job is to merge them into clean structured JSON matching the schema.

Rules:
  - Preserve exact prompt wording — do NOT paraphrase questions
  - Include stimulus content (tables, graphs described in words, source documents)
  - rubric.points must sum to totalPoints for each question
  - sampleResponse: pull the highest-scoring sample from the scoring guidelines
  - unit: leave empty string if you can't confidently identify a single course unit
  - type: most are "FRQ", but US/World History uses "SAQ" / "LEQ" / "DBQ" — preserve original

Output strict JSON only. No commentary.`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function extractYear(course, year) {
  const courseDir = join(PDF_ROOT, course);
  const frqPath = join(courseDir, `${year}-frq.pdf`);
  const sgPath = join(courseDir, `${year}-sg.pdf`);
  const outPath = join(courseDir, `${year}-extracted.json`);

  if (await exists(outPath)) {
    return { course, year, status: "cached" };
  }
  if (!(await exists(frqPath)) || !(await exists(sgPath))) {
    return { course, year, status: "missing_pdfs" };
  }

  const [frqBuf, sgBuf] = await Promise.all([readFile(frqPath), readFile(sgPath)]);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0.1, // deterministic extraction
      maxOutputTokens: 8192,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: "application/pdf", data: frqBuf.toString("base64") } },
    { inlineData: { mimeType: "application/pdf", data: sgBuf.toString("base64") } },
    `Extract the ${year} ${course.replace(/^AP_/, "AP ").replace(/_/g, " ")} FRQs and rubrics into the schema.`,
  ]);

  const text = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { course, year, status: "parse_fail", raw: text.slice(0, 500) };
  }

  await writeFile(outPath, JSON.stringify(parsed, null, 2));
  return {
    course,
    year,
    status: "extracted",
    questionCount: parsed.questions?.length ?? 0,
  };
}

async function listCourses() {
  const onlyCourse = process.argv[2];
  if (onlyCourse) return [onlyCourse];
  const entries = await readdir(PDF_ROOT, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

async function listYearsFor(course) {
  const dir = join(PDF_ROOT, course);
  const files = await readdir(dir).catch(() => []);
  const years = new Set();
  for (const f of files) {
    const m = f.match(/^(\d{4})-frq\.pdf$/);
    if (m) years.add(Number(m[1]));
  }
  return Array.from(years).sort((a, b) => b - a); // newest first
}

async function main() {
  console.log(`\n🤖 FRQ ingestion stage 2 — Gemini 1.5 Pro extraction\n`);

  const courses = await listCourses();
  let totalExtracted = 0, totalCached = 0, totalFailed = 0, totalQs = 0;
  const failures = [];

  for (const course of courses) {
    const years = await listYearsFor(course);
    if (years.length === 0) {
      console.log(`(skip) ${course} — no PDFs downloaded`);
      continue;
    }
    console.log(`\n${course}:`);
    for (const year of years) {
      try {
        const result = await extractYear(course, year);
        const tag = result.status === "extracted" ? "✓" : result.status === "cached" ? "·" : "✗";
        const detail = result.status === "extracted"
          ? `${result.questionCount} Qs`
          : result.status === "cached" ? "cached"
          : `[${result.status}]${result.raw ? " " + result.raw.slice(0, 80) : ""}`;
        console.log(`  ${tag} ${year} ${detail}`);
        if (result.status === "extracted") {
          totalExtracted++;
          totalQs += result.questionCount;
          await sleep(2000); // throttle for free-tier
        } else if (result.status === "cached") {
          totalCached++;
        } else {
          totalFailed++;
          failures.push({ course, year, ...result });
        }
      } catch (e) {
        totalFailed++;
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`  ✗ ${year} [error] ${msg.slice(0, 100)}`);
        failures.push({ course, year, status: "exception", error: msg });
        await sleep(5000); // back off on errors
      }
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Extracted: ${totalExtracted} year-files (${totalQs} questions)`);
  console.log(`  Cached:    ${totalCached}`);
  console.log(`  Failed:    ${totalFailed}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

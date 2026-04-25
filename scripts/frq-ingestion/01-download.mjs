#!/usr/bin/env node
/**
 * Stage 1 of the FRQ ingestion pipeline.
 *
 * Downloads College Board released FRQ + scoring-guideline PDFs from the
 * curated sources.json into data/cb-frqs/{course}/{year}-{frq|sg}.pdf.
 *
 * Idempotent: skips files that already exist on disk. Deduplicates URL
 * fetches. Polite rate limit (1 req/sec) so we don't hammer apcentral.
 *
 * Run:
 *   node scripts/frq-ingestion/01-download.mjs              # all courses
 *   node scripts/frq-ingestion/01-download.mjs AP_BIOLOGY   # one course
 *
 * Output:
 *   data/cb-frqs/AP_BIOLOGY/2023-frq.pdf
 *   data/cb-frqs/AP_BIOLOGY/2023-sg.pdf
 *   ... etc per { course, year }
 *
 * Next stage:
 *   node scripts/frq-ingestion/02-extract.mjs   (LLM PDF → structured JSON)
 */

import { readFile, mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const SOURCES = JSON.parse(await readFile(join(__dirname, "sources.json"), "utf8"));
const OUT_DIR = join(ROOT, "data", "cb-frqs");

const onlyCourse = process.argv[2];
const RATE_LIMIT_MS = 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function downloadOne(url, destPath) {
  if (await exists(destPath)) {
    return { url, destPath, status: "cached", bytes: 0 };
  }
  const res = await fetch(url, {
    headers: {
      "User-Agent": "StudentNest-Educational-Ingestion/1.0 (contact@studentnest.ai)",
    },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    return { url, destPath, status: `http_${res.status}`, bytes: 0 };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, buf);
  return { url, destPath, status: "downloaded", bytes: buf.length };
}

async function main() {
  console.log(`\n📥 FRQ ingestion stage 1 — downloading PDFs to ${OUT_DIR}\n`);

  const courses = onlyCourse
    ? { [onlyCourse]: SOURCES[onlyCourse] }
    : Object.fromEntries(Object.entries(SOURCES).filter(([k]) => !k.startsWith("_")));

  let totalDownloaded = 0, totalCached = 0, totalFailed = 0, totalBytes = 0;
  const failures = [];

  for (const [course, info] of Object.entries(courses)) {
    if (!info?.exams || info.exams.length === 0) {
      console.log(`  (skip) ${course} — no exams configured (${info?._note ?? "empty list"})`);
      continue;
    }
    console.log(`\n${course} (${info.exams.length} exam years):`);
    for (const exam of info.exams) {
      for (const which of ["frq", "sg"]) {
        const url = exam[`${which}Url`];
        if (!url) continue;
        const destPath = join(OUT_DIR, course, `${exam.year}-${which}.pdf`);
        const result = await downloadOne(url, destPath);
        const tag = result.status === "downloaded" ? "✓" : result.status === "cached" ? "·" : "✗";
        const sizeKb = result.bytes ? `(${(result.bytes / 1024).toFixed(0)}KB)` : "";
        console.log(`  ${tag} ${exam.year} ${which} ${sizeKb} ${result.status === "downloaded" ? "" : `[${result.status}]`}`);
        if (result.status === "downloaded") { totalDownloaded++; totalBytes += result.bytes; }
        else if (result.status === "cached") totalCached++;
        else { totalFailed++; failures.push({ course, year: exam.year, which, url, status: result.status }); }
        if (result.status === "downloaded") await sleep(RATE_LIMIT_MS);
      }
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Downloaded: ${totalDownloaded} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  Cached:     ${totalCached}`);
  console.log(`  Failed:     ${totalFailed}`);
  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) console.log(`    ${f.course} ${f.year} ${f.which}: ${f.status}\n      ${f.url}`);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

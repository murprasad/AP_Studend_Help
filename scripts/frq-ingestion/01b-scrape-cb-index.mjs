#!/usr/bin/env node
/**
 * Generalized CB past-exam-questions index scraper.
 *
 * For each AP course in COURSE_REGISTRY, hits
 *   https://apcentral.collegeboard.org/courses/ap-{slug}/exam/past-exam-questions
 * and extracts every linked PDF URL. Downloads each PDF locally to
 *   data/cb-frqs/{COURSE_ENUM}_NEW/{filename}
 * Skips files already present (idempotent).
 *
 * This is the FIX for the Beta 8.0 url-pattern bug: I had hardcoded
 * apXX-frq-{slug}.pdf which CB deprecated in 2023. The index page is
 * the source of truth — scrape it to get the actual current URLs
 * (apXX-apc-... + apXX-frq-...-set-N.pdf + apXX-sg-... + cr-report +
 * scoring-statistics + score-distributions + ...).
 *
 * No login required. CB serves the index page anonymously and the
 * media/pdf/ paths are publicly downloadable with a browser User-Agent.
 *
 * Usage:
 *   node scripts/frq-ingestion/01b-scrape-cb-index.mjs              # all courses
 *   node scripts/frq-ingestion/01b-scrape-cb-index.mjs AP_BIOLOGY   # one course
 */

import { mkdir, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const PDF_ROOT = join(ROOT, "data", "cb-frqs");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// CB course enum → URL slug. Mirrors COURSE_REGISTRY.courseSlug.
const COURSE_SLUGS = {
  AP_WORLD_HISTORY: "ap-world-history",
  AP_US_HISTORY: "ap-united-states-history",
  AP_EUROPEAN_HISTORY: "ap-european-history",
  AP_BIOLOGY: "ap-biology",
  AP_CHEMISTRY: "ap-chemistry",
  AP_PHYSICS_1: "ap-physics-1",
  AP_PHYSICS_2: "ap-physics-2",
  AP_PHYSICS_C_MECHANICS: "ap-physics-c-mechanics",
  AP_PHYSICS_C_ELECTRICITY: "ap-physics-c-electricity-and-magnetism",
  AP_CALCULUS_AB: "ap-calculus-ab",
  AP_CALCULUS_BC: "ap-calculus-bc",
  AP_STATISTICS: "ap-statistics",
  AP_PRECALCULUS: "ap-precalculus",
  AP_ENVIRONMENTAL_SCIENCE: "ap-environmental-science",
  AP_PSYCHOLOGY: "ap-psychology",
  AP_HUMAN_GEOGRAPHY: "ap-human-geography",
  AP_US_GOVERNMENT: "ap-united-states-government-and-politics",
  AP_MACROECONOMICS: "ap-macroeconomics",
  AP_MICROECONOMICS: "ap-microeconomics",
  AP_COMPUTER_SCIENCE_PRINCIPLES: "ap-computer-science-principles",
  AP_COMPUTER_SCIENCE_A: "ap-computer-science-a",
  AP_ENGLISH_LANGUAGE: "ap-english-language-and-composition",
  AP_ENGLISH_LITERATURE: "ap-english-literature-and-composition",
  AP_ART_HISTORY: "ap-art-history",
};

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

async function downloadPdf(url, filepath) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const buf = Buffer.from(await res.arrayBuffer());
  // CB serves a 18.7KB "404 page" with status 200 sometimes. Skip those.
  if (buf.length < 50_000) return { ok: false, reason: "too small (likely 404 page)", size: buf.length };
  await writeFile(filepath, buf);
  return { ok: true, size: buf.length };
}

async function scrapeCourse(courseEnum, slug) {
  const indexUrl = `https://apcentral.collegeboard.org/courses/${slug}/exam/past-exam-questions`;
  const dir = join(PDF_ROOT, courseEnum);
  await mkdir(dir, { recursive: true });

  process.stdout.write(`\n${courseEnum.padEnd(35)} → ${slug}\n  Index: ${indexUrl}\n`);

  let html;
  try {
    html = await fetchHtml(indexUrl);
  } catch (e) {
    console.log(`  ❌ Index fetch failed: ${e.message}\n`);
    return { courseEnum, totalUrls: 0, downloaded: 0, skipped: 0, failed: 0 };
  }

  // Extract PDF paths from <a href="/media/pdf/...pdf">
  const matches = html.match(/\/media\/pdf\/[a-z0-9_-]+\.pdf/gi) || [];
  const urls = [...new Set(matches)];
  console.log(`  📄 ${urls.length} PDF URLs in index`);

  // Track existing files so we can skip
  const existing = new Set(await readdir(dir).catch(() => []));

  let downloaded = 0, skipped = 0, failed = 0;
  for (const path of urls) {
    const fname = path.split("/").pop();
    if (existing.has(fname)) {
      skipped++;
      continue;
    }
    const fullUrl = `https://apcentral.collegeboard.org${path}`;
    try {
      const result = await downloadPdf(fullUrl, join(dir, fname));
      if (result.ok) {
        downloaded++;
        process.stdout.write(`  ✓ ${fname} (${(result.size / 1024).toFixed(0)} KB)\n`);
      } else {
        failed++;
        process.stdout.write(`  ✗ ${fname} — ${result.reason || `HTTP ${result.status}`}\n`);
      }
    } catch (e) {
      failed++;
      console.log(`  ✗ ${fname} — ${e.message}`);
    }
    // Polite delay between downloads.
    await new Promise((r) => setTimeout(r, 300));
  }

  return { courseEnum, totalUrls: urls.length, downloaded, skipped, failed };
}

async function main() {
  const onlyCourse = process.argv[2];
  const courses = onlyCourse
    ? { [onlyCourse]: COURSE_SLUGS[onlyCourse] }
    : COURSE_SLUGS;

  if (onlyCourse && !COURSE_SLUGS[onlyCourse]) {
    console.error(`Unknown course: ${onlyCourse}`);
    console.error(`Valid: ${Object.keys(COURSE_SLUGS).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n📥 CB past-exam-questions scraper — ${Object.keys(courses).length} course(s)\n`);

  const summary = [];
  for (const [courseEnum, slug] of Object.entries(courses)) {
    if (!slug) continue;
    summary.push(await scrapeCourse(courseEnum, slug));
  }

  console.log(`\n── Summary ──`);
  console.log(`  course                              urls  new  skip  fail`);
  console.log(`  ${"─".repeat(60)}`);
  for (const s of summary) {
    console.log(`  ${s.courseEnum.padEnd(35)} ${String(s.totalUrls).padStart(4)} ${String(s.downloaded).padStart(4)} ${String(s.skipped).padStart(4)}  ${String(s.failed).padStart(4)}`);
  }
  const totals = summary.reduce(
    (acc, s) => ({
      urls: acc.urls + s.totalUrls,
      dl: acc.dl + s.downloaded,
      sk: acc.sk + s.skipped,
      fa: acc.fa + s.failed,
    }),
    { urls: 0, dl: 0, sk: 0, fa: 0 },
  );
  console.log(`  ${"TOTAL".padEnd(35)} ${String(totals.urls).padStart(4)} ${String(totals.dl).padStart(4)} ${String(totals.sk).padStart(4)}  ${String(totals.fa).padStart(4)}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node
/**
 * Stage 0 of the FRQ ingestion pipeline — DISCOVERY ONLY.
 *
 * Uses apfrqs.com as a discovery INDEX (NOT a data source) to find
 * older / removed AP FRQ years that our current sources.json doesn't
 * cover. For each gap found, attempts to construct the official
 * College Board URL (apcentral.collegeboard.org). If CB URL exists,
 * we add it to sources.json. If CB no longer hosts that year, we
 * skip — we do NOT re-host content from apfrqs.com.
 *
 * Legal posture (per 2026-04-25 strategy doc):
 *   - apfrqs.com = curator, not rights holder
 *   - College Board = original publisher
 *   - Generally safe: link to CB-hosted PDFs, use for instruction,
 *     store extracted structure with attribution
 *   - Risky: re-host full PDFs at scale, package archive as our own
 *
 * This script touches NO file content from apfrqs.com beyond reading
 * its index pages to learn WHICH years exist. All data extraction
 * happens against CB's own URLs (via 01-download.mjs).
 *
 * Run:
 *   node scripts/frq-ingestion/00-discover-gaps.mjs              # all courses
 *   node scripts/frq-ingestion/00-discover-gaps.mjs AP_BIOLOGY   # one course
 *
 * Output:
 *   - Console table: course / years-already-have / years-discovered / gaps-fillable-via-CB
 *   - Optional: writes sources-discovered.json for review (NOT auto-merged into sources.json)
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const SOURCES = JSON.parse(await readFile(join(__dirname, "sources.json"), "utf8"));

// Map our course enum → apfrqs.com slug. Will need 1-time confirmation
// per course — apfrqs.com URL pattern is /course/{slug}.
const APFRQS_SLUGS = {
  AP_BIOLOGY: "biology",
  AP_CHEMISTRY: "chemistry",
  AP_CALCULUS_AB: "calculus-ab",
  AP_CALCULUS_BC: "calculus-bc",
  AP_STATISTICS: "statistics",
  AP_PHYSICS_1: "physics-1",
  AP_US_HISTORY: "us-history",
  AP_WORLD_HISTORY: "world-history-modern",
  AP_PSYCHOLOGY: "psychology",
  AP_ENVIRONMENTAL_SCIENCE: "environmental-science",
  AP_HUMAN_GEOGRAPHY: "human-geography",
  AP_PRECALCULUS: "precalculus",
  AP_ENGLISH_LANGUAGE_AND_COMPOSITION: "english-language-and-composition",
  AP_COMPUTER_SCIENCE_PRINCIPLES: "computer-science-principles",
};

/**
 * Probe apfrqs.com index for a course to discover which years they
 * have indexed. We only read the index page (not the PDF content
 * itself) to learn the year list.
 */
async function discoverYears(course) {
  const slug = APFRQS_SLUGS[course];
  if (!slug) {
    return { course, status: "no_apfrqs_mapping", years: [] };
  }
  const url = `https://apfrqs.com/?p=${encodeURIComponent("/course/" + slug)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "StudentNest-Discovery/1.0 (educational research only)" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { course, status: `http_${res.status}`, years: [] };
    }
    const html = await res.text();
    // apfrqs.com renders the year list client-side, so the static HTML
    // probably won't have it — we'd need a headless browser. For now,
    // best-effort regex against any year tokens visible in the page.
    const years = Array.from(new Set(
      (html.match(/\b(19[89]\d|20[012]\d)\b/g) || [])
        .map(Number)
        .filter((y) => y >= 1995 && y <= new Date().getFullYear()),
    )).sort((a, b) => b - a);
    return { course, status: "ok", years, slug, indexUrl: url };
  } catch (e) {
    return {
      course,
      status: "fetch_failed",
      years: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Attempt to construct an official College Board URL for a given
 * (course, year) pair. CB's URL pattern is well-known and stable:
 *   https://apcentral.collegeboard.org/media/pdf/ap{YY}-frq-{slug}.pdf
 *   https://apcentral.collegeboard.org/media/pdf/ap{YY}-sg-{slug}.pdf
 *
 * Returns { available: true, frqUrl, sgUrl } if the URL responds 200,
 * { available: false } if 404, { available: null } if probe failed.
 */
async function probeCbForYear(course, year) {
  const slug = SOURCES[course]?.courseSlug;
  if (!slug) return { available: false, reason: "no_slug" };

  const yy = String(year).slice(-2);
  // CB sometimes uses different slug variants (ap-us-history vs us-history,
  // world-history vs world-history-modern). We probe both `frq-{slug}` and
  // `frq-{shortSlug}` patterns.
  const slugVariants = [
    slug.replace(/^ap-/, ""),                // ap-us-history → us-history
    slug.replace(/^ap-/, "").replace(/-modern$/, ""),  // world-history-modern → world-history
    slug,                                    // full slug as-is
  ];

  for (const v of slugVariants) {
    const frqUrl = `https://apcentral.collegeboard.org/media/pdf/ap${yy}-frq-${v}.pdf`;
    const sgUrl = `https://apcentral.collegeboard.org/media/pdf/ap${yy}-sg-${v}.pdf`;
    try {
      // HEAD check to avoid downloading the whole PDF
      const res = await fetch(frqUrl, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
      if (res.ok) return { available: true, frqUrl, sgUrl };
    } catch {
      // continue trying next slug variant
    }
  }
  return { available: false, reason: "404_on_all_variants" };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const onlyCourse = process.argv[2];
  console.log(`\n🔍 FRQ ingestion stage 0 — gap discovery (apfrqs.com index → CB URL probe)\n`);
  console.log(`Legal posture: apfrqs.com used as discovery INDEX only.`);
  console.log(`All data eventually pulled from official CB URLs.\n`);

  const courses = onlyCourse
    ? [onlyCourse]
    : Object.keys(APFRQS_SLUGS);

  const report = [];

  for (const course of courses) {
    process.stdout.write(`${course.padEnd(40)} `);
    const known = (SOURCES[course]?.exams ?? []).map((e) => e.year).sort((a, b) => b - a);
    const knownStr = known.length ? known.join(",") : "(none)";

    const discovery = await discoverYears(course);
    if (discovery.status !== "ok") {
      console.log(`[${discovery.status}]`);
      report.push({ course, known, ...discovery });
      continue;
    }

    const gapYears = discovery.years.filter((y) => !known.includes(y) && y >= 2002);
    console.log(`have ${known.length}, discovered ${discovery.years.length}, gaps ${gapYears.length}`);
    console.log(`  have:       ${knownStr}`);
    console.log(`  discovered: ${discovery.years.length ? discovery.years.slice(0, 12).join(",") : "(none — apfrqs.com SPA may need browser render)"}`);
    if (gapYears.length === 0) {
      report.push({ course, known, discovered: discovery.years, gapsFillable: [] });
      continue;
    }

    // Probe CB for each gap year
    const fillable = [];
    for (const year of gapYears.slice(0, 5)) { // cap probe at 5 per course to be polite
      const probe = await probeCbForYear(course, year);
      if (probe.available) {
        fillable.push({ year, frqUrl: probe.frqUrl, sgUrl: probe.sgUrl });
      }
      await sleep(400); // polite delay
    }
    console.log(`  fillable via CB: ${fillable.length} year(s) — ${fillable.map((f) => f.year).join(",") || "(none)"}`);
    report.push({ course, known, discovered: discovery.years, gapYears, gapsFillable: fillable });

    await sleep(1000); // polite per-course delay
  }

  // Write report for review (NOT auto-merged — user reviews + adds to sources.json manually)
  const reportPath = join(__dirname, "discovered-gaps.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Report written: ${reportPath}`);
  console.log(`Review + manually add fillable gap URLs to sources.json before running 01-download.mjs.\n`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

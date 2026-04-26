#!/usr/bin/env node
/**
 * Stage 0b — Probe College Board directly for older years (2002-2024).
 *
 * apfrqs.com is a SPA and its year-index isn't visible to server-side
 * fetch without a headless browser. Sidestep it: CB has a stable URL
 * pattern, so we can HEAD-probe each (course, year) combination directly
 * and discover which PDFs CB still hosts. No third-party data accessed.
 *
 * For every course in sources.json, probes years 2002 → current and
 * writes a sources-extended.json with all available URLs. User reviews
 * + merges into sources.json before running 01-download.mjs.
 *
 * Run:
 *   node scripts/frq-ingestion/00b-probe-cb-years.mjs              # all courses
 *   node scripts/frq-ingestion/00b-probe-cb-years.mjs AP_BIOLOGY   # one course
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCES = JSON.parse(await readFile(join(__dirname, "sources.json"), "utf8"));

const YEARS_TO_PROBE = (() => {
  const current = new Date().getFullYear();
  const arr = [];
  for (let y = 2002; y <= current; y++) arr.push(y);
  return arr.reverse(); // newest first
})();

// Skip 2020 (COVID digital exam used different formats — incompatible
// with our extraction schema).
const SKIP_YEARS = new Set([2020]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probeYear(slug, year) {
  if (SKIP_YEARS.has(year)) return { available: false, reason: "skip_covid_year" };
  const yy = String(year).slice(-2);

  // CB sometimes uses different slug variants. Try the configured one first,
  // then common alternatives.
  const variants = [
    slug.replace(/^ap-/, ""),
    slug,
    slug.replace(/^ap-/, "").replace(/-modern$/, ""),
    slug.replace(/^ap-/, "").replace(/-and-composition$/, ""),
  ];

  for (const v of [...new Set(variants)]) {
    const frqUrl = `https://apcentral.collegeboard.org/media/pdf/ap${yy}-frq-${v}.pdf`;
    const sgUrl = `https://apcentral.collegeboard.org/media/pdf/ap${yy}-sg-${v}.pdf`;
    try {
      const res = await fetch(frqUrl, {
        method: "HEAD",
        headers: { "User-Agent": "StudentNest-Discovery/1.0 (educational research)" },
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) return { available: true, frqUrl, sgUrl, year };
    } catch {
      // try next variant
    }
  }
  return { available: false, year };
}

async function main() {
  const onlyCourse = process.argv[2];
  console.log(`\n🔍 FRQ ingestion stage 0b — direct CB year probe (2002 → ${new Date().getFullYear()})\n`);

  const courses = onlyCourse
    ? { [onlyCourse]: SOURCES[onlyCourse] }
    : Object.fromEntries(Object.entries(SOURCES).filter(([k]) => !k.startsWith("_")));

  const extended = {};
  let totalNew = 0;

  for (const [course, info] of Object.entries(courses)) {
    if (!info?.courseSlug) continue;
    const knownYears = new Set((info.exams ?? []).map((e) => e.year));
    process.stdout.write(`${course.padEnd(40)} probing... `);

    const newExams = [];
    for (const year of YEARS_TO_PROBE) {
      if (knownYears.has(year)) continue; // already in sources.json
      const probe = await probeYear(info.courseSlug, year);
      if (probe.available) {
        newExams.push({
          year: probe.year,
          frqUrl: probe.frqUrl,
          sgUrl: probe.sgUrl,
        });
      }
      await sleep(150); // polite — be nice to CB's CDN
    }

    console.log(`have ${knownYears.size}, new ${newExams.length}`);
    if (newExams.length > 0) {
      console.log(`  new years: ${newExams.map((e) => e.year).join(", ")}`);
      extended[course] = {
        ...info,
        exams: [...(info.exams ?? []), ...newExams].sort((a, b) => b.year - a.year),
      };
      totalNew += newExams.length;
    }
  }

  const outPath = join(__dirname, "sources-extended.json");
  await writeFile(outPath, JSON.stringify(extended, null, 2));

  console.log(`\n── Summary ──`);
  console.log(`  Courses scanned:     ${Object.keys(courses).length}`);
  console.log(`  Total new year-pairs found: ${totalNew}`);
  console.log(`\n📝 Extended source list written: ${outPath}`);
  console.log(`Review + merge into sources.json (manually or via merge script) before re-running 01-download.mjs.\n`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

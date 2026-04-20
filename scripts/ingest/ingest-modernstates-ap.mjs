// Ingest Modern States publicly-accessible AP practice MCQs.
//
// --------------------------------------------------------------
// ACCESSIBILITY PROBE (2026-04-18)
// --------------------------------------------------------------
// Modern States (https://modernstates.org) is a 501(c)(3) College Board
// partner that offers free AP prep alongside their larger CLEP program.
// Marketing materials state "Modern States offers nearly all of the major
// AP courses" — however the publicly accessible surface tells a different
// story:
//
//   1. modernstates.org/course-sitemap.xml lists 33 CLEP courses and
//      ZERO AP courses. There is no AP catalog page on the marketing
//      domain. Confirmed by enumerating all <loc> entries in the sitemap.
//
//   2. learn.modernstates.org (D2L / Brightspace): every path redirects
//      to /d2l/login. AP course content and quizzes are login-gated.
//
//   3. courses.modernstates.org (legacy Open edX CDN, TLS cert EXPIRED):
//      Google-indexed asset paths all begin with
//      `ModernStatesX+<CLEP_SUBJECT>+2016-2018` — all CLEP, no AP course
//      IDs surface in `site:courses.modernstates.org` queries.
//
//   4. wp-json REST endpoints: HTTP 401.
//
// --------------------------------------------------------------
// CONCLUSION
// --------------------------------------------------------------
// There is NO publicly-accessible Modern States AP MCQ content as of
// 2026-04-18. StudentNest already has direct College Board AP ingests
// (ingest-ap-biology.mjs, ingest-ap-calculus-ab.mjs, etc.) pulling
// genuine AP FRQs from apcentral.collegeboard.org — Modern States offers
// no net-new MCQ pool we can harvest without credentials.
//
// This script therefore:
//
//   * Probes the public sitemap to enumerate Modern States' current
//     course catalog and prints any AP slugs it finds (so we'd catch
//     them if Modern States ever publishes AP pages).
//
//   * Attempts a handful of guessed AP asset URL patterns against the
//     legacy Open edX CDN (ModernStatesX+APBiology+..., +APPhysics1+...,
//     +APCalculusAB+..., etc.) and reports 404/401/200 per URL.
//
//   * If any MCQ-bearing PDFs are fetched, parses them with the same
//     fact-sheet heuristic used for CLEP and DEDUPLICATES against
//     OfficialSample by (course, questionText).
//
// When Modern States publishes AP content publicly, or the user supplies
// D2L credentials so we can harvest the real AP quiz pool, extend the
// MANIFEST and re-run. Dedup logic makes this fully idempotent.
//
// --------------------------------------------------------------
// Usage:
//   node scripts/ingest/ingest-modernstates-ap.mjs
//   node scripts/ingest/ingest-modernstates-ap.mjs --dry-run
//   node scripts/ingest/ingest-modernstates-ap.mjs --probe-only
//
// Flags:
//   --dry-run      Probe + parse, do not write to DB
//   --probe-only   Only probe URLs, don't even try to parse
//   --verbose      Print every duplicate skip
// --------------------------------------------------------------

import fs from "fs";
import path from "path";
import https from "https";
import { PrismaClient } from "@prisma/client";
import { extractPdfText, ensureRawDir } from "./pdf-utils.mjs";

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes("--dry-run");
const PROBE_ONLY = process.argv.includes("--probe-only");
const VERBOSE = process.argv.includes("--verbose");

const LICENSE =
  "Modern States nonprofit CLEP/AP practice content \u2014 used as AI " +
  "training/grounding reference under fair use. Not redistributed " +
  "verbatim to students. Stored for RAG retrieval during question " +
  "generation only. Modern States is a 501(c)(3) CB-partnered provider.";

const insecureAgent = new https.Agent({ rejectUnauthorized: false });

// --------------------------------------------------------------
// AP target courses — matches the StudentNest ApCourse enum.
// Each entry lists URL-slug guesses the script will probe against the
// legacy Open edX CDN. Not a single one is confirmed live; we probe and
// report. Fill in verified URLs when found.
// --------------------------------------------------------------

const AP_TARGETS = [
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    name: "AP Computer Science Principles",
    slugs: ["APCSP", "ComputerSciencePrinciples", "CSP"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_PHYSICS_1",
    name: "AP Physics 1",
    slugs: ["APPhysics1", "Physics1", "APPhys1"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_US_HISTORY",
    name: "AP US History",
    slugs: ["APUSHistory", "APUSH", "USHistoryAP"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_WORLD_HISTORY",
    name: "AP World History",
    slugs: ["APWorldHistory", "WorldHistoryAP"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_CALCULUS_AB",
    name: "AP Calculus AB",
    slugs: ["APCalculusAB", "CalculusAB", "APCalcAB"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_BIOLOGY",
    name: "AP Biology",
    slugs: ["APBiology", "BiologyAP"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_CHEMISTRY",
    name: "AP Chemistry",
    slugs: ["APChemistry", "ChemistryAP"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_STATISTICS",
    name: "AP Statistics",
    slugs: ["APStatistics", "StatisticsAP", "APStats"],
    years: ["2024", "2023", "2022", "2021"],
  },
  {
    course: "AP_PSYCHOLOGY",
    name: "AP Psychology",
    slugs: ["APPsychology", "PsychologyAP", "APPsych"],
    years: ["2024", "2023", "2022", "2021"],
  },
];

// Generic asset-URL shape Modern States uses on their legacy CDN. We don't
// know the content hashes in advance, so we can't produce a full URL — we
// can only probe "about" paths and syllabus paths to test whether the
// course ID exists at all.
function candidateCourseAboutUrls(slug, year) {
  return [
    `https://courses.modernstates.org/courses/course-v1:ModernStatesX+${slug}+${year}/about`,
    `https://courses.modernstates.org/courses/course-v1:ModernStatesX+${slug}+${year}_T1/about`,
  ];
}

// --------------------------------------------------------------
// Fetch helper (handles expired TLS cert).
// --------------------------------------------------------------

function headInsecure(url) {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        method: "GET",
        agent: insecureAgent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          Accept: "*/*",
        },
      },
      (res) => {
        const status = res.statusCode;
        const loc = res.headers.location || "";
        res.resume(); // consume body, don't buffer
        resolve({ status, location: loc });
      }
    );
    req.on("error", () => resolve({ status: 0, location: "" }));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ status: 0, location: "timeout" });
    });
    req.end();
  });
}

async function fetchInsecure(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        agent: insecureAgent,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          Accept: "application/pdf,*/*",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchInsecure(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on("error", reject);
    req.setTimeout(60000, () => req.destroy(new Error("timeout")));
  });
}

// --------------------------------------------------------------
// Discover AP courses on the public sitemap (should currently return 0).
// --------------------------------------------------------------

async function discoverApCatalog() {
  const res = await fetch("https://modernstates.org/course-sitemap.xml", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/xml,text/xml,*/*",
    },
  });
  if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const slugs = urls
    .filter((u) => u.includes("/course/") && !u.endsWith("/course/"))
    .map((u) => u.replace(/.*\/course\//, "").replace(/\/$/, ""));
  const apLike = slugs.filter((s) => /^(ap-|advanced-placement)/i.test(s));
  return { total: slugs.length, apLike };
}

// --------------------------------------------------------------
// Probe a single course: try each slug×year "about" URL. If any returns
// 200 (i.e. the course exists on the CDN) or a non-login redirect, record
// the URL as a lead for manual follow-up.
// --------------------------------------------------------------

async function probeCourse(target) {
  const hits = [];
  for (const slug of target.slugs) {
    for (const year of target.years) {
      for (const url of candidateCourseAboutUrls(slug, year)) {
        const { status, location } = await headInsecure(url);
        if (status === 200) hits.push({ url, status, location });
        else if (VERBOSE)
          console.log(`    ${status} ${url.split("?")[0]}`);
      }
    }
  }
  return hits;
}

// --------------------------------------------------------------
// Fact-sheet MCQ parser (shared heuristic with CLEP script — mirrored
// locally here to keep StudentNest ingest scripts self-contained).
// --------------------------------------------------------------

function parseFactSheetMcqs(fullText) {
  const keyMatch = fullText.match(
    /Answers\s+to\s+Sample\s+Questions[:\s]+([0-9A-E\-;,\s\u2013]+)/i
  );
  const answerKey = {};
  if (keyMatch) {
    const entries = keyMatch[1].split(/[;,]/);
    for (const e of entries) {
      const m = e.match(/(\d+)\s*[\-\u2013]\s*([A-E])/);
      if (m) answerKey[m[1]] = m[2];
    }
  }
  const section = fullText
    .split(/Sample\s+Questions?/i)
    .slice(1)
    .join("\n");
  if (!section) return [];

  const items = [];
  const qRegex = /(^|\n)\s*(\d+)\.\s+([\s\S]*?)(?=\n\s*\d+\.\s|Answers\s+to\s+Sample\s+Questions|$)/g;
  let m;
  while ((m = qRegex.exec(section)) !== null) {
    const qNum = m[2];
    const block = m[3].trim();
    const opts = [];
    const optRe = /(?:^|\n)\s*([A-E])[.)]\s+([^\n]+)/g;
    let om;
    while ((om = optRe.exec(block)) !== null) {
      opts.push({ label: om[1], text: om[2].trim() });
    }
    if (opts.length < 2) continue;
    const stemEnd = block.search(/(?:^|\n)\s*A[.)]\s+/);
    const stem = (stemEnd > 0 ? block.slice(0, stemEnd) : block).trim().replace(/\s+/g, " ");
    if (stem.length < 10) continue;
    items.push({ qNum, stem, options: opts, correctAnswer: answerKey[qNum] || null });
  }
  return items;
}

async function downloadApPdf(url, destPath) {
  const abs = path.resolve(destPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && fs.statSync(abs).size > 0) {
    console.log(`  [cached] ${path.basename(abs)}`);
    return abs;
  }
  console.log(`  downloading ${url} ...`);
  const buf = await fetchInsecure(url);
  fs.writeFileSync(abs, buf);
  console.log(`  saved ${path.basename(abs)} (${(buf.length / 1024).toFixed(0)} KB)`);
  return abs;
}

// --------------------------------------------------------------
// Main
// --------------------------------------------------------------

async function main() {
  console.log("\n==== MODERN STATES AP INGEST ====");
  console.log(`mode: ${DRY_RUN ? "DRY RUN" : PROBE_ONLY ? "PROBE ONLY" : "WRITE"}\n`);

  // Step 1: check the public catalog for any AP entries.
  try {
    const cat = await discoverApCatalog();
    console.log(
      `Modern States public catalog: ${cat.total} courses; AP-like slugs: ${cat.apLike.length}`
    );
    if (cat.apLike.length) {
      console.log("  Found AP-shaped slugs (update AP_TARGETS accordingly):");
      for (const s of cat.apLike) console.log(`    ${s}`);
    } else {
      console.log(
        "  Zero AP courses in the public catalog — Modern States has not " +
          "published AP pages on the marketing domain."
      );
    }
  } catch (err) {
    console.log(`catalog discovery failed: ${err.message}`);
  }

  // Step 2: probe legacy CDN for AP course IDs.
  console.log("\n-- Probing legacy CDN for AP course IDs --");
  const allHits = [];
  for (const target of AP_TARGETS) {
    process.stdout.write(`  ${target.course.padEnd(36)} `);
    const hits = await probeCourse(target);
    if (hits.length === 0) {
      console.log("no public AP course found");
    } else {
      console.log(`FOUND ${hits.length} url(s)`);
      for (const h of hits) console.log(`    ${h.status} ${h.url}`);
      allHits.push({ target, hits });
    }
  }

  if (PROBE_ONLY) {
    console.log("\nprobe-only mode — exiting.");
    await prisma.$disconnect();
    return;
  }

  if (allHits.length === 0) {
    console.log(
      "\nNo public AP content discovered. Consistent with the 2026-04-18 " +
        "probe — Modern States AP lives entirely behind the D2L login. " +
        "Nothing to ingest."
    );
    await prisma.$disconnect();
    return;
  }

  // Step 3: for any hits, follow up — try to fetch any fact-sheet-shaped
  // PDFs linked from the about page and parse them.
  const dataDir = ensureRawDir("data/raw/modernstates-ap");
  const report = [];

  for (const { target, hits } of allHits) {
    console.log(`\n-- ${target.course} --`);
    for (const h of hits) {
      try {
        const html = (await fetchInsecure(h.url)).toString("utf8");
        const pdfUrls = [
          ...html.matchAll(/https:\/\/courses\.modernstates\.org\/[^"'\s<>]+\.pdf/g),
        ].map((m) => m[0]);
        const uniq = [...new Set(pdfUrls)];
        console.log(`  about page ${h.url} — ${uniq.length} pdf link(s)`);
        for (const pdfUrl of uniq) {
          const safe = `${target.course.toLowerCase()}_${path.basename(pdfUrl).replace(/[^a-z0-9.]+/gi, "_")}`;
          const pdfPath = await downloadApPdf(pdfUrl, path.join(dataDir, safe));
          const { fullText } = await extractPdfText(pdfPath);
          const mcqs = parseFactSheetMcqs(fullText);
          console.log(`    parsed ${mcqs.length} MCQ candidate(s) from ${path.basename(pdfUrl)}`);

          let dup = 0;
          let inserted = 0;
          for (const q of mcqs) {
            if (!q.correctAnswer) continue;
            const existing = await prisma.officialSample.findFirst({
              where: { course: target.course, questionText: q.stem },
            });
            if (existing) {
              dup++;
              continue;
            }
            const data = {
              course: target.course,
              unit: null,
              year: null,
              sourceUrl: pdfUrl,
              sourceName: `Modern States (CB-Partnered) \u2014 ${target.name}`,
              questionText: q.stem,
              stimulus: null,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: null,
              questionType: "MCQ",
              licenseNotes: LICENSE,
            };
            if (DRY_RUN) {
              console.log(`      [dry-run] q${q.qNum}: ${q.stem.slice(0, 60)}...`);
            } else {
              await prisma.officialSample.create({ data });
            }
            inserted++;
          }
          report.push({
            course: target.course,
            pdfUrl,
            parsed: mcqs.length,
            dup,
            inserted,
          });
        }
      } catch (err) {
        console.log(`  ERROR on ${h.url}: ${err.message}`);
      }
    }
  }

  // -----------------------
  // Summary
  // -----------------------
  const t = (k) => report.reduce((a, r) => a + (r[k] || 0), 0);
  console.log("\n==== SUMMARY ====");
  console.log(`AP targets probed:       ${AP_TARGETS.length}`);
  console.log(`AP courses with hits:    ${allHits.length}`);
  console.log(`PDFs parsed:             ${report.length}`);
  console.log(`MCQs parsed:             ${t("parsed")}`);
  console.log(`Duplicates (vs CB):      ${t("dup")}`);
  console.log(`Net-new inserted:        ${t("inserted")}`);

  if (report.length) {
    console.log("\nPer PDF:");
    for (const r of report) {
      console.log(
        `  ${r.course.padEnd(36)} parsed=${r.parsed} dup=${r.dup} new=${r.inserted}`
      );
      console.log(`    ${r.pdfUrl}`);
    }
  }

  console.log(
    "\nNote: Modern States AP content is currently login-gated in D2L. " +
      "StudentNest's primary AP data source remains apcentral.collegeboard.org " +
      "via the ingest-ap-*.mjs family."
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});

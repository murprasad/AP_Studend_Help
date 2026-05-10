/**
 * scripts/openstax/download-textbooks.mjs
 *
 * Phase 1 of the OpenStax ingest pipeline (per docs/openstax-ingest-plan-2026-05-08.md
 * + project_feedback_loop_standard_spec.md). Downloads OpenStax textbook
 * PDFs that map to AP/SAT/ACT courses we serve.
 *
 * License: All OpenStax textbooks are CC BY 4.0 — commercial use OK with
 * attribution. No copyright issue with hosting/serving derived questions.
 *
 * Usage:
 *   node scripts/openstax/download-textbooks.mjs              # download all
 *   node scripts/openstax/download-textbooks.mjs --book=biology-ap-courses
 *   node scripts/openstax/download-textbooks.mjs --dry        # list only
 *
 * Output: data/openstax/<slug>/textbook.pdf
 */
import { existsSync, mkdirSync, statSync, createWriteStream } from "node:fs";
import { join } from "node:path";

// OpenStax book slug → product course mapping. Each entry has the
// pdfUrl (from openstax.org/details/books/<slug>), the slug (used as
// directory name), and the courses it feeds.
const BOOKS = [
  // Strong AP-aligned (use AP-specific OpenStax editions where available)
  { slug: "biology-ap-courses",                pdf: "https://openstax.org/details/books/biology-ap-courses",                courses: ["AP_BIOLOGY"] },
  { slug: "college-physics-ap-courses-2e",     pdf: "https://openstax.org/details/books/college-physics-ap-courses-2e",     courses: ["AP_PHYSICS_1", "AP_PHYSICS_2"] },
  { slug: "calculus-volume-1",                 pdf: "https://openstax.org/details/books/calculus-volume-1",                 courses: ["AP_CALCULUS_AB"] },
  { slug: "calculus-volume-2",                 pdf: "https://openstax.org/details/books/calculus-volume-2",                 courses: ["AP_CALCULUS_BC"] },
  { slug: "chemistry-2e",                      pdf: "https://openstax.org/details/books/chemistry-2e",                      courses: ["AP_CHEMISTRY"] },
  { slug: "introductory-statistics-2e",        pdf: "https://openstax.org/details/books/introductory-statistics-2e",        courses: ["AP_STATISTICS"] },
  { slug: "psychology-2e",                     pdf: "https://openstax.org/details/books/psychology-2e",                     courses: ["AP_PSYCHOLOGY"] },
  { slug: "us-history",                        pdf: "https://openstax.org/details/books/us-history",                        courses: ["AP_US_HISTORY"] },
  { slug: "american-government-4e",            pdf: "https://openstax.org/details/books/american-government-4e",            courses: ["AP_US_GOVERNMENT"] },
  { slug: "world-history-volume-1",            pdf: "https://openstax.org/details/books/world-history-volume-1",            courses: ["AP_WORLD_HISTORY"] },
  { slug: "world-history-volume-2",            pdf: "https://openstax.org/details/books/world-history-volume-2",            courses: ["AP_WORLD_HISTORY"] },
  // SAT/ACT Math — College Algebra + Algebra & Trig cover most domains
  { slug: "college-algebra-2e",                pdf: "https://openstax.org/details/books/college-algebra-2e",                courses: ["SAT_MATH"] },
  { slug: "algebra-and-trigonometry-2e",       pdf: "https://openstax.org/details/books/algebra-and-trigonometry-2e",       courses: ["ACT_MATH"] },
  // Microeconomics + Macroeconomics for AP econ
  { slug: "principles-of-microeconomics-3e",   pdf: "https://openstax.org/details/books/principles-of-microeconomics-3e",   courses: ["AP_MICROECONOMICS"] },
  { slug: "principles-of-macroeconomics-3e",   pdf: "https://openstax.org/details/books/principles-of-macroeconomics-3e",   courses: ["AP_MACROECONOMICS"] },
];

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const ONLY = args.book ?? null;
const DRY = !!args.dry;

const queue = ONLY ? BOOKS.filter((b) => b.slug === ONLY) : BOOKS;
if (queue.length === 0) {
  console.error("No books match --book filter");
  process.exit(1);
}

const baseDir = join(process.cwd(), "data", "openstax");
mkdirSync(baseDir, { recursive: true });

console.log(`OpenStax textbook download — ${queue.length} book(s) ${DRY ? "(DRY)" : ""}`);
let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const book of queue) {
  const dir = join(baseDir, book.slug);
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "textbook.pdf");

  if (existsSync(outPath)) {
    const size = statSync(outPath).size;
    if (size > 100_000) {
      console.log(`  ✓ ${book.slug} already downloaded (${(size / 1024 / 1024).toFixed(1)} MB)`);
      skipped++;
      continue;
    }
  }
  if (DRY) {
    console.log(`  [DRY] would fetch ${book.slug} → ${book.pdf}`);
    continue;
  }

  // OpenStax CMS API exposes high_resolution_pdf_url for each book.
  // Step 1: GET /apps/cms/api/v2/pages/?slug=<slug>&type=books.Book → get page id
  // Step 2: GET /apps/cms/api/v2/pages/<id>/ → has high_resolution_pdf_url
  try {
    const listRes = await fetch(`https://openstax.org/apps/cms/api/v2/pages/?slug=${book.slug}&type=books.Book`);
    if (!listRes.ok) throw new Error(`CMS list HTTP ${listRes.status}`);
    const listJson = await listRes.json();
    const pageId = listJson?.items?.[0]?.id;
    if (!pageId) throw new Error("no page id for slug");
    const detailsRes = await fetch(`https://openstax.org/apps/cms/api/v2/pages/${pageId}/`);
    if (!detailsRes.ok) throw new Error(`CMS details HTTP ${detailsRes.status}`);
    const detailsJson = await detailsRes.json();
    const pdfUrl = detailsJson?.high_resolution_pdf_url ?? detailsJson?.low_resolution_pdf_url;
    if (!pdfUrl) throw new Error("no pdf url on book record");
    console.log(`  ↓ ${book.slug} from ${pdfUrl.slice(0, 80)}...`);
    const res = await fetch(pdfUrl, { redirect: "follow" });
    if (!res.ok) {
      console.error(`  ✗ ${book.slug} — HTTP ${res.status}`);
      failed++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const fs = await import("node:fs");
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ ${book.slug} saved (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
    downloaded++;
  } catch (e) {
    console.error(`  ✗ ${book.slug} — ${e.message?.slice(0, 100)}`);
    failed++;
  }
  // Be courteous to OpenStax CDN
  await new Promise((r) => setTimeout(r, 2000));
}

console.log(`\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
console.log(`Books mapped to ${queue.reduce((s, b) => s + b.courses.length, 0)} course slots.`);

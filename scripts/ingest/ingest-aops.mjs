// Ingest MCQs from Art of Problem Solving (AoPS) wiki — AMC 10 + AMC 12.
//
// Rationale: AoPS wiki is consistently formatted MediaWiki with problems
// rendered as `<h2 id="Problem_N">` headings, each followed by a `<p>` that
// contains the stem + answer choices as LaTeX rendered into <img alt="...">
// attributes. Answer keys live at a sibling page `YYYY_AMC_10X_Answer_Key`
// with a clean `<ol><li>X</li>` list.
//
// AoPS is STEM/math-only. Probing confirmed the bio/chem/physics Olympiad
// archives (USABO, USNCO, Physics Bowl) do not exist on the wiki (HTTP 404).
// So we only harvest AMC 10 + AMC 12, tagged to the nearest AP course:
//
//   AMC 10 (grades 9-10 rigor, algebra/geometry/number theory/counting)
//     -> AP_CALCULUS_AB  (precalc-to-AB overlap on algebraic manipulation)
//
//   AMC 12 (grades 11-12 rigor, adds trig + logs + advanced algebra)
//     -> AP_CALCULUS_BC  (closer to BC rigor; some problems require calculus)
//
//   AMC 10 w/ probability-heavy years
//     -> AP_STATISTICS   (dedicated set: 2023 A+B, which is comb/prob heavy)
//
// We do NOT ingest for AP_PHYSICS_1, AP_CHEMISTRY, AP_BIOLOGY — AoPS has no
// on-wiki archive for those subjects.
//
// License: AoPS wiki content is CC-BY-SA. Stored as OfficialSample rows with
// full attribution for RAG grounding. Not redistributed verbatim to students.
//
// Usage: node scripts/ingest/ingest-aops.mjs

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AP-Help-AoPS-Ingest/1.0";

const RAW_DIR = "data/raw/aops";
const LICENSE =
  "AoPS wiki content, CC-BY-SA license. Used as AI training/grounding " +
  "reference. Attribution: Art of Problem Solving community. Fair use applies.";

// ---- Fetch + cache --------------------------------------------------------

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

async function fetchCached(url, filename) {
  ensureDir(RAW_DIR);
  const fp = path.join(RAW_DIR, filename);
  if (existsSync(fp)) {
    const cached = readFileSync(fp, "utf8");
    if (cached.length > 5000) return cached; // sanity: skip corrupt tiny cache
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const html = await res.text();
  writeFileSync(fp, html);
  return html;
}

// ---- HTML parsing ---------------------------------------------------------

/**
 * Convert an AoPS wiki `<img class="latex(center)?" alt="$...$">` block into
 * its plain-text LaTeX content. The `alt` attribute is the authoritative
 * source; AoPS renders math as PNG but preserves the TeX in the alt.
 *
 * Input: raw HTML fragment (can contain many imgs, other tags, entities).
 * Output: plain text with LaTeX inline ($...$) preserved.
 */
function htmlToText(html) {
  let s = html;
  // Replace each latex image with its alt text (which is the TeX, e.g. "$x$")
  s = s.replace(/<img[^>]*class="latex(?:center)?"[^>]*alt="([^"]*)"[^>]*>/g, (_, alt) => {
    // Unescape HTML entities in alt.
    return " " + decodeEntities(alt) + " ";
  });
  // Remove any other images (e.g. Asymptote diagrams — we can't usefully
  // serialize a diagram as text).
  s = s.replace(/<img[^>]*>/g, " [diagram] ");
  // Drop solution link trailers like <a href=...>Solution</a>
  s = s.replace(/<a[^>]*>Solution<\/a>/gi, " ");
  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, " ");
  s = decodeEntities(s);
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Extract problems from an AMC 10/12 problems-page HTML. Returns an array
 * of { qNum, stem, choicesText } where choicesText is the raw LaTeX string
 * containing all five answer choices (e.g. "\textbf{(A)}\ 20 \qquad ...").
 *
 * Strategy:
 *   1. Find each `<h2><span id="Problem_N">...</h2>` heading.
 *   2. Capture HTML until the next `<h2>` OR until the See-Also header.
 *   3. Within that block, the LAST latex-image with alt text starting with
 *      "$\textbf{(A)" is the answer-choices block. Everything before it is
 *      the stem (plus possibly an Asymptote diagram we replace with [diagram]).
 */
function parseProblemsPage(html) {
  // Narrow to mw-parser-output body to avoid sidebar boilerplate.
  const bodyMatch = html.match(/<div class="mw-content-ltr mw-parser-output"[^>]*>([\s\S]*?)<\/div>\s*<!--\s*\nNewPP/);
  const body = bodyMatch ? bodyMatch[1] : html;

  // Split on <h2> boundaries marked by the Problem_N span.
  const chunks = body.split(/<h2>\s*<span class="mw-headline" id="Problem_(\d+)">/);
  // chunks[0] = preamble. Then alternating: [qNum, blockHtml, qNum, blockHtml, ...]
  const problems = [];
  for (let i = 1; i < chunks.length; i += 2) {
    const qNum = parseInt(chunks[i], 10);
    let block = chunks[i + 1] || "";
    // Cut off at the next section heading (See also / Video Solution subheads
    // use <h3>, but the problem block ends at the next <h2> which is
    // already consumed by the split).
    // Also cut off at the "Solution" link — but keep text before it.
    // The answer-choices latex image is always the last latex in the block.

    // Find all latex alt attributes in order.
    const latexAlts = [];
    const latexRe = /<img[^>]*class="latex(?:center)?"[^>]*alt="([^"]*)"[^>]*>/g;
    let m;
    while ((m = latexRe.exec(block)) !== null) {
      latexAlts.push({ start: m.index, alt: decodeEntities(m[1]) });
    }

    // Locate the answer-choices latex: the one whose alt begins with
    // "$\textbf{(A)" (possibly with leading spaces or alternate casing).
    const choiceIdx = latexAlts.findIndex((x) =>
      /^\$\s*\\textbf\{\s*\(A\)/.test(x.alt) ||
      /^\$\s*\\mathrm\{\s*\(A\)/.test(x.alt)  // older AMC years use \mathrm
    );

    if (choiceIdx < 0) {
      // No MCQ-style choices block — skip this problem (may be a withdrawn
      // problem, or an edge case where choices are spread across imgs).
      continue;
    }

    const choicesAlt = latexAlts[choiceIdx].alt;
    // Stem = everything before the choices image.
    const stemHtml = block.slice(0, latexAlts[choiceIdx].start);
    let stem = htmlToText(stemHtml);
    // Remove redundant "Problem N" prefix that the Problem_N heading left
    // in the extracted text (we already store qNum in the sourceUrl hash).
    stem = stem.replace(/^Problem\s+\d+\s*/i, "").trim();

    if (!stem || stem.length < 10) continue;

    problems.push({ qNum, stem, choicesText: choicesAlt });
  }
  return problems;
}

/**
 * Split an AMC-style choices LaTeX string into five {letter, text} entries.
 * Input examples:
 *   $\textbf{(A)}\ 20 \qquad\textbf{(B)}\ 22 \qquad\textbf{(C)}\ 24 \qquad
 *    \textbf{(D)} 25\qquad\textbf{(E)} 26$
 *   $\textbf{(A) } 12 \qquad \textbf{(B) } 15 \qquad ...$
 *   $\mathrm{(A) } 1 \qquad \mathrm{(B) } 2 \qquad ...$  (older years)
 *
 * We split on each `\textbf{(X)}` or `\mathrm{(X)}` marker for X in A-E.
 */
function parseChoices(choicesText) {
  // Strip outer $ delimiters.
  let s = choicesText.replace(/^\$+/, "").replace(/\$+$/, "").trim();
  // Normalize \mathrm -> \textbf for easier single-regex split.
  s = s.replace(/\\mathrm\{\s*\(([A-E])\)\s*\}/g, "\\textbf{($1)}");
  // Split on markers.
  const parts = s.split(/\\textbf\{\s*\(([A-E])\)\s*\}/);
  // parts[0] = preamble (should be empty or whitespace). Then alternating:
  // [letter, content, letter, content, ...]
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const letter = parts[i];
    let text = (parts[i + 1] || "").trim();
    // Trim trailing \qquad / \quad / punctuation from the last choice before
    // the closing $.
    text = text
      .replace(/\\qquad\s*$/g, "")
      .replace(/\\quad\s*$/g, "")
      .replace(/\\\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    // Strip a single leading backslash-space ("\ ") used as a thin space
    // between the bold marker and the content. NOTE: we only match the
    // literal "\ " sequence (backslash + ASCII space) — not "\frac" etc.,
    // which also starts with a backslash.
    text = text.replace(/^\\ /, "").trim();
    if (text) out.push({ letter, text });
  }
  return out;
}

/**
 * Parse an AoPS AMC answer-key page into Map<qNum, letter>. Format:
 *   <ol><li>E</li><li>C</li>...</ol>
 */
function parseAnswerKey(html) {
  const bodyMatch = html.match(/<div class="mw-content-ltr mw-parser-output"[^>]*>([\s\S]*?)<\/div>/);
  const body = bodyMatch ? bodyMatch[1] : html;
  const listMatch = body.match(/<ol>([\s\S]*?)<\/ol>/);
  if (!listMatch) return new Map();
  const items = [];
  const itemRe = /<li>\s*([A-E])\s*<\/li>/g;
  let m;
  while ((m = itemRe.exec(listMatch[1])) !== null) {
    items.push(m[1]);
  }
  const map = new Map();
  items.forEach((letter, i) => map.set(i + 1, letter));
  return map;
}

// ---- Ingest helpers -------------------------------------------------------

async function upsertSample(data) {
  // Idempotency key: (course, year, sourceUrl, qNum-via-first-60-chars).
  const existing = await prisma.officialSample.findFirst({
    where: {
      course: data.course,
      year: data.year,
      sourceUrl: data.sourceUrl,
      questionType: data.questionType,
      questionText: { startsWith: data.questionText.slice(0, 60) },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.officialSample.update({ where: { id: existing.id }, data });
    return { created: 0, updated: 1 };
  }
  await prisma.officialSample.create({ data });
  return { created: 1, updated: 0 };
}

// ---- Per-exam ingest ------------------------------------------------------

/**
 * Fetch, parse, and upsert one AMC exam (e.g. "2020_AMC_10A") for the given
 * AP course tag. Returns { created, updated, parsed, skipped }.
 */
async function ingestExam({ slug, examLabel, year, course, category }) {
  const problemsUrl = `https://artofproblemsolving.com/wiki/index.php?title=${slug}_Problems`;
  const keyUrl = `https://artofproblemsolving.com/wiki/index.php?title=${slug}_Answer_Key`;
  let problemsHtml, keyHtml;
  try {
    problemsHtml = await fetchCached(problemsUrl, `${slug}_Problems.html`);
  } catch (e) {
    console.log(`  FETCH FAIL problems ${slug}: ${e.message}`);
    return { created: 0, updated: 0, parsed: 0, skipped: 0, err: "fetch-problems" };
  }
  try {
    keyHtml = await fetchCached(keyUrl, `${slug}_Answer_Key.html`);
  } catch (e) {
    console.log(`  FETCH FAIL key ${slug}: ${e.message}`);
    return { created: 0, updated: 0, parsed: 0, skipped: 0, err: "fetch-key" };
  }

  const answerKey = parseAnswerKey(keyHtml);
  const problems = parseProblemsPage(problemsHtml);

  let created = 0, updated = 0, skipped = 0;
  for (const p of problems) {
    const choices = parseChoices(p.choicesText);
    if (choices.length < 4) { skipped++; continue; }
    const correct = answerKey.get(p.qNum) || null;
    if (!correct) { skipped++; continue; }

    const options = Object.fromEntries(choices.map((c) => [c.letter, c.text]));
    const res = await upsertSample({
      course,
      unit: null,
      year,
      sourceUrl: `${problemsUrl}#Problem_${p.qNum}`,
      sourceName: `Art of Problem Solving (AoPS) — ${category}`,
      questionText: p.stem,
      stimulus: null,
      options,
      correctAnswer: correct,
      explanation: null,
      questionType: "MCQ",
      licenseNotes: LICENSE,
    });
    created += res.created;
    updated += res.updated;
  }
  return { created, updated, parsed: problems.length, skipped };
}

// ---- Exam roster ----------------------------------------------------------

// AP_CALCULUS_AB <- AMC 10 2020-2022 (A + B)
// AP_CALCULUS_BC <- AMC 12 2020-2022 (A + B)
// AP_STATISTICS  <- AMC 10 2023-2024 (A + B)  [prob/comb heavy recent years]
const ROSTER = [
  // AP_CALCULUS_AB <- AMC 10
  { slug: "2022_AMC_10A", year: 2022, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2022 AMC 10A" },
  { slug: "2022_AMC_10B", year: 2022, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2022 AMC 10B" },
  { slug: "2021_AMC_10A", year: 2021, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2021 AMC 10A" },
  { slug: "2021_AMC_10B", year: 2021, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2021 AMC 10B" },
  { slug: "2020_AMC_10A", year: 2020, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2020 AMC 10A" },
  { slug: "2020_AMC_10B", year: 2020, course: "AP_CALCULUS_AB", category: "AMC 10", label: "2020 AMC 10B" },

  // AP_CALCULUS_BC <- AMC 12
  { slug: "2022_AMC_12A", year: 2022, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2022 AMC 12A" },
  { slug: "2022_AMC_12B", year: 2022, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2022 AMC 12B" },
  { slug: "2021_AMC_12A", year: 2021, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2021 AMC 12A" },
  { slug: "2021_AMC_12B", year: 2021, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2021 AMC 12B" },
  { slug: "2020_AMC_12A", year: 2020, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2020 AMC 12A" },
  { slug: "2020_AMC_12B", year: 2020, course: "AP_CALCULUS_BC", category: "AMC 12", label: "2020 AMC 12B" },

  // AP_STATISTICS <- AMC 10 recent years (prob/comb/counting heavy)
  { slug: "2024_AMC_10A", year: 2024, course: "AP_STATISTICS", category: "AMC 10", label: "2024 AMC 10A" },
  { slug: "2024_AMC_10B", year: 2024, course: "AP_STATISTICS", category: "AMC 10", label: "2024 AMC 10B" },
  { slug: "2023_AMC_10A", year: 2023, course: "AP_STATISTICS", category: "AMC 10", label: "2023 AMC 10A" },
  { slug: "2023_AMC_10B", year: 2023, course: "AP_STATISTICS", category: "AMC 10", label: "2023 AMC 10B" },
];

// Courses AoPS cannot serve — recorded for the report so we don't silently
// drop the request.
const UNSERVED = [
  { course: "AP_PHYSICS_1", reason: "AoPS wiki has no Physics Bowl / PhysicsOlympiad archive (404s on probes)." },
  { course: "AP_CHEMISTRY", reason: "AoPS wiki has no USNCO archive (404 on probe)." },
  { course: "AP_BIOLOGY", reason: "AoPS wiki has no USABO archive (404 on probe)." },
];

// ---- Main -----------------------------------------------------------------

async function main() {
  console.log("\n==== Ingesting AoPS AMC 10/12 MCQs as OfficialSample ====\n");
  const perCourse = new Map();
  const perExam = [];

  for (const exam of ROSTER) {
    process.stdout.write(`— ${exam.label} (${exam.course})`);
    const r = await ingestExam(exam);
    console.log(`  parsed=${r.parsed}  ingested=${r.created + r.updated}  skipped=${r.skipped}${r.err ? "  err=" + r.err : ""}`);
    perExam.push({ ...exam, ...r });
    const bag = perCourse.get(exam.course) || { created: 0, updated: 0, parsed: 0, skipped: 0, exams: 0 };
    bag.created += r.created;
    bag.updated += r.updated;
    bag.parsed += r.parsed;
    bag.skipped += r.skipped;
    bag.exams += 1;
    perCourse.set(exam.course, bag);
  }

  console.log("\n==== Summary ====");
  let grandCreated = 0, grandUpdated = 0;
  for (const [course, bag] of perCourse.entries()) {
    const total = await prisma.officialSample.count({ where: { course, sourceName: { contains: "AoPS" } } });
    console.log(
      `  ${course.padEnd(22)}  exams=${bag.exams}  parsed=${bag.parsed}  ` +
      `new=${bag.created}  upd=${bag.updated}  skipped=${bag.skipped}  ` +
      `total-AoPS-rows=${total}`
    );
    grandCreated += bag.created;
    grandUpdated += bag.updated;
  }

  console.log("\n==== Unserved (AoPS has no archive) ====");
  for (const u of UNSERVED) console.log(`  ${u.course}: ${u.reason}`);

  console.log(`\nGrand totals: created=${grandCreated}  updated=${grandUpdated}`);
  await prisma.$disconnect();
}

const isDirect =
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main, parseProblemsPage, parseChoices, parseAnswerKey };

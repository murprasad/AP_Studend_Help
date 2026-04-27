// Ingest end-of-chapter multiple-choice questions from OpenStax CC-BY
// textbooks. OpenStax publishes AP-aligned textbooks under a Creative
// Commons Attribution 4.0 license, which means — unlike the College Board
// PDFs — we can lawfully store the verbatim text in our RAG corpus so long
// as we carry attribution through the `licenseNotes` field.
//
// Usage: node scripts/ingest/ingest-openstax-ap.mjs
//        node scripts/ingest/ingest-openstax-ap.mjs --only AP_BIOLOGY
//
// Discovery notes (recorded during development on 2026-04-19):
//   - `biology-2e`, `psychology-2e`, `us-history`, `world-history-volume-1`,
//     `world-history-volume-2` all expose chapter MCQs at
//       /books/{slug}/pages/{N}-review-questions
//     with clean `<div data-type="exercise">` + `<ol type="a">` markup.
//   - `introductory-statistics-2e` exposes MCQs at /{N}-practice, but the
//     same page uses `<ol type="a">` for multi-part sub-questions too, so
//     we apply a tighter filter (short option text + 3-5 options).
//   - `chemistry-2e`, `college-physics-2e`, `university-physics-volume-1`,
//     `calculus-volume-1`, `calculus-volume-2` do NOT contain MCQ-formatted
//     end-of-chapter questions — their exercises are open-ended. We skip
//     those books rather than ingesting FRQ-style content that doesn't
//     match the MCQ shape we need.
//
// Answer keys are NOT in the public review-question pages and not
// consistently exposed as standalone HTML endpoints, so we persist rows
// with `correctAnswer: null`. The question stem + options are still very
// valuable as RAG grounding for style/topic matching during AI generation.

import { upsertSample, summarizeCourse } from "./_shared.mjs";
import { makePrisma } from "../_prisma-http.mjs";

// HTTP adapter — matches prod + avoids TCP/5432 Neon pooler blocks.
const prisma = makePrisma();

const BOOKS = [
  {
    course: "AP_BIOLOGY",
    slug: "biology-2e",
    title: "Biology 2e",
    pagePattern: "{n}-review-questions",
    maxChapters: 47,
  },
  {
    course: "AP_PSYCHOLOGY",
    slug: "psychology-2e",
    title: "Psychology 2e",
    pagePattern: "{n}-review-questions",
    maxChapters: 16,
  },
  {
    course: "AP_US_HISTORY",
    slug: "us-history",
    title: "U.S. History",
    pagePattern: "{n}-review-questions",
    maxChapters: 32,
  },
  {
    course: "AP_WORLD_HISTORY",
    slug: "world-history-volume-1",
    title: "World History Volume 1, to 1500",
    pagePattern: "{n}-review-questions",
    maxChapters: 17,
  },
  {
    course: "AP_WORLD_HISTORY",
    slug: "world-history-volume-2",
    title: "World History Volume 2, from 1400",
    pagePattern: "{n}-review-questions",
    maxChapters: 15,
  },
  // ── 2026 catalog expansion (Task #13) ────────────────────────────
  // OpenStax's American Government 3e is CB-AP-aligned and has review
  // MCQs at /{N}-review-questions. 17 chapters.
  {
    course: "AP_US_GOVERNMENT",
    slug: "american-government-3e",
    title: "American Government 3e",
    pagePattern: "{n}-review-questions",
    maxChapters: 17,
  },
  // OpenStax's Precalculus 2e has MCQs at /{N}-review-exercises
  // (different page name than "-review-questions"). 13 chapters.
  {
    course: "AP_PRECALCULUS",
    slug: "precalculus-2e",
    title: "Precalculus 2e",
    pagePattern: "{n}-review-exercises",
    maxChapters: 13,
  },
  // NOTE: introductory-statistics-2e and statistics were probed during
  // discovery and DO NOT contain end-of-chapter MCQs. Both books' "Practice"
  // pages use <ol type="a"> exclusively for multi-part subquestions (each
  // <li> is a task like "Find the value k..." or ends with "=", which is
  // why model-based extraction occasionally misreads them as MCQs).
  // AP Statistics OpenStax MCQs are NOT available — skip this course.
];

const TODAY = new Date().toISOString().slice(0, 10);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
  "Safari/605.1.15 (PrepLion/AP_Help RAG ingester; educational)";

// ──────────────────────────────────────────────────────────────────────
// HTML helpers
// ──────────────────────────────────────────────────────────────────────

/** Fetch a page with the standard UA + light retry. */
async function fetchPage(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
      if (res.status === 404) return { status: 404, html: null };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: 200, html: await res.text() };
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  return { status: 0, html: null };
}

/** Strip HTML tags, decode common entities, collapse whitespace. */
function stripHtml(raw) {
  if (!raw) return "";
  let s = raw
    // Drop tables entirely — they never render cleanly as plain MCQ text
    .replace(/<table[\s\S]*?<\/table>/gi, " [TABLE] ")
    // Drop images
    .replace(/<img[^>]*>/gi, " ")
    // Drop anchor "solution" links that OpenStax inlines next to question numbers
    .replace(/<a[^>]*aria-label="[^"]*"[^>]*>[\s\S]*?<\/a>/gi, "")
    // Convert line-break-ish tags to spaces
    .replace(/<\/?(br|p|div|li|ol|ul|span|em|strong|sub|sup|section|header)[^>]*>/gi, " ")
    // Strip any other tags
    .replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&times;/g, "×")
    .replace(/&deg;/g, "°")
    // Generic numeric entity fallback
    .replace(/&#(\d+);/g, (_, d) => {
      const n = parseInt(d, 10);
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : " ";
    });
  // Postgres won't accept NULL bytes
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

// ──────────────────────────────────────────────────────────────────────
// Parser
// ──────────────────────────────────────────────────────────────────────

/**
 * Parse one chapter's review-questions HTML into MCQs.
 * Returns [{ qNum, questionText, options: [A..D], letters: [A..D] }].
 *
 * OpenStax uses two distinct HTML schemas for review-question pages:
 *
 *   A) Legacy (biology-2e, psychology-2e, us-history, statistics,
 *      introductory-statistics-2e):
 *        <div data-type="exercise">
 *          <span class="os-number">N</span>...
 *          <div class="os-problem-container">
 *            <p>question stem</p>
 *            <ol type="a"><li>option</li>...</ol>
 *          </div>
 *        </div>
 *
 *   B) New (world-history-volume-1, world-history-volume-2):
 *        <div data-type="exercise-question" data-formats="...multiple-choice">
 *          <span class="os-number">N</span>...
 *          <div class="os-problem-container">
 *            <div data-type="question-stem">question stem</div>
 *            <ol data-type="question-answers" type="a">
 *              <li data-type="question-answer">
 *                <div data-type="answer-content">option</div>
 *              </li>...
 *            </ol>
 *          </div>
 *        </div>
 *
 * We try both and merge. The `strictMcq` flag applies extra filters for
 * books whose legacy markup also hosts non-MCQ multi-part subquestions
 * under the same `<ol type="a">` shape (Statistics variants).
 */
function parseChapterHtml(html, opts = {}) {
  const strict = !!opts.strictMcq;
  const out = [];

  // ── Schema A: legacy <div data-type="exercise"> blocks ──────────────
  const legacyRe =
    /<div\s+data-type="exercise"[^>]*>([\s\S]*?)(?=<div\s+data-type="exercise"[^>]*>|<\/section>|<footer|$)/gi;
  let m;
  while ((m = legacyRe.exec(html)) !== null) {
    const block = m[1];
    const item = extractLegacy(block, strict);
    if (item) out.push(item);
  }

  // ── Schema B: new <div data-type="exercise-question"> blocks ────────
  const newRe =
    /<div\s+data-type="exercise-question"[^>]*>([\s\S]*?)(?=<div\s+data-type="exercise-question"[^>]*>|<\/section>|<footer|$)/gi;
  while ((m = newRe.exec(html)) !== null) {
    const block = m[0] + m[1]; // include the opening tag so we can read data-formats
    const item = extractNew(block, strict);
    if (item) out.push(item);
  }

  // Dedupe on (qNum, first 40 chars of stem) so we don't double-count if
  // both schemas happen to match overlapping regions.
  const seen = new Set();
  const deduped = [];
  for (const q of out) {
    const key = `${q.qNum}::${q.questionText.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(q);
  }
  return deduped;
}

function extractLegacy(block, strict) {
  const numMatch =
    block.match(/<span\s+class="os-number"[^>]*>\s*(\d+)\s*<\/span>/i) ||
    block.match(/<a\s+class="os-number"[^>]*>\s*(\d+)\s*<\/a>/i);
  const qNum = numMatch ? parseInt(numMatch[1], 10) : null;

  const probMatch = block.match(
    /<div\s+class="os-problem-container"[^>]*>([\s\S]*?)(?=<\/div>\s*<\/div>|<\/section>|$)/i
  );
  if (!probMatch) return null;
  const probInner = probMatch[1];

  const stemMatch = probInner.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (!stemMatch) return null;
  const questionText = stripHtml(stemMatch[1]);
  if (!questionText || questionText.length < 15) return null;

  const olMatch = probInner.match(/<ol[^>]*\btype="a"[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return null;
  const rawOptions = collectListItems(olMatch[1]);
  if (rawOptions.length < 3 || rawOptions.length > 5) return null;

  if (!passesMcqShape(questionText, rawOptions, strict)) return null;

  return formatItem(qNum, questionText, rawOptions);
}

function extractNew(block, strict) {
  // Only keep blocks whose data-formats advertises "multiple-choice".
  const headMatch = block.match(/<div\s+data-type="exercise-question"[^>]*>/i);
  const head = headMatch ? headMatch[0] : "";
  const formatsMatch = head.match(/data-formats="([^"]*)"/i);
  if (formatsMatch && !/multiple-choice/i.test(formatsMatch[1])) return null;

  const numMatch =
    block.match(/<span\s+class="os-number"[^>]*>\s*(\d+)\s*<\/span>/i) ||
    block.match(/<a\s+class="os-number"[^>]*>\s*(\d+)\s*<\/a>/i);
  const qNum = numMatch ? parseInt(numMatch[1], 10) : null;

  const stemMatch = block.match(
    /<div\s+data-type="question-stem"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (!stemMatch) return null;
  const questionText = stripHtml(stemMatch[1]);
  if (!questionText || questionText.length < 15) return null;

  const olMatch = block.match(
    /<ol[^>]*data-type="question-answers"[^>]*>([\s\S]*?)<\/ol>/i
  );
  if (!olMatch) return null;
  // answer-content divs carry the option text verbatim
  const rawOptions = [];
  const answerRe =
    /<div\s+data-type="answer-content"[^>]*>([\s\S]*?)<\/div>/gi;
  let am;
  while ((am = answerRe.exec(olMatch[1])) !== null) {
    const text = stripHtml(am[1]);
    if (text) rawOptions.push(text);
  }
  if (rawOptions.length < 3 || rawOptions.length > 5) return null;

  if (!passesMcqShape(questionText, rawOptions, strict)) return null;
  return formatItem(qNum, questionText, rawOptions);
}

function collectListItems(olInner) {
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const out = [];
  let m;
  while ((m = liRe.exec(olInner)) !== null) {
    const text = stripHtml(m[1]);
    if (text) out.push(text);
  }
  return out;
}

function passesMcqShape(questionText, options, strict) {
  // Universal reject: any option containing a preserved [TABLE] token is
  // not useful as plain-text MCQ.
  if (options.some((o) => o.includes("[TABLE]"))) return false;
  // Universal reject: options that end in "?" are almost certainly
  // multi-part subquestions, not MCQ answer choices.
  if (options.every((o) => /\?\s*$/.test(o))) return false;
  // Universal reject: options that end in "=" (fill-in-the-blank calcs) or
  // ":" (instructional subquestion) are not MCQ answer choices.
  if (options.some((o) => /[=:]\s*$/.test(o))) return false;
  // Universal reject: options starting with an instructional verb are
  // subquestion parts, not answer choices.
  if (
    options.some((o) =>
      /^(construct|explain|discuss|determine\s+(if|whether)|describe|sketch|find\s+the|calculate|compute)\b/i.test(
        o
      )
    )
  ) {
    return false;
  }

  if (strict) {
    const longest = Math.max(...options.map((o) => o.length));
    if (longest > 160) return false;
    if (/^(use\s+the\s+|refer\s+to|for\s+problems|for\s+the\s+following)/i.test(questionText)) {
      return false;
    }
  }
  return true;
}

function formatItem(qNum, questionText, rawOptions) {
  const letters = ["A", "B", "C", "D", "E"].slice(0, rawOptions.length);
  const labeled = rawOptions.map((t, i) => `${letters[i]}) ${t}`);
  return {
    qNum: qNum ?? 0,
    questionText,
    options: labeled,
    letters,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Ingestion driver
// ──────────────────────────────────────────────────────────────────────

async function ingestBook(book) {
  console.log(`\n── ${book.title}  (${book.course})  slug=${book.slug}`);
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalParsed = 0;
  let chaptersWithQuestions = 0;
  const chapterStats = [];

  for (let n = 1; n <= book.maxChapters; n++) {
    const pageSlug = book.pagePattern.replace("{n}", String(n));
    const url = `https://openstax.org/books/${book.slug}/pages/${pageSlug}`;
    const { status, html } = await fetchPage(url);
    if (status !== 200 || !html) {
      console.log(`  ch${n}: HTTP ${status} — skipping`);
      continue;
    }
    const items = parseChapterHtml(html, { strictMcq: book.strictMcq });
    chapterStats.push({ chapter: n, parsed: items.length });
    if (items.length === 0) {
      console.log(`  ch${n}: 0 MCQs`);
      continue;
    }
    chaptersWithQuestions++;
    totalParsed += items.length;

    let created = 0;
    let updated = 0;
    for (const q of items) {
      const licenseNotes =
        `OpenStax CC-BY 4.0 licensed. Used as AI training/grounding ` +
        `reference. Attribution: OpenStax, ${book.title}, ` +
        `Chapter ${n}, accessed ${TODAY}.`;
      const res = await upsertSample(prisma, {
        course: book.course,
        unit: null,
        year: null,
        sourceUrl: url,
        sourceName: `OpenStax CC-BY \u2014 ${book.title}: Chapter ${n}`,
        questionText: q.questionText,
        stimulus: null,
        options: q.options,
        correctAnswer: null, // OpenStax answer keys aren't reliably scrapable from HTML
        explanation: null,
        questionType: "MCQ",
        licenseNotes,
      });
      created += res.created;
      updated += res.updated;
    }
    totalCreated += created;
    totalUpdated += updated;
    console.log(
      `  ch${n}: parsed=${items.length}  created=${created}  updated=${updated}`
    );
  }

  console.log(
    `\n  ${book.title} summary: parsed=${totalParsed} ` +
      `chapters_with_mcqs=${chaptersWithQuestions}/${book.maxChapters} ` +
      `created=${totalCreated} updated=${totalUpdated}`
  );
  return { totalCreated, totalUpdated, totalParsed, chaptersWithQuestions, chapterStats };
}

async function main() {
  const args = process.argv.slice(2);
  let only = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--only" && args[i + 1]) only = args[i + 1];
  }
  const books = only ? BOOKS.filter((b) => b.course === only) : BOOKS;
  if (only && books.length === 0) {
    console.error(`No OpenStax book configured for course=${only}`);
    process.exit(2);
  }

  console.log(`\n==== OpenStax AP MCQ ingestion (${books.length} book${books.length === 1 ? "" : "s"}) ====`);
  const grandTotals = {};
  for (const book of books) {
    const res = await ingestBook(book);
    const g = (grandTotals[book.course] = grandTotals[book.course] || {
      parsed: 0, created: 0, updated: 0, books: 0,
    });
    g.parsed += res.totalParsed;
    g.created += res.totalCreated;
    g.updated += res.totalUpdated;
    g.books += 1;
  }

  console.log(`\n==== OpenStax AP MCQ ingestion complete ====`);
  for (const [course, g] of Object.entries(grandTotals)) {
    const { total, byType } = await summarizeCourse(prisma, course);
    console.log(
      `${course}: openstax_parsed=${g.parsed} created=${g.created} ` +
        `updated=${g.updated} total_samples_in_db=${total} ` +
        `types=[${byType.map((r) => `${r.questionType}=${r._count}`).join(",")}]`
    );
  }
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

export { parseChapterHtml, ingestBook, main };

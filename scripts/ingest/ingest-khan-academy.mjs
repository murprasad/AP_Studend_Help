// Ingest public AP practice MCQs from Khan Academy (CB-partnered).
// Usage: node scripts/ingest/ingest-khan-academy.mjs
//
// Khan Academy has AP-branded content created with College Board input.
// Content is CC-BY-NC-SA. We store lightweight grounding references in
// OfficialSample for RAG retrieval only — no verbatim redistribution.
//
// STRUCTURE
// ---------
// For each AP course we seed a list of candidate topic URLs (public
// "Example questions" / "Practice" pages). For each URL we:
//   1. Fetch with a realistic browser User-Agent.
//   2. Detect Khan Academy's "Client Challenge" anti-bot stub (a 3 KB
//      JavaScript page that renders only in real browsers with cookies).
//      When the stub is served, we log the URL as "gated" and move on.
//   3. If real HTML comes through (e.g. when running behind a residential
//      proxy, Playwright, or once KA relaxes the gate), extract any MCQs
//      using a conservative parser and upsert via shared helpers.
//
// HONEST OPERATIONAL NOTE
// -----------------------
// As of 2026-04-18, every www.khanacademy.org HTML route returns the
// Datadome-style Client Challenge stub to non-browser clients. Their
// legacy public /api/v1 endpoints return HTTP 410 Gone. A zero-row
// "gated" run is the expected outcome on stock infrastructure.
// The script is intentionally left runnable and idempotent so that when
// an authenticated / browser-emulated fetcher is wired in, no code
// changes are needed — only the `fetchPage` implementation.

import { PrismaClient } from "@prisma/client";
import { LICENSE, upsertSample, summarizeCourse } from "./_shared.mjs";

const prisma = new PrismaClient();

// Keep the KA-specific license attribution distinct from the CB one.
const KA_LICENSE =
  "Khan Academy CC-BY-NC-SA. Used as AI training/grounding reference. " +
  "Attribution: Khan Academy. Fair use applies. " +
  "Not redistributed verbatim to students.";

// -------- Target URLs (public landing + known topic/practice pages) --------
//
// These are intentionally the human-readable KA URLs. Each entry produces
// a `sourceName` like "Khan Academy (CB-Partnered) — AP Biology: Cell
// Structure". When fetchable, the parser looks for any MCQs on the page.

/** @type {Record<string, Array<{url: string, topic: string}>>} */
const TARGETS = {
  AP_BIOLOGY: [
    { url: "https://www.khanacademy.org/science/ap-biology", topic: "Course index" },
    { url: "https://www.khanacademy.org/science/ap-biology/chemistry-of-life", topic: "Chemistry of Life" },
    { url: "https://www.khanacademy.org/science/ap-biology/cell-structure-and-function", topic: "Cell Structure and Function" },
    { url: "https://www.khanacademy.org/science/ap-biology/cellular-energetics", topic: "Cellular Energetics" },
    { url: "https://www.khanacademy.org/science/ap-biology/cell-communication-and-cell-cycle", topic: "Cell Communication and Cell Cycle" },
    { url: "https://www.khanacademy.org/science/ap-biology/heredity", topic: "Heredity" },
    { url: "https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation", topic: "Gene Expression and Regulation" },
    { url: "https://www.khanacademy.org/science/ap-biology/natural-selection", topic: "Natural Selection" },
    { url: "https://www.khanacademy.org/science/ap-biology/ecology-ap", topic: "Ecology" },
  ],
  AP_CHEMISTRY: [
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta", topic: "Course index" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:atomic-structure-and-properties", topic: "Atomic Structure and Properties" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:molecular-and-ionic-compound-structure-and-properties", topic: "Molecular and Ionic Compounds" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:intermolecular-forces-and-properties", topic: "Intermolecular Forces and Properties" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:chemical-reactions", topic: "Chemical Reactions" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:kinetics", topic: "Kinetics" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:thermodynamics", topic: "Thermodynamics" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:equilibrium", topic: "Equilibrium" },
    { url: "https://www.khanacademy.org/science/ap-chemistry-beta/x2eef969c74e0d802:acids-and-bases", topic: "Acids and Bases" },
  ],
  AP_PHYSICS_1: [
    { url: "https://www.khanacademy.org/science/ap-physics-1", topic: "Course index" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-kinematics", topic: "Kinematics" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-forces-newtons-laws", topic: "Forces and Newton's Laws" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-circular-motion-and-gravitation", topic: "Circular Motion and Gravitation" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-energy", topic: "Energy" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-momentum", topic: "Momentum" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/simple-harmonic-motion-ap", topic: "Simple Harmonic Motion" },
    { url: "https://www.khanacademy.org/science/ap-physics-1/ap-torque-angular-momentum", topic: "Torque and Angular Momentum" },
  ],
  AP_CALCULUS_AB: [
    { url: "https://www.khanacademy.org/math/ap-calculus-ab", topic: "Course index" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new", topic: "Limits and Continuity" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-1-new", topic: "Differentiation: Definition and Basic Rules" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-2-new", topic: "Differentiation: Composite, Implicit, Inverse" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-contextual-applications-new", topic: "Contextual Applications of Differentiation" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-analytical-applications-new", topic: "Analytical Applications of Differentiation" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new", topic: "Integration and Accumulation of Change" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-diff-equations-new", topic: "Differential Equations" },
    { url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-applications-of-integration-new", topic: "Applications of Integration" },
  ],
  AP_CALCULUS_BC: [
    { url: "https://www.khanacademy.org/math/ap-calculus-bc", topic: "Course index" },
    { url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-limits-new", topic: "Limits and Continuity" },
    { url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-differentiation-1-new", topic: "Differentiation: Definition and Basic Rules" },
    { url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-integration-new", topic: "Integration and Accumulation of Change" },
    { url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-parametric-polar-new", topic: "Parametric Equations, Polar Coordinates, Vector-Valued Functions" },
    { url: "https://www.khanacademy.org/math/ap-calculus-bc/bc-series-new", topic: "Infinite Sequences and Series" },
  ],
  AP_STATISTICS: [
    { url: "https://www.khanacademy.org/math/ap-statistics", topic: "Course index" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:analyzing-categorical", topic: "Analyzing Categorical Data" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:analyzing-quantitative", topic: "Analyzing Quantitative Data" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:study-design", topic: "Collecting Data: Study Design" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:probability", topic: "Probability" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:sampling-distributions", topic: "Sampling Distributions" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:inference-categorical-proportions", topic: "Inference for Categorical Data: Proportions" },
    { url: "https://www.khanacademy.org/math/ap-statistics/xfb5d8e68:inference-quantitative-means", topic: "Inference for Quantitative Data: Means" },
  ],
  AP_US_HISTORY: [
    { url: "https://www.khanacademy.org/humanities/ap-us-history", topic: "Course index" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-1", topic: "Period 1: 1491-1607" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-2", topic: "Period 2: 1607-1754" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-3", topic: "Period 3: 1754-1800" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-4", topic: "Period 4: 1800-1848" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-5", topic: "Period 5: 1844-1877" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-6", topic: "Period 6: 1865-1898" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-7", topic: "Period 7: 1890-1945" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-8", topic: "Period 8: 1945-1980" },
    { url: "https://www.khanacademy.org/humanities/ap-us-history/period-9", topic: "Period 9: 1980-Present" },
  ],
  AP_WORLD_HISTORY: [
    { url: "https://www.khanacademy.org/humanities/world-history", topic: "World History overview" },
    { url: "https://www.khanacademy.org/humanities/whp-origins", topic: "World History: Origins to the Present" },
    { url: "https://www.khanacademy.org/humanities/whp-1750", topic: "World History: 1750 to the Present" },
  ],
  AP_MACROECONOMICS: [
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics", topic: "Course index" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/basic-economic-concepts-macro", topic: "Basic Economic Concepts" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/economic-iondicators-and-the-business-cycle", topic: "Economic Indicators and the Business Cycle" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/national-income-and-price-determination", topic: "National Income and Price Determination" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/financial-sector", topic: "Financial Sector" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-macroeconomics/long-run-consequences-of-stabilization-policies", topic: "Long-Run Consequences of Stabilization Policies" },
  ],
  AP_MICROECONOMICS: [
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics", topic: "Course index" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/basic-economics-concepts-macro", topic: "Basic Economic Concepts" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/supply-demand-and-consumer-choice", topic: "Supply, Demand, and Consumer Choice" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/production-cost-and-the-perfect-competition-model", topic: "Production, Cost, and Perfect Competition" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/imperfect-competition", topic: "Imperfect Competition" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/factor-markets", topic: "Factor Markets" },
    { url: "https://www.khanacademy.org/economics-finance-domain/ap-microeconomics/market-failure-and-the-role-of-government", topic: "Market Failure and the Role of Government" },
  ],
};

// -------- Fetching --------

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 20_000;

/**
 * Return the raw HTML body, or null on network error.
 */
async function fetchPage(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: ctl.signal,
      redirect: "follow",
    });
    if (!res.ok) return { html: null, status: res.status };
    return { html: await res.text(), status: res.status };
  } catch (e) {
    return { html: null, status: 0, error: String(e && e.message).slice(0, 120) };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Khan Academy fronts every non-authenticated page request with a
 * "Client Challenge" JavaScript stub served from /_fs-ch-* assets.
 * The real content is only injected after the challenge solves in a
 * real browser. Stub HTML is ~3 KB, contains "Client Challenge" and
 * never contains exercise markup. We detect and skip it.
 */
function isChallengeStub(html) {
  if (!html) return false;
  if (html.length > 10_000) return false;
  return (
    html.includes("Client Challenge") ||
    html.includes("/_fs-ch-") ||
    /handleScriptError/.test(html)
  );
}

/** Check that a "login required" interstitial rendered (rare when stub is served). */
function isLoginGated(html) {
  if (!html) return false;
  return /\bLog in\b[^<]{0,40}to access/i.test(html) ||
    /Sign up to save your progress/i.test(html);
}

/**
 * Detect the KA SPA shell — a ~200 KB HTML document with the generic
 * "Khan Academy" <title>, a GTM bootstrap script, and NO server-rendered
 * exercise data. This is the standard response for every course/topic URL
 * to non-authenticated clients: the real content (topic tree, MCQs) is
 * fetched asynchronously via persisted-query GraphQL calls that require
 * valid query hashes + session cookies from a real browser.
 */
function isSpaShell(html) {
  if (!html) return false;
  // Hallmark: generic title, no Perseus/radio/choices JSON anywhere, and
  // no __INITIAL_STATE / __APOLLO_STATE blob.
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const genericTitle = titleMatch && /^\s*Khan Academy\s*$/.test(titleMatch[1]);
  const noExerciseData =
    !html.includes('"choices"') &&
    !html.includes('"radio') &&
    !html.includes("Perseus") &&
    !html.includes("__INITIAL_STATE") &&
    !html.includes("__APOLLO_STATE");
  return Boolean(genericTitle && noExerciseData);
}

// -------- MCQ extraction --------
//
// Khan Academy's Perseus exercise format embeds questions as JSON inside
// a <script> tag or as rendered Markdown with a specific option list.
// When we do get real HTML, MCQs typically look like:
//
//   <div ...>Question stem text with $latex$ blocks...</div>
//   <ul>
//     <li><span>A</span> Option 1 text</li>
//     <li><span>B</span> Option 2 text</li>
//     ...
//   </ul>
//
// Correct-answer hints ("is correct" aria labels) are NOT emitted in
// static HTML; they're resolved client-side after a user submits.
// So on any successful parse we store the stem + options with
// `correctAnswer = null` and rely on downstream review. That still
// qualifies the row as a valid grounding reference per the task spec.

const STRIP_TAGS = /<(script|style)\b[\s\S]*?<\/\1>/gi;

function stripHtml(s) {
  return s
    .replace(STRIP_TAGS, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract candidate MCQs from rendered KA HTML. Conservative: only
 * accepts blocks that look like "question text + >=3 options (A-E)".
 * Returns [] on challenge stubs or empty pages.
 *
 * @param {string} html
 * @returns {Array<{stem: string, options: Array<{label: string, text: string}>}>}
 */
function extractMcqs(html) {
  if (!html) return [];
  const out = [];

  // Strategy 1: look for embedded Perseus JSON (widget-based MCQs).
  // Shape: {"question":{"content":"...","widgets":{"radio 1":{"options":[...]}}}}
  const perseusRe = /"question"\s*:\s*\{[\s\S]{0,4000}?"widgets"\s*:\s*\{[\s\S]{0,4000}?"radio[^"]*"\s*:\s*\{[\s\S]{0,4000}?"choices"\s*:\s*(\[[\s\S]{0,4000}?\])/g;
  let m;
  while ((m = perseusRe.exec(html)) !== null) {
    try {
      const choicesRaw = m[1];
      // Minimal JSON repair for common escaping.
      const choices = JSON.parse(choicesRaw);
      if (!Array.isArray(choices) || choices.length < 3) continue;
      // Find the nearest "content" field before this choices block.
      const before = html.slice(Math.max(0, m.index - 4000), m.index);
      const contentMatch = before.match(/"content"\s*:\s*"((?:[^"\\]|\\.){20,2000})"/);
      if (!contentMatch) continue;
      const stem = JSON.parse('"' + contentMatch[1] + '"').replace(/\$\$?/g, "");
      const options = choices.slice(0, 5).map((c, i) => ({
        label: String.fromCharCode(65 + i),
        text: (c && c.content) ? String(c.content).replace(/\$\$?/g, "").trim() : "",
      })).filter(o => o.text.length > 0);
      if (options.length >= 3 && stem.length >= 30) {
        out.push({ stem, options });
      }
    } catch {
      // Ignore JSON parse failures (KA's embedded JSON is often nested / escaped oddly).
    }
  }

  // Strategy 2 (fallback): rendered HTML with <ul>/<ol> option lists.
  // This is a best-effort pattern match for future proofing.
  const cleaned = stripHtml(html);
  const shortListRe =
    /([A-Z][^\n?]{40,600}\?)\s+(?:A[.)])\s*([^\n]{2,200})\s+(?:B[.)])\s*([^\n]{2,200})\s+(?:C[.)])\s*([^\n]{2,200})(?:\s+(?:D[.)])\s*([^\n]{2,200}))?(?:\s+(?:E[.)])\s*([^\n]{2,200}))?/g;
  let sm;
  while ((sm = shortListRe.exec(cleaned)) !== null) {
    const stem = sm[1].trim();
    const rawOpts = [sm[2], sm[3], sm[4], sm[5], sm[6]].filter(Boolean).map((t, i) => ({
      label: String.fromCharCode(65 + i),
      text: t.trim(),
    }));
    if (rawOpts.length >= 3) out.push({ stem, options: rawOpts });
  }

  // Dedupe by stem prefix.
  const seen = new Set();
  return out.filter((q) => {
    const k = q.stem.slice(0, 80).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// -------- Per-course ingestion --------

async function ingestCourse(course, targets) {
  const report = {
    course,
    targetsTried: targets.length,
    gated: 0,
    spaShell: 0,
    loginWall: 0,
    networkError: 0,
    pagesWithMcqs: 0,
    mcqsFound: 0,
    created: 0,
    updated: 0,
    urlsUsed: [],
  };

  for (const { url, topic } of targets) {
    const { html, status, error } = await fetchPage(url);
    if (!html) {
      report.networkError++;
      console.log(`    NET  ${status || "ERR"} ${topic} -> ${error || url}`);
      continue;
    }
    if (isChallengeStub(html)) {
      report.gated++;
      console.log(`    GATE challenge stub  ${topic}`);
      continue;
    }
    if (isLoginGated(html)) {
      report.loginWall++;
      console.log(`    GATE login wall      ${topic}`);
      continue;
    }
    if (isSpaShell(html)) {
      report.spaShell++;
      console.log(`    SPA  shell (no data) ${topic}`);
      continue;
    }

    const mcqs = extractMcqs(html);
    if (mcqs.length === 0) {
      console.log(`    ---  no MCQs parsed  ${topic}`);
      continue;
    }
    report.pagesWithMcqs++;
    report.mcqsFound += mcqs.length;
    report.urlsUsed.push(url);

    for (const q of mcqs) {
      const optionsJson = q.options.reduce((acc, o) => {
        acc[o.label] = o.text;
        return acc;
      }, {});
      const res = await upsertSample(prisma, {
        course,
        unit: null,
        year: null,
        sourceUrl: url,
        sourceName: `Khan Academy (CB-Partnered) \u2014 ${courseLabel(course)}: ${topic}`,
        questionText: q.stem.slice(0, 4000),
        stimulus: null,
        options: optionsJson,
        correctAnswer: null, // KA doesn't expose answers in static HTML
        explanation: null,
        questionType: "MCQ",
        licenseNotes: KA_LICENSE,
      });
      report.created += res.created;
      report.updated += res.updated;
    }
    console.log(`    OK   +${mcqs.length} MCQs        ${topic}`);
  }

  return report;
}

function courseLabel(course) {
  // "AP_CALCULUS_AB" -> "AP Calculus AB"
  return course
    .replace(/^AP_/, "AP ")
    .replace(/_/g, " ")
    .replace(/\bAb\b/, "AB")
    .replace(/\bBc\b/, "BC")
    .replace(/\bUs\b/, "US");
}

// -------- Main --------

async function main() {
  console.log(`\n==== Ingesting Khan Academy AP practice MCQs ====\n`);

  const overall = {
    coursesAttempted: 0,
    totalCreated: 0,
    totalUpdated: 0,
    totalMcqsFound: 0,
    totalGated: 0,
    totalSpaShell: 0,
    totalLoginWall: 0,
    totalNetErr: 0,
    perCourse: [],
  };

  for (const course of Object.keys(TARGETS)) {
    console.log(`\n-- ${course} --`);
    overall.coursesAttempted++;
    const report = await ingestCourse(course, TARGETS[course]);
    overall.totalCreated += report.created;
    overall.totalUpdated += report.updated;
    overall.totalMcqsFound += report.mcqsFound;
    overall.totalGated += report.gated;
    overall.totalSpaShell += report.spaShell;
    overall.totalLoginWall += report.loginWall;
    overall.totalNetErr += report.networkError;
    overall.perCourse.push(report);
  }

  console.log(`\n==== Khan Academy ingestion complete ====`);
  console.log(
    `Courses attempted:  ${overall.coursesAttempted}`
  );
  console.log(
    `MCQs parsed:        ${overall.totalMcqsFound}  ` +
    `(created=${overall.totalCreated} updated=${overall.totalUpdated})`
  );
  console.log(
    `Access gates hit:   challenge=${overall.totalGated}  ` +
    `spa-shell=${overall.totalSpaShell}  login=${overall.totalLoginWall}  ` +
    `net=${overall.totalNetErr}`
  );
  console.log(`\nPer-course breakdown:`);
  for (const r of overall.perCourse) {
    console.log(
      `  ${r.course.padEnd(22)} created=${String(r.created).padStart(3)}  ` +
      `gated=${String(r.gated).padStart(2)}  spa-shell=${String(r.spaShell).padStart(2)}  ` +
      `login=${String(r.loginWall).padStart(2)}  neterr=${String(r.networkError).padStart(2)}  ` +
      `pages-with-mcqs=${r.pagesWithMcqs}`
    );
  }

  // Final per-course OfficialSample counts (across ALL sources, KA + CB).
  console.log(`\nOfficialSample totals after run:`);
  for (const course of Object.keys(TARGETS)) {
    try {
      const { total, byType } = await summarizeCourse(prisma, course);
      const types = byType.map((r) => `${r.questionType}=${r._count}`).join(" ");
      console.log(`  ${course.padEnd(22)} total=${total}  (${types})`);
    } catch (e) {
      console.log(`  ${course.padEnd(22)} summarize failed: ${String(e.message).slice(0, 80)}`);
    }
  }

  await prisma.$disconnect();
  return overall;
}

const isDirect = import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isDirect) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main, TARGETS, extractMcqs, isChallengeStub };

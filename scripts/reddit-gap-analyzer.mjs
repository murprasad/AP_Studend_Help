/**
 * Reddit Gap Analyzer
 *
 * Takes the latest scripts/data/reddit-exam-signals-<date>.json and runs
 * an LLM pass over each post to extract product-relevant signals across
 * five categories:
 *
 *   1. content_quality    — wrong answer / mismatched explanation / broken Q
 *   2. missing_feature    — "wish there was audio practice", "no flashcards"
 *   3. ux_friction        — "couldn't find diagnostic", "lost my progress"
 *   4. marketing          — high-intent student who'd benefit from our product
 *   5. specific_bug       — names a specific Q or feature that's broken
 *
 * Also surfaces a per-course "auto-link to bank" line — counts our approved
 * Qs for any mentioned course and reports against the 500-Q target.
 *
 * Outputs markdown to data/reddit-gap-report-<date>.md and prints to stdout.
 *
 * Auto-invoked by the daily reddit-weekly-report.mjs cron, but also runnable
 * standalone:
 *
 *   node scripts/reddit-gap-analyzer.mjs
 *   node scripts/reddit-gap-analyzer.mjs --signals=scripts/data/reddit-exam-signals-2026-05-27.json
 */
import "dotenv/config";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const REPO = process.cwd().includes("AP_Help") ? "StudentNest" : "PrepLion";
const SIGNALS_DIR = "scripts/data";

function findLatestSignalsFile() {
  if (args.signals) return args.signals;
  const files = readdirSync(SIGNALS_DIR)
    .filter((f) => /^reddit-exam-signals-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  return files.length > 0 ? `${SIGNALS_DIR}/${files[files.length - 1]}` : null;
}

const path = findLatestSignalsFile();
if (!path) {
  console.error(`No reddit-exam-signals-*.json found in ${SIGNALS_DIR}`);
  process.exit(1);
}
const { date, signals } = JSON.parse(readFileSync(path, "utf8"));
console.log(`Loaded ${signals.length} signals from ${path} (date: ${date})`);

// ── LLM classifier (Groq free tier, llama-3.3-70b) ───────────────────────
const GROQ_KEY = process.env.GROQ_API_KEY;
async function classifyPost(post) {
  if (!GROQ_KEY) return null;
  const body = [
    `Title: ${post.title || ""}`,
    `Subreddit: r/${post.subreddit}`,
    `Body: ${(post.body || post.selftext || "").slice(0, 1500)}`,
    `Top comments: ${(post.topComments || []).slice(0, 3).map((c) => `[★${c.score}] ${(c.body || "").slice(0, 300)}`).join(" | ").slice(0, 1500)}`,
  ].join("\n");

  const system = `You analyze a Reddit post about a CLEP/AP/SAT/ACT exam-prep platform (${REPO}).
Extract product-relevant signals as JSON. Skip generic posts that don't reveal a product gap or opportunity.

Return ONE JSON object:
{
  "is_relevant": true|false,
  "categories": ["content_quality"|"missing_feature"|"ux_friction"|"marketing"|"specific_bug"],
  "summary": "<one sentence — what's the product signal>",
  "course_mentioned": "<exam name e.g. 'CLEP American Government' or null>",
  "verbatim_quote": "<<=200 chars from the post that conveys the signal>"
}

Rules:
- is_relevant=false for generic "I passed!" posts UNLESS they include study tips, score range, or named resources we could index
- is_relevant=true if the post:
   * complains about a specific question being wrong or unclear
   * wishes for a missing feature (audio, flashcards, etc.)
   * struggles with our UI / can't find something
   * is a high-intent student who'd benefit from our product
   * mentions a competitor positively/negatively (Modern States, FreeClepPrep, Petersons, etc.)
- categories: pick 1-3 from the enum
- course_mentioned: extract specific exam name if mentioned
- verbatim_quote: cite the actual user's words

Output JSON only, no markdown, no prose.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: body },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const txt = j?.choices?.[0]?.message?.content || "{}";
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

// ── Course-mention → DB-state lookup ─────────────────────────────────────
const COURSE_NAME_TO_ENUM = {
  // PL CLEP
  "clep american government": "CLEP_AMERICAN_GOVERNMENT",
  "american government": "CLEP_AMERICAN_GOVERNMENT",
  "clep biology": "CLEP_BIOLOGY",
  "clep chemistry": "CLEP_CHEMISTRY",
  "clep college algebra": "CLEP_COLLEGE_ALGEBRA",
  "college algebra": "CLEP_COLLEGE_ALGEBRA",
  "clep college math": "CLEP_COLLEGE_MATH",
  "clep college mathematics": "CLEP_COLLEGE_MATH",
  "clep calculus": "CLEP_CALCULUS",
  "clep precalculus": "CLEP_PRECALCULUS",
  "clep american literature": "CLEP_AMERICAN_LITERATURE",
  "american literature": "CLEP_AMERICAN_LITERATURE",
  "clep english literature": "CLEP_ENGLISH_LITERATURE",
  "english literature": "CLEP_ENGLISH_LITERATURE",
  "clep analyzing and interpreting literature": "CLEP_ANALYZING_INTERPRETING_LIT",
  "analyzing and interpreting literature": "CLEP_ANALYZING_INTERPRETING_LIT",
  "analyzing & interpreting literature": "CLEP_ANALYZING_INTERPRETING_LIT",
  "a&i lit": "CLEP_ANALYZING_INTERPRETING_LIT",
  "clep humanities": "CLEP_HUMANITIES",
  "clep us history": "CLEP_US_HISTORY_1",
  "us history": "CLEP_US_HISTORY_1",
  "clep us history 1": "CLEP_US_HISTORY_1",
  "clep us history 2": "CLEP_US_HISTORY_2",
  "clep western civilization 1": "CLEP_WESTERN_CIV_1",
  "western civilization 1": "CLEP_WESTERN_CIV_1",
  "western civ 1": "CLEP_WESTERN_CIV_1",
  "western civ i": "CLEP_WESTERN_CIV_1",
  "western civilization 2": "CLEP_WESTERN_CIV_2",
  "western civ 2": "CLEP_WESTERN_CIV_2",
  "western civ ii": "CLEP_WESTERN_CIV_2",
  "clep introductory psychology": "CLEP_INTRO_PSYCHOLOGY",
  "clep psychology": "CLEP_INTRO_PSYCHOLOGY",
  "clep sociology": "CLEP_INTRODUCTORY_SOCIOLOGY",
  "clep introductory sociology": "CLEP_INTRODUCTORY_SOCIOLOGY",
  "clep macroeconomics": "CLEP_MACROECONOMICS",
  "clep microeconomics": "CLEP_MICROECONOMICS",
  "clep human growth and development": "CLEP_HUMAN_GROWTH_DEV",
  "clep human growth": "CLEP_HUMAN_GROWTH_DEV",
  "clep financial accounting": "CLEP_FINANCIAL_ACCOUNTING",
  "clep information systems": "CLEP_INFORMATION_SYSTEMS",
  "clep principles of marketing": "CLEP_PRINCIPLES_OF_MARKETING",
  "clep marketing": "CLEP_PRINCIPLES_OF_MARKETING",
  "clep principles of management": "CLEP_PRINCIPLES_OF_MANAGEMENT",
  "clep management": "CLEP_PRINCIPLES_OF_MANAGEMENT",
  "clep business law": "CLEP_BUSINESS_LAW",
  "clep natural sciences": "CLEP_NATURAL_SCIENCES",
  "clep social sciences": "CLEP_SOCIAL_SCIENCES_HISTORY",
  "clep social sciences and history": "CLEP_SOCIAL_SCIENCES_HISTORY",
  "clep educational psychology": "CLEP_EDUCATIONAL_PSYCHOLOGY",
  "clep spanish": "CLEP_SPANISH",
  "clep college composition": "CLEP_COLLEGE_COMPOSITION",
  // SN — AP
  "ap biology": "AP_BIOLOGY", "ap chem": "AP_CHEMISTRY", "ap chemistry": "AP_CHEMISTRY",
  "ap physics 1": "AP_PHYSICS_1", "ap physics 2": "AP_PHYSICS_2",
  "ap physics c": "AP_PHYSICS_C_MECHANICS",
  "ap calculus ab": "AP_CALCULUS_AB", "ap calc ab": "AP_CALCULUS_AB",
  "ap calculus bc": "AP_CALCULUS_BC", "ap calc bc": "AP_CALCULUS_BC",
  "ap precalculus": "AP_PRECALCULUS", "ap precalc": "AP_PRECALCULUS",
  "ap statistics": "AP_STATISTICS", "ap stats": "AP_STATISTICS",
  "ap psychology": "AP_PSYCHOLOGY", "ap psych": "AP_PSYCHOLOGY",
  "ap us history": "AP_US_HISTORY", "apush": "AP_US_HISTORY",
  "ap world history": "AP_WORLD_HISTORY",
  "ap european history": "AP_EUROPEAN_HISTORY", "ap euro": "AP_EUROPEAN_HISTORY",
  "ap us government": "AP_US_GOVERNMENT", "ap us gov": "AP_US_GOVERNMENT", "ap gov": "AP_US_GOVERNMENT",
  "ap human geography": "AP_HUMAN_GEOGRAPHY", "ap hug": "AP_HUMAN_GEOGRAPHY",
  "ap macroeconomics": "AP_MACROECONOMICS", "ap macro": "AP_MACROECONOMICS",
  "ap microeconomics": "AP_MICROECONOMICS", "ap micro": "AP_MICROECONOMICS",
  "ap environmental science": "AP_ENVIRONMENTAL_SCIENCE", "apes": "AP_ENVIRONMENTAL_SCIENCE",
  "ap english language": "AP_ENGLISH_LANGUAGE", "ap lang": "AP_ENGLISH_LANGUAGE",
  "ap english literature": "AP_ENGLISH_LITERATURE", "ap lit": "AP_ENGLISH_LITERATURE",
  "ap computer science a": "AP_COMPUTER_SCIENCE_A", "ap csa": "AP_COMPUTER_SCIENCE_A",
  "ap computer science principles": "AP_COMPUTER_SCIENCE_PRINCIPLES", "ap csp": "AP_COMPUTER_SCIENCE_PRINCIPLES",
  // SN — SAT / ACT / PSAT
  "sat math": "SAT_MATH",
  "sat reading and writing": "SAT_READING_WRITING", "sat r/w": "SAT_READING_WRITING", "sat reading": "SAT_READING_WRITING",
  "act math": "ACT_MATH",
  "act english": "ACT_ENGLISH",
  "act reading": "ACT_READING",
  "act science": "ACT_SCIENCE",
  "psat math": "PSAT_MATH",
  "psat reading and writing": "PSAT_READING_WRITING", "psat r/w": "PSAT_READING_WRITING",
};

function normalizeName(s) {
  return (s || "").toLowerCase().replace(/[^\w\s&/]/g, " ").replace(/\s+/g, " ").trim();
}
function resolveCourse(name) {
  if (!name) return null;
  const n = normalizeName(name);
  if (COURSE_NAME_TO_ENUM[n]) return COURSE_NAME_TO_ENUM[n];
  // Try substring matches
  for (const [k, v] of Object.entries(COURSE_NAME_TO_ENUM)) {
    if (n.includes(k)) return v;
  }
  return null;
}

async function getBankState(courseEnum) {
  try {
    const r = await sql`SELECT COUNT(*)::int AS approved FROM questions WHERE course::text = ${courseEnum} AND "isApproved" = true AND "questionType" = 'MCQ'`;
    return r[0]?.approved ?? null;
  } catch {
    return null;
  }
}

// ── Run analysis ──────────────────────────────────────────────────────────
console.log("Classifying posts (this may take a few minutes)...");
const classified = [];
let i = 0;
for (const post of signals.slice(0, 100)) { // cap at 100 posts to bound runtime
  const c = await classifyPost(post);
  if (c?.is_relevant) {
    classified.push({ post, ...c });
  }
  i++;
  if (i % 10 === 0) process.stdout.write(`  ${i}/${Math.min(100, signals.length)}... `);
}
console.log(`\n  done. ${classified.length} relevant signals out of ${i} posts.`);

// ── Group by category + bank lookup ──────────────────────────────────────
const buckets = {
  content_quality: [],
  missing_feature: [],
  ux_friction: [],
  marketing: [],
  specific_bug: [],
};
const courseHits = new Map(); // course enum → count of mentions
for (const c of classified) {
  for (const cat of c.categories || []) {
    if (buckets[cat]) buckets[cat].push(c);
  }
  const enum_ = resolveCourse(c.course_mentioned);
  if (enum_) courseHits.set(enum_, (courseHits.get(enum_) || 0) + 1);
}

// Resolve bank state for each mentioned course
const bankState = {};
for (const courseEnum of courseHits.keys()) {
  bankState[courseEnum] = await getBankState(courseEnum);
}

// ── Emit markdown ────────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
const lines = [];
lines.push(`\n## 🎯 GAPS DETECTED — ${REPO} — ${today}\n`);
lines.push(`Scanned ${signals.length} reddit signals; ${classified.length} flagged as product-relevant.\n`);

const CAT_LABELS = {
  content_quality: "📝 Content quality complaints",
  missing_feature: "✨ Missing-feature signals",
  ux_friction: "🚧 UX friction",
  marketing: "📣 Marketing opportunities (high-intent students)",
  specific_bug: "🐛 Specific bug reports",
};

for (const [cat, label] of Object.entries(CAT_LABELS)) {
  if (buckets[cat].length === 0) continue;
  lines.push(`### ${label} — ${buckets[cat].length}\n`);
  for (const c of buckets[cat]) {
    const url = c.post.url || "#";
    const title = (c.post.title || "").slice(0, 80);
    lines.push(`- **[${title}](${url})** — ${c.summary}`);
    if (c.verbatim_quote) lines.push(`  > "${c.verbatim_quote.slice(0, 180)}"`);
  }
  lines.push("");
}

if (courseHits.size > 0) {
  lines.push(`\n## 📊 AUTO-LINK TO BANK — Course mentions vs our bank state\n`);
  const sorted = [...courseHits.entries()].sort((a, b) => b[1] - a[1]);
  for (const [course, mentions] of sorted) {
    const n = bankState[course];
    const display = course.replace(/_/g, " ");
    let line = `- **${display}** — mentioned ${mentions}× in today's posts. `;
    if (n === null) line += `*(no bank data)*`;
    else if (n >= 500) line += `Our bank: **${n} verified Qs** ✓ (meets 500 target)`;
    else line += `Our bank: ${n} verified Qs ⚠️ (gap ${500 - n} to target)`;
    lines.push(line);
  }
}

if (buckets.content_quality.length === 0 && buckets.missing_feature.length === 0 && buckets.ux_friction.length === 0 && buckets.specific_bug.length === 0 && buckets.marketing.length === 0) {
  lines.push(`\n*(No product-relevant signals detected today.)*`);
}

const md = lines.join("\n");
const outDir = "data";
mkdirSync(outDir, { recursive: true });
const outPath = `${outDir}/reddit-gap-report-${today}.md`;
writeFileSync(outPath, md);
console.log(`\nWrote ${outPath}`);
console.log("\n" + md);

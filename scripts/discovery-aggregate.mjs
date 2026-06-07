/**
 * Customer-Discovery Aggregator — the Cluster→Surface engine.
 * See docs/DEMAND_CYCLE_STRATEGY_2026-06-07.md PART B.
 *
 * Mines the signal we ALREADY collect but never analyze: SessionFeedback
 * free-text (prompted on thumbs-down) + abandon-context rows. Buckets each into
 * a deterministic pain-point taxonomy (keyword match — NOT an LLM judge, per the
 * deterministic-first rule), ranks themes by frequency and by course, and emits
 * a Discovery Report the owner can read in 2 minutes.
 *
 *   node scripts/discovery-aggregate.mjs            # last 90 days
 *   DISCOVERY_DAYS=30 node scripts/discovery-aggregate.mjs
 *
 * Output: data/discovery-reports/pain-points-<YYYY-MM-DD>.{json,md}
 * Read-only against the DB. Cron-wireable (weekly) once validated.
 *
 * NOTE on dates: this script stamps the report with a real wall-clock date and
 * is intended to run as a standalone tool / cron — it is NOT a Workflow script,
 * so Date is available here.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Load DATABASE_URL from .env if the runner didn't inject it.
if (!process.env.DATABASE_URL) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const f of [".env.local", ".env"]) {
    const p = join(root, f);
    if (existsSync(p)) {
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const DAYS = Number(process.env.DISCOVERY_DAYS ?? 90);
const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
const stamp = new Date().toISOString().slice(0, 10);

// ── Pain-point taxonomy (deterministic). Order matters: first match wins per
//    rule, but we tag ALL matching themes so a comment can hit multiple. ──
const TAXONOMY = [
  { theme: "Too hard / over my level", kw: [/too (hard|difficult|advanced)/i, /(can'?t|cannot) (understand|do these)/i, /way (harder|tougher)/i, /impossible/i] },
  { theme: "Too easy / not challenging", kw: [/too easy/i, /not (hard|challenging) enough/i, /baby/i, /trivial/i] },
  { theme: "Confusing wording / ambiguous", kw: [/confus/i, /unclear/i, /ambiguous/i, /(doesn'?t|does not) make sense/i, /poorly worded/i, /(two|multiple) (right|correct) answers/i] },
  { theme: "Looks broken / missing image or graph", kw: [/broke/i, /missing (image|graph|figure|diagram|table|picture)/i, /can'?t see/i, /\[object/i, /render/i, /no (image|graph|figure)/i, /blank/i, /didn'?t load/i] },
  { theme: "Wrong answer / factual error", kw: [/wrong answer/i, /answer is (wrong|incorrect)/i, /(this|that) is (wrong|incorrect)/i, /error in/i, /factually/i, /mistake/i] },
  { theme: "Too repetitive / same questions", kw: [/repetit/i, /same question/i, /repeat/i, /already (saw|seen|did)/i, /keeps showing/i, /duplicate/i] },
  { theme: "Pacing / timing / too long", kw: [/too (long|many)/i, /takes? too long/i, /timer/i, /not enough time/i, /pacing/i, /tired/i, /overwhelm/i] },
  { theme: "Wanted more / better explanation", kw: [/explanation/i, /explain (better|more)/i, /don'?t (get|understand) why/i, /no rationale/i, /more detail/i, /how (do|did)/i] },
  { theme: "Off-topic / not on my exam / outdated", kw: [/not (on|relevant)/i, /off.?topic/i, /wrong (subject|course|exam|topic)/i, /unrelated/i, /nothing to do with/i, /not in (the )?(curriculum|syllabus|exam|test)/i, /(no longer|isn'?t|aren'?t) (on|in|tested|part of)/i, /outdated/i, /removed from/i] },
  { theme: "Tutor / Sage issue", kw: [/sage/i, /tutor/i, /ai (didn'?t|won'?t|wrong)/i, /chat(bot)?/i] },
  // Pricing: specific billing language only. NOT bare /free/ (matches "free
  // response") or bare /charge/ (matches electrical "charge"). Deterministic-
  // validator discipline applied to the taxonomy itself (2026-06-07 false-pos fix).
  { theme: "Pricing / paywall", kw: [/pric(e|ing)/i, /pay(wall|ment)/i, /expensive/i, /cost(s)? (too|so) much/i, /subscri/i, /(over)?charged? (me|my|for|too)/i, /refund/i, /credit card/i] },
  { theme: "Technical / not working / can't submit", kw: [/log ?in/i, /sign ?in/i, /account/i, /password/i, /crash/i, /bug/i, /glitch/i, /(won'?t|wont|can'?t|cant) (open|load|start|submit)/i, /not working/i, /doesn'?t work/i, /(unable|failed) to (submit|load|save)/i, /submission/i] },
];

function classify(text) {
  if (!text) return [];
  const hits = [];
  for (const { theme, kw } of TAXONOMY) {
    if (kw.some((re) => re.test(text))) hits.push(theme);
  }
  return hits.length ? hits : ["Other / uncategorized"];
}

const prisma = new PrismaClient();
try {
  // Pull thumbs-down-with-text + abandon rows. We treat ANY free-text or any
  // abandon as a pain signal; positive thumbs with no text carry no pain info.
  const rows = await prisma.sessionFeedback.findMany({
    where: {
      createdAt: { gte: since },
      OR: [{ feedbackText: { not: null } }, { context: "abandon" }, { rating: -1 }],
    },
    select: {
      rating: true, feedbackText: true, context: true, createdAt: true,
      session: { select: { course: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const themeCounts = new Map();   // theme -> count
  const themeByCourse = new Map(); // theme -> Map(course -> count)
  const examples = new Map();      // theme -> [{text, course}]
  let abandons = 0, thumbsDown = 0, withText = 0;

  for (const r of rows) {
    if (r.context === "abandon") abandons++;
    if (r.rating === -1) thumbsDown++;
    const text = (r.feedbackText ?? "").trim();
    if (text) withText++;
    // Behavioral signal: an abandon with no text still counts as a pacing/
    // overwhelm pain signal (the user quit mid-session).
    const themes = text ? classify(text) : (r.context === "abandon" ? ["Pacing / timing / too long"] : ["Other / uncategorized"]);
    const course = r.session?.course ?? "UNKNOWN";
    for (const t of themes) {
      themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1);
      if (!themeByCourse.has(t)) themeByCourse.set(t, new Map());
      const cm = themeByCourse.get(t);
      cm.set(course, (cm.get(course) ?? 0) + 1);
      if (text) {
        if (!examples.has(t)) examples.set(t, []);
        const ex = examples.get(t);
        if (ex.length < 3) ex.push({ text: text.slice(0, 200), course });
      }
    }
  }

  const ranked = [...themeCounts.entries()]
    .map(([theme, count]) => ({
      theme, count,
      byCourse: Object.fromEntries([...(themeByCourse.get(theme) ?? new Map())].sort((a, b) => b[1] - a[1])),
      examples: examples.get(theme) ?? [],
    }))
    .sort((a, b) => b.count - a.count);

  const report = {
    generatedAt: new Date().toISOString(),
    windowDays: DAYS,
    product: "StudentNest",
    totals: { painSignals: rows.length, abandons, thumbsDown, withFreeText: withText },
    rankedPainPoints: ranked,
  };

  const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "discovery-reports");
  mkdirSync(outDir, { recursive: true });
  const jsonPath = join(outDir, `pain-points-${stamp}.json`);
  const mdPath = join(outDir, `pain-points-${stamp}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const md = [
    `# Customer-Discovery Report — StudentNest (${stamp})`,
    ``,
    `Window: last ${DAYS} days · Pain signals: **${rows.length}** ` +
      `(${abandons} abandons, ${thumbsDown} thumbs-down, ${withText} with free text)`,
    ``,
    rows.length === 0
      ? `> No pain signals in window. Either traffic is low or capture is too narrow ` +
        `(currently thumbs-down/abandon only — see PART B.4 "Expand capture").`
      : `## Top pain points\n\n` + ranked.slice(0, 10).map((p, i) => {
          const courses = Object.entries(p.byCourse).slice(0, 3).map(([c, n]) => `${c}:${n}`).join(", ");
          const ex = p.examples[0] ? `\n   - e.g. "${p.examples[0].text}" (${p.examples[0].course})` : "";
          return `${i + 1}. **${p.theme}** — ${p.count} (${courses})${ex}`;
        }).join("\n"),
    ``,
    `---`,
    `_Generated by scripts/discovery-aggregate.mjs. Deterministic taxonomy; no LLM judge._`,
    `_Next: assign an owner to the top 5, fix per BIQ/RCA, and compare next week's report._`,
  ].join("\n");
  writeFileSync(mdPath, md);

  console.log(md);
  console.log(`\n✅ Wrote ${jsonPath}`);
  console.log(`✅ Wrote ${mdPath}`);
} catch (e) {
  console.error("Discovery aggregation failed:", e.message);
  console.error("(If this is a DB-connection error, ensure DATABASE_URL is set in .env)");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

// Nightly external-URL audit — catches link rot (Khan Academy deprecating
// pages, OpenStax restructuring, etc) BEFORE a real student hits it.
//
// Designed to be invoked from a GH Actions cron (.github/workflows/audit-
// external-urls.yml, MWF 08:00 UTC). Posts failures to contact@preplion.ai
// and writes a JSON report to data/external-url-audits/<date>.json.
//
// Why this exists: G6 SRE gate caught nothing when Khan Academy
// deprecated /test-prep/mcat/* in 2024. Jimmy Sabbatical hit a dead
// theories-of-deviance link on 2026-06-02. This script would have
// detected the rot weekly.
//
// Run: node scripts/_audit-external-urls.mjs [--source=courses|all] [--report]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const FLAGS = process.argv.slice(2);
const SOURCE = FLAGS.find((f) => f.startsWith("--source="))?.split("=")[1] ?? "courses";
const WRITE_REPORT = FLAGS.includes("--report");

// ── 1. Collect URLs from the codebase ───────────────────────────────────────
const sources = [];
if (SOURCE === "courses" || SOURCE === "all") {
  sources.push("src/lib/courses.ts");
  sources.push("src/lib/resource-hub.ts");
}

const urlPattern = /https:\/\/(www\.)?(khanacademy\.org|openstax\.org|libretexts\.org)\/[^\s"'`]+/g;
const urls = new Set();
for (const src of sources) {
  const filePath = path.join(REPO_ROOT, src);
  if (!existsSync(filePath)) continue;
  const content = readFileSync(filePath, "utf8");
  const matches = content.match(urlPattern) ?? [];
  for (const u of matches) urls.add(u);
}
console.log(`Found ${urls.size} unique external URL(s) across ${sources.length} source file(s)`);

// ── 2. Check each URL ───────────────────────────────────────────────────────
const CONCURRENCY = 6;
const queue = [...urls];
const results = [];

async function checkOne(url) {
  try {
    const r = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; QualityProcessAudit/1.0)" },
    });
    const body = await r.text();
    // Khan: SPA returns 200 + JS challenge body when content missing OR bot-detected.
    // Treat the bot-challenge body as "indeterminate" — flag for manual review,
    // not as definitively broken.
    const isBotChallenge = /Client Challenge|Just a moment|JavaScript is disabled/i.test(body);
    const looksBroken = /Sorry, the page you were trying to load doesn't exist/i.test(body)
                     || /page-not-found/i.test(body)
                     || (body.includes('"NotFound"') && body.includes('"errorType"'))
                     || r.status >= 400;
    return {
      url,
      status: r.status,
      verdict: looksBroken ? "BROKEN" : isBotChallenge ? "INDETERMINATE" : "OK",
      bodyLen: body.length,
    };
  } catch (err) {
    return { url, status: 0, verdict: "ERR", error: String(err).slice(0, 200) };
  }
}

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const u = queue.shift();
      const r = await checkOne(u);
      results.push(r);
      const tag = r.verdict.padEnd(13);
      process.stdout.write(`[${results.length}/${urls.size}] ${tag} ${u.slice(0, 100)}\n`);
    }
  }),
);

// ── 3. Report ───────────────────────────────────────────────────────────────
const broken = results.filter((r) => r.verdict === "BROKEN" || r.verdict === "ERR");
const indeterminate = results.filter((r) => r.verdict === "INDETERMINATE");

console.log(`\n=== Summary ===`);
console.log(`  OK:            ${results.filter((r) => r.verdict === "OK").length}`);
console.log(`  INDETERMINATE: ${indeterminate.length} (bot-challenged — manual check)`);
console.log(`  BROKEN:        ${broken.length}`);
if (broken.length) {
  console.log(`\nBROKEN URLs:`);
  for (const b of broken) console.log(`  [${b.status}] ${b.url}`);
}

if (WRITE_REPORT) {
  const reportDir = path.join(REPO_ROOT, "data", "external-url-audits");
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const report = path.join(reportDir, `${date}.json`);
  writeFileSync(
    report,
    JSON.stringify({ date, total: results.length, broken, indeterminate, results }, null, 2),
  );
  console.log(`\nReport written: ${report}`);
}

// Exit non-zero if any URL is broken — fails CI cron, triggering alert email.
process.exit(broken.length > 0 ? 1 : 0);

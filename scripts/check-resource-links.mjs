/**
 * Link-Validation Gate (render-based) — verifies hardcoded resource/explanation
 * URLs actually resolve in a real browser. Plain HTTP is insufficient: SPAs like
 * Khan Academy return HTTP 200 for dead deep-links and only show "Page not found"
 * client-side. We render each page and check the document TITLE (body has nav
 * noise; the title is the clean signal — control-verified 2026-06-07).
 * Addresses the user-reported broken Piaget link + "gate so broken links can't ship".
 *
 *   node scripts/check-resource-links.mjs                 # all URLs in courses.ts
 *   ONLY=khanacademy node scripts/check-resource-links.mjs
 * Output: data/link-audit-<date>.json. Exit 1 if any broken.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ONLY = process.env.ONLY || "";
const src = readFileSync(join(root, "src", "lib", "courses.ts"), "utf8");

const seen = new Set();
const urls = [];
for (const m of src.matchAll(/https?:\/\/[^\s"'`)]+/g)) {
  const url = m[0].replace(/[.,)]+$/, "");
  if (ONLY && !url.includes(ONLY)) continue;
  if (!seen.has(url)) { seen.add(url); urls.push(url); }
}
console.log(`Render-checking ${urls.length} unique URLs${ONLY ? ` (filter: ${ONLY})` : ""}\n`);

// Title patterns that mean the page is dead. PRECISE — bare /error/ matches
// "tERROR"/"error analysis" and bare /not found/ over-fires; KA's real dead-page
// title is exactly "Page not found | Khan Academy". (verify-don't-assume, 2026-06-07)
const DEAD_TITLE = /\bpage not found\b|\b404\b|^oops|\boops[!.]/i;

const browser = await chromium.launch();
const page = await browser.newPage({ userAgent: "Mozilla/5.0 (link-audit)" });
const broken = [];
let done = 0;
for (const url of urls) {
  let verdict = null;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const title = (await page.title().catch(() => "")) || "";
    if (!title.trim()) verdict = { why: "empty title (no render)" };
    else if (DEAD_TITLE.test(title)) verdict = { why: `dead title: "${title.slice(0, 50)}"` };
  } catch (e) { verdict = { why: e.name === "TimeoutError" ? "timeout" : e.message.slice(0, 40) }; }
  done++;
  if (verdict) { broken.push({ url, ...verdict }); console.log(`  ✗ ${verdict.why} — ${url.slice(0, 90)}`); }
  if (done % 20 === 0) console.log(`  …${done}/${urls.length} (${broken.length} broken)`);
}
await browser.close();

console.log(`\n=== ${broken.length} broken of ${urls.length} ===`);
const outDir = join(root, "data");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
writeFileSync(join(outDir, `link-audit-${stamp}.json`), JSON.stringify({ checked: urls.length, broken }, null, 2));
console.log(`Wrote data/link-audit-${stamp}.json`);
process.exit(broken.length > 0 ? 1 : 0);

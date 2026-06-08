/**
 * Auto-fix dead Khan Academy links found by check-resource-links.mjs.
 * For each broken URL, derive a search query from its own slug (last meaningful
 * path segment) and replace it with a KA search URL — which always resolves and
 * survives future KA reorganizations. DRY by default; APPLY=1 to write courses.ts.
 *
 *   node scripts/_fix-dead-ka-links.mjs                 # dry (show replacements)
 *   APPLY=1 node scripts/_fix-dead-ka-links.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const APPLY = process.env.APPLY === "1";
const auditPath = [join(root, "data", "link-audit-2026-06-08.json"), join(root, "data", "link-audit-2026-06-07.json")].find(existsSync);
if (!auditPath) { console.error("No link-audit JSON found — run check-resource-links.mjs first."); process.exit(1); }
const broken = JSON.parse(readFileSync(auditPath, "utf8")).broken.filter((b) => b.url.includes("khanacademy.org"));

const STOP = new Set(["v", "test-prep", "science", "math", "humanities", "computing", "a", "e", "ap", "the", "of", "and", "x2f8bb11595b61c86"]);
function searchUrlFor(url) {
  const path = url.replace(/^https?:\/\/[^/]+\//, "").split(/[?#]/)[0];
  // KA uses `topic-hash:descriptive-slug` segments — split on ":" too so we keep
  // the descriptive slug ("rational-exponents-radicals"), not the topic name.
  const segs = path.split("/").filter(Boolean).flatMap((s) => s.split(":"));
  // pick the last segment that looks descriptive (hyphenated words, not an id/hash)
  let slug = "";
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    if (/^[a-z0-9-]+$/i.test(s) && /[a-z]/i.test(s) && !/^x[0-9a-f]{6,}/i.test(s) && !STOP.has(s.toLowerCase())) { slug = s; break; }
  }
  if (!slug) slug = segs[segs.length - 1] || "khan academy";
  const query = slug.replace(/-/g, " ").replace(/\b([a-z]) s\b/g, "$1's").replace(/\s+\d+([-]\d+)?$/, "").trim();
  return `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(query)}`;
}

let src = readFileSync(join(root, "src", "lib", "courses.ts"), "utf8");
let replaced = 0;
for (const b of broken) {
  if (!src.includes(b.url)) continue; // already fixed / not in this repo's courses.ts
  const repl = searchUrlFor(b.url);
  console.log(`  ${b.url.slice(30, 90)}\n   → ${repl.slice(40)}`);
  if (APPLY) { src = src.split(b.url).join(repl); }
  replaced++;
}
console.log(`\n${APPLY ? "Replaced" : "Would replace"} ${replaced} dead KA links.`);
if (APPLY) { writeFileSync(join(root, "src", "lib", "courses.ts"), src); console.log("✅ Wrote src/lib/courses.ts"); }
else console.log("DRY — re-run with APPLY=1.");

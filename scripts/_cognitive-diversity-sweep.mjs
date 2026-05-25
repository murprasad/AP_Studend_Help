/**
 * UARP §6.4 — Cognitive Diversity Monitoring.
 *
 * Detects template/phrasing repetition across each course. If 30k generated Qs
 * have the same stem opening "Which of the following is most likely..." 40% of
 * the time, the generator collapsed into a rut. CB never does that.
 *
 * Output: data/cognitive-diversity-report.json — top-repeated openings per
 * course, plus flagged Qs that contribute to >30% template-share within a unit.
 *
 * Review-only (no auto-unapprove). Surfaces in admin / sweep email so we can
 * direct regen at the worst offenders.
 *
 * Usage:
 *   node _cognitive-diversity-sweep.mjs                  # full report
 *   node _cognitive-diversity-sweep.mjs --threshold=0.3  # flag at 30% share
 *   node _cognitive-diversity-sweep.mjs --course=CLEP_PSYCHOLOGY
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const THRESHOLD = Number(args.threshold ?? 0.30);   // template-share that triggers flag
const COURSE = args.course ?? null;
const N_PREFIX_WORDS = 5;                            // measure first 5 words

console.log(`Cognitive Diversity Sweep — threshold=${(THRESHOLD * 100).toFixed(0)}% template-share, N=${N_PREFIX_WORDS} word prefix`);

const rows = COURSE
  ? await sql`SELECT id, course::text AS course, unit::text AS unit, "questionText" FROM questions WHERE course::text = ${COURSE} AND "isApproved" = true AND "questionType" = 'MCQ'`
  : await sql`SELECT id, course::text AS course, unit::text AS unit, "questionText" FROM questions WHERE "isApproved" = true AND "questionType" = 'MCQ'`;

console.log(`Loaded ${rows.length.toLocaleString()} approved MCQs`);

// Normalize a stem opening to its first N words, lowercased, no punctuation
function stemPrefix(text, n = N_PREFIX_WORDS) {
  if (!text) return "";
  const cleaned = text.replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return cleaned.split(" ").slice(0, n).join(" ");
}

// Group by (course, unit, prefix)
const groups = new Map();
for (const r of rows) {
  const prefix = stemPrefix(r.questionText);
  if (!prefix) continue;
  const key = `${r.course}|${r.unit}|${prefix}`;
  if (!groups.has(key)) groups.set(key, { course: r.course, unit: r.unit, prefix, ids: [] });
  groups.get(key).ids.push(r.id);
}

// Per-unit totals
const unitTotals = new Map();
for (const r of rows) {
  const key = `${r.course}|${r.unit}`;
  unitTotals.set(key, (unitTotals.get(key) || 0) + 1);
}

// Compute template share + flag
const flagged = [];
const courseReport = new Map();
for (const [key, g] of groups) {
  const unitKey = `${g.course}|${g.unit}`;
  const total = unitTotals.get(unitKey) || 1;
  const share = g.ids.length / total;
  if (!courseReport.has(g.course)) courseReport.set(g.course, []);
  courseReport.get(g.course).push({ unit: g.unit, prefix: g.prefix, count: g.ids.length, unitTotal: total, share: Number(share.toFixed(3)) });
  if (share >= THRESHOLD && g.ids.length >= 3) {
    flagged.push({ ...g, share: Number(share.toFixed(3)), unitTotal: total });
  }
}

// Sort each course's templates by share desc
for (const list of courseReport.values()) list.sort((a, b) => b.share - a.share);

// Top-10 worst offenders globally
const topGlobal = [...flagged].sort((a, b) => b.share - a.share).slice(0, 10);

const outDir = path.join(process.cwd(), "data");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "cognitive-diversity-report.json");
writeFileSync(outPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  threshold: THRESHOLD,
  prefixWords: N_PREFIX_WORDS,
  totals: {
    questionsScanned: rows.length,
    uniqueTemplates: groups.size,
    flaggedClusters: flagged.length,
  },
  topGlobal,
  byCourse: Object.fromEntries([...courseReport.entries()].map(([c, list]) => [c, list.slice(0, 10)])),
  flaggedClusters: flagged,
}, null, 2));

console.log(`\n══ Summary ══`);
console.log(`Questions scanned:    ${rows.length.toLocaleString()}`);
console.log(`Unique templates:     ${groups.size.toLocaleString()}`);
console.log(`Flagged clusters:     ${flagged.length} (template share >= ${(THRESHOLD * 100).toFixed(0)}%)`);
console.log(`\nTop 10 worst offenders:`);
for (const f of topGlobal) {
  console.log(`  ${(f.share * 100).toFixed(0)}%  ${f.course}/${f.unit}  "${f.prefix}…"  (${f.ids.length}/${f.unitTotal})`);
}
console.log(`\nReport: ${outPath}`);

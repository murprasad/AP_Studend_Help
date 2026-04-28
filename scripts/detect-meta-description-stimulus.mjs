// Detect MCQs whose "stimulus" is just a meta-description of source material
// rather than the actual content. Pattern observed: "Passage excerpt from a
// 1845 political speech and an 1847 abolitionist pamphlet" — that's a
// description of WHAT'S there, not the actual primary-source content.
//
// CB stimuli are ALWAYS the actual content. A student presented with a
// meta-description has nothing to read.
//
// Heuristics:
//   1. Stimulus length < 200 chars (real CB stimuli rarely shorter).
//   2. Stimulus contains tells like "Excerpt from a X and a Y", "describes",
//      "Source: ... [no actual quoted content]".
//   3. Stimulus has no quoted text (no '"' or '"'/'"' chars) AND is short.
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const META_PATTERNS = [
  /^[^"'""'']*(?:excerpt from|description of|the following (passage|excerpt|article))[^"'""'']*$/i,
  /^Passage excerpt from .{0,150}$/i,
  /^The (article|passage|text) (describes|discusses|outlines)/i,
  /describes? (.{0,100})$/i,
];

function isMetaDescription(stim) {
  if (!stim) return false;
  const trimmed = stim.trim();
  if (trimmed.length > 250) return false;  // long stimuli usually have content
  // Has a real quote? Then it's not just meta.
  const hasQuote = /["'""''].{20,}["'""'']/i.test(trimmed);
  if (hasQuote) return false;
  // Has a colon-ended source attribution followed by actual content (>= 80 chars after colon)?
  const colonIdx = trimmed.indexOf(":");
  if (colonIdx > 0 && trimmed.length - colonIdx > 100) return false;
  // Just the source attribution alone?
  if (/^Source: [^\n]{20,}$/.test(trimmed)) return true;
  // Meta-description tells
  for (const re of META_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  // Short + no quote = suspicious
  if (trimmed.length < 150) return true;
  return false;
}

const courses = [
  "AP_WORLD_HISTORY", "AP_US_HISTORY", "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY",
  "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_BIOLOGY", "AP_CHEMISTRY",
  "AP_PHYSICS_1", "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC",
  "AP_PRECALCULUS", "AP_COMPUTER_SCIENCE_PRINCIPLES",
];

const totals = { byCourse: {}, total: 0, meta: 0 };

for (const course of courses) {
  const rows = await sql`
    SELECT id, stimulus FROM questions
    WHERE course = ${course}::"ApCourse"
      AND "isApproved" = true
      AND "questionType" = 'MCQ'
      AND stimulus IS NOT NULL
      AND LENGTH(stimulus) > 30
  `;
  let metaCount = 0;
  const samples = [];
  for (const r of rows) {
    if (isMetaDescription(r.stimulus)) {
      metaCount++;
      if (samples.length < 2) samples.push({ id: r.id, stim: r.stimulus.slice(0, 200) });
    }
  }
  totals.byCourse[course] = { total: rows.length, meta: metaCount, samples };
  totals.total += rows.length;
  totals.meta += metaCount;
}

console.log("# Meta-description stimulus detection — 2026-04-28");
console.log(`Total stimuli scanned: ${totals.total}`);
console.log(`Meta-description suspects: ${totals.meta} (${(totals.meta/totals.total*100).toFixed(1)}%)`);
console.log(`\nPer-course:`);
for (const c of courses) {
  const x = totals.byCourse[c];
  console.log(`${c}: ${x.meta}/${x.total} (${x.total > 0 ? ((x.meta/x.total)*100).toFixed(0) : 0}%)`);
}
console.log(`\n## Sample meta-descriptions:`);
for (const c of courses) {
  for (const s of totals.byCourse[c].samples) {
    console.log(`\n${c} — ${s.id.slice(0, 8)}`);
    console.log(`  ${s.stim}`);
  }
}

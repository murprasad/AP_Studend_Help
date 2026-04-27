#!/usr/bin/env node
/**
 * APUSH unit reclassifier — fix the audit finding that 285/499 MCQs are
 * misfiled into APUSH_1_PERIOD_1491_1607 regardless of actual era content.
 *
 * Strategy: scan stimulus + questionText + topic for 4-digit years.
 * Use the LATEST year found (the era the question is set in) to pick unit.
 * If no year, fall back to topic keyword heuristics.
 *
 * Pure SQL/regex — no Groq calls.
 *
 * Usage:
 *   node scripts/reclassify-apush-by-period.mjs --dry      # report changes only
 *   node scripts/reclassify-apush-by-period.mjs            # apply
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const dry = process.argv.includes("--dry");

// CB AP US History periods (ranges per CB CED). Picked exclusive cuts so years map deterministically.
const PERIOD_BY_YEAR = (year) => {
  if (year >= 1980) return "APUSH_9_PERIOD_1980_PRESENT";
  if (year >= 1945) return "APUSH_8_PERIOD_1945_1980";
  if (year >= 1898) return "APUSH_7_PERIOD_1890_1945";
  if (year >= 1865) return "APUSH_6_PERIOD_1865_1898";
  if (year >= 1848) return "APUSH_5_PERIOD_1844_1877";
  if (year >= 1800) return "APUSH_4_PERIOD_1800_1848";
  if (year >= 1754) return "APUSH_3_PERIOD_1754_1800";
  if (year >= 1607) return "APUSH_2_PERIOD_1607_1754";
  return "APUSH_1_PERIOD_1491_1607";
};

// Topic keyword fallback when no year found
const TOPIC_TO_PERIOD = [
  [/\b(prior to european contact|pre.?columbian|native american societies)\b/i, "APUSH_1_PERIOD_1491_1607"],
  [/\b(columbus|conquistador|aztec|inca|first contact)\b/i, "APUSH_1_PERIOD_1491_1607"],
  [/\b(jamestown|plymouth|pilgrims|puritans|salem|colonial era)\b/i, "APUSH_2_PERIOD_1607_1754"],
  [/\b(triangular trade|mercantilism|seven years.?war|french and indian)\b/i, "APUSH_2_PERIOD_1607_1754"],
  [/\b(american revolution|declaration of independence|articles of confederation|constitutional convention)\b/i, "APUSH_3_PERIOD_1754_1800"],
  [/\b(federalist|anti.?federalist|whiskey rebellion|washington administration|alien and sedition)\b/i, "APUSH_3_PERIOD_1754_1800"],
  [/\b(jeffersonian|louisiana purchase|war of 1812|era of good feelings|jacksonian|manifest destiny|second great awakening|trail of tears)\b/i, "APUSH_4_PERIOD_1800_1848"],
  [/\b(missouri compromise|kansas.?nebraska|compromise of 1850|fugitive slave|bleeding kansas|dred scott|civil war|reconstruction|emancipation)\b/i, "APUSH_5_PERIOD_1844_1877"],
  [/\b(gilded age|industrialization|robber barons|homestead strike|pullman strike|populism|populist|jim crow|plessy)\b/i, "APUSH_6_PERIOD_1865_1898"],
  [/\b(progressive era|spanish.?american war|world war i|wwi|roaring twenties|harlem renaissance|great depression|new deal|world war ii|wwii|pearl harbor|fdr|roosevelt)\b/i, "APUSH_7_PERIOD_1890_1945"],
  [/\b(cold war|truman|korean war|mccarthyism|civil rights movement|vietnam war|kennedy|johnson|nixon|watergate|great society)\b/i, "APUSH_8_PERIOD_1945_1980"],
  [/\b(reagan|cold war end|soviet collapse|9.?11|globalization|war on terror|obama|hurricane katrina|tea party)\b/i, "APUSH_9_PERIOD_1980_PRESENT"],
];

function classify(stim, qText, topic) {
  const text = [stim || "", qText || "", topic || ""].join(" ");
  // Find all 4-digit years in 1491-2026 range
  const yearMatches = [...text.matchAll(/\b(1[4-9]\d{2}|20[0-2]\d)\b/g)].map((m) => parseInt(m[1], 10));
  if (yearMatches.length > 0) {
    // Use latest year — captures "Kansas-Nebraska Act of 1854" type stems
    const latestYear = Math.max(...yearMatches);
    return { unit: PERIOD_BY_YEAR(latestYear), reason: `year=${latestYear}` };
  }
  // Topic keyword fallback
  const topicLower = topic?.toLowerCase() ?? "";
  for (const [re, unit] of TOPIC_TO_PERIOD) {
    if (re.test(text) || re.test(topicLower)) {
      return { unit, reason: `topic-match=${re.source.slice(0, 30)}` };
    }
  }
  return null; // can't classify
}

const rows = await sql`
  SELECT id, unit::text as unit, topic, stimulus, "questionText"
  FROM questions
  WHERE course = 'AP_US_HISTORY'::"ApCourse"
    AND "isApproved" = true
    AND "questionType" = 'MCQ'
    AND unit = 'APUSH_1_PERIOD_1491_1607'::"ApUnit"
`;
console.log(`Found ${rows.length} APUSH MCQs in Period 1 (1491-1607). Auditing...`);

const counts = {};
const moves = [];
const unclassified = [];
for (const r of rows) {
  const result = classify(r.stimulus, r.questionText, r.topic);
  if (!result) {
    unclassified.push(r);
    continue;
  }
  if (result.unit !== "APUSH_1_PERIOD_1491_1607") {
    counts[result.unit] = (counts[result.unit] || 0) + 1;
    moves.push({ id: r.id, from: "P1", to: result.unit, reason: result.reason, q: r.questionText.slice(0, 60) });
  }
}

console.log(`\nPlanned moves: ${moves.length}`);
console.log(`Will remain in P1 (correctly): ${rows.length - moves.length - unclassified.length}`);
console.log(`Unclassifiable (no year, no topic match): ${unclassified.length}`);
console.log("\nDistribution after move:");
for (const [u, c] of Object.entries(counts).sort(([, a], [, b]) => b - a)) {
  console.log(`  ${u}: +${c}`);
}

console.log("\nSample moves:");
moves.slice(0, 8).forEach((m) => console.log(`  ${m.id.slice(0, 8)} → ${m.to} [${m.reason}] "${m.q}"`));

if (dry) {
  console.log("\n--dry — no DB writes.");
  process.exit(0);
}

console.log("\nApplying moves...");
let applied = 0, errors = 0;
for (const m of moves) {
  try {
    await sql`UPDATE questions SET unit = ${m.to}::"ApUnit", "updatedAt" = NOW() WHERE id = ${m.id}`;
    applied++;
    if (applied % 50 === 0) console.log(`  ${applied}/${moves.length}…`);
  } catch (e) {
    errors++;
    if (errors <= 5) console.error(`  ✗ ${m.id.slice(0, 8)}: ${e.message?.slice(0, 100)}`);
  }
}

console.log(`\n── Summary ──`);
console.log(`  Reclassified: ${applied}`);
console.log(`  Errors: ${errors}`);
console.log(`  Unclassifiable (left in P1): ${unclassified.length}`);

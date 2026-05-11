/**
 * scripts/validate-topic-tags.mjs
 *
 * Topic-tagging validator. Fixes the bug class I found in the 2026-05-08
 * student-persona audit: legacy questions about "Congress of Vienna 1815"
 * tagged as `unit=EURO_2_AGE_OF_REFORMATION` (1500s era) and topic
 * "Renaissance and Exploration (1450-1648)".
 *
 * Strategy:
 *   1. For each course, build a unit→keyword map from COURSE_REGISTRY
 *      (existing unit names, time periods, key themes).
 *   2. For each approved question, scan stem + stimulus for unit-specific
 *      keywords (e.g., "Congress of Vienna" → must be unit-3-era).
 *   3. If stored unit doesn't match the detected keywords → MISMATCH.
 *   4. Output: data/topic-tag-mismatches.json with course/id/oldUnit/suggestedUnit/evidence.
 *
 * Run:
 *   node scripts/validate-topic-tags.mjs              # report only, no writes
 *   node scripts/validate-topic-tags.mjs --course=AP_EUROPEAN_HISTORY
 *   node scripts/validate-topic-tags.mjs --unapprove  # unapprove mismatched (with 200-floor gate)
 *
 * No LLM calls — pure deterministic regex against course-specific keyword
 * dictionaries.
 */
import "dotenv/config";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--unapprove") return ["unapprove", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COURSE = args.course ?? null;
const UNAPPROVE = !!args.unapprove;

// Unit keyword dictionary. Per-course unit → required keywords (any one
// match accepts the unit assignment). If question text mentions an
// unrelated unit's keywords AND not its own → flag.
//
// Conservative: only includes courses with strong historical / era-based
// unit boundaries where tag-mismatch is most likely.
const UNIT_KEYWORDS = {
  AP_EUROPEAN_HISTORY: {
    "EURO_1_RENAISSANCE_EXPLORATION": ["renaissance", "humanism", "medici", "petrarch", "machiavelli", "exploration", "columbus", "magellan", "vasco da gama", "1450", "1500s", "early modern"],
    "EURO_2_AGE_OF_REFORMATION": ["reformation", "luther", "calvin", "henry viii", "council of trent", "wars of religion", "thirty years war", "huguenot", "1517"],
    "EURO_3_ABSOLUTISM_CONSTITUTIONALISM": ["louis xiv", "absolutism", "peter the great", "glorious revolution", "constitutionalism", "1648", "1700"],
    "EURO_4_SCIENTIFIC_PHILOSOPHICAL_POLITICAL": ["scientific revolution", "enlightenment", "voltaire", "kant", "rousseau", "newton", "social contract", "philosophes"],
    "EURO_5_CONFLICT_LATE_18TH_CENTURY": ["napoleon", "congress of vienna", "metternich", "1815", "concert of europe", "restoration", "1848", "french revolution"],
    "EURO_6_INDUSTRIALIZATION": ["industrial revolution", "factory system", "marx", "communist manifesto", "1840", "1860", "urbanization"],
    "EURO_7_19TH_CENTURY_PERSPECTIVES": ["bismarck", "italian unification", "german unification", "1870", "1871", "darwin", "imperialism scramble"],
    "EURO_8_20TH_CENTURY_GLOBAL_CONFLICTS": ["world war", "ww1", "wwii", "hitler", "stalin", "treaty of versailles", "league of nations", "holocaust"],
    "EURO_9_COLD_WAR_CONTEMPORARY": ["cold war", "berlin wall", "european union", "decolonization", "fall of the soviet"],
  },
  AP_US_HISTORY: {
    "APUSH_1_PERIOD_1491_1607": ["pre-columbian", "native american", "iroquois", "aztec", "before 1491", "1492", "columbus"],
    "APUSH_2_PERIOD_1607_1754": ["jamestown", "plymouth", "puritan", "colonial", "1607", "1620", "salem", "great awakening"],
    "APUSH_3_PERIOD_1754_1800": ["american revolution", "declaration of independence", "1776", "stamp act", "boston tea party", "constitution", "federalist", "washington"],
    "APUSH_4_PERIOD_1800_1848": ["jefferson", "madison", "louisiana purchase", "1800", "war of 1812", "monroe", "jackson", "manifest destiny"],
    "APUSH_5_PERIOD_1844_1877": ["civil war", "lincoln", "emancipation", "reconstruction", "1861", "1865", "confederate", "compromise of 1850"],
    "APUSH_6_PERIOD_1865_1898": ["gilded age", "robber baron", "carnegie", "rockefeller", "labor union", "populist", "1880", "1890"],
    "APUSH_7_PERIOD_1890_1945": ["progressive era", "teddy roosevelt", "muckraker", "world war i", "great depression", "new deal", "wwii"],
    "APUSH_8_PERIOD_1945_1980": ["cold war", "korean war", "vietnam", "civil rights", "mlk", "kennedy", "nixon", "watergate"],
    "APUSH_9_PERIOD_1980_PRESENT": ["reagan", "berlin wall falls", "cold war ends", "9/11", "2008 financial", "obama"],
  },
  AP_WORLD_HISTORY: {
    "UNIT_1_GLOBAL_TAPESTRY": ["dar al-islam", "mongol", "song china", "swahili", "1200", "1300", "1400", "byzantine", "abbasid"],
    "UNIT_2_NETWORKS_OF_EXCHANGE": ["silk road", "indian ocean trade", "trans-saharan", "marco polo", "ibn battuta"],
    "UNIT_3_LAND_BASED_EMPIRES": ["ottoman", "safavid", "mughal", "ming", "qing", "tokugawa", "1450", "1600", "1700"],
    "UNIT_4_TRANSOCEANIC_INTERCONNECTIONS": ["columbian exchange", "atlantic slave trade", "triangular trade", "encomienda", "encomendero"],
    "UNIT_5_REVOLUTIONS": ["french revolution", "american revolution", "industrial revolution", "1750", "1800", "1850", "haitian revolution"],
    "UNIT_6_INDUSTRIALIZATION": ["scramble for africa", "colonization of africa", "berlin conference", "1884", "second industrial"],
    "UNIT_7_GLOBAL_CONFLICT": ["world war", "ww1", "wwii", "1914", "1939", "1945", "holocaust", "treaty of versailles"],
    "UNIT_8_COLD_WAR": ["cold war", "decolonization", "vietnam", "gandhi", "mao", "1947", "1960", "iron curtain"],
    "UNIT_9_GLOBALIZATION": ["globalization", "berlin wall falls", "european union", "9/11", "1989", "2001", "neoliberal"],
  },
};

let courses = Object.keys(UNIT_KEYWORDS);
if (COURSE) courses = courses.filter((c) => c === COURSE);
if (courses.length === 0) {
  console.error("No courses match. Available:", Object.keys(UNIT_KEYWORDS).join(", "));
  process.exit(1);
}

console.log(`Validating topic tags for ${courses.length} course(s)...`);
console.log(UNAPPROVE ? "Mode: WRITE (will unapprove mismatches per 200-floor)" : "Mode: DRY (report only)");

const findings = [];

for (const course of courses) {
  const dict = UNIT_KEYWORDS[course];
  const rows = await sql`
    SELECT id, unit::text AS unit, topic, "questionText", stimulus
    FROM questions
    WHERE course::text = ${course} AND "isApproved" = true
  `;
  console.log(`\n${course}: ${rows.length} approved questions`);

  let mismatches = 0;
  for (const r of rows) {
    const text = (r.questionText + " " + (r.stimulus ?? "") + " " + JSON.stringify(r.topic ?? "")).toLowerCase();
    // Find which unit's keywords appear in this question's text
    const detected = [];
    for (const [unit, kws] of Object.entries(dict)) {
      for (const kw of kws) {
        if (text.includes(kw.toLowerCase())) { detected.push({ unit, kw }); break; }
      }
    }
    if (detected.length === 0) continue; // no recognizable era keywords — pass
    // If stored unit not in detected list → mismatch
    const storedUnit = r.unit;
    const detectedUnits = new Set(detected.map((d) => d.unit));
    if (!detectedUnits.has(storedUnit)) {
      mismatches++;
      findings.push({
        course,
        id: r.id,
        storedUnit,
        suggestedUnits: [...detectedUnits],
        evidence: detected.map((d) => d.kw),
        stemPreview: r.questionText.slice(0, 120),
      });
    }
  }
  console.log(`  mismatches: ${mismatches}`);
}

const outDir = join(process.cwd(), "data", "topic-tag-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(outDir, `topic-tag-${ts}.json`);
writeFileSync(outFile, JSON.stringify({ findings, generatedAt: new Date().toISOString(), totalMismatches: findings.length }, null, 2));
console.log(`\n══ Total: ${findings.length} mismatches ══`);
console.log(`Artifact: ${outFile}`);
if (findings.length > 0) {
  console.log("\nFirst 5 examples:");
  for (const f of findings.slice(0, 5)) {
    console.log(`  [${f.course}] id=${f.id.slice(0, 8)} stored=${f.storedUnit} → suggested=${f.suggestedUnits.join("/")}  evidence=${f.evidence.join(",")}`);
    console.log(`    stem: ${f.stemPreview}`);
  }
}

if (UNAPPROVE && findings.length > 0) {
  // 200-floor safety: only unapprove if course will stay >= 200
  console.log("\nApplying 200-floor safety gate...");
  const byCourse = {};
  for (const f of findings) {
    if (!byCourse[f.course]) byCourse[f.course] = [];
    byCourse[f.course].push(f.id);
  }
  let totalUnapproved = 0;
  for (const [course, ids] of Object.entries(byCourse)) {
    const cur = await sql`SELECT COUNT(*)::int AS c FROM questions WHERE course::text = ${course} AND "isApproved" = true AND "questionType" = 'MCQ'`;
    const currentApproved = cur[0]?.c ?? 0;
    const maxAllowed = Math.max(0, currentApproved - 200);
    const toUnapprove = ids.slice(0, maxAllowed);
    if (toUnapprove.length === 0) {
      console.log(`  ${course}: SKIP (current ${currentApproved}, can't drop)`);
      continue;
    }
    if (toUnapprove.length < ids.length) {
      console.log(`  ${course}: cap ${toUnapprove.length}/${ids.length} (keep >=200)`);
    }
    await sql`UPDATE questions SET "isApproved" = false, "auditPassed" = false WHERE id = ANY(${toUnapprove})`;
    totalUnapproved += toUnapprove.length;
    console.log(`  ${course}: unapproved ${toUnapprove.length}`);
  }
  console.log(`\n✓ Total unapproved: ${totalUnapproved}`);
}

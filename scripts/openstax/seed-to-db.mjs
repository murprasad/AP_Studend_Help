/**
 * scripts/openstax/seed-to-db.mjs — Phase 3 of OpenStax ingest.
 *
 * Reads extracted-with-answers.json, classifies each high-confidence Q
 * into an AP unit via Groq, computes contentHash, and inserts into
 * `questions` with FULL source attribution.
 *
 * IMPORTANT INSERT CONTRACT (per HARD REQ feedback memory):
 *   - isApproved = false        — must pass pipeline + gates first
 *   - pipelineVetted = false    — promoted only by ensemble-sweep
 *   - auditPassed = false       — promoted only by audit
 *   - isAiGenerated = false     — these came from OpenStax textbook, not AI
 *   - modelUsed = "groq-answer-key" — answer-key was AI-determined though
 *   - sourceBook, sourceUrl, sourcePage (where available), sourceLicense
 *     = "CC BY 4.0", sourceChapter
 *
 * Run:
 *   node scripts/openstax/seed-to-db.mjs --book=biology-ap-courses --course=AP_BIOLOGY [--limit=50]
 *   node scripts/openstax/seed-to-db.mjs --book=biology-ap-courses --course=AP_BIOLOGY --dry
 *
 * After seeding, run scripts/ensemble-sweep.mjs to promote the new rows
 * through the same gates as AI-generated content.
 */
import "dotenv/config";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--dry") return ["dry", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const BOOK = args.book;
const COURSE = args.course;
const DRY = !!args.dry;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 4;

if (!BOOK || !COURSE) {
  console.error("usage: --book=<slug> --course=<ApCourse> [--limit=N] [--dry]");
  process.exit(1);
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const dir = join(process.cwd(), "data", "openstax", BOOK);
const inPath = join(dir, "extracted-with-answers.json");
if (!existsSync(inPath)) {
  console.error(`Missing ${inPath}. Run determine-answers.mjs first.`);
  process.exit(2);
}

const data = JSON.parse(readFileSync(inPath, "utf-8"));
const allQs = data.questions;

// Filter for high-confidence answered
const usable = allQs.filter((q) => q.correctAnswer && q.answerConfidence === "high");
console.log(`Book ${BOOK}: ${allQs.length} extracted, ${usable.length} high-confidence usable`);

// Look up valid units for this course from the DB enum
const enumRow = await sql`SELECT enum_range(NULL::"ApUnit")::text AS u`;
const allUnits = enumRow[0].u.replace(/^{|}$/g, "").split(",");
// Heuristic: AP_BIOLOGY → BIO_, AP_PSYCHOLOGY → PSYCH_, etc.
const coursePrefixes = {
  AP_BIOLOGY: ["BIO_"],
  AP_CHEMISTRY: ["CHEM_"],
  AP_PSYCHOLOGY: ["PSYCH_"],
  AP_US_HISTORY: ["APUSH_"],
  AP_WORLD_HISTORY: ["UNIT_"],
  AP_EUROPEAN_HISTORY: ["EURO_"],
  AP_PHYSICS_1: ["P1_"],
  AP_STATISTICS: ["STAT_"],
  AP_CALCULUS_AB: ["CALC_AB_"],
  AP_CALCULUS_BC: ["CALC_BC_"],
  AP_HUMAN_GEOGRAPHY: ["HUGEO_"],
  AP_US_GOVERNMENT: ["USGOV_"],
  AP_MACROECONOMICS: ["MACRO_"],
  AP_MICROECONOMICS: ["MICRO_"],
  AP_ENVIRONMENTAL_SCIENCE: ["ENVSCI_"],
};
const prefixes = coursePrefixes[COURSE] ?? [];
const courseUnits = allUnits.filter((u) => prefixes.some((p) => u.startsWith(p)));
if (courseUnits.length === 0) {
  console.error(`No units found for course ${COURSE} (looking for prefixes ${prefixes.join(",")})`);
  process.exit(3);
}
console.log(`Target course: ${COURSE}, ${courseUnits.length} units available`);
console.log(`  Units: ${courseUnits.join(", ")}`);

const key = process.env.GROQ_API_KEY;
if (!key) { console.error("GROQ_API_KEY required"); process.exit(4); }

async function classifyUnit(q) {
  const unitList = courseUnits.join(", ");
  const prompt = `You are an AP exam content expert. Classify this ${COURSE.replace(/_/g, " ")} question into exactly ONE of the following units. Reply with ONLY the unit name, nothing else.

Question: ${q.stem}

Units (pick exactly one):
${unitList}

Answer with just the unit name (e.g., "BIO_5_HEREDITY"):`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 30,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const txt = (j?.choices?.[0]?.message?.content ?? "").trim();
    // Extract first matching unit name
    for (const u of courseUnits) {
      if (txt.includes(u)) return u;
    }
    return null;
  } catch {
    return null;
  }
}

function contentHashOf(s) {
  const norm = s.toLowerCase().replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(norm).digest("hex");
}

const slice = LIMIT ? usable.slice(0, LIMIT) : usable;
console.log(`\nProcessing ${slice.length} questions (concurrency=${CONCURRENCY}, dry=${DRY})`);

let i = 0;
let classified = 0;
let unclassified = 0;
let inserted = 0;
let skipped = 0;
let errors = 0;
const unitDistribution = {};
const startTs = Date.now();

const sourceUrlBase = `https://openstax.org/details/books/${BOOK}`;

async function worker() {
  while (i < slice.length) {
    const idx = i++;
    const q = slice[idx];
    const unit = await classifyUnit(q);
    if (!unit) { unclassified++; continue; }
    classified++;
    unitDistribution[unit] = (unitDistribution[unit] ?? 0) + 1;

    const hash = contentHashOf(q.stem);
    const options = q.options.map((o) => o.trim());
    const correctLetter = q.correctAnswer.toUpperCase().slice(0, 1);

    if (DRY) continue;
    try {
      const result = await sql`
        INSERT INTO questions (
          id, course, unit, topic, subtopic, difficulty, "questionType",
          "questionText", stimulus, options, "correctAnswer", explanation,
          "isAiGenerated", "isApproved", "contentHash",
          "modelUsed", "pipelineVetted", "auditPassed",
          "sourceBook", "sourceUrl", "sourcePage", "sourceLicense", "sourceChapter",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${COURSE}::"ApCourse", ${unit}::"ApUnit",
          ${q.sectionHeader ?? "OpenStax review"}, '', 'MEDIUM'::"Difficulty", 'MCQ'::"QuestionType",
          ${q.stem}, NULL, ${JSON.stringify(options)}::jsonb, ${correctLetter},
          ${"Source: OpenStax " + BOOK + " (CC BY 4.0). Reasoning: " + (q.answerReasoning ?? "")},
          false, false, ${hash},
          'groq-answer-key', false, false,
          ${BOOK}, ${sourceUrlBase}, ${q.sourcePage ?? null}, 'CC BY 4.0', ${q.sectionHeader ?? null},
          NOW(), NOW()
        )
        ON CONFLICT ("contentHash") DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) inserted++;
      else skipped++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.warn(`Insert error: ${e.message?.slice(0, 200)}`);
    }
    if ((classified + unclassified) % 50 === 0) {
      const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
      console.log(`[${classified + unclassified}/${slice.length}] inserted=${inserted} skipped=${skipped} unclass=${unclassified} err=${errors} t=${elapsed}s`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

const elapsed = ((Date.now() - startTs) / 1000).toFixed(0);
console.log(`\n══ DONE in ${elapsed}s ══`);
console.log(`  processed:     ${slice.length}`);
console.log(`  classified:    ${classified}`);
console.log(`  unclassified:  ${unclassified}`);
console.log(`  inserted:      ${inserted}`);
console.log(`  skipped (dup): ${skipped}`);
console.log(`  errors:        ${errors}`);
console.log(`\nUnit distribution:`);
for (const [u, n] of Object.entries(unitDistribution).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${u.padEnd(38)} ${n}`);
}

const outDir = join(process.cwd(), "data", "openstax-seed-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(outDir, `seed-${BOOK}-${ts}.json`), JSON.stringify({
  book: BOOK, course: COURSE, processedAt: new Date().toISOString(),
  processed: slice.length, classified, unclassified, inserted, skipped, errors, unitDistribution
}, null, 2));
console.log(`\nArtifact: ${join(outDir, `seed-${BOOK}-${ts}.json`)}`);
console.log(`\nNext: run scripts/ensemble-sweep.mjs --course=${COURSE} --only-source=${BOOK} to promote new rows through gates.`);

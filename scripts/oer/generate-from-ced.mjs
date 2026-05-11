/**
 * scripts/oer/generate-from-ced.mjs
 *
 * CED-GROUNDED GENERATOR for STEM + math + econ courses where
 * passage-based gen doesn't apply.
 *
 * Approach:
 *   - Read CB CED text (data/official/AP/CED/*.txt) — already extracted.
 *   - Chunk into ~600-word sections (CED units describe content for whole AP topics).
 *   - For each chunk, prompt Groq to GENERATE 1 AP-style MCQ that tests the
 *     content described in that CED section.
 *   - The QUESTION'S OWN stimulus is AI-generated (a scenario, problem,
 *     equation, etc.); the CED text is NOT stored in the DB (CB copyright).
 *   - sourceBook = "AP {Course Name} Course and Exam Description (CB 2024)"
 *   - sourceUrl = "https://apcentral.collegeboard.org/.../course-and-exam-description"
 *   - sourceLicense = "AI-generated; CB CED used as reference (not redistributed)"
 *
 * The CED is © College Board. We do NOT redistribute it. Generated questions
 * are original AI output stylistically aligned to CB exam content. This is the
 * same posture as textbook authors reading the CED before writing questions.
 *
 * Run:
 *   node scripts/oer/generate-from-ced.mjs --course=AP_PHYSICS_1 --limit=100
 *   node scripts/oer/generate-from-ced.mjs --course=AP_PHYSICS_1 --concurrency=4
 *   node scripts/oer/generate-from-ced.mjs --course=AP_PHYSICS_1 --dry --limit=5
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (a === "--dry") return ["dry", true];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const COURSE = args.course;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 3;
const DRY = !!args.dry;

if (!COURSE) {
  console.error("usage: --course=<ApCourse> [--limit=N] [--dry]");
  process.exit(1);
}

// Course → CED filename + AP-Central URL slug
const CED_MAP = {
  AP_BIOLOGY: { file: "ap-biology-ced.txt", urlSlug: "ap-biology" },
  AP_CHEMISTRY: { file: "ap-chemistry-ced.txt", urlSlug: "ap-chemistry" },
  AP_PHYSICS_1: { file: "ap-physics-1-ced.txt", urlSlug: "ap-physics-1" },
  AP_CALCULUS_AB: { file: "ap-calc-ab-bc-ced.txt", urlSlug: "ap-calculus-ab" },
  AP_CALCULUS_BC: { file: "ap-calc-ab-bc-ced.txt", urlSlug: "ap-calculus-bc" },
  AP_PRECALCULUS: { file: "ap-precalculus-ced.txt", urlSlug: "ap-precalculus" },
  AP_STATISTICS: { file: "ap-statistics-ced.txt", urlSlug: "ap-statistics" },
  AP_COMPUTER_SCIENCE_PRINCIPLES: { file: "ap-computer-science-principles-ced.txt", urlSlug: "ap-computer-science-principles" },
  AP_ENVIRONMENTAL_SCIENCE: { file: "ap-environmental-science-ced.txt", urlSlug: "ap-environmental-science" },
  AP_HUMAN_GEOGRAPHY: { file: "ap-human-geography-ced.txt", urlSlug: "ap-human-geography" },
  AP_MACROECONOMICS: { file: "ap-macroeconomics-ced.txt", urlSlug: "ap-macroeconomics" },
  AP_MICROECONOMICS: { file: "ap-microeconomics-ced.txt", urlSlug: "ap-microeconomics" },
  AP_PSYCHOLOGY: { file: "ap-psychology-ced.txt", urlSlug: "ap-psychology" },
  AP_US_HISTORY: { file: "ap-us-history-ced.txt", urlSlug: "ap-united-states-history" },
  AP_US_GOVERNMENT: { file: "ap-us-government-and-politics-ced.txt", urlSlug: "ap-united-states-government-and-politics" },
  AP_WORLD_HISTORY: { file: "ap-world-history-modern-ced.txt", urlSlug: "ap-world-history-modern" },
  AP_PHYSICS_2: { file: "ap-physics-2-ced.txt", urlSlug: "ap-physics-2" },
  AP_PHYSICS_C_MECHANICS: { file: "ap-physics-c-mechanics-ced.txt", urlSlug: "ap-physics-c-mechanics" },
  AP_PHYSICS_C_ELECTRICITY_MAGNETISM: { file: "ap-physics-c-electricity-magnetism-ced.txt", urlSlug: "ap-physics-c-electricity-and-magnetism" },
  AP_COMPUTER_SCIENCE_A: { file: "ap-computer-science-a-ced.txt", urlSlug: "ap-computer-science-a" },
  // Cross-CED proxies: SAT/ACT use related AP CEDs as content scaffold,
  // tagged with the SAT/ACT-specific sourceBook to avoid CB mis-attribution.
  ACT_MATH: { file: "ap-precalculus-ced.txt", urlSlug: "act-math", proxy: true, sourceBookOverride: "ACT Math content alignment (precalculus reference)" },
  SAT_MATH: { file: "ap-precalculus-ced.txt", urlSlug: "sat-math", proxy: true, sourceBookOverride: "SAT Math content alignment (precalculus reference)" },
  ACT_SCIENCE: { file: "ap-biology-ced.txt", urlSlug: "act-science", proxy: true, sourceBookOverride: "ACT Science content alignment (biology reference)" },
  AP_EUROPEAN_HISTORY: { file: "ap-european-history-ced.txt", urlSlug: "ap-european-history" },
};

const cedInfo = CED_MAP[COURSE];
if (!cedInfo) {
  console.error(`No CED mapping for ${COURSE}. Known: ${Object.keys(CED_MAP).join(", ")}`);
  process.exit(2);
}

const cedPath = join(process.cwd(), "data", "official", "AP", "CED", cedInfo.file);
if (!existsSync(cedPath)) {
  console.error(`CED file missing: ${cedPath}`);
  process.exit(3);
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

// Look up valid units for course
const enumRow = await sql`SELECT enum_range(NULL::"ApUnit")::text AS u`;
const allUnits = enumRow[0].u.replace(/^{|}$/g, "").split(",");
const coursePrefixes = {
  AP_BIOLOGY: ["BIO_"],
  AP_CHEMISTRY: ["CHEM_"],
  AP_PHYSICS_1: ["PHY1_"],
  AP_PHYSICS_2: ["PHY2_"],
  AP_PHYSICS_C_MECHANICS: ["PHYC_M_"],
  AP_PHYSICS_C_ELECTRICITY_MAGNETISM: ["PHYC_EM_"],
  AP_CALCULUS_AB: ["CALC_AB_"],
  AP_CALCULUS_BC: ["CALC_BC_", "CALC_AB_"],
  AP_PRECALCULUS: ["PRECALC_"],
  AP_STATISTICS: ["STATS_"],
  AP_COMPUTER_SCIENCE_PRINCIPLES: ["CSP_"],
  AP_COMPUTER_SCIENCE_A: ["CSA_"],
  AP_ENVIRONMENTAL_SCIENCE: ["APES_"],
  AP_HUMAN_GEOGRAPHY: ["HUGEO_"],
  AP_MACROECONOMICS: ["MACRO_"],
  AP_MICROECONOMICS: ["MICRO_"],
  AP_PSYCHOLOGY: ["PSYCH_"],
  AP_US_HISTORY: ["APUSH_"],
  AP_US_GOVERNMENT: ["USGOV_"],
  AP_WORLD_HISTORY: ["UNIT_"],
  AP_EUROPEAN_HISTORY: ["EURO_"],
  ACT_MATH: ["ACT_MATH_"],
  SAT_MATH: ["SAT_MATH_"],
  ACT_SCIENCE: ["ACT_SCI_"],
};
const prefixes = coursePrefixes[COURSE] ?? [];
const courseUnits = allUnits.filter((u) => prefixes.some((p) => u.startsWith(p)));
if (courseUnits.length === 0) {
  console.error(`No units in schema for ${COURSE} (prefix ${prefixes.join(",")})`);
  console.error(`Sample units: ${allUnits.slice(0, 20).join(", ")}`);
  process.exit(4);
}
console.log(`Target: ${COURSE} (${courseUnits.length} units)`);
console.log(`CED file: ${cedInfo.file}`);

// Chunk CED text
const fullText = readFileSync(cedPath, "utf-8");
const body = fullText.slice(5000);
const words = body.split(/\s+/);
const CHUNK_WORDS = args.chunkWords ? parseInt(args.chunkWords, 10) : 600;
// Offset can shift the chunk boundaries to produce different question slices
// in repeated runs (useful for filling bank without contentHash dedup eating everything).
const OFFSET = args.offset ? parseInt(args.offset, 10) : 0;
const chunks = [];
for (let i = OFFSET; i < words.length; i += CHUNK_WORDS) {
  const chunk = words.slice(i, i + CHUNK_WORDS).join(" ");
  if (chunk.length > 1500) chunks.push(chunk);
}
console.log(`Chunked CED into ${chunks.length} sections of ~${CHUNK_WORDS} words each (offset=${OFFSET})`);

const key = process.env.GROQ_API_KEY;
if (!key) { console.error("GROQ_API_KEY required"); process.exit(5); }

function contentHashOf(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

async function generateOne(chunk, idx) {
  const prompt = `You are writing an exam question for ${COURSE.replace(/_/g, " ")}.

Below is a section from the official College Board Course and Exam Description. Use it to UNDERSTAND what content/skills are tested. Then write ONE original multiple-choice question that tests the SAME content at the same difficulty/rigor as the real AP exam.

CED CONTEXT (do NOT quote or copy — use for guidance only):
"""
${chunk.slice(0, 2500)}
"""

Requirements:
- Stem must be self-contained (don't reference "the passage above" — the student won't see the CED).
- Include a brief stimulus/scenario if STEM (numerical setup, scenario, diagram description).
- 4 options A–D, exactly one correct.
- Distractors represent real student misconceptions for this skill.
- Difficulty: match real AP exam rigor.

Reply with JSON only:
{
  "questionText": "the question stem (include any scenario/numerical setup directly)",
  "stimulus": "optional separate scenario block, or empty string",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A" | "B" | "C" | "D",
  "explanation": "<200-400 chars explaining why correct answer is correct based on AP content>",
  "skill": "<one-word skill area>",
  "unit": "<one of: ${courseUnits.join(", ")}>"
}`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 900,
        temperature: args.temp ? parseFloat(args.temp) : 0.4,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { ok: false, reason: `http ${res.status}` };
    const j = await res.json();
    const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}");
    if (!parsed.questionText || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
      return { ok: false, reason: "shape" };
    }
    const letter = String(parsed.correctAnswer ?? "A").trim().charAt(0).toUpperCase();
    if (!"ABCD".includes(letter)) return { ok: false, reason: "bad letter" };
    let unit = parsed.unit;
    if (!courseUnits.includes(unit)) unit = courseUnits[0];
    return {
      ok: true,
      data: {
        questionText: parsed.questionText,
        stimulus: typeof parsed.stimulus === "string" && parsed.stimulus.trim() ? parsed.stimulus : null,
        options: parsed.options.map((o) => o.trim()),
        correctAnswer: letter,
        explanation: String(parsed.explanation ?? "").slice(0, 600),
        unit,
        skill: parsed.skill ?? null,
      },
    };
  } catch (e) {
    return { ok: false, reason: e.message?.slice(0, 80) ?? "err" };
  }
}

const slice = LIMIT ? chunks.slice(0, LIMIT) : chunks;
console.log(`\nProcessing ${slice.length} chunks (concurrency=${CONCURRENCY}, dry=${DRY})`);

const sourceBook = cedInfo.sourceBookOverride
  ?? `AP ${COURSE.replace(/^AP_/, "").replace(/_/g, " ")} CED 2024 (CB)`;
const sourceUrl = cedInfo.proxy
  ? `https://www.${cedInfo.urlSlug.startsWith("act") ? "act.org" : "satsuite.collegeboard.org"}`
  : `https://apcentral.collegeboard.org/courses/${cedInfo.urlSlug}/course-and-exam-description`;

let i = 0, generated = 0, inserted = 0, skipped = 0, failed = 0;
const startTs = Date.now();

async function worker() {
  while (i < slice.length) {
    const idx = i++;
    const r = await generateOne(slice[idx], idx);
    if (!r.ok) { failed++; continue; }
    generated++;
    if (DRY) continue;
    const hash = contentHashOf(r.data.questionText + JSON.stringify(r.data.options));
    try {
      const result = await sql`
        INSERT INTO questions (
          id, course, unit, topic, subtopic, difficulty, "questionType",
          "questionText", stimulus, options, "correctAnswer", explanation,
          "isAiGenerated", "isApproved", "contentHash",
          "modelUsed", "pipelineVetted", "auditPassed",
          "sourceBook", "sourceUrl", "sourcePage", "sourceLicense", "sourceChapter",
          "apSkill", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${COURSE}::"ApCourse", ${r.data.unit}::"ApUnit",
          ${r.data.skill ?? "CED-grounded"}, '', 'MEDIUM'::"Difficulty", 'MCQ'::"QuestionType",
          ${r.data.questionText}, ${r.data.stimulus}, ${JSON.stringify(r.data.options)}::jsonb,
          ${r.data.correctAnswer}, ${r.data.explanation},
          true, false, ${hash},
          'groq-ced-grounded', false, false,
          ${sourceBook}, ${sourceUrl}, NULL,
          'AI-generated (CB CED used as content reference, not redistributed)',
          ${`ced-chunk-${idx}`},
          ${r.data.skill}, NOW(), NOW()
        )
        ON CONFLICT ("contentHash") DO NOTHING
        RETURNING id
      `;
      if (result.length > 0) inserted++; else skipped++;
    } catch (e) {
      failed++;
      if (failed <= 3) console.warn(`Insert err: ${e.message?.slice(0, 200)}`);
    }
    if ((generated + failed) % 25 === 0) {
      const t = ((Date.now() - startTs) / 1000).toFixed(0);
      console.log(`[${generated + failed}/${slice.length}] gen=${generated} ins=${inserted} skip=${skipped} fail=${failed} t=${t}s`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

console.log(`\n══ DONE (${COURSE}) ══`);
console.log(`  chunks: ${slice.length}  generated: ${generated}  inserted: ${inserted}  skipped: ${skipped}  failed: ${failed}`);

const outDir = join(process.cwd(), "data", "ced-seed-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(outDir, `ced-${COURSE}-${ts}.json`), JSON.stringify({
  course: COURSE, generatedAt: new Date().toISOString(),
  chunks: slice.length, generated, inserted, skipped, failed
}, null, 2));
console.log(`Next: scripts/deterministic-gate.mjs --course=${COURSE} --approve`);

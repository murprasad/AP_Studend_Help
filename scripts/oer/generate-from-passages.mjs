/**
 * scripts/oer/generate-from-passages.mjs
 *
 * Phase 3 of Gutenberg ingest. Generates one CB-AP-Lit-style MCQ per
 * passage chunk via Groq, grounded in the passage as stimulus.
 *
 * Each inserted question has:
 *   stimulus:      passage text (capped at 1800 chars; longer chunks get split)
 *   sourceBook:    "<title> by <author>"
 *   sourceUrl:     https://www.gutenberg.org/ebooks/<id>
 *   sourceLicense: "Public Domain (US)"
 *   isApproved:    false      — must pass pipeline gates first
 *   pipelineVetted: false     — promoted by ensemble-sweep
 *   isAiGenerated: true       — questions ARE AI-generated (stimulus is the textbook part)
 *   modelUsed:     "groq-passage-grounded"
 *
 * Per HARD REQ feedback memory: every Q traceable to official-source-grounded
 * passage; pipeline gate (deterministic + ensemble) before approval.
 *
 * Usage:
 *   node scripts/oer/generate-from-passages.mjs --id=1342 --course=AP_ENGLISH_LITERATURE --limit=20
 *   node scripts/oer/generate-from-passages.mjs --id=1342 --course=AP_ENGLISH_LITERATURE --concurrency=4
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
const BOOK_ID = args.id;
const COURSE = args.course;
const LIMIT = args.limit ? parseInt(args.limit, 10) : null;
const CONCURRENCY = args.concurrency ? parseInt(args.concurrency, 10) : 3;
const DRY = !!args.dry;

if (!BOOK_ID || !COURSE) {
  console.error("usage: --id=<gutenberg-id> --course=<ApCourse> [--limit=N] [--dry]");
  process.exit(1);
}

process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
const { neon } = await import("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const dir = join(process.cwd(), "data", "oer", "gutenberg", String(BOOK_ID));
const passagesPath = join(dir, "passages.json");
if (!existsSync(passagesPath)) {
  console.error(`Missing ${passagesPath}. Run chunk-gutenberg.mjs first.`);
  process.exit(2);
}

const book = JSON.parse(readFileSync(passagesPath, "utf-8"));
console.log(`Generating from ${book.title} by ${book.author} — ${book.passages.length} passages available`);
console.log(`Target course: ${COURSE}, concurrency=${CONCURRENCY}, dry=${DRY}`);

// Look up valid units for course
const enumRow = await sql`SELECT enum_range(NULL::"ApUnit")::text AS u`;
const allUnits = enumRow[0].u.replace(/^{|}$/g, "").split(",");
const coursePrefixes = {
  AP_ENGLISH_LITERATURE: ["APLIT_"],
  AP_ENGLISH_LANGUAGE: ["ENGLANG_"],
  AP_US_HISTORY: ["APUSH_"],
  AP_US_GOVERNMENT: ["USGOV_"],
  AP_WORLD_HISTORY: ["UNIT_"],
  AP_EUROPEAN_HISTORY: ["EURO_"],
  AP_PSYCHOLOGY: ["PSYCH_"],
  AP_HUMAN_GEOGRAPHY: ["HUGEO_"],
  SAT_READING_WRITING: ["SAT_RW_"],
  ACT_READING: ["ACT_READ_"],
  ACT_ENGLISH: ["ACT_ENG_"],
};
const prefixes = coursePrefixes[COURSE] ?? [];
const courseUnits = allUnits.filter((u) => prefixes.some((p) => u.startsWith(p)));
if (courseUnits.length === 0) {
  console.error(`No units for ${COURSE} (looking for ${prefixes.join(",")})`);
  console.error(`Available units sample: ${allUnits.slice(0, 20).join(", ")}`);
  process.exit(3);
}
console.log(`Found ${courseUnits.length} units: ${courseUnits.slice(0, 5).join(", ")}${courseUnits.length > 5 ? "..." : ""}`);

const key = process.env.GROQ_API_KEY;
if (!key) { console.error("GROQ_API_KEY required"); process.exit(4); }

function contentHashOf(s) {
  return crypto.createHash("sha256").update(s.toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
}

async function generateOne(passage) {
  const sourceLine = `From "${book.title}" by ${book.author} (Project Gutenberg, public domain)`;
  const prompt = `You are writing an AP English Literature multiple-choice question grounded in the following passage. The question MUST be answerable strictly from the passage text — no outside knowledge required.

PASSAGE:
"${passage.text.slice(0, 1800)}"

ATTRIBUTION: ${sourceLine}

Write ONE high-quality MCQ following College Board AP English Literature exam style:
- Tests inference, tone, characterization, theme, or rhetorical strategy
- 4 options (A-D), exactly one correct, three plausible distractors
- Stem is precise and not ambiguous
- Wrong answers represent real student misreadings

Reply with JSON only:
{
  "questionText": "the question stem",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A" | "B" | "C" | "D",
  "explanation": "<150-300 chars explaining why the correct answer is correct based on passage text>",
  "skill": "Inference | Tone | Characterization | Theme | Rhetorical Strategy | Diction",
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
        max_tokens: 700,
        temperature: 0.4,
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

const passages = LIMIT ? book.passages.slice(0, LIMIT) : book.passages;
console.log(`\nProcessing ${passages.length} passages`);

let i = 0;
let generated = 0;
let inserted = 0;
let skipped = 0;
let failed = 0;
const sourceBook = `${book.title} by ${book.author}`;
const sourceUrl = book.sourceUrl;
const startTs = Date.now();

async function worker() {
  while (i < passages.length) {
    const idx = i++;
    const p = passages[idx];
    const r = await generateOne(p);
    if (!r.ok) { failed++; continue; }
    generated++;
    if (DRY) continue;
    const stimulus = `${p.text}\n\n— ${sourceBook} (Project Gutenberg)`;
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
          ${r.data.skill ?? "Passage-Based Analysis"}, '', 'MEDIUM'::"Difficulty", 'MCQ'::"QuestionType",
          ${r.data.questionText}, ${stimulus}, ${JSON.stringify(r.data.options)}::jsonb,
          ${r.data.correctAnswer}, ${r.data.explanation},
          true, false, ${hash},
          'groq-passage-grounded', false, false,
          ${sourceBook}, ${sourceUrl}, NULL, 'Public Domain (US)', ${`passage-${p.index}`},
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
      console.log(`[${generated + failed}/${passages.length}] gen=${generated} ins=${inserted} skip=${skipped} fail=${failed} t=${t}s`);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

console.log(`\n══ DONE ══`);
console.log(`  passages: ${passages.length}`);
console.log(`  generated: ${generated}`);
console.log(`  inserted: ${inserted}`);
console.log(`  skipped (dup): ${skipped}`);
console.log(`  failed: ${failed}`);

const outDir = join(process.cwd(), "data", "oer-seed-runs");
mkdirSync(outDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(outDir, `gutenberg-${BOOK_ID}-${ts}.json`), JSON.stringify({
  bookId: BOOK_ID, title: book.title, course: COURSE, generatedAt: new Date().toISOString(),
  passages: passages.length, generated, inserted, skipped, failed
}, null, 2));
console.log(`\nNext: scripts/ensemble-sweep.mjs --course=${COURSE} --include-unapproved --unapprove`);
console.log(`(requires functioning Anthropic + Gemini judges for quorum)`);

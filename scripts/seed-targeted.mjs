#!/usr/bin/env node
/**
 * seed-targeted.mjs
 * Directly generates MCQ questions for the 4 red courses by calling Groq locally
 * and saving to the Neon DB via the Prisma HTTP adapter.
 *
 * Run: node scripts/seed-targeted.mjs
 * Requires: DATABASE_URL and GROQ_API_KEY in .env
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Load .env
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*["']?(.*?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!GROQ_API_KEY || !DATABASE_URL) {
  console.error("Missing GROQ_API_KEY or DATABASE_URL in .env");
  process.exit(1);
}

// Target: 4 red courses × first unit each — enough to get to "green" (5+ MCQ)
const TARGETS = [
  { course: "AP_STATISTICS",  unit: "STATS_1_EXPLORING_ONE_VARIABLE",   subject: "AP Statistics",  topic: "Describing distributions of data" },
  { course: "AP_STATISTICS",  unit: "STATS_2_EXPLORING_TWO_VARIABLES",  subject: "AP Statistics",  topic: "Scatterplots and linear regression" },
  { course: "AP_CHEMISTRY",   unit: "CHEM_1_ATOMIC_STRUCTURE",          subject: "AP Chemistry",   topic: "Atomic structure and electron configuration" },
  { course: "AP_CHEMISTRY",   unit: "CHEM_2_MOLECULAR_PROPERTIES",      subject: "AP Chemistry",   topic: "Molecular geometry and intermolecular forces" },
  { course: "AP_US_HISTORY",  unit: "APUSH_1_PERIOD_1",                 subject: "AP US History",  topic: "Pre-Columbian societies and first contacts" },
  { course: "AP_US_HISTORY",  unit: "APUSH_2_PERIOD_2",                 subject: "AP US History",  topic: "Colonial America and early settlement" },
  { course: "AP_PSYCHOLOGY",  unit: "PSYCH_1_HISTORY_APPROACHES",       subject: "AP Psychology",  topic: "History and major approaches in psychology" },
  { course: "AP_PSYCHOLOGY",  unit: "PSYCH_2_RESEARCH_METHODS",         subject: "AP Psychology",  topic: "Research methods, statistics, and ethics" },
];

const QUESTIONS_PER_TARGET = 3; // 8 targets × 3 = 24 questions → all 4 courses well above 5 (green)

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGroq(prompt, maxTokens = 800) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  if (timer.unref) timer.unref();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq ${res.status}: ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function generateMCQ(subject, unit, topic, difficulty) {
  const prompt = `Generate 1 challenging AP-level multiple choice question for ${subject}, unit: ${unit}, topic: "${topic}", difficulty: ${difficulty}.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "questionText": "...",
  "choices": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correctAnswer": "A",
  "explanation": "...",
  "topic": "${topic}"
}

The question must have exactly one correct answer. Make all distractors plausible.`;

  const text = await callGroq(prompt, 600);

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");
  const q = JSON.parse(jsonMatch[0]);

  if (!q.questionText || !q.choices?.A || !q.correctAnswer || !q.explanation) {
    throw new Error("Invalid question structure");
  }
  return q;
}

async function saveQuestion(course, unit, q, difficulty) {
  // Use the Neon HTTP API directly (simpler than loading the full Prisma WASM stack)
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(DATABASE_URL);

  const id = crypto.randomUUID();
  const choicesJson = JSON.stringify(q.choices);
  const now = new Date().toISOString();

  // Check for duplicate
  const existing = await sql`
    SELECT id FROM "Question"
    WHERE course = ${course}
    AND "questionText" = ${q.questionText}
    LIMIT 1
  `;
  if (existing.length > 0) {
    return { skipped: true };
  }

  await sql`
    INSERT INTO "Question" (
      id, course, unit, "questionType", difficulty,
      "questionText", choices, "correctAnswer", explanation,
      topic, "isApproved", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${course}, ${unit}, 'MCQ', ${difficulty},
      ${q.questionText}, ${choicesJson}::jsonb, ${q.correctAnswer}, ${q.explanation},
      ${q.topic ?? ''}, true, ${now}, ${now}
    )
  `;
  return { id, saved: true };
}

async function main() {
  console.log("\n🌱 Targeted seeding: AP Statistics, AP Chemistry, AP US History, AP Psychology");
  console.log(`   ${TARGETS.length} unit targets × ${QUESTIONS_PER_TARGET} questions = ~${TARGETS.length * QUESTIONS_PER_TARGET} questions\n`);

  let totalSaved = 0;
  let totalFailed = 0;
  const difficulties = ["EASY", "MEDIUM", "HARD", "MEDIUM", "EASY", "MEDIUM"];

  for (let t = 0; t < TARGETS.length; t++) {
    const { course, unit, subject, topic } = TARGETS[t];
    console.log(`\n[${t + 1}/${TARGETS.length}] ${course} / ${unit}`);

    for (let i = 0; i < QUESTIONS_PER_TARGET; i++) {
      const difficulty = difficulties[i % difficulties.length];
      process.stdout.write(`  Generating ${difficulty}... `);

      try {
        const q = await generateMCQ(subject, unit, topic, difficulty);
        const result = await saveQuestion(course, unit, q, difficulty);
        if (result.skipped) {
          console.log("skipped (duplicate)");
        } else {
          console.log(`✅ saved (${q.questionText.slice(0, 50)}...)`);
          totalSaved++;
        }
      } catch (e) {
        console.log(`❌ failed: ${e.message.slice(0, 80)}`);
        totalFailed++;
      }

      // 2s between Groq calls (well within 30 RPM limit)
      if (i < QUESTIONS_PER_TARGET - 1) await sleep(2000);
    }

    // Pause between units
    if (t < TARGETS.length - 1) await sleep(3000);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Saved: ${totalSaved} | ❌ Failed: ${totalFailed}`);
  console.log("\nVerifying course status...");

  // Quick check via Neon directly
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(DATABASE_URL);
  const targetCourses = [...new Set(TARGETS.map((t) => t.course))];

  for (const course of targetCourses) {
    const rows = await sql`
      SELECT COUNT(*) as count FROM "Question"
      WHERE course = ${course} AND "questionType" = 'MCQ' AND "isApproved" = true
    `;
    const count = parseInt(rows[0].count);
    const status = count === 0 ? "❌ red" : count < 5 ? "⚠️  yellow" : "✅ green";
    console.log(`  ${status}: ${course} — ${count} MCQ`);
  }
}

main().catch((e) => {
  console.error("Seeder crashed:", e.message);
  process.exit(1);
});

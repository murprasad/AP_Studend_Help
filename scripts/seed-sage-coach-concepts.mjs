// Seed SageCoachConcept — Haiku 4.5 extracts concept+question+keyPoints
// from OfficialSample + existing Question rows for a given course.
//
// Strategy:
//   - For each unit in course, pull 8 representative Question rows (approved,
//     high-quality) across difficulty bands
//   - Ask Haiku: "from these exam questions, identify 2-3 core concepts with
//     open-ended oral-answer questions + 5-8 key points each"
//   - Upsert into SageCoachConcept (dedupe on concept name within unit)
//
// Usage:
//   node scripts/seed-sage-coach-concepts.mjs --course=AP_WORLD_HISTORY
//   node scripts/seed-sage-coach-concepts.mjs --course=AP_WORLD_HISTORY --per-unit=3 --dry-run
//
// Cost: ~$0.001 per Haiku call × 9 units × 1 call/unit = ~$0.01 per course.

import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

function parseArgs() {
  const a = { course: null, perUnit: 3, dryRun: false };
  for (const x of process.argv.slice(2)) {
    if (x.startsWith("--course=")) a.course = x.slice(9);
    else if (x.startsWith("--per-unit=")) a.perUnit = parseInt(x.slice(11), 10);
    else if (x === "--dry-run") a.dryRun = true;
  }
  return a;
}

async function callHaiku(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

function tryParseJsonArray(s) {
  const cleaned = String(s).replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

function buildPrompt(course, unit, questions) {
  const sample = questions.slice(0, 8).map((q, i) =>
    `--- Sample ${i + 1} ---\n${q.questionText}${q.explanation ? `\n(answer context: ${q.explanation.slice(0, 200)})` : ""}`
  ).join("\n\n");

  return `You are designing a Sage Coach oral-response training system for ${course}, Unit: ${unit}.

Below are sample exam questions from this unit. Identify the core CONCEPTS students must be able to EXPLAIN ALOUD to truly understand this unit. For each concept, create an open-ended oral-response prompt and 5-8 key points an expert answer would cover.

IMPORTANT:
- Questions should invite EXPLANATION, not recall. "Explain…" / "Why did…" / "How does…" / "Compare…"
- Questions should be answerable in 30-60 seconds of spoken response
- Key points should be specific facts/ideas (not vague) — these are used to score coverage
- Difficulty: "basic" = define/explain, "intermediate" = apply, "advanced" = analyze/compare

SAMPLE QUESTIONS FROM THE UNIT:
${sample}

Return STRICT JSON array (no markdown fences, no commentary). Generate exactly 3 concepts:
[
  {
    "concept": "Short concept name (2-5 words)",
    "question": "Open-ended oral-response prompt",
    "difficulty": "basic|intermediate|advanced",
    "keyPoints": ["Specific point 1", "Specific point 2", "Specific point 3", "Specific point 4", "Specific point 5"]
  }
]`;
}

async function seedUnit(course, unit, perUnit, dryRun) {
  // Pull 8 approved questions across difficulty bands
  const questions = await prisma.question.findMany({
    where: { course, unit, isApproved: true },
    select: { questionText: true, explanation: true, difficulty: true },
    take: 8,
  });
  if (questions.length === 0) {
    console.log(`  ${unit}: no questions available — skip`);
    return 0;
  }

  const prompt = buildPrompt(course, unit, questions);
  let text;
  try {
    text = await callHaiku(prompt);
  } catch (e) {
    console.log(`  ${unit}: Haiku error — ${e.message.slice(0, 100)}`);
    return 0;
  }
  const concepts = tryParseJsonArray(text);
  if (!Array.isArray(concepts)) {
    console.log(`  ${unit}: Haiku returned non-array`);
    return 0;
  }

  let created = 0;
  for (const c of concepts.slice(0, perUnit)) {
    if (!c.concept || !c.question || !Array.isArray(c.keyPoints) || c.keyPoints.length === 0) continue;
    const existing = await prisma.sageCoachConcept.findFirst({
      where: { course, unit, concept: c.concept },
    });
    if (existing) {
      console.log(`    [dup]  ${c.concept}`);
      continue;
    }
    if (!dryRun) {
      await prisma.sageCoachConcept.create({
        data: {
          course,
          unit,
          concept: String(c.concept).slice(0, 120),
          question: String(c.question),
          difficulty: ["basic", "intermediate", "advanced"].includes(c.difficulty) ? c.difficulty : "basic",
          keyPoints: c.keyPoints.map(String).slice(0, 8),
        },
      });
    }
    created++;
    console.log(`    [+${created}] ${c.concept} (${c.difficulty || "basic"})`);
  }
  return created;
}

async function main() {
  const args = parseArgs();
  if (!args.course) {
    console.error("--course=AP_WORLD_HISTORY required");
    process.exit(1);
  }

  // Discover units from Question table
  const unitGroups = await prisma.question.groupBy({
    by: ["unit"],
    where: { course: args.course },
    _count: true,
  });
  const units = unitGroups.map(g => g.unit).filter(Boolean);
  console.log(`Seeding ${args.course} across ${units.length} units (perUnit=${args.perUnit}, dryRun=${args.dryRun})`);

  let total = 0;
  for (const unit of units) {
    console.log(`\n${unit}`);
    const n = await seedUnit(args.course, unit, args.perUnit, args.dryRun);
    total += n;
  }

  console.log(`\nDone. Seeded ${total} new concepts across ${units.length} units.`);
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

#!/usr/bin/env node
/**
 * Seed DBQ + LEQ questions for AP History courses.
 *
 * CB AP World History + AP US History exam structure:
 *   - 55 MCQ (40%)
 *   - 3 SAQ (20%)
 *   - 1 DBQ (25%)
 *   - 1 LEQ (15%)
 *
 * We have MCQs (500+), some SAQs, ZERO DBQs and LEQs. That's 40% of the
 * exam-weighted experience missing. This script generates new DBQ + LEQ
 * content using the actual CB 2025 PDFs as style references.
 *
 * For each target course:
 *   - Generate N DBQs (each: 1 prompt + 7 short source documents in stimulus,
 *     student answers with thesis + analysis essay)
 *   - Generate N LEQs (each: 1 essay prompt for a specific time period,
 *     student writes thesis-driven historical argument)
 *
 * Marks generated questions isApproved=true so they appear in FRQ Practice.
 *
 * Usage:
 *   node scripts/seed-dbq-leq-history.mjs --per 5    # 5 DBQ + 5 LEQ each
 *   node scripts/seed-dbq-leq-history.mjs AP_WORLD_HISTORY
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const perArg = args.find((a, i) => args[i - 1] === "--per");
const PER = perArg ? parseInt(perArg, 10) : 5;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const TARGETS = courseFilter ? [courseFilter] : ["AP_WORLD_HISTORY", "AP_US_HISTORY"];

const PACE_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COURSE_CONFIG = {
  AP_WORLD_HISTORY: {
    units: [
      "UNIT_1_GLOBAL_TAPESTRY", "UNIT_2_NETWORKS_OF_EXCHANGE",
      "UNIT_3_LAND_BASED_EMPIRES", "UNIT_4_TRANSOCEANIC_INTERCONNECTIONS",
      "UNIT_5_REVOLUTIONS", "UNIT_6_INDUSTRIALIZATION",
      "UNIT_7_GLOBAL_CONFLICT", "UNIT_8_COLD_WAR",
      "UNIT_9_GLOBALIZATION",
    ],
    timeRange: "1200–present",
    dbqExamples: [
      `2025 CB DBQ: "Evaluate the extent to which the development of the Atlantic slave trade transformed African societies between 1500 and 1800." Documents: 7 sources including Olaudah Equiano memoir excerpt, John Newton ship log, African oral tradition, etc.`,
      `Older CB pattern: "Evaluate the extent of change in religious belief in early modern Europe between 1500 and 1700." Documents: theological treatises, sermons, royal decrees.`,
    ],
    leqExamples: [
      `LEQ pattern: "Evaluate the extent to which industrialization transformed European societies in the period 1815 to 1914."`,
      `LEQ pattern: "Evaluate the extent to which the Mongol Empire facilitated cultural exchange between 1200 and 1450."`,
    ],
  },
  AP_US_HISTORY: {
    units: [
      "APUSH_1_PERIOD_1491_1607", "APUSH_2_PERIOD_1607_1754",
      "APUSH_3_PERIOD_1754_1800", "APUSH_4_PERIOD_1800_1848",
      "APUSH_5_PERIOD_1844_1877", "APUSH_6_PERIOD_1865_1898",
      "APUSH_7_PERIOD_1890_1945", "APUSH_8_PERIOD_1945_1980",
      "APUSH_9_PERIOD_1980_PRESENT",
    ],
    timeRange: "1491–present",
    dbqExamples: [
      `2025 CB DBQ pattern: "Evaluate the extent to which the New Deal transformed the role of the federal government in the American economy between 1933 and 1945." Documents: FDR speeches, Supreme Court rulings, political cartoons.`,
      `Older pattern: "Evaluate the extent to which technological innovations changed the lives of US workers between 1865 and 1920."`,
    ],
    leqExamples: [
      `LEQ: "Evaluate the extent to which the Civil War was a turning point in the role of the federal government in American life between 1860 and 1900."`,
      `LEQ: "Evaluate the extent to which gender roles in the United States changed between 1945 and 1980."`,
    ],
  },
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function genDbq(course, cfg, unit) {
  const prompt = `Generate one Document-Based Question (DBQ) for AP ${course.replace('AP_', '').replace(/_/g, ' ')} in the style of College Board released questions.

Unit/Period: ${unit}
Time range: ${cfg.timeRange}

Real CB DBQ examples for reference:
${cfg.dbqExamples.join('\n')}

A CB DBQ has:
- Background context (1-2 sentences)
- Prompt: "Evaluate the extent to which X..." or "Evaluate the relative importance of..."
- 7 short documents (each 30-100 words) — primary or secondary sources, each with CB-strict attribution: Source: <Author>, <descriptor>, <type>, <year>
- Mix of types: speech, letter, treaty, photograph description, political cartoon description, statistical chart description

Return JSON:
{
  "questionText": "the DBQ prompt (e.g. 'Evaluate the extent to which...')",
  "stimulus": "background context, then 7 documents formatted as:\\n\\nDocument 1:\\nSource: <citation>\\n\\n<excerpt 30-100 words>\\n\\nDocument 2:\\n...etc through Document 7",
  "explanation": "complete model rubric: 1) Thesis (1 pt) — what a strong thesis would say. 2) Contextualization (1 pt) — what context to set. 3) Evidence (3 pts) — which documents to use + outside info. 4) Analysis (2 pts) — sourcing analysis on 3+ docs. Total: 7 pts.",
  "topic": "brief topic tag (3-5 words)",
  "subtopic": "specific sub-theme",
  "difficulty": "HARD",
  "correctAnswer": "Same as explanation"
}

Output ONLY valid JSON.`;
  return await callGroq(
    `You are an AP exam content writer trained on College Board AP ${course.replace('AP_', '')} curriculum and rubric standards. Generate authentic CB-style DBQs with real historical figures and verifiable source types.`,
    prompt,
  );
}

async function genLeq(course, cfg, unit) {
  const prompt = `Generate one Long Essay Question (LEQ) for AP ${course.replace('AP_', '').replace(/_/g, ' ')} in CB style.

Unit/Period: ${unit}
Time range: ${cfg.timeRange}

Real CB LEQ examples for reference:
${cfg.leqExamples.join('\n')}

A CB LEQ has:
- 1 prompt asking student to "Evaluate the extent to which X..." or similar comparative/causation/CCOT question
- Specified time period (must fall within the course's time range and the unit's period)
- Specific historical thinking skill: causation, comparison, or continuity-and-change-over-time

Return JSON:
{
  "questionText": "the LEQ prompt + time period framing",
  "stimulus": "(brief 1-2 sentence framing context, optional — LEQs don't have documents)",
  "explanation": "scoring rubric: 1) Thesis (1 pt). 2) Contextualization (1 pt). 3) Evidence (2 pts). 4) Analysis & Reasoning (2 pts). Total: 6 pts. Include sample 'high-scoring' approach: thesis statement, key evidence to cite, contextualization, sourcing.",
  "topic": "brief topic tag",
  "subtopic": "specific sub-theme",
  "difficulty": "HARD",
  "correctAnswer": "Same as explanation"
}

Output ONLY valid JSON.`;
  return await callGroq(
    `You are an AP exam content writer trained on College Board AP ${course.replace('AP_', '')} LEQ rubric standards.`,
    prompt,
  );
}

async function insert(course, unit, qtype, gen) {
  if (!gen.questionText || !gen.explanation) return false;
  await sql`
    INSERT INTO questions (
      id, course, unit, topic, subtopic, difficulty, "questionType",
      "questionText", stimulus, "correctAnswer", explanation,
      "isAiGenerated", "isApproved", "modelUsed", "generatedForTier",
      "createdAt", "updatedAt"
    ) VALUES (
      ${"cm" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36).slice(-4)},
      ${course}::"ApCourse",
      ${unit}::"ApUnit",
      ${gen.topic ?? "general"},
      ${gen.subtopic ?? null},
      ${gen.difficulty ?? "HARD"}::"Difficulty",
      ${qtype}::"QuestionType",
      ${gen.questionText},
      ${gen.stimulus ?? null},
      ${gen.correctAnswer ?? gen.explanation},
      ${gen.explanation},
      true, true, 'llama-3.3-70b-versatile', 'PREMIUM'::"SubTier",
      NOW(), NOW()
    )
  `;
  return true;
}

(async () => {
  console.log(`\n📚 DBQ + LEQ history seed — ${PER} of each per course\n`);

  let totalDbq = 0, totalLeq = 0, totalErr = 0;

  for (const course of TARGETS) {
    const cfg = COURSE_CONFIG[course];
    if (!cfg) {
      console.log(`No config for ${course}, skipping`);
      continue;
    }
    console.log(`\n=== ${course} (units: ${cfg.units.length}) ===\n`);

    // DBQs
    for (let i = 0; i < PER; i++) {
      const unit = cfg.units[i % cfg.units.length];
      try {
        if (dry) { console.log(`  [DRY] DBQ ${i + 1}/${PER} unit=${unit}`); continue; }
        const gen = await genDbq(course, cfg, unit);
        if (await insert(course, unit, "DBQ", gen)) {
          totalDbq++;
          console.log(`  ✓ DBQ ${i + 1}: ${(gen.questionText || '').slice(0, 80)}…`);
        }
      } catch (e) {
        totalErr++;
        console.error(`  ✗ DBQ ${i + 1}: ${e.message?.slice(0, 100)}`);
      }
      await sleep(PACE_MS);
    }

    // LEQs
    for (let i = 0; i < PER; i++) {
      const unit = cfg.units[i % cfg.units.length];
      try {
        if (dry) { console.log(`  [DRY] LEQ ${i + 1}/${PER} unit=${unit}`); continue; }
        const gen = await genLeq(course, cfg, unit);
        if (await insert(course, unit, "LEQ", gen)) {
          totalLeq++;
          console.log(`  ✓ LEQ ${i + 1}: ${(gen.questionText || '').slice(0, 80)}…`);
        }
      } catch (e) {
        totalErr++;
        console.error(`  ✗ LEQ ${i + 1}: ${e.message?.slice(0, 100)}`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  DBQs added: ${totalDbq}`);
  console.log(`  LEQs added: ${totalLeq}`);
  console.log(`  Errors: ${totalErr}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });

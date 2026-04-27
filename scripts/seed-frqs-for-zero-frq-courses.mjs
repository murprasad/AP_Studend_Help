#!/usr/bin/env node
/**
 * Seed FRQs (SAQ/FRQ depending on course) for AP courses currently at 0 FRQ.
 *
 * Per the cross-course gap audit (2026-04-27), 6 AP courses have 0 FRQ rows
 * even after the FRQ ingestion + approval pass:
 *   - AP_HUMAN_GEOGRAPHY  (SAQ — short-answer style)
 *   - AP_PRECALCULUS      (FRQ — calc-style multi-part)
 *   - AP_PHYSICS_1        (FRQ — physics multi-part with diagram)
 *   - AP_ENVIRONMENTAL_SCIENCE (FRQ — multi-part scenario)
 *   - AP_US_GOVERNMENT    (SAQ + ARGUMENT_ESSAY — but we only generate SAQ here)
 *   - AP_STATISTICS       (FRQ — investigative task style)
 *
 * Premium users currently see "no FRQs available" on these courses, breaking
 * the AP-season Premium experience. Seed 10–20 per course (cap to keep
 * Groq budget bounded; admins can extend later).
 *
 * Uses the existing generateQuestion() flow with FRQ/SAQ questionType — same
 * path as the live API. Each generated question is saved with isApproved=true
 * so it's immediately usable. Skips Beta 1.2 validator (FRQ doesn't go through
 * MCQ's 5-criterion check).
 *
 * Usage:
 *   node scripts/seed-frqs-for-zero-frq-courses.mjs              # seed all 6
 *   node scripts/seed-frqs-for-zero-frq-courses.mjs --dry        # report only
 *   node scripts/seed-frqs-for-zero-frq-courses.mjs AP_PHYSICS_1 # one course
 *   node scripts/seed-frqs-for-zero-frq-courses.mjs --per 10     # 10 per course
 *
 * Concurrency: 1 question at a time (sequential), 2s pacing between to stay
 * under Groq's 30-req/min limit. ~10 questions × ~5s each = ~1 min per course.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const perArg = args.find((a, i) => args[i - 1] === "--per");
const PER_COURSE = perArg ? parseInt(perArg, 10) : 15;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 2000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Course config — qtype, units list (matches actual ApUnit enum), AI prompt seed.
const ZERO_FRQ_COURSES = {
  AP_HUMAN_GEOGRAPHY: {
    qtype: "SAQ",
    units: [
      "HUGEO_1_THINKING_GEOGRAPHICALLY", "HUGEO_2_POPULATION_MIGRATION",
      "HUGEO_3_CULTURAL_PATTERNS", "HUGEO_4_POLITICAL_PATTERNS",
      "HUGEO_5_AGRICULTURE_RURAL", "HUGEO_6_URBAN_LAND_USE",
      "HUGEO_7_INDUSTRIAL_ECONOMIC",
    ],
    seed: "AP Human Geography SAQ-style: 3-part question (A/B/C). Each part demands 2-3 sentence response analyzing a geographic concept (demographic transition, urban hierarchy, political boundary disputes, agricultural patterns).",
  },
  AP_PRECALCULUS: {
    qtype: "FRQ",
    units: [
      "PRECALC_1_POLYNOMIAL_RATIONAL", "PRECALC_2_EXPONENTIAL_LOGARITHMIC",
      "PRECALC_3_TRIGONOMETRIC_POLAR", "PRECALC_4_FUNCTIONS_PARAMETERS_VECTORS_MATRICES",
    ],
    seed: "AP Precalculus FRQ-style: multi-part problem. (a) compute, (b) analyze, (c) interpret. Show student a function definition (KaTeX), ask for derivative behavior or function composition or transformation analysis.",
  },
  AP_PHYSICS_1: {
    qtype: "FRQ",
    units: [
      "PHY1_1_KINEMATICS", "PHY1_2_FORCES_AND_NEWTONS_LAWS",
      "PHY1_3_CIRCULAR_MOTION_GRAVITATION", "PHY1_4_ENERGY",
      "PHY1_5_MOMENTUM", "PHY1_6_SIMPLE_HARMONIC_MOTION",
      "PHY1_7_TORQUE_AND_ROTATION", "PHY1_8_ELECTRIC_CHARGE_AND_FORCE",
      "PHY1_9_DC_CIRCUITS", "PHY1_10_WAVES_AND_SOUND",
    ],
    seed: "AP Physics 1 FRQ-style: multi-part problem with quantitative scenario + qualitative reasoning. (a) calculate a quantity using formula, (b) describe the physical reasoning, (c) explain what changes if a parameter changes. Use KaTeX equations and concrete numeric values (units MUST appear).",
  },
  AP_ENVIRONMENTAL_SCIENCE: {
    qtype: "FRQ",
    units: [
      "APES_1_ECOSYSTEMS", "APES_2_BIODIVERSITY",
      "APES_3_POPULATIONS", "APES_4_EARTH_SYSTEMS",
      "APES_5_LAND_WATER_USE", "APES_6_ENERGY",
      "APES_7_ATMOSPHERIC_POLLUTION", "APES_8_AQUATIC_TERRESTRIAL_POLLUTION",
      "APES_9_GLOBAL_CHANGE",
    ],
    seed: "AP Environmental Science FRQ-style: scenario describing an environmental issue. (a) identify a process or phenomenon, (b) describe the scientific cause, (c) propose a solution with quantitative reasoning. Include data (e.g. ppm concentrations, kg waste/yr, % deforestation).",
  },
  AP_US_GOVERNMENT: {
    qtype: "SAQ",
    units: [
      "USGOV_1_FOUNDATIONS", "USGOV_2_INTERACTIONS_BRANCHES",
      "USGOV_3_CIVIL_LIBERTIES_RIGHTS", "USGOV_4_IDEOLOGIES_BELIEFS",
      "USGOV_5_POLITICAL_PARTICIPATION",
    ],
    seed: "AP US Gov SAQ-style: cite a specific Constitutional clause, SCOTUS case, or founding document. (A) Describe a feature, (B) Explain how it relates to a current issue, (C) Identify a way the principle could be challenged.",
  },
  AP_STATISTICS: {
    qtype: "FRQ",
    units: [
      "STATS_1_EXPLORING_DATA", "STATS_2_MODELING_DATA",
      "STATS_3_COLLECTING_DATA", "STATS_4_PROBABILITY",
      "STATS_5_SAMPLING_DISTRIBUTIONS", "STATS_6_INFERENCE_PROPORTIONS",
      "STATS_7_INFERENCE_MEANS", "STATS_8_CHI_SQUARE",
      "STATS_9_INFERENCE_SLOPES",
    ],
    seed: "AP Statistics FRQ-style: scenario with named context (school, factory, study). (a) state hypotheses + select test, (b) compute test statistic + p-value (use KaTeX or numeric scenario), (c) interpret in context of original problem. Include sample size, mean, sd, and a number to compute against.",
  },
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) {
  console.error("Missing GROQ_API_KEY. Set in .env or pass --dry.");
  process.exit(1);
}

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function genFrq(course, unit, qtype, seed) {
  const prompt = `Generate one ${course} ${qtype} (free-response) question.

${seed}

Unit: ${unit}

Return JSON in this exact shape:
{
  "questionText": "The full multi-part prompt the student sees. 80-300 chars. Include parts (A), (B), (C) inline.",
  "stimulus": "Source quote, scenario setup, or data table. 80-400 chars. For Stats use named scenario with numeric values; for Physics/Calc include KaTeX equations; for Bio/Env Sci include named species + quantities; for HuGeo include named region + demographic; for History/Gov include attributed quote ('Source: <Author>, <type>, <year>').",
  "explanation": "The complete model-answer rubric. 200-800 chars. For each part (A/B/C), give a 1-2 sentence model response that earns full credit. Cite specific reasoning. Format as: '(A) <answer>. (B) <answer>. (C) <answer>.'",
  "topic": "Brief topic tag (3-5 words)",
  "subtopic": "More-specific subtopic (3-8 words)",
  "difficulty": "MEDIUM" or "HARD",
  "correctAnswer": "Same as explanation field, used as fallback grader reference"
}

Output ONLY the JSON. No markdown, no commentary.`;

  return await callGroq(
    `You are an AP exam content writer trained on College Board ${course} CED standards.`,
    prompt,
  );
}

(async () => {
  console.log(`\n📝 FRQ seed for zero-FRQ courses ${dry ? "(DRY RUN)" : "(WRITE)"}\n`);

  const targets = courseFilter
    ? { [courseFilter]: ZERO_FRQ_COURSES[courseFilter] }
    : ZERO_FRQ_COURSES;
  if (!targets[Object.keys(targets)[0]]) {
    console.error(`Unknown course ${courseFilter}. Valid: ${Object.keys(ZERO_FRQ_COURSES).join(", ")}`);
    process.exit(1);
  }

  let totalGenerated = 0;
  let totalErrors = 0;

  for (const [course, cfg] of Object.entries(targets)) {
    if (!cfg) continue;
    console.log(`\n━━━ ${course} (${cfg.qtype}) — target ${PER_COURSE} ━━━\n`);

    // Confirm zero existing first.
    const existing = await sql`
      SELECT COUNT(*)::int AS n FROM questions
      WHERE course = ${course}::"ApCourse" AND "questionType" = ${cfg.qtype}::"QuestionType"
    `;
    console.log(`  Existing ${cfg.qtype} for ${course}: ${existing[0].n}`);
    if (existing[0].n >= PER_COURSE) {
      console.log(`  Already at target. Skipping.`);
      continue;
    }

    for (let i = 0; i < PER_COURSE; i++) {
      const unit = cfg.units[i % cfg.units.length];
      const difficulty = i < PER_COURSE / 3 ? "MEDIUM" : "HARD";
      try {
        if (dry) {
          console.log(`  [${i + 1}/${PER_COURSE}] [DRY] would gen ${cfg.qtype} for unit=${unit} diff=${difficulty}`);
          continue;
        }
        const gen = await genFrq(course, unit, cfg.qtype, cfg.seed);
        if (!gen.questionText || !gen.explanation) {
          console.log(`  [${i + 1}/${PER_COURSE}] empty response from Groq, skipping`);
          totalErrors++;
          continue;
        }
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
            ${difficulty}::"Difficulty",
            ${cfg.qtype}::"QuestionType",
            ${gen.questionText},
            ${gen.stimulus ?? null},
            ${gen.correctAnswer ?? gen.explanation},
            ${gen.explanation},
            true, true, 'llama-3.3-70b-versatile', 'PREMIUM'::"SubTier",
            NOW(), NOW()
          )
        `;
        totalGenerated++;
        console.log(`  [${i + 1}/${PER_COURSE}] saved (unit=${unit}, ${gen.questionText.slice(0, 60)}…)`);
      } catch (e) {
        totalErrors++;
        console.error(`  [${i + 1}/${PER_COURSE}] error: ${e.message?.slice(0, 100)}`);
      }
      await sleep(PACE_MS);
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Generated: ${totalGenerated}`);
  console.log(`  Errors:    ${totalErrors}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });

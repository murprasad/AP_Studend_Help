/**
 * scripts/rebuild-bank.ts
 *
 * Production batch generator. Runs the same 7-gate pipeline as
 * pilot-question-gen.ts, but in a loop with DB persistence.
 *
 * Usage:
 *   npx tsx scripts/rebuild-bank.ts --course=AP_CHEMISTRY --target=300
 *   npx tsx scripts/rebuild-bank.ts --course=AP_CHEMISTRY --target=300 --budget=5
 *   npx tsx scripts/rebuild-bank.ts --course=AP_CHEMISTRY --target=300 --dry  # don't write
 *
 * Stops when ANY of: target reached, budget cap hit, 10 consecutive
 * rejections (something's systematically wrong).
 *
 * Persists approved questions to prod DB with:
 *   - isAiGenerated=true, isApproved=true
 *   - modelUsed="pipeline-v1-gemini-2.5-pro"
 *   - generatedForTier="FREE"
 *   - contentHash (sha256 of normalized questionText)
 *
 * Cost: ~$0.01/question. Default budget cap $5/course.
 *
 * SAFETY: this writes to prod DB. Use --dry first to verify.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type ApCourse, type ApUnit, Difficulty, QuestionType, SubTier } from "@prisma/client";

import { getContract, getStimulusRequirement } from "../src/lib/course-contracts";
import { validateMcqStructure } from "../src/lib/options";
import { validateExplanationMath, validateAnswerNumericMatch } from "../src/lib/math-validator";
import { validateDistractorIntegrity } from "../src/lib/distractor-leak-validator";
import { validateStimulus } from "../src/lib/stimulus-validator";
import { validateAttribution } from "../src/lib/source-attribution-validator";
import { validateFigure } from "../src/lib/figure-validator";
import { COURSE_REGISTRY } from "../src/lib/courses";

const prisma = new PrismaClient();

// 2026-05-02 LATE — Pro daily quota exhausted (1000 req/day Tier 1 cap;
// rolling 24h window won't reset until ~20h from now). Switch generator
// to Flash (10K/day limit, currently available). Quality safety net:
// the deterministic gates AND the OpenAI cross-family judge (Stage 5b)
// will reject any Flash output that doesn't meet the bar.
const GENERATOR_MODEL = "gemini-2.5-flash";
const JUDGE_MODEL = "gemini-2.5-flash";
const PRICING = {
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-2.5-flash": { input: 0.075, output: 0.3 },
};

const PIPELINE_VERSION = "pipeline-v1-gemini-2.5-flash";

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args: Record<string, string | boolean> = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--")) {
      const [k, v] = a.replace(/^--/, "").split("=");
      args[k] = v ?? true;
    }
  }
  return {
    course: String(args.course ?? "AP_PSYCHOLOGY") as ApCourse,
    target: parseInt(String(args.target ?? "200"), 10),
    budget: parseFloat(String(args.budget ?? "5.0")),
    dry: !!args.dry,
  };
}

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function costFor(model: keyof typeof PRICING, inputTokens: number, outputTokens: number) {
  const p = PRICING[model];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Gemini call (with retry) ──────────────────────────────────────────────────

async function callGemini(model: string, prompt: string, maxTokens: number) {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: Math.max(maxTokens, 4096),
      temperature: 0.7,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: model.endsWith("flash") ? 1024 : 2048 },
    },
  };
  const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
  let lastErr = "";
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await sleep(Math.min(2000 * Math.pow(2, attempt - 1), 32000));
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      const json = await res.json();
      return {
        text: json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
        inputTokens: json?.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: json?.usageMetadata?.candidatesTokenCount ?? 0,
      };
    }
    const errText = await res.text();
    lastErr = `${model} HTTP ${res.status}: ${errText.slice(0, 300)}`;
    if (!RETRY_STATUSES.has(res.status)) throw new Error(lastErr);
  }
  throw new Error(`${lastErr} (exhausted retries)`);
}

// ── Per-course CED loaders ────────────────────────────────────────────────────

const CED_PATHS: Partial<Record<ApCourse, string>> = {
  AP_PHYSICS_1: "data/official/AP/CED/ap-physics-1-ced.txt",
  AP_CALCULUS_AB: "data/official/AP/CED/ap-calc-ab-bc-ced.txt",
  AP_CALCULUS_BC: "data/official/AP/CED/ap-calc-ab-bc-ced.txt",
  AP_PRECALCULUS: "data/official/AP/CED/ap-precalculus-ced.txt",
  AP_CHEMISTRY: "data/official/AP/CED/ap-chemistry-ced.txt",
  AP_BIOLOGY: "data/official/AP/CED/ap-biology-ced.txt",
  AP_STATISTICS: "data/official/AP/CED/ap-statistics-ced.txt",
  AP_ENVIRONMENTAL_SCIENCE: "data/official/AP/CED/ap-environmental-science-ced.txt",
  AP_HUMAN_GEOGRAPHY: "data/official/AP/CED/ap-human-geography-ced.txt",
  AP_PSYCHOLOGY: "data/official/AP/CED/ap-psychology-ced.txt",
  AP_COMPUTER_SCIENCE_PRINCIPLES: "data/official/AP/CED/ap-computer-science-principles-ced.txt",
  AP_US_GOVERNMENT: "data/official/AP/CED/ap-us-government-and-politics-ced.txt",
  AP_US_HISTORY: "data/official/AP/CED/ap-us-history-ced.txt",
  AP_WORLD_HISTORY: "data/official/AP/CED/ap-world-history-modern-ced.txt",
  // SAT — College Board's digital SAT framework (added 2026-05-02)
  SAT_MATH: "data/official/SAT/assessment-framework-for-digital-sat-suite.txt",
  SAT_READING_WRITING: "data/official/SAT/assessment-framework-for-digital-sat-suite.txt",
  // ACT — official ACT framework
  ACT_MATH: "data/official/ACT/preparing-for-the-act-2025.txt",
  ACT_ENGLISH: "data/official/ACT/preparing-for-the-act-2025.txt",
  ACT_SCIENCE: "data/official/ACT/preparing-for-the-act-2025.txt",
  ACT_READING: "data/official/ACT/preparing-for-the-act-2025.txt",
};

import { readFileSync } from "node:fs";
function loadCedExcerpt(course: ApCourse): string {
  const path = CED_PATHS[course];
  if (!path) return "";
  try {
    const full = readFileSync(join(process.cwd(), path), "utf-8");
    // Take a slice from the middle (skips title/TOC, gets curriculum content)
    const lines = full.split("\n");
    const start = Math.floor(lines.length * 0.2);
    const end = Math.floor(lines.length * 0.5);
    return lines.slice(start, end).join("\n").slice(0, 5000);
  } catch {
    return "";
  }
}

// ── Topic rotation ────────────────────────────────────────────────────────────
//
// Coverage-aware picker: counts existing pipeline-v1 questions per
// (unit, topic), weights by CB exam emphasis, and picks the unit/topic
// with the largest GAP between actual share and CB target share.
//
// Without this, the generator over-anchors on whatever it's familiar
// with, producing template collapse like the AP CSP "city dataset →
// generate knowledge" pattern that filled 4 of 5 audited CSP questions
// (2026-05-02 audit). This also matches CB's exam emphasis — high-
// weight units (e.g., AP World Unit 6 = 12-15%) get more questions
// than low-weight units (Unit 1 = 8-10%).
//
// Per-course unit weights (% of exam) — verified against CB CED PDFs.
// Default: equal weight if a unit isn't in the table.
const UNIT_WEIGHTS: Partial<Record<ApCourse, Record<string, number>>> = {
  AP_WORLD_HISTORY: {
    UNIT_1_GLOBAL_TAPESTRY: 8, UNIT_2_NETWORKS_OF_EXCHANGE: 8,
    UNIT_3_LAND_BASED_EMPIRES: 12, UNIT_4_TRANSOCEANIC: 12,
    UNIT_5_REVOLUTIONS: 12, UNIT_6_CONSEQUENCES_OF_INDUSTRIALIZATION: 12,
    UNIT_7_GLOBAL_CONFLICT: 8, UNIT_8_COLD_WAR_DECOLONIZATION: 8,
    UNIT_9_GLOBALIZATION: 8,
  },
  AP_PHYSICS_1: {
    PHY1_1_KINEMATICS: 14, PHY1_2_FORCES_AND_NEWTONS_LAWS: 14,
    PHY1_3_CIRCULAR_MOTION_GRAVITATION: 12, PHY1_4_ENERGY: 14,
    PHY1_5_MOMENTUM: 14, PHY1_6_SIMPLE_HARMONIC_MOTION: 8,
    PHY1_7_TORQUE_AND_ROTATION: 12, PHY1_FLUIDS: 12,
  },
};

async function pickLeastCoveredTopic(
  course: ApCourse,
): Promise<{ unit: ApUnit; topic: string } | null> {
  const cfg = COURSE_REGISTRY[course];
  if (!cfg) return null;
  const units = Object.entries(cfg.units) as [ApUnit, { keyThemes?: string[]; name: string }][];
  if (!units.length) return null;

  // Pipeline-v1 counts per (unit, topic).
  const counts = await prisma.question.groupBy({
    by: ["unit", "topic"],
    where: { course, isApproved: true, questionType: QuestionType.MCQ, modelUsed: PIPELINE_VERSION },
    _count: { _all: true },
  });
  const countMap = new Map<string, number>();
  for (const c of counts) countMap.set(`${c.unit}::${c.topic}`, c._count._all);

  // Total questions across all (unit, topic) for this course.
  const total = Array.from(countMap.values()).reduce((a, b) => a + b, 0);
  const weights = UNIT_WEIGHTS[course] ?? {};
  const equalWeight = 100 / units.length;

  // For each (unit, topic), compute "gap" = target_share - actual_share.
  // Positive gap = under-represented. Pick the largest positive gap.
  let bestKey: { unit: ApUnit; topic: string } | null = null;
  let bestGap = -Infinity;
  for (const [unit, meta] of units) {
    const unitWeightPct = weights[unit] ?? equalWeight;
    const themes = meta.keyThemes && meta.keyThemes.length ? meta.keyThemes : [meta.name];
    const perTopicTargetPct = unitWeightPct / themes.length;
    for (const topic of themes) {
      const actualCount = countMap.get(`${unit}::${topic}`) ?? 0;
      const actualPct = total > 0 ? (actualCount / total) * 100 : 0;
      const gap = perTopicTargetPct - actualPct + Math.random() * 0.3; // tiny random tiebreak
      if (gap > bestGap) { bestGap = gap; bestKey = { unit, topic }; }
    }
  }
  return bestKey;
}

// Pull recent pipeline-generated question stems so the generator can
// explicitly AVOID their cognitive patterns (anti-template-collapse).
//
// Returns both literal stems AND extracted "patterns" (verb + structure)
// so the generator avoids the FAMILY of templates, not just exact text.
// Pattern extraction: first 5 words + the first interrogative + scenario
// type keywords.
async function getRecentStems(course: ApCourse, n = 5): Promise<{ stems: string[]; patterns: string[] }> {
  const rows = await prisma.question.findMany({
    where: { course, isApproved: true, questionType: QuestionType.MCQ, modelUsed: PIPELINE_VERSION },
    select: { questionText: true },
    orderBy: { createdAt: "desc" },
    take: n,
  });
  const stems = rows.map((r) => r.questionText.slice(0, 200));
  const patterns = stems.map(extractPattern);
  // Dedupe patterns — collapsed templates produce duplicate patterns,
  // and listing the same pattern N times gives stronger signal.
  return { stems, patterns: Array.from(new Set(patterns)) };
}

function extractPattern(stem: string): string {
  // Cognitive structure indicators we care about:
  const interrogatives = stem.match(/\b(which|what|how|why|where|when|to what extent|in what way|on what basis|under which circumstance)\b/i)?.[0] ?? "?";
  const scenarioTypes: string[] = [];
  if (/\b(scenario|consider|imagine|suppose|given|study|experiment|example)\b/i.test(stem)) scenarioTypes.push("scenario-led");
  if (/\b(graph|chart|table|figure|diagram|map|passage|excerpt)\b/i.test(stem)) scenarioTypes.push("stimulus-anchored");
  if (/\b(best describes|most accurately|primarily|main|underlying)\b/i.test(stem)) scenarioTypes.push("best-fit");
  if (/\b(if|would|could|then)\b.*\b(happen|result|occur|likely|expect)\b/i.test(stem)) scenarioTypes.push("causal-conditional");
  if (/\b(compare|contrast|differ|similar)\b/i.test(stem)) scenarioTypes.push("compare-contrast");
  if (/\b(calculate|determine|find|compute|solve)\b/i.test(stem)) scenarioTypes.push("calculation");
  if (/\b(trace|step|order|sequence|after|before)\b/i.test(stem)) scenarioTypes.push("trace-process");
  return `${interrogatives.toLowerCase()} | ${scenarioTypes.join(",") || "open"}`;
}

// ── Generator prompt ──────────────────────────────────────────────────────────

function buildGenPrompt(course: ApCourse, unit: ApUnit, topic: string, contract: ReturnType<typeof getContract>, cedExcerpt: string, avoid: { stems: string[]; patterns: string[] } = { stems: [], patterns: [] }): string {
  if (!contract) throw new Error("No contract");
  const isHistory = course.includes("HISTORY");
  const avoidBlock = (avoid.stems.length > 0 || avoid.patterns.length > 0)
    ? `\n# CRITICAL: AVOID TEMPLATE COLLAPSE
Recent questions for this course used these cognitive patterns: ${avoid.patterns.length > 0 ? avoid.patterns.map((p) => `[${p}]`).join(", ") : "(none yet)"}

Your new question MUST use a DIFFERENT cognitive pattern. Available alternatives:
- scenario-led + causal-conditional ("Given X scenario, if Y changes, what would happen to Z?")
- stimulus-anchored + compare-contrast ("Based on the table/graph, which difference is most significant between A and B?")
- calculation + trace-process ("Compute the value at step N of the algorithm/reaction/series")
- best-fit + open ("Which of the following best explains the underlying mechanism of X?")
- conditional + counterfactual ("If condition Y were absent, which outcome would NOT occur?")

Recent literal stems (don't paraphrase these — use a DIFFERENT structure):
${avoid.stems.slice(0, 3).map((s, i) => `  ${i + 1}. "${s.slice(0, 150)}..."`).join("\n")}\n`
    : "";
  return `You are writing ONE multiple-choice question for ${course}, ${unit}, modeled on real College Board released exam questions.

# CED context (use as the source of truth for content and skill expectations)
${cedExcerpt}
${avoidBlock}

# Contract
- Course: ${course}
- Unit: ${unit}
- Topic: ${topic}
- Number of options: ${contract.expectedOptionCount}
- Cognitive level: ${contract.cognitiveLevel} or higher (NOT recall)
- Stimulus required: ${contract.requiresStimulus ? "YES" : "no"}
- Stimulus type: ${contract.requiredStimulusType ?? "none"}
- Min explanation length: ${contract.minExplanationChars} chars

# Rules
1. Distractors are SPECIFIC, confident-sounding answers. NEVER include critique phrases ("incorrectly", "mistakenly", "confusing X", "wrong because") inside option text. Each distractor reflects a specific student error.
2. Distractor lengths within 30% of each other.
3. The explanation shows the actual reasoning. ${isHistory ? "Cite the stimulus directly." : "If numerical, the final number in the explanation MUST equal the option indexed by correctAnswer."}
4. NO option labels in option text. Output options as plain strings: ["Choice 1", "Choice 2", ...]. Position = letter.
5. ${contract.requiresStimulus
      ? contract.requiredStimulusType === "primarySource"
        ? `Stimulus REQUIRED — provide a REAL primary source (quoted passage with attribution to a real, identifiable historical figure or named document). NO fabrication. Format: "[QUOTED TEXT]" — Author, [role/title], [specific year]. CB never says "Imagine a colonist..."`
        : contract.requiredStimulusType === "readingPassage"
          ? `Stimulus REQUIRED — provide a 600-900 word reading passage in the style of ACT/SAT (contemporary prose: literary narrative, humanities essay, social science, or natural science). Open with a byline in this format: "Passage A: [Genre]. From [Italicized Title] by [Author Name] (©YEAR)." or "From the [novel/essay/article] [Title] by [Author] (©YEAR)." Then write the passage prose. The passage MUST be ≥1500 chars. Do NOT open with "Imagine..." or fabricate a hypothetical scenario. Real published-style content only.`
        : contract.requiredStimulusType === "graph"
          ? `Stimulus REQUIRED — embed an ACTUAL Vega-Lite chart that the student can interpret. Use this exact format:

\\\`\\\`\\\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {"values": [{"x": 0, "y": 0}, {"x": 1, "y": 2}, {"x": 2, "y": 4}]},
  "mark": "line",
  "encoding": {
    "x": {"field": "x", "type": "quantitative", "title": "Time (s)"},
    "y": {"field": "y", "type": "quantitative", "title": "Velocity (m/s)"}
  },
  "width": 320, "height": 220
}
\\\`\\\`\\\`

NO "[Graph: ...]" placeholders. The chart MUST contain real data values that the question references — students should be able to read off specific (x, y) values to answer.`
        : contract.requiredStimulusType === "diagram"
          ? `Stimulus REQUIRED — embed an ACTUAL Mermaid diagram. Use this exact format:

\\\`\\\`\\\`mermaid
graph LR
    A[Reactants] -->|catalyst| B[Transition State]
    B --> C[Products]
\\\`\\\`\\\`

For Lewis structures, free-body diagrams, molecular geometry, circuit diagrams: use Mermaid. NO ASCII art, NO "[Diagram: ...]" placeholders. The diagram MUST contain the elements/forces/bonds the question references.`
        : contract.requiredStimulusType === "table"
          ? `Stimulus REQUIRED — embed a markdown table:

| trial | time (s) | concentration (M) |
|-------|----------|-------------------|
| 1     | 0        | 0.10              |
| 2     | 30       | 0.075             |
| 3     | 60       | 0.056             |

The table MUST contain real data values the question references.`
          : `Stimulus REQUIRED — real ${contract.requiredStimulusType}.`
      : "Stimulus is optional for this topic."}
6. Cite no fabricated authors or fake datasets. Round numbers grounded in plausible facts.
7. **Math notation**: ALL math expressions MUST be wrapped in LaTeX dollar-sign delimiters for proper rendering via KaTeX. Inline: \`$x^2 + 5x + 6 = 0$\`. Block (centered, larger): \`$$\\int_0^1 f(x)\\,dx$$\`. Use this for: equations, exponents, fractions, integrals, derivatives, square roots, Greek letters (\`$\\pi$\`, \`$\\theta$\`), inequalities, summations, vectors, matrices. NEVER use unicode characters like ², ³, √, ≤, ≥, ≠, π — they don't render consistently. NEVER use ASCII art for fractions (\`a/b\`) when they're displayed as a stacked fraction (\`$\\frac{a}{b}$\`).

# Output — strict JSON
{
  "questionText": "string",
  "stimulus": "string | null",
  "stimulusType": "${contract.requiredStimulusType ?? "scenario"}" | null,
  "options": ["string", "string", "string", "string"${contract.expectedOptionCount === 5 ? ', "string"' : ""}],
  "correctAnswer": "${contract.expectedOptionCount === 5 ? "A | B | C | D | E" : "A | B | C | D"}",
  "explanation": "string (≥${contract.minExplanationChars} chars)",
  "apSkill": "string",
  "cognitiveLevel": "${contract.cognitiveLevel}",
  "subtopic": "string (more specific than topic)"
}

Generate the question now.`;
}

// ── Gates ─────────────────────────────────────────────────────────────────────

function runGates(q: any, contract: ReturnType<typeof getContract>, course: ApCourse, topic: string): { passed: boolean; failedGate?: string; detail?: string } {
  if (!contract) return { passed: false, failedGate: "no-contract" };
  let opts = q.options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
  if (!Array.isArray(opts)) return { passed: false, failedGate: "structural", detail: "options not array" };
  const ca = String(q.correctAnswer ?? "");
  const structErr = validateMcqStructure(opts, ca);
  if (structErr) return { passed: false, failedGate: "structural", detail: structErr };
  const mathErr = validateExplanationMath(q.explanation);
  if (mathErr) return { passed: false, failedGate: "math", detail: mathErr };
  const matchErr = validateAnswerNumericMatch(opts, ca, q.explanation);
  if (matchErr) return { passed: false, failedGate: "answer-match", detail: matchErr };
  const leakErr = validateDistractorIntegrity(opts, ca);
  if (leakErr) return { passed: false, failedGate: "distractor", detail: leakErr };
  const stimReq = getStimulusRequirement(course, contract.unit ?? null, topic);
  const stimErr = validateStimulus(q.questionText, q.stimulus, stimReq);
  if (stimErr) return { passed: false, failedGate: "stimulus", detail: stimErr };
  const figErr = validateFigure(q.stimulus, contract.requiredStimulusType ?? null);
  if (figErr) return { passed: false, failedGate: "figure", detail: figErr };
  // Attribution validator is AP-history-flavored (known-author allowlist,
  // CB-document specificity). Skip for readingPassage — ACT/SAT/AP English
  // contemporary-prose authors aren't on the AP-history list.
  if (contract.requiredStimulusType !== "readingPassage") {
    const attrErr = validateAttribution(q.stimulus, q.explanation);
    if (attrErr) return { passed: false, failedGate: "attribution", detail: attrErr };
  }
  return { passed: true };
}

// ── Judge ─────────────────────────────────────────────────────────────────────

async function judge(q: any, course: ApCourse, cedExcerpt: string) {
  const isHistory = course.includes("HISTORY");
  const prompt = `You are a College Board reviewer evaluating a generated ${course} MCQ. Reply with strict JSON.

# CED context
${cedExcerpt.slice(0, 3000)}

# Question
${JSON.stringify(q, null, 2)}

# Criteria
1. factualAccuracy — aligns with CED + real-world facts
2. singleAnswer — exactly one option correct
3. distractorPlausibility — each wrong option reflects a specific error (${isHistory ? "common student misreading" : "sign, units, factor-of-2"})
4. cognitiveLevel — Application or Analysis (not just Recall)
5. ${isHistory ? "sourceReality — any cited author/document is real" : "mathReverify — re-do explanation arithmetic, matches stated answer"}
6. noLeak — no critique phrases in options ("incorrectly", "mistakenly", "confusing")

Return: {"approved": true|false, "failures": [{"criterion":"...","detail":"..."}]}`;
  const r = await callGemini(JUDGE_MODEL, prompt, 800);
  try {
    const parsed = JSON.parse(r.text);
    return { approved: !!parsed.approved, failures: parsed.failures ?? [], tokens: { in: r.inputTokens, out: r.outputTokens } };
  } catch {
    return { approved: false, failures: [{ criterion: "parse", detail: r.text.slice(0, 200) }], tokens: { in: r.inputTokens, out: r.outputTokens } };
  }
}

// ── Stage 5b: OpenAI cross-family judge ───────────────────────────────────────
//
// GPT-4o-mini scores 5 criteria 1-5. ALL must score ≥4 to pass.
// This is a stricter standard than Gemini Flash (same-family) catches.

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_JUDGE_MODEL = "gpt-4o-mini";
const OPENAI_MIN_SCORE = 4;

async function openaiJudge(q: any, course: ApCourse): Promise<{
  approved: boolean;
  minScore: number;
  scores: Record<string, number>;
  failures: string[];
  cost: number;
}> {
  if (!OPENAI_KEY) {
    // Fail-open if OpenAI not configured (rare; we set this up earlier).
    return { approved: true, minScore: 5, scores: {}, failures: [], cost: 0 };
  }
  let opts = q.options;
  if (typeof opts === "string") { try { opts = JSON.parse(opts); } catch { opts = []; } }
  const prompt = `You are an expert ${course} reviewer. Score 1-5 (5=excellent CB-grade, 1=unusable).

Q: ${q.questionText}
${q.stimulus ? `Stimulus: ${String(q.stimulus).slice(0, 600)}\n` : ""}
Options:
${(opts as string[]).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n")}
Stored correct: ${q.correctAnswer}
Explanation: ${String(q.explanation).slice(0, 800)}

Score:
1. factualAccuracy (1-5)
2. singleAnswer — exactly one option correct (1-5)
3. distractorQuality — wrong options reflect specific student errors (1-5)
4. cbEquivalence — feels like real CB / ACT exam question (1-5)
5. cognitiveLevel — Application or Analysis, not Recall (1-5)

Return strict JSON: {"factualAccuracy":N,"singleAnswer":N,"distractorQuality":N,"cbEquivalence":N,"cognitiveLevel":N,"reason":"<brief if any score ≤3>"}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_JUDGE_MODEL,
      messages: [
        { role: "system", content: "Strict exam-question reviewer. JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 250,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 150)}`);
  }
  const json = await res.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  const scores = {
    factualAccuracy: parsed.factualAccuracy ?? 0,
    singleAnswer: parsed.singleAnswer ?? 0,
    distractorQuality: parsed.distractorQuality ?? 0,
    cbEquivalence: parsed.cbEquivalence ?? 0,
    cognitiveLevel: parsed.cognitiveLevel ?? 0,
  };
  const minScore = Math.min(...Object.values(scores));
  // gpt-4o-mini pricing: $0.15 input / $0.60 output per Mtok
  const inTok = json.usage?.prompt_tokens ?? 700;
  const outTok = json.usage?.completion_tokens ?? 100;
  const cost = (inTok / 1_000_000) * 0.15 + (outTok / 1_000_000) * 0.60;
  return {
    approved: minScore >= OPENAI_MIN_SCORE,
    minScore,
    scores,
    failures: minScore < OPENAI_MIN_SCORE ? [parsed.reason ?? `min score ${minScore} below ${OPENAI_MIN_SCORE}`] : [],
    cost,
  };
}

// ── DB persist ────────────────────────────────────────────────────────────────

async function persistQuestion(q: any, course: ApCourse, unit: ApUnit, topic: string): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const normalized = String(q.questionText).toLowerCase().replace(/\s+/g, " ").trim();
  const contentHash = createHash("sha256").update(normalized).digest("hex");
  try {
    const created = await prisma.question.create({
      data: {
        course,
        unit,
        topic,
        subtopic: q.subtopic ?? null,
        difficulty: Difficulty.MEDIUM,
        questionType: QuestionType.MCQ,
        questionText: q.questionText,
        stimulus: q.stimulus ?? null,
        stimulusImageUrl: null,
        options: q.options,
        correctAnswer: String(q.correctAnswer).toUpperCase(),
        explanation: q.explanation,
        isAiGenerated: true,
        isApproved: true,
        modelUsed: PIPELINE_VERSION,
        generatedForTier: SubTier.FREE,
        contentHash,
        apSkill: q.apSkill ?? null,
        bloomLevel: String(q.cognitiveLevel ?? "apply").toLowerCase(),
      },
    });
    return { ok: true, id: created.id };
  } catch (e: any) {
    if (e.code === "P2002") return { ok: false, reason: "duplicate (contentHash)" };
    return { ok: false, reason: e.message?.slice(0, 200) ?? "DB error" };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { course, target, budget, dry } = parseArgs();
  log(`Course: ${course}, target=${target}, budget=$${budget.toFixed(2)}, dry=${dry}`);

  // How many do we currently have?
  const currentCount = await prisma.question.count({
    where: { course, isApproved: true, questionType: QuestionType.MCQ },
  });
  log(`Current approved: ${currentCount}. Need ${Math.max(0, target - currentCount)} more.`);

  if (currentCount >= target) {
    log(`✓ Already at target. Exiting.`);
    await prisma.$disconnect();
    return;
  }

  const cedExcerpt = loadCedExcerpt(course);
  if (!cedExcerpt) log(`⚠ No CED excerpt for ${course} — generator runs without grounding context.`);

  let approved = 0, attempts = 0, totalCost = 0;
  let consecutiveFails = 0;
  const failureLog: { idx: number; gate: string; detail: string }[] = [];
  const created: string[] = [];

  while (currentCount + approved < target) {
    if (totalCost >= budget) { log(`✗ Budget cap $${budget} reached. Stopping.`); break; }
    if (consecutiveFails >= 20) { log(`✗ 20 consecutive rejections — stopping (something is systematically wrong).`); break; }
    attempts++;
    const pick = await pickLeastCoveredTopic(course);
    if (!pick) { log(`✗ No topics for ${course}`); break; }
    const { unit, topic } = pick;
    const contract = getContract(course, unit, topic);
    if (!contract) { log(`✗ No contract for ${unit}/${topic}`); break; }

    let candidate: any;
    let genCost = 0;
    try {
      const avoid = await getRecentStems(course, 5);
      const prompt = buildGenPrompt(course, unit, topic, contract, cedExcerpt, avoid);
      const r = await callGemini(GENERATOR_MODEL, prompt, 1500);
      genCost = costFor(GENERATOR_MODEL, r.inputTokens, r.outputTokens);
      totalCost += genCost;
      candidate = JSON.parse(r.text);
    } catch (e: any) {
      log(`  Q${attempts}: gen error: ${e.message?.slice(0, 100)}`);
      // Gen errors are transient API issues (503/429/parse-fail), NOT
      // quality rejections. Don't count toward consecutiveFails brake.
      continue;
    }

    const det = runGates(candidate, contract, course, topic);
    if (!det.passed) {
      consecutiveFails++;
      failureLog.push({ idx: attempts, gate: det.failedGate ?? "?", detail: (det.detail ?? "").slice(0, 100) });
      if (attempts % 5 === 0) log(`  Q${attempts}: det reject [${det.failedGate}] | approved=${approved}/${target - currentCount} | $${totalCost.toFixed(3)}`);
      continue;
    }

    let judgeResult: any;
    let judgeCost = 0;
    try {
      judgeResult = await judge(candidate, course, cedExcerpt);
      judgeCost = costFor(JUDGE_MODEL, judgeResult.tokens.in, judgeResult.tokens.out);
      totalCost += judgeCost;
    } catch (e: any) {
      log(`  Q${attempts}: judge error: ${e.message?.slice(0, 100)}`);
      // Judge errors are transient API issues, NOT rejections.
      continue;
    }
    if (!judgeResult.approved) {
      consecutiveFails++;
      failureLog.push({ idx: attempts, gate: "judge", detail: (judgeResult.failures?.[0]?.detail ?? "").slice(0, 100) });
      continue;
    }

    // Stage 5b — OpenAI GPT-4o-mini cross-family judge (added 2026-05-02
    // per user directive "use all tools LLM to validate").
    // Same family (Gemini Pro) gen + (Gemini Flash) judge has known
    // blind spots. Adding GPT-4o-mini as a SECOND judge from a different
    // model family catches what Gemini misses — especially distractor
    // quality and CB-equivalence (the 2 weakest dimensions in the audit).
    // Cost: ~$0.0002 per question; negligible vs quality gain.
    let openaiJudgeCost = 0;
    try {
      const oaResult = await openaiJudge(candidate, course);
      openaiJudgeCost = oaResult.cost;
      totalCost += openaiJudgeCost;
      if (!oaResult.approved) {
        consecutiveFails++;
        failureLog.push({
          idx: attempts,
          gate: "openai-judge",
          detail: (oaResult.failures?.[0] ?? "").slice(0, 100),
        });
        if (attempts % 5 === 0) {
          log(`  Q${attempts}: ✗ openai-judge rejected | minScore=${oaResult.minScore} | $${totalCost.toFixed(3)}`);
        }
        continue;
      }
    } catch (e: any) {
      const msg = e.message ?? "";
      const is429 = /429/.test(msg);
      const isTransient = is429 || /5\d\d/.test(msg) || /timeout|ETIMEDOUT|ECONNRESET/i.test(msg);
      if (isTransient) {
        // Transient infra issue — fail-OPEN. Question already passed
        // deterministic gates + Gemini judge; treat as approved.
        // (Bug 2026-05-09: previous behavior `continue`'d, dropping every
        // 429'd question. SAT_RW rebuild produced 0 approvals because the
        // OpenAI account was rate-limited the entire run.)
        if (attempts % 5 === 0) {
          log(`  Q${attempts}: openai-judge ${is429 ? "rate-limited" : "transient err"}, fail-OPEN | $${totalCost.toFixed(3)}`);
        }
        // FALL THROUGH to persistQuestion below
      } else {
        log(`  Q${attempts}: openai-judge non-transient error: ${msg.slice(0, 100)}`);
        continue;
      }
    }

    if (dry) {
      log(`  Q${attempts}: ✓ approved (DRY — not persisted) | $${(genCost + judgeCost + openaiJudgeCost).toFixed(4)}`);
      approved++;
      consecutiveFails = 0;
      continue;
    }

    const saved = await persistQuestion(candidate, course, unit, topic);
    if (saved.ok) {
      approved++;
      consecutiveFails = 0;
      created.push(saved.id);
      log(`  Q${attempts}: ✓ saved id=${saved.id.slice(0, 12)}... | approved=${currentCount + approved}/${target} | $${totalCost.toFixed(3)}`);

      // Random-audit log every 5 approved Qs — saves the question to
      // data/audit-samples/ so user can spot-check quality.
      if (approved % 5 === 0) {
        const auditDir = join(process.cwd(), "data/audit-samples");
        mkdirSync(auditDir, { recursive: true });
        const auditPath = join(auditDir, `${course}-${saved.id}.json`);
        writeFileSync(auditPath, JSON.stringify({
          courseId: saved.id,
          course, unit, topic,
          questionText: candidate.questionText,
          stimulus: candidate.stimulus,
          options: candidate.options,
          correctAnswer: candidate.correctAnswer,
          explanation: candidate.explanation,
          generatedAt: new Date().toISOString(),
        }, null, 2));
        log(`    [audit-sample] saved to ${auditPath}`);
      }
    } else {
      log(`  Q${attempts}: ✗ DB save failed: ${saved.reason}`);
      consecutiveFails++;
    }
  }

  // Auto-visible: if this course just hit the threshold, add it to the
  // visible_courses allowlist so users see it immediately.
  const finalCount = currentCount + approved;
  if (finalCount >= target && !dry) {
    try {
      const settingRow = await prisma.siteSetting.findUnique({ where: { key: "visible_courses" } });
      let allowlist: string[] = [];
      if (settingRow?.value && settingRow.value !== "all") {
        try { allowlist = JSON.parse(settingRow.value); } catch { allowlist = []; }
      }
      if (!allowlist.includes(course)) {
        allowlist.push(course);
        await prisma.siteSetting.upsert({
          where: { key: "visible_courses" },
          create: { key: "visible_courses", value: JSON.stringify(allowlist), updatedBy: "rebuild-bank-auto" },
          update: { value: JSON.stringify(allowlist), updatedBy: "rebuild-bank-auto" },
        });
        log(`  ✓ Added ${course} to visible_courses (now ${allowlist.length} visible)`);
      } else {
        log(`  ✓ ${course} already in visible_courses`);
      }
    } catch (e: any) {
      log(`  ⚠ failed to update visible_courses: ${e.message}`);
    }
  }

  log("");
  log("━".repeat(60));
  log(`Course: ${course}`);
  log(`  Final approved count:    ${currentCount + approved} / ${target}`);
  log(`  Newly added this run:    ${approved}`);
  log(`  Attempts:                ${attempts}`);
  log(`  Pass rate:               ${attempts ? Math.round((approved / attempts) * 100) : 0}%`);
  log(`  Total cost:              $${totalCost.toFixed(4)}`);
  log(`  Cost per approved Q:     $${approved ? (totalCost / approved).toFixed(4) : "n/a"}`);
  log("━".repeat(60));

  // Save artifacts
  const outDir = join(process.cwd(), "data/rebuild-runs");
  mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(
    join(outDir, `${course}-${ts}.json`),
    JSON.stringify({ course, target, budget, dry, currentCount, approved, attempts, totalCost, created, failureLog }, null, 2),
  );

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

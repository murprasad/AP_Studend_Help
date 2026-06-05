// End-to-end fidelity generator proof:
//   Algorithmic SVG figure → prompt LLM with figure context → validated Q
//   with stimulusImageUrl populated + distractorExplanations populated.
//
// Run: npx tsx scripts/_gen-sat-math-with-figure.ts --count=5
//      npx tsx scripts/_gen-sat-math-with-figure.ts --count=1 --dry-run

import { config } from "dotenv";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderStimulus, type StimulusSpec } from "../src/lib/stimulus-svg/index";
import crypto from "node:crypto";
// @ts-ignore — JS helper, no types
import { makePrisma } from "./_prisma-http.mjs";

config({ path: "C:/Users/akkil/project/AP_Help/.env" });
process.env.DATABASE_URL = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

main().catch((e) => { console.error(e); process.exit(1); });

async function main() {
  const FLAGS = process.argv.slice(2);
  const COUNT = parseInt(FLAGS.find((f) => f.startsWith("--count="))?.split("=")[1] ?? "1", 10);
  const DRY_RUN = FLAGS.includes("--dry-run");
  const SAVE = FLAGS.includes("--save");
  const prisma: any = SAVE ? makePrisma() : null;
  const DOMAIN_TO_UNIT: Record<string, string> = {
    ALGEBRA: "SAT_MATH_1_ALGEBRA",
    ADVANCED_MATH: "SAT_MATH_2_ADVANCED_MATH",
    PROBLEM_SOLVING_DATA_ANALYSIS: "SAT_MATH_3_PROBLEM_SOLVING",
    GEOMETRY_TRIG: "SAT_MATH_4_GEOMETRY_TRIG",
  };

  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    console.error("GROQ_API_KEY not set. Aborting.");
    process.exit(1);
  }

  const BLUEPRINTS = [
    {
      domain: "ALGEBRA",
      subskill: "Linear functions — slope interpretation",
      figureKind: "scatterPlot-with-trendline",
      contextTopics: ["population growth", "savings over time", "fuel consumption", "subscriber growth", "temperature rise"],
    },
    {
      domain: "PROBLEM_SOLVING_DATA_ANALYSIS",
      subskill: "One-variable data — measure of center from bar chart",
      figureKind: "barChart",
      contextTopics: ["votes for school activities", "books read per student", "products sold per category", "test scores by class"],
    },
    {
      domain: "ALGEBRA",
      subskill: "Linear equations from a graph — finding y-intercept",
      figureKind: "coordinatePlane-line",
      contextTopics: ["cost over time", "distance traveled", "balance over months", "tank fill level"],
    },
  ];

  const OUT_DIR = path.join(REPO, "data", "fidelity-proofs", "generated");
  mkdirSync(OUT_DIR, { recursive: true });

  const summary: { ok: boolean; file?: string; stem?: string }[] = [];

  for (let i = 0; i < COUNT; i++) {
    const bp = BLUEPRINTS[i % BLUEPRINTS.length];
    const ctx = bp.contextTopics[Math.floor(Math.random() * bp.contextTopics.length)];
    process.stdout.write(`[${i + 1}/${COUNT}] ${bp.domain} / ${bp.subskill} / context="${ctx}"... `);

    try {
      const stimulus = buildStimulus(bp.figureKind, ctx);
      const rendered = renderStimulus(stimulus as StimulusSpec);

      const promptText = buildPrompt(bp, ctx, stimulus);
      const ai = await callGroq(GROQ_KEY, promptText);
      if (!ai) {
        process.stdout.write("AI call failed\n");
        continue;
      }
      const parsed = parseJsonStrict(ai);
      if (!parsed || !validateQuestion(parsed)) {
        process.stdout.write("validation failed\n");
        continue;
      }

      const verify = {
        svgBytes: rendered.svg.length,
        hasStimulusImageUrl: !!rendered.dataUri,
        distractorCount: Object.keys(parsed.distractorExplanations || {}).length,
        perOptionExplanationsPresent: Object.values(parsed.distractorExplanations || {}).every((e: any) => typeof e === "string" && e.length > 30),
      };

      const fullRecord = {
        course: "SAT_MATH",
        domain: bp.domain,
        subskill: bp.subskill,
        difficulty: "MEDIUM",
        questionType: "MCQ",
        stimulusSpec: stimulus,
        stimulusImageUrl: rendered.dataUri,
        questionText: parsed.stem,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
        explanation: parsed.workedSolution,
        distractorExplanations: parsed.distractorExplanations,
        sourceAttribution: {
          figureLicense: "Algorithmic SVG — original",
          scenarioLicense: "Synthetic stimulus modeled on real-world domain (illustrative)",
        },
        verify,
      };

      const fname = `gen-sat-math-${Date.now()}-${i}.json`;
      if (!DRY_RUN) {
        writeFileSync(path.join(OUT_DIR, fname), JSON.stringify(fullRecord, null, 2), "utf8");
        writeFileSync(path.join(OUT_DIR, fname.replace(".json", ".svg")), rendered.svg, "utf8");
      }
      // Productionize (--save): insert the figure-backed Q into the bank. SVG
      // lives in stimulusImageUrl as a data-URI (rendered by the practice page).
      // Single create (Neon HTTP — no transaction). isApproved=true: it already
      // passed validateQuestion() + has a real figure + per-option explanations.
      if (SAVE && prisma) {
        const ch = crypto.createHash("sha256")
          .update((parsed.stem || "").toLowerCase().replace(/\s+/g, " ").trim()).digest("hex");
        try {
          await prisma.question.create({
            data: {
              course: "SAT_MATH", unit: DOMAIN_TO_UNIT[bp.domain] || "SAT_MATH_1_ALGEBRA",
              topic: bp.subskill, subtopic: "", difficulty: "MEDIUM", questionType: "MCQ",
              questionText: parsed.stem, options: parsed.options, correctAnswer: parsed.correctAnswer,
              explanation: parsed.workedSolution, stimulusImageUrl: rendered.dataUri,
              distractorExplanations: parsed.distractorExplanations, isApproved: true,
              isAiGenerated: true, contentHash: ch, modelUsed: "figure-svg-gen-2026-06-05",
              generatedForTier: "FREE", apSkill: bp.subskill,
            },
          });
          process.stdout.write(" [saved]");
        } catch (e: any) {
          process.stdout.write(` [save skip: ${(e.message || "").slice(0, 40)}]`);
        }
      }
      summary.push({ ok: true, file: fname, stem: parsed.stem.slice(0, 80) });
      process.stdout.write(`OK — ${verify.svgBytes}b SVG, ${verify.distractorCount} distractors\n`);
    } catch (err: any) {
      process.stdout.write(`ERROR: ${err.message || err}\n`);
    }

    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log(`\n═══ Summary ═══`);
  console.log(`  Generated: ${summary.filter((s) => s.ok).length} / ${COUNT}`);
  console.log(`  Output:    ${path.relative(REPO, OUT_DIR)}/`);
  for (const s of summary) {
    if (s.ok) console.log(`    • ${s.stem}...`);
  }
  if (SAVE) console.log(`  Saved to DB: SAT_MATH figure-backed (modelUsed=figure-svg-gen-2026-06-05)`);
  if (prisma) await prisma.$disconnect();
}

// ─────────────────────────────────────────────────────────────────────────

function buildStimulus(figureKind: string, ctx: string): any {
  if (figureKind === "scatterPlot-with-trendline") {
    const intercept = 40 + Math.floor(Math.random() * 60);
    const slope = 15 + Math.floor(Math.random() * 25);
    const data: { x: number; y: number }[] = [];
    for (let x = 0; x <= 10; x += 2) {
      const y = intercept + slope * x + Math.round((Math.random() - 0.5) * 10);
      data.push({ x, y });
    }
    return {
      kind: "scatterPlot",
      spec: {
        width: 440,
        height: 360,
        xRange: [0, 12],
        yRange: [0, Math.ceil((intercept + slope * 10 + 30) / 50) * 50],
        title: `${ctx.charAt(0).toUpperCase() + ctx.slice(1)} vs Time`,
        xLabel: "Months",
        yLabel: ctx,
        points: data.map((p) => ({ x: p.x, y: p.y, color: "#0b62a4" })),
        trendline: { from: [0, intercept], to: [10, intercept + slope * 10], color: "#0b62a4" },
      },
      _meta: { intercept, slope, dataPoints: data },
    };
  }
  if (figureKind === "barChart") {
    const categories = ["A", "B", "C", "D", "E"];
    const values = categories.map(() => 10 + Math.floor(Math.random() * 40));
    return {
      kind: "barChart",
      spec: {
        width: 420,
        height: 320,
        title: `${ctx.charAt(0).toUpperCase() + ctx.slice(1)}`,
        xLabel: "Category",
        yLabel: "Count",
        categories,
        values,
      },
      _meta: { categories, values, sum: values.reduce((a, b) => a + b, 0) },
    };
  }
  if (figureKind === "coordinatePlane-line") {
    const intercept = 5 + Math.floor(Math.random() * 25);
    const slope = 2 + Math.floor(Math.random() * 8);
    return {
      kind: "coordinatePlane",
      spec: {
        width: 420,
        height: 360,
        xRange: [0, 10],
        yRange: [0, intercept + slope * 10 + 10],
        title: `${ctx.charAt(0).toUpperCase() + ctx.slice(1)}`,
        xLabel: "Time (hours)",
        yLabel: ctx,
        lines: [{ from: [0, intercept], to: [10, intercept + slope * 10], color: "#0b62a4" }],
      },
      _meta: { intercept, slope },
    };
  }
  throw new Error(`Unknown figure kind: ${figureKind}`);
}

function buildPrompt(bp: any, ctx: string, stimulus: any): string {
  const meta = stimulus._meta;
  let figureDescription = "";
  if (stimulus.kind === "scatterPlot") {
    figureDescription = `A scatterplot of ${ctx} (y-axis) versus months (x-axis) from 0 to 10 months. The line of best fit has y-intercept ${meta.intercept} and slope ${meta.slope} (so it passes through (0, ${meta.intercept}) and (10, ${meta.intercept + meta.slope * 10})).`;
  } else if (stimulus.kind === "barChart") {
    figureDescription = `A bar chart with 5 categories (A, B, C, D, E) and values ${meta.values.join(", ")}. Sum = ${meta.sum}.`;
  } else if (stimulus.kind === "coordinatePlane") {
    figureDescription = `A coordinate plane with a single line of best fit. y-intercept = ${meta.intercept}, slope = ${meta.slope}.`;
  }

  const mistakeCategories = bp.subskill.includes("slope")
    ? "slope-vs-intercept-confusion, intercept-as-slope, slope-as-endpoint, sign-flip, units-error"
    : "off-by-one-category, sum-vs-mean confusion, max-as-median, range-as-mode, label-misread";

  return `You are writing a CB-style Digital SAT Math question.

CONTEXT:
- Domain: ${bp.domain}
- Subskill: ${bp.subskill}
- Difficulty: MEDIUM (target pValue ~0.55)
- A figure is provided to the student. Description:
  ${figureDescription}

STYLE RULES:
- 4-option MCQ (A, B, C, D)
- Stem 1-3 sentences, refers to the figure
- Each wrong option must be traceable to a NAMED student mistake category. Use one of:
  ${mistakeCategories}
- 60-120 word explanation per wrong option that names the misconception and points to the right method
- Use natural CB vocabulary cues like "Which of the following is the best interpretation of..." or "What is the value of..."

Respond with ONLY valid JSON (no prose before/after):
{
  "stem": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A|B|C|D",
  "workedSolution": "...",
  "distractorExplanations": {
    "<wrong letter 1>": "...",
    "<wrong letter 2>": "...",
    "<wrong letter 3>": "..."
  }
}`;
}

async function callGroq(key: string, prompt: string): Promise<string | null> {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) return null;
  const j = await resp.json();
  return j.choices?.[0]?.message?.content ?? null;
}

function parseJsonStrict(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function validateQuestion(q: any): boolean {
  if (!q.stem || q.stem.length < 30) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  if (!"ABCD".includes(q.correctAnswer)) return false;
  if (!q.workedSolution || q.workedSolution.length < 50) return false;
  const wrong = "ABCD".split("").filter((L) => L !== q.correctAnswer);
  if (!q.distractorExplanations) return false;
  for (const L of wrong) {
    if (typeof q.distractorExplanations[L] !== "string" || q.distractorExplanations[L].length < 40) return false;
  }
  return true;
}

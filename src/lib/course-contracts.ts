/**
 * src/lib/course-contracts.ts — per-course/unit/topic contracts that
 * define what a CB-equivalent MCQ looks like for that scope. Read by
 * every gate in the question pipeline (design v1, §4.1 SPEC stage).
 *
 * Architecture: layered. A `defaultContractFor(course)` returns the
 * baseline (e.g. "all AP US History MCQs require a primary source").
 * Topic-specific overrides live in `topicOverrides`. `getContract()`
 * merges them.
 *
 * Why not hand-write 14 courses × 8 units × 4 topics = 448 entries?
 * The course-family defaults capture 90% of the contract. Overrides
 * handle the long tail (e.g. "AP_PHYSICS_1, kinematics topics, require
 * a free-body diagram or motion graph").
 *
 * The cbAnchorExamples field is intentionally NOT hand-populated here —
 * those come from the RAG retrieval over CED PDFs at generation time
 * (design v1, §4.2 GROUND stage). This file owns the SPEC contract
 * (what we require); the corpus index owns the EXAMPLES (what real CB
 * looks like).
 */

import { ApCourse, ApUnit } from "@prisma/client";

export type CognitiveLevel = "Recall" | "Application" | "Analysis" | "Evaluation";
export type StimulusType = "primarySource" | "readingPassage" | "graph" | "table" | "diagram" | "image" | "scenario";

export type QuestionContract = {
  /** Course this contract applies to. */
  course: ApCourse;
  /** Unit within the course; null = applies to whole course. */
  unit?: ApUnit;
  /** Topic string match (substring, case-insensitive); null = applies to whole unit. */
  topicMatch?: string;
  /** How many MCQ options the real CB exam uses for this scope. */
  expectedOptionCount: 4 | 5;
  /** Must this question be anchored to a stimulus? */
  requiresStimulus: boolean;
  /** Type of stimulus required, when required. */
  requiredStimulusType?: StimulusType;
  /** Minimum cognitive level — generator must produce at this level or higher. */
  cognitiveLevel: CognitiveLevel;
  /** Minimum explanation length. CB explanations average 200-400 chars. */
  minExplanationChars: number;
  /** Patterns forbidden in option text — caught by structural gate. */
  forbiddenPatterns: string[];
  /**
   * Course-family-specific notes for the generator prompt. Short and
   * concrete, not marketing copy.
   */
  generatorNotes?: string;
};

// ── Course-family defaults ────────────────────────────────────────────────────

/**
 * AP History courses (US History, World History, European History).
 * Per the 2026-05-01 audit: every CB AP History MCQ is anchored to a
 * primary source (Stamp Act resolutions, 1860 Republican platform,
 * Béla IV letter, Sinan biography). A history MCQ without a primary
 * source is a flashcard, not a CB-style question. Hard rule.
 */
const AP_HISTORY_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: true,
  requiredStimulusType: "primarySource",
  cognitiveLevel: "Analysis",
  minExplanationChars: 150,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)"],
  generatorNotes:
    "Anchor to a real primary source (a quoted document, image with caption, or named author). Do NOT fabricate sources. CB never uses 'Imagine a colonist...' — use real documents only. Distractors must reflect plausible misreadings of the source, not generic textbook misconceptions.",
};

/**
 * AP STEM courses with heavy visual content (Physics 1/2, Calc AB/BC,
 * Chemistry, Biology, Environmental Science). Per audit: ~60-80% of
 * CB MCQs in these courses use a diagram, graph, or table. Stimulus
 * is required for any topic where setup or data is essential.
 */
const AP_STEM_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: false, // overridden per topic; default is permissive
  cognitiveLevel: "Application",
  minExplanationChars: 150,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)"],
  generatorNotes:
    "Show units in numerical answers. Distractors must reflect specific student errors (sign error, unit mismatch, off-by-factor-of-two), not random numbers. If the question requires a diagram or graph, include it in the stimulus field — never reference 'the figure above' without one.",
};

/**
 * AP Statistics — special case: real CB MCQs use 5 options (A-E).
 * Per audit: our Stats bank had 4. Format violation.
 */
const AP_STATS_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 5, // CB uses 5 for Stats specifically
  requiresStimulus: true,
  requiredStimulusType: "table",
  cognitiveLevel: "Analysis",
  minExplanationChars: 200,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)", "(E)"],
  generatorNotes:
    "AP Statistics MCQs use 5 options (A-E), not 4. Almost every question references a data set, scenario, or graph. Distractors are common statistical errors (confusing mean/median, mistaking association for causation, misinterpreting p-values). Include real numerical data; do not generate 'Consider a hypothetical study'.",
};

/**
 * AP CS Principles — pseudocode-driven. Stimulus required when
 * tracing or analyzing code.
 */
const AP_CSP_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: false, // permissive default; pseudocode topics override
  cognitiveLevel: "Application",
  minExplanationChars: 150,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)"],
  generatorNotes:
    "Use AP CSP pseudocode syntax: PROCEDURE, DISPLAY, INPUT, IF, REPEAT, FOR EACH, RETURN, <- assignment. Do NOT use Python, JavaScript, or other real languages. If the question references a code segment, the stimulus must contain it.",
};

/**
 * AP Behavioral / Conceptual courses (Psychology, Human Geography,
 * US Government, Macro/Microeconomics). More text-heavy, less
 * primary-source-required than history but still benefit from a
 * scenario or data table for higher-tier cognitive levels.
 */
const AP_BEHAVIORAL_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: false, // varies by topic
  cognitiveLevel: "Application",
  minExplanationChars: 150,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)"],
  generatorNotes:
    "Distractors must be specific theories/named entities (e.g., for Maslow: 'Esteem needs', not 'Needs related to esteem'). Never embed the answer's critique in another option ('mistakenly assuming...' is the gold-standard tell that distractor leaks the answer).",
};

/**
 * SAT / ACT — different exam structure. SAT uses 4 options. ACT Math
 * uniquely uses 5. SAT R&W and ACT Reading require a passage stimulus.
 */
const SAT_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: false, // R&W requires passage; Math may include figure
  cognitiveLevel: "Application",
  minExplanationChars: 100,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)"],
};

const ACT_DEFAULT: Omit<QuestionContract, "course"> = {
  expectedOptionCount: 4,
  requiresStimulus: false,
  cognitiveLevel: "Application",
  minExplanationChars: 100,
  forbiddenPatterns: ["(A)", "(B)", "(C)", "(D)", "(E)", "(F)", "(G)", "(H)", "(J)", "(K)"],
};

const ACT_MATH_DEFAULT: Omit<QuestionContract, "course"> = {
  ...ACT_DEFAULT,
  expectedOptionCount: 5, // ACT Math uses 5 (A-E or F-K alternating)
};

// ── Course → default contract map ─────────────────────────────────────────────

const COURSE_DEFAULTS: Partial<Record<ApCourse, Omit<QuestionContract, "course">>> = {
  AP_US_HISTORY: AP_HISTORY_DEFAULT,
  AP_WORLD_HISTORY: AP_HISTORY_DEFAULT,
  AP_EUROPEAN_HISTORY: AP_HISTORY_DEFAULT,
  AP_PHYSICS_1: AP_STEM_DEFAULT,
  AP_PHYSICS_2: AP_STEM_DEFAULT,
  AP_PHYSICS_C_MECHANICS: AP_STEM_DEFAULT,
  AP_PHYSICS_C_ELECTRICITY_MAGNETISM: AP_STEM_DEFAULT,
  AP_CALCULUS_AB: AP_STEM_DEFAULT,
  AP_CALCULUS_BC: AP_STEM_DEFAULT,
  AP_PRECALCULUS: AP_STEM_DEFAULT,
  AP_CHEMISTRY: AP_STEM_DEFAULT,
  AP_BIOLOGY: AP_STEM_DEFAULT,
  AP_ENVIRONMENTAL_SCIENCE: AP_STEM_DEFAULT,
  AP_STATISTICS: AP_STATS_DEFAULT,
  AP_COMPUTER_SCIENCE_PRINCIPLES: AP_CSP_DEFAULT,
  AP_PSYCHOLOGY: AP_BEHAVIORAL_DEFAULT,
  AP_HUMAN_GEOGRAPHY: AP_BEHAVIORAL_DEFAULT,
  AP_US_GOVERNMENT: AP_BEHAVIORAL_DEFAULT,
  AP_MACROECONOMICS: AP_BEHAVIORAL_DEFAULT,
  AP_MICROECONOMICS: AP_BEHAVIORAL_DEFAULT,
  SAT_MATH: SAT_DEFAULT,
  SAT_READING_WRITING: { ...SAT_DEFAULT, requiresStimulus: true, requiredStimulusType: "readingPassage" },
  ACT_MATH: ACT_MATH_DEFAULT,
  ACT_ENGLISH: ACT_DEFAULT,
  ACT_READING: { ...ACT_DEFAULT, requiresStimulus: true, requiredStimulusType: "readingPassage" },
  ACT_SCIENCE: { ...ACT_DEFAULT, requiresStimulus: true, requiredStimulusType: "table" },
};

// ── Topic-level overrides ─────────────────────────────────────────────────────

/**
 * Topic patterns that promote a STEM course's `requiresStimulus` to
 * true. Substring match against `topic` field, case-insensitive.
 *
 * Sourced from the CED audit: physics kinematics needs motion graphs
 * or free-body diagrams; chemistry titration needs a curve or data
 * table; calculus optimization needs a function graph; biology genetics
 * needs a Punnett square or pedigree.
 */
const STEM_VISUAL_TOPIC_PATTERNS: { pattern: RegExp; type: StimulusType }[] = [
  { pattern: /\b(kinematics|projectile|motion|velocity|acceleration|free-body|FBD)\b/i, type: "diagram" },
  { pattern: /\b(graph|plot|curve|function|trajectory)\b/i, type: "graph" },
  // Chem patterns extended 2026-05-02 per CB-comparison audit (CB Chem
  // CED has figures in 6 of first 7 MCQs; ours had 0%).
  { pattern: /\b(titration|equilibrium|reaction\s+rate|rate\s+law|kinetics)\b/i, type: "graph" },
  { pattern: /\b(lewis|molecular\s+geometry|VSEPR|bonding|hybridization|orbital)\b/i, type: "diagram" },
  { pattern: /\b(spectroscop|spectrum|spectra|absorption|emission)\b/i, type: "graph" },
  { pattern: /\b(periodic\s+trend|atomic\s+radius|ionization\s+energy)\b/i, type: "graph" },
  { pattern: /\b(buret|calorimetry|reaction\s+coordinate)\b/i, type: "graph" },
  { pattern: /\b(pedigree|punnett|inheritance|cross)\b/i, type: "diagram" },
  { pattern: /\b(circuit|wiring|capacitor|resistor)\b/i, type: "diagram" },
  { pattern: /\b(data|table|measurement|reading)\b/i, type: "table" },
  // Precalc/Calc — most topics need a graph
  { pattern: /\b(optimization|related\s+rates|integral|riemann)\b/i, type: "graph" },
  { pattern: /\b(trig|sine|cosine|tangent|sinusoidal|periodic|amplitude|phase)\b/i, type: "graph" },
  { pattern: /\b(polynomial|rational|exponential|logarithm|log)\b/i, type: "graph" },
  { pattern: /\b(asymptote|end\s+behavior|inverse|composition)\b/i, type: "graph" },
  { pattern: /\b(transformation|shift|reflection|stretch|dilat)\w*/i, type: "graph" },
];

const TOPIC_OVERRIDES: Array<Partial<QuestionContract> & { course: ApCourse; topicMatch: string }> = [
  // CSP pseudocode topics — stimulus REQUIRED when tracing code
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    topicMatch: "algorithm",
    requiresStimulus: true,
    requiredStimulusType: "diagram",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    topicMatch: "iteration",
    requiresStimulus: true,
    requiredStimulusType: "diagram",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    topicMatch: "procedure",
    requiresStimulus: true,
    requiredStimulusType: "diagram",
  },
  // Behavioral courses — graphs/tables for econ
  {
    course: "AP_MACROECONOMICS",
    topicMatch: "supply",
    requiresStimulus: true,
    requiredStimulusType: "graph",
  },
  {
    course: "AP_MACROECONOMICS",
    topicMatch: "demand",
    requiresStimulus: true,
    requiredStimulusType: "graph",
  },
  {
    course: "AP_MICROECONOMICS",
    topicMatch: "supply",
    requiresStimulus: true,
    requiredStimulusType: "graph",
  },
  {
    course: "AP_MICROECONOMICS",
    topicMatch: "demand",
    requiresStimulus: true,
    requiredStimulusType: "graph",
  },
  // Human Geography — maps and data
  {
    course: "AP_HUMAN_GEOGRAPHY",
    topicMatch: "population",
    requiresStimulus: true,
    requiredStimulusType: "table",
  },
  // US Gov — primary source for foundational documents
  {
    course: "AP_US_GOVERNMENT",
    topicMatch: "foundation",
    requiresStimulus: true,
    requiredStimulusType: "primarySource",
  },
  {
    course: "AP_US_GOVERNMENT",
    topicMatch: "constitution",
    requiresStimulus: true,
    requiredStimulusType: "primarySource",
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Get the contract for a (course, unit, topic) tuple. Layers:
 *   1. Course-family default (history/STEM/stats/CSP/behavioral/SAT/ACT)
 *   2. STEM visual topic patterns (auto-promote requiresStimulus when topic mentions kinematics, graphs, etc.)
 *   3. Explicit topic overrides
 *
 * Returns null if the course has no registered default. Callers should
 * treat null as "halt — config error" rather than continue with a
 * permissive default.
 */
export function getContract(
  course: ApCourse,
  unit: ApUnit | null,
  topic: string | null,
): QuestionContract | null {
  const baseDefault = COURSE_DEFAULTS[course];
  if (!baseDefault) return null;

  let contract: QuestionContract = { ...baseDefault, course };

  // Layer 2: STEM visual topic patterns
  const stemCourses: ApCourse[] = [
    "AP_PHYSICS_1",
    "AP_PHYSICS_2",
    "AP_PHYSICS_C_MECHANICS",
    "AP_PHYSICS_C_ELECTRICITY_MAGNETISM",
    "AP_CALCULUS_AB",
    "AP_CALCULUS_BC",
    "AP_PRECALCULUS",
    "AP_CHEMISTRY",
    "AP_BIOLOGY",
  ];
  if (stemCourses.includes(course) && topic) {
    for (const { pattern, type } of STEM_VISUAL_TOPIC_PATTERNS) {
      if (pattern.test(topic)) {
        contract = { ...contract, requiresStimulus: true, requiredStimulusType: type };
        break;
      }
    }
  }

  // Layer 3: explicit topic overrides
  if (topic) {
    for (const ov of TOPIC_OVERRIDES) {
      if (ov.course === course && topic.toLowerCase().includes(ov.topicMatch.toLowerCase())) {
        contract = { ...contract, ...ov };
        break;
      }
    }
  }

  contract.unit = unit ?? undefined;
  contract.topicMatch = topic ?? undefined;
  return contract;
}

/**
 * Convenience: returns just the StimulusRequirement object that
 * `validateStimulus()` from src/lib/stimulus-validator.ts consumes.
 */
export function getStimulusRequirement(
  course: ApCourse,
  unit: ApUnit | null,
  topic: string | null,
): import("./stimulus-validator").StimulusRequirement {
  const contract = getContract(course, unit, topic);
  if (!contract) return { required: false };
  return {
    required: contract.requiresStimulus,
    type: contract.requiredStimulusType,
  };
}

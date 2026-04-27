/**
 * Question style scorer — Stage 2 of the AP-quality fix sprint (Beta 8.6).
 *
 * Pure function. Takes an MCQ row, returns 0-10 score + structured failure
 * reasons. Used both:
 *   1. AT GENERATION TIME — reject any question scoring < 7
 *   2. FOR BATCH AUDIT — score all 13K MCQs to find regen candidates
 *
 * Mirrors the trial-run rubric proven in scripts/trial-cb-vs-ours-chem.mjs.
 *
 * Score breakdown (max 10):
 *   - Stimulus: 0-2  (presence + appropriate length per course type)
 *   - Stem: 0-2     (50-180 chars, no superlative drift)
 *   - Options: 0-2  (8-60 char range, formula-style not paragraph)
 *   - Cognitive: 0-2 (HARD-tag matches multi-step demand, not vocab)
 *   - Length: 0-2  (explanation 100-450 chars, no letter refs)
 */

const QUANTITATIVE_COURSES = new Set([
  "AP_CHEMISTRY", "AP_PHYSICS_1", "AP_PHYSICS_2",
  "AP_PHYSICS_C_MECHANICS", "AP_PHYSICS_C_ELECTRICITY",
  "AP_BIOLOGY", "AP_STATISTICS",
  "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "SAT_MATH", "ACT_MATH", "ACT_SCIENCE",
]);

// Courses where ≥50% of real CB MCQs depend on a visual artifact (table, graph,
// equation, code block, document excerpt). For these, a text-only stimulus is
// a fidelity miss even if the text quality is otherwise fine.
const VISUAL_REQUIRED_COURSES = new Set([
  "AP_STATISTICS", "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_PRECALCULUS",
  "AP_PHYSICS_1", "AP_PHYSICS_2", "AP_PHYSICS_C_MECHANICS", "AP_PHYSICS_C_ELECTRICITY",
  "AP_CHEMISTRY", "AP_BIOLOGY",
  "AP_HUMAN_GEOGRAPHY", "AP_US_HISTORY", "AP_WORLD_HISTORY", "AP_EUROPEAN_HISTORY",
  "AP_ENVIRONMENTAL_SCIENCE",
  "AP_COMPUTER_SCIENCE_PRINCIPLES", "AP_COMPUTER_SCIENCE_A",
  "SAT_MATH", "ACT_MATH", "ACT_SCIENCE",
]);

// Heuristic visual-content detector — accepts any of: pipe-delimited markdown
// table, KaTeX delimiters, fenced code block, unicode arrow (chemistry), or a
// quoted-source excerpt with attribution dash.
function hasVisualContent(stim: string): boolean {
  if (!stim) return false;
  const s = stim;
  if (/\|\s*[^|\n]+\s*\|/m.test(s) && /\n\s*\|/.test(s)) return true;  // markdown table
  if (/\$[^$\n]+\$/.test(s) || /\$\$[\s\S]+\$\$/.test(s)) return true; // KaTeX
  if (/```[\s\S]+```/.test(s)) return true;                            // fenced code
  if (/[→⇌⇄↔]/.test(s)) return true;                                   // chem arrows
  if (/[—–-]\s*[A-Z][a-zA-Z .]+,\s*\d{3,4}/.test(s)) return true;       // "—Author, 1776"
  if (/\d+(\.\d+)?\s*(mol|mL|kg|g|cm|m\/s|°C|kJ|N|Pa|atm|ppm|Hz|V|A|Ω|J|W)/i.test(s)) return true; // SI units
  return false;
}

export interface QuestionForScoring {
  id?: string;
  course: string;
  questionText: string;
  stimulus?: string | null;
  options: string[] | string | null;  // JSON-stringified or array
  correctAnswer?: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic?: string | null;
}

export interface StyleScoreResult {
  score: number;        // 0-10
  max: number;          // 10
  breakdown: {
    stimulus: number;   // 0-2
    stem: number;       // 0-2
    options: number;    // 0-2
    cognitive: number;  // 0-2
    length: number;     // 0-2
  };
  issues: string[];
  bucket: "standard" | "salvageable" | "regen";  // ≥7, 5-6, <5
}

function parseOptions(opts: string[] | string | null): string[] {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts;
  try { return JSON.parse(opts); } catch { return []; }
}

export function scoreQuestionStyle(q: QuestionForScoring): StyleScoreResult {
  const issues: string[] = [];
  const breakdown = { stimulus: 0, stem: 0, options: 0, cognitive: 0, length: 0 };

  const isQuant = QUANTITATIVE_COURSES.has(q.course);

  // 1. Stimulus quality (0-2)
  const stim = q.stimulus ?? "";
  const stimLen = stim.length;
  const visualRequired = VISUAL_REQUIRED_COURSES.has(q.course);
  const stimVisual = hasVisualContent(stim);
  if (isQuant) {
    if (stimLen < 30) {
      breakdown.stimulus = 0;
      issues.push("missing_stimulus_quant");
    } else if (stimLen < 80) {
      breakdown.stimulus = 1;
      issues.push("stimulus_too_short");
    } else if (stimLen > 400) {
      breakdown.stimulus = 1;
      issues.push("stimulus_too_long");
    } else {
      breakdown.stimulus = 2;
    }
  } else {
    // Non-quant: stimulus optional. Score 2 if absent (acceptable) or
    // present at reasonable length.
    if (stimLen === 0) breakdown.stimulus = 2;
    else if (stimLen >= 30 && stimLen <= 400) breakdown.stimulus = 2;
    else if (stimLen > 400) { breakdown.stimulus = 1; issues.push("stimulus_too_long"); }
    else { breakdown.stimulus = 1; issues.push("stimulus_too_short"); }
  }
  // Visual fidelity penalty: courses where ≥50% of CB MCQs include a visual
  // artifact (table, plot, equation, code, document excerpt) get -1 if their
  // stimulus is text-only. This makes Stage 4 regen optimize for visual
  // resemblance to the real exam, not just text quality.
  if (visualRequired && stimLen >= 30 && !stimVisual) {
    issues.push("stimulus_no_visual");
    if (breakdown.stimulus === 2) breakdown.stimulus = 1;
  }

  // 2. Stem (0-2)
  const stemLen = q.questionText.length;
  if (stemLen < 50) {
    breakdown.stem = 0; issues.push("stem_too_short");
  } else if (stemLen > 250) {
    breakdown.stem = 0; issues.push("stem_too_long");
  } else if (stemLen > 180) {
    breakdown.stem = 1; issues.push("stem_long");
  } else {
    breakdown.stem = 2;
  }
  // Hedging language without anchor
  if (/\b(best|most|primary|primarily|chiefly|main)\b/i.test(q.questionText)
      && !/\b(according to|per|defined by|specified in)\b/i.test(q.questionText)) {
    issues.push("hedging_unanchored");
    if (breakdown.stem === 2) breakdown.stem = 1;
  }

  // 3. Options (0-2)
  const opts = parseOptions(q.options);
  if (opts.length < 2) {
    breakdown.options = 0; issues.push("options_invalid");
  } else {
    const lens = opts.map((o) => o.length);
    const avgLen = lens.reduce((s, n) => s + n, 0) / lens.length;
    const maxLen = Math.max(...lens);
    if (avgLen < 12) {
      breakdown.options = 0; issues.push("options_too_terse");
    } else if (maxLen > 120) {
      breakdown.options = 1; issues.push("options_too_long");
    } else if (avgLen > 80) {
      breakdown.options = 1; issues.push("options_long");
    } else {
      breakdown.options = 2;
    }
  }

  // 4. Cognitive level (0-2)
  // HARD must show multi-step / contrast markers. Recall-style ("which/what")
  // is at most MEDIUM.
  const stem = q.questionText;
  const hasCalcMarker = /\b(calculate|compute|determine|find|derive|solve)\b/i.test(stem);
  const hasContrastMarker = /\b(compare|contrast|differs|unlike|whereas|both|either)\b/i.test(stem);
  const hasMultiStepMarker = /\b(then|next|after|finally|first.*second|step.*step)\b/i.test(stem);
  const isRecallStyle = /^(which|what|identify|name)\b/i.test(stem.trim());

  if (q.difficulty === "HARD") {
    if (isRecallStyle && !hasCalcMarker && !hasContrastMarker && !hasMultiStepMarker) {
      breakdown.cognitive = 0; issues.push("hard_but_recall_style");
    } else if (hasCalcMarker || hasContrastMarker || hasMultiStepMarker) {
      breakdown.cognitive = 2;
    } else {
      breakdown.cognitive = 1;
    }
  } else if (q.difficulty === "MEDIUM") {
    if (hasCalcMarker || hasContrastMarker) breakdown.cognitive = 2;
    else breakdown.cognitive = 1;
  } else { // EASY
    breakdown.cognitive = 2; // EASY = recall is correct
  }

  // 5. Explanation length + letter-ref leak (0-2)
  const explLen = q.explanation.length;
  if (explLen < 100) {
    breakdown.length = 0; issues.push("explanation_too_short");
  } else if (explLen > 600) {
    breakdown.length = 0; issues.push("explanation_too_long");
  } else if (explLen > 450) {
    breakdown.length = 1; issues.push("explanation_long");
  } else {
    breakdown.length = 2;
  }
  // Letter-ref leak (Beta 8.2 shuffle damage detector)
  if (/\b[A-E]\s+(?:is|was)\s+(?:correct|wrong|incorrect|right)\b/i.test(q.explanation)) {
    issues.push("explanation_letter_ref_leak");
    if (breakdown.length === 2) breakdown.length = 1;
  }

  const score = breakdown.stimulus + breakdown.stem + breakdown.options
              + breakdown.cognitive + breakdown.length;

  const bucket: StyleScoreResult["bucket"] =
    score >= 7 ? "standard" : score >= 5 ? "salvageable" : "regen";

  return { score, max: 10, breakdown, issues, bucket };
}

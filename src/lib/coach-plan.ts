/**
 * Coach plan — turns readiness + mastery + exam-date into a single
 * prescription: where the student stands, what they need to do next,
 * and how much effort it'll take.
 *
 * Dashboard "Coach Mode" rewrite:
 *   - One dominant CTA instead of 5 equal buttons.
 *   - Rough score shown immediately (not gated behind the diagnostic).
 *   - Countdown converted to required effort ("6 days → 120 questions").
 *   - Weakest unit framed as impact ("likely to miss ~3 questions").
 *
 * Pure functions — no DB, no React. Caller passes pre-loaded data.
 */

export interface MasteryPoint {
  unit: string;
  unitName: string;
  masteryScore: number;
  accuracy: number;
  totalAttempts: number;
}

export interface CoachPlanInput {
  family: "AP" | "SAT" | "ACT";
  scaledScore: number;
  scaleMax: number;
  showScore: boolean;         // predictor's own low-confidence flag
  hasDiagnostic: boolean;
  totalAnswered: number;
  recentAccuracy: number;     // 0-100, across last 2 weeks
  priorAccuracy: number | null; // previous window, for delta
  examDate: Date | null;
  mastery: MasteryPoint[];
  masteryAvg: number;         // 0-100
}

export type NextActionType =
  | "diagnostic_soft"       // no signal yet — suggest diagnostic, don't gate
  | "fix_weak_unit"         // we know the weakness, attack it
  | "daily_review"          // user has trap Qs to re-try
  | "mock_exam"             // close to ready, prove it under timed conditions
  | "maintain";             // already ready, keep reps

export interface NextAction {
  type: NextActionType;
  url: string;
  ctaText: string;
  minutes: number;
  questions: number;
}

export interface CoachPlan {
  /** Family-native rough score. ALWAYS shown — even with weak signal. */
  roughScore: number;
  /** Our honesty signal: "high" | "medium" | "low" | "very_low". */
  confidence: "very_low" | "low" | "medium" | "high";
  /** "Trending toward a 2 — needs improvement" style label. */
  verdict: string;
  /** Realistic next tier the student can reach. */
  targetScore: number;
  /** Days remaining, null if no exam date set. */
  daysUntilExam: number | null;
  /** How many questions to likely reach targetScore (capped). */
  questionsToTarget: number;
  /** Estimated minutes = questions * 0.75 (~45 sec/Q avg). */
  minutesToTarget: number;
  /** Weakest unit from current mastery data, null if we have none. */
  weakestUnit: {
    unit: string;
    unitName: string;
    masteryScore: number;
    missRatePct: number;       // 100 - accuracy
    likelyMissesOn50Q: number; // approximate impact on a 50-MCQ section
  } | null;
  /** Single dominant CTA. */
  nextAction: NextAction;
  /** Accuracy delta copy (optional, null if no prior data). */
  accuracyDelta: {
    from: number;
    to: number;
    deltaPct: number; // positive = improved
  } | null;
}

function verdictFor(family: "AP" | "SAT" | "ACT", score: number, confidence: CoachPlan["confidence"]): string {
  const prefix = confidence === "very_low" ? "Rough estimate" : "Trending toward";
  if (family === "AP") {
    if (score >= 4.5) return `${prefix} a 5 — you're ready`;
    if (score >= 3.5) return `${prefix} a 4 — close to top-tier`;
    if (score >= 2.5) return `${prefix} a 3 — passing range`;
    if (score >= 1.5) return `${prefix} a 2 — needs improvement`;
    return `${prefix} a 1 — big gap to close`;
  }
  if (family === "SAT") {
    if (score >= 1400) return `${prefix} a ${Math.round(score)} — competitive`;
    if (score >= 1200) return `${prefix} a ${Math.round(score)} — solid`;
    if (score >= 1000) return `${prefix} a ${Math.round(score)} — middle range`;
    return `${prefix} a ${Math.round(score)} — needs improvement`;
  }
  // ACT
  if (score >= 32) return `${prefix} a ${Math.round(score)} — competitive`;
  if (score >= 26) return `${prefix} a ${Math.round(score)} — solid`;
  if (score >= 20) return `${prefix} a ${Math.round(score)} — middle range`;
  return `${prefix} a ${Math.round(score)} — needs improvement`;
}

/**
 * AP-specific "next target" rule: always aim 1 whole score above current,
 * capped at 5. For floor scores under 1.5, target a 3 (passing).
 */
function nextTargetAp(current: number): number {
  if (current < 1.5) return 3;
  if (current < 2.5) return 3;
  if (current < 3.5) return 4;
  return 5;
}

/** Rough "question cost" to move current → target on AP 1-5 scale. */
function questionsToHitApTarget(current: number, target: number): number {
  const gap = Math.max(0, target - current);
  // Empirical: ~30-40 well-answered questions per 1 AP point on average.
  // Underpromise: use 40 at low end, taper as they approach target.
  const base = Math.round(40 * gap);
  // Minimum useful chunk so we never say "3 questions".
  return Math.max(20, Math.min(250, base));
}

function questionsToHitSatTarget(current: number, target: number): number {
  const gap = Math.max(0, target - current);
  // ~1 pt per question of practice is a useful directional baseline.
  return Math.max(30, Math.min(300, Math.round(gap * 1.2)));
}

function questionsToHitActTarget(current: number, target: number): number {
  const gap = Math.max(0, target - current);
  // ~15 Qs per ACT point.
  return Math.max(25, Math.min(250, Math.round(gap * 15)));
}

/** Floor-out the coach's confidence from predictor's showScore + signal volume. */
function confidenceFor(input: CoachPlanInput): CoachPlan["confidence"] {
  if (!input.showScore && input.totalAnswered < 10) return "very_low";
  if (!input.showScore) return "low";
  if (input.hasDiagnostic && input.totalAnswered >= 100) return "high";
  if (input.totalAnswered >= 50) return "medium";
  return "low";
}

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Compute the rough score even before a diagnostic. We still call the
 * predictor — but if it refuses to show a score (very low signal), fall
 * back to mastery-driven AP-family mapping so the UI never shows
 * "Take diagnostic to unlock" as the sole info.
 */
function roughScoreFor(input: CoachPlanInput): number {
  if (input.showScore) return input.scaledScore;
  // Fallback: tie rough score to masteryAvg. 0 → family floor, 100 → family max-ish.
  const avg = Math.max(0, Math.min(100, input.masteryAvg || input.recentAccuracy || 0));
  if (input.family === "AP") {
    // 0% → 1, 25 → 2, 50 → 3, 75 → 4, 90+ → 5
    if (avg >= 90) return 4.8;
    if (avg >= 75) return 4.0;
    if (avg >= 55) return 3.0;
    if (avg >= 35) return 2.0;
    return 1.4;
  }
  if (input.family === "SAT") {
    // 0% → 900, 50 → 1100, 100 → 1500
    return Math.round(900 + avg * 6);
  }
  // ACT: 0% → 14, 100 → 32
  return Math.round(14 + avg * 0.18);
}

function weakestOf(mastery: MasteryPoint[]): CoachPlan["weakestUnit"] {
  if (!mastery || mastery.length === 0) return null;
  const ranked = [...mastery]
    .filter((m) => m.totalAttempts > 0) // attempts > 0 only — else everything ties at 0
    .sort((a, b) => a.masteryScore - b.masteryScore);
  const w = ranked[0];
  if (!w) {
    // Still return the first unit as "where to start" if nothing attempted.
    const first = mastery[0];
    if (!first) return null;
    return {
      unit: first.unit,
      unitName: first.unitName,
      masteryScore: 0,
      missRatePct: 100,
      likelyMissesOn50Q: 5, // 1/10 of MCQ section as a conservative anchor
    };
  }
  const missRatePct = Math.max(0, Math.min(100, 100 - w.accuracy));
  // If this unit covers roughly 1/7 to 1/10 of the exam MCQ, likely misses scale with miss rate.
  const likelyMissesOn50Q = Math.round((missRatePct / 100) * 6);
  return {
    unit: w.unit,
    unitName: w.unitName,
    masteryScore: Math.round(w.masteryScore),
    missRatePct: Math.round(missRatePct),
    likelyMissesOn50Q,
  };
}

function decideAction(input: CoachPlanInput, weakest: CoachPlan["weakestUnit"]): NextAction {
  // Branch 1: no signal at all → soft diagnostic nudge (NOT a gate)
  if (input.totalAnswered < 10 && !input.hasDiagnostic) {
    return {
      type: "diagnostic_soft",
      url: "/diagnostic",
      ctaText: "Calibrate with a 10-min diagnostic",
      minutes: 10,
      questions: 15,
    };
  }

  // Branch 2: close to top tier → mock exam
  const current = input.scaledScore;
  if (input.family === "AP" && current >= 3.5) {
    return {
      type: "mock_exam",
      url: "/mock-exam",
      ctaText: "Take a timed mock to prove it",
      minutes: 45,
      questions: 30,
    };
  }

  // Branch 3: ready — maintain
  if (input.family === "AP" && current >= 4.5) {
    return {
      type: "maintain",
      url: "/practice",
      ctaText: "Daily practice to hold your score",
      minutes: 10,
      questions: 10,
    };
  }

  // Branch 4: we have a weak unit → fix it
  if (weakest && weakest.unit) {
    return {
      type: "fix_weak_unit",
      url: `/practice?mode=focused&unit=${encodeURIComponent(weakest.unit)}`,
      ctaText: `Fix ${weakest.unitName}`,
      minutes: 8,
      questions: 10,
    };
  }

  // Branch 5: fallback — daily review
  return {
    type: "daily_review",
    url: "/practice?mode=quick",
    ctaText: "Fix 1 mistake in 60 seconds",
    minutes: 2,
    questions: 3,
  };
}

export function buildCoachPlan(input: CoachPlanInput): CoachPlan {
  const confidence = confidenceFor(input);
  const roughScore = roughScoreFor(input);
  const verdict = verdictFor(input.family, roughScore, confidence);

  const target =
    input.family === "AP"
      ? nextTargetAp(roughScore)
      : input.family === "SAT"
      ? Math.min(1600, Math.round((roughScore + 100) / 10) * 10)
      : Math.min(36, Math.ceil(roughScore + 2));

  const qs =
    input.family === "AP"
      ? questionsToHitApTarget(roughScore, target)
      : input.family === "SAT"
      ? questionsToHitSatTarget(roughScore, target)
      : questionsToHitActTarget(roughScore, target);

  const weakest = weakestOf(input.mastery);
  const nextAction = decideAction(input, weakest);
  const daysUntilExam = daysUntil(input.examDate);

  const accuracyDelta =
    input.priorAccuracy !== null && input.priorAccuracy >= 0 && input.recentAccuracy >= 0
      ? {
          from: Math.round(input.priorAccuracy),
          to: Math.round(input.recentAccuracy),
          deltaPct: Math.round(input.recentAccuracy - input.priorAccuracy),
        }
      : null;

  return {
    roughScore: Math.round(roughScore * 10) / 10,
    confidence,
    verdict,
    targetScore: target,
    daysUntilExam,
    questionsToTarget: qs,
    minutesToTarget: Math.round(qs * 0.75),
    weakestUnit: weakest,
    nextAction,
    accuracyDelta,
  };
}

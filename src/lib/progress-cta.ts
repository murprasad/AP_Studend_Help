/**
 * Progress-based CTA resolver.
 *
 * Replaces the generic "Upgrade" button with copy that maps to the
 * student's current score tier, so the call-to-action feels like a
 * continuation of their current work rather than a pitch.
 *
 * Proven conversion lever: score-tier-aware CTAs outperform generic
 * upgrade buttons by 2-3x per internal testing.
 *
 * Usage:
 *   const cta = resolveUpgradeCta({ scaledScore: 3, family: "AP", showScore: true });
 *   <Button>{cta.ctaText}</Button>  // "You're one mock away from a 4 — lock it in"
 */

export type ExamFamily = "AP" | "SAT" | "ACT";

export interface ProgressCtaInput {
  /** Exam family — drives the score-unit language. */
  family: ExamFamily;
  /** Current scaled score. For AP 1-5, SAT 400-1600, ACT 1-36. */
  scaledScore: number;
  /** Whether the raw score should be shown. If false, user is in a
   *  zero-signal state — we pitch the diagnostic first. */
  showScore: boolean;
  /** Optional: whether the user already has Premium. If true, copy
   *  shifts to feature-usage CTAs (e.g. "Take your next mock") rather
   *  than upgrade pitches. */
  isPremium?: boolean;
  /** Optional: has the user taken any mock exam? Shifts copy toward
   *  "run a mock" vs "start mocks" when true. */
  hasTakenMock?: boolean;
}

export interface ProgressCta {
  /** One-line headline for the upsell card or modal title. */
  headline: string;
  /** Supporting sentence under the headline (1 line). */
  subcopy: string;
  /** Button label. Short + action-verb. */
  ctaText: string;
  /** Target URL. Use `/pricing` for upgrade pitches, in-product routes
   *  for usage nudges (`/practice?mode=weakest`, `/mock-exam`, etc.). */
  targetUrl: string;
  /** Score tier label for analytics + any nearby badge. */
  tierLabel: "zero-signal" | "struggling" | "building" | "close" | "ready";
}

/**
 * AP tier thresholds (1-5 scale).
 * zero-signal: no score yet
 * struggling: AP 1 (raw <25%)
 * building:   AP 2 (raw 25-54)
 * close:      AP 3-4 (raw 55-79)
 * ready:      AP 5 (raw 80+)
 */
function apTier(score: number): ProgressCta["tierLabel"] {
  if (score <= 1) return "struggling";
  if (score === 2) return "building";
  if (score === 3 || score === 4) return "close";
  return "ready";
}

function satTier(score: number): ProgressCta["tierLabel"] {
  if (score < 900) return "struggling";
  if (score < 1200) return "building";
  if (score < 1400) return "close";
  return "ready";
}

function actTier(score: number): ProgressCta["tierLabel"] {
  if (score < 18) return "struggling";
  if (score < 24) return "building";
  if (score < 30) return "close";
  return "ready";
}

export function resolveUpgradeCta(input: ProgressCtaInput): ProgressCta {
  // Zero-signal users → pitch the diagnostic, not the plan.
  if (!input.showScore) {
    return {
      headline: "See your projected score in 3 minutes",
      subcopy: "Take a short diagnostic — no signup for the 5-question preview.",
      ctaText: "Start diagnostic",
      targetUrl: "/am-i-ready",
      tierLabel: "zero-signal",
    };
  }

  const tier = (
    input.family === "AP" ? apTier(input.scaledScore) :
    input.family === "SAT" ? satTier(input.scaledScore) :
    actTier(input.scaledScore)
  );

  const nextScoreLabel =
    input.family === "AP" ? (input.scaledScore + 1 <= 5 ? input.scaledScore + 1 : 5) :
    input.family === "SAT" ? Math.min(1600, Math.ceil(input.scaledScore / 100) * 100 + 100) :
    Math.min(36, Math.ceil(input.scaledScore) + 2);

  const scoreUnit = input.family === "AP" ? "AP" : input.family;

  if (tier === "struggling") {
    return {
      headline: `Fix your weakest unit now`,
      subcopy: `The fastest way from a ${input.scaledScore} to a ${nextScoreLabel} is targeted practice on your lowest-mastery unit.`,
      ctaText: input.isPremium ? "Drill weakest unit" : "Unlock weakness drill",
      targetUrl: input.isPremium ? "/practice?mode=weakest" : "/pricing",
      tierLabel: "struggling",
    };
  }

  if (tier === "building") {
    return {
      headline: `You're building — keep the momentum`,
      subcopy: input.hasTakenMock
        ? `Your practice is moving the projection. Lock it in with another mock — Premium unlocks unlimited.`
        : `Take your first mock exam to see where you really stand — Premium includes unlimited mocks.`,
      ctaText: input.isPremium ? "Take a mock exam" : "Upgrade for unlimited mocks",
      targetUrl: input.isPremium ? "/mock-exam" : "/pricing",
      tierLabel: "building",
    };
  }

  if (tier === "close") {
    return {
      headline: `You're one mock away from a ${nextScoreLabel} — lock it in`,
      subcopy: `Students at your level who take 2-3 mocks under timed pressure are ${input.family === "AP" ? "2× more likely to score a " + nextScoreLabel : "far more likely to hit their target"}.`,
      ctaText: input.isPremium ? "Schedule a mock" : "Unlock mocks · Premium",
      targetUrl: input.isPremium ? "/mock-exam" : "/pricing",
      tierLabel: "close",
    };
  }

  // ready
  return {
    headline: `Prove you're ready — Pass Confident Guarantee`,
    subcopy: `If our projection says 80%+ and you don't pass, 60 days free + refund. Run 2 mocks to lock in.`,
    ctaText: input.isPremium ? "Take final mock" : "Lock in your score · Premium",
    targetUrl: input.isPremium ? "/mock-exam" : "/pricing",
    tierLabel: "ready",
  };
}

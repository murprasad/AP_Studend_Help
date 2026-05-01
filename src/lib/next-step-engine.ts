/**
 * next-step-engine.ts — Single source of truth for "what should this user do next?"
 *
 * Beta 10 (2026-05-01). Replaces five fragmentary recommenders that drifted:
 *   1. coach-plan.ts NextActionType
 *   2. post-session-next-step.tsx priority tree
 *   3. journey-hero-card.tsx 11-state machine (per-course aware)
 *   4. post-journey-hero.tsx Days 1-3 logic
 *   5. middleware.ts + dashboard layout onboarding gate
 *
 * Every recommendation surface (dashboard hero, post-session card, post-journey
 * hero, FRQ-cap screen) consumes computeNextStep() — no surface decides on its
 * own. A user who hits the daily cap should see the SAME message everywhere,
 * not three different "try X next" suggestions.
 *
 * Pure. No DB. No fetch. The /api/next-step endpoint fans out to existing
 * data routes (/api/user/conversion-signal, /api/readiness, /api/journey,
 * /api/daily-goal) and feeds the snapshot into computeNextStep().
 *
 * Decision precedence (top wins):
 *   1. capped_today / frq_capped     (loud closure, can't be silent)
 *   2. start_journey / resume_journey (defensive — middleware should catch these)
 *   3. premium_welcome / premium_active (paying-user path)
 *   4. returning_after_gap            (habit recovery > task push)
 *   5. brand_new → mcq_fresh → first_frq → first_diagnostic → fix_weakest → daily_drill
 *
 * Adding a new state: extend NextStepKind, add to KIND_DEFAULTS, add a branch
 * to computeNextStep() (priority-ordered), add a unit-test scenario.
 */

import { FREE_LIMITS } from "@/lib/tier-limits";

export type NextStepKind =
  // Routing fallbacks (middleware should normally pre-empt these)
  | "start_journey"
  | "resume_journey"
  // Hard limits
  | "capped_today"
  | "frq_capped"
  // Premium paths
  | "premium_welcome"
  | "premium_active"
  // Habit recovery
  | "returning_after_gap"
  // Onboarding-in-course progression
  | "brand_new"
  | "mcq_fresh"
  | "first_frq"
  | "first_diagnostic"
  // Steady-state
  | "fix_weakest"
  | "daily_drill"
  | "maintain";

export type NextStepTone = "indigo" | "purple" | "emerald" | "amber" | "blue" | "neutral";

export interface NextStepCta {
  label: string;
  href: string;
  /** "primary" or "secondary" so the renderer can size correctly. */
  variant?: "primary" | "secondary" | "upgrade";
}

export interface NextStep {
  kind: NextStepKind;
  /** Eyebrow / kicker label, shown small above headline. */
  eyebrow: string;
  /** Main one-line headline. */
  headline: string;
  /** Optional sub-copy. */
  body?: string;
  /** Primary action — always present. */
  primaryCta: NextStepCta;
  /** Optional secondary actions (e.g. "Browse all FRQs", "Explore tools"). */
  secondaryCtas?: NextStepCta[];
  /** Optional explicit upgrade CTA — surfaced when conversion-relevant. */
  upgradeCta?: NextStepCta;
  /** Visual tone hint. */
  tone: NextStepTone;
  /** For tie-breaks if two surfaces both compute a step. Higher = more urgent. */
  priority: number;
  /** For analytics — pass to next-step click handlers. */
  analyticsTag: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Inputs

export interface NextStepInputs {
  course: string;
  /** Subscription tier from JWT/session. */
  subscriptionTier: "FREE" | "PREMIUM";
  /** Days since first PREMIUM subscription started (null if not premium). */
  daysAsPremium: number | null;

  /** Journey state from /api/journey. null = no row. */
  journey: {
    currentStep: number | null;
    completedAt: Date | string | null;
    weakestUnit: string | null;
  } | null;

  /** From /api/user/conversion-signal?course=X. Per-course fields drive in-course progression. */
  signal: {
    responseCount: number;
    responseCountInCourse: number;
    hasDiagnostic: boolean;
    hasDiagnosticInCourse: boolean;
    hasFrqAttempt: boolean;
    hasFrqAttemptInCourse: boolean;
    answeredToday: number;
    answeredTodayInCourse: number;
    daysSinceLastSession: number | null;
    cohortAgeDays: number;
  };

  /** From /api/readiness?course=X. May be null if score-engine has no signal yet. */
  readiness: {
    weakestUnit: { unit: string; unitName: string; missRatePct: number } | null;
    scaledScore: number | null;
    scaleMax: number;
  } | null;

  /** From /api/daily-goal. */
  dailyGoal: {
    targetQs: number;
    answeredToday: number;
    goalHit: boolean;
    progressPercent: number;
  };

  /** Hard caps. `frqCappedTypes` lists FRQ types (DBQ/LEQ/SAQ/FRQ) the user has exhausted in this course. */
  caps: {
    practiceCappedToday: boolean;
    frqCappedTypes: string[];
  };

  /** Optional — exam date for `near_exam_mock` (future kind, not yet active). */
  examDate?: Date | string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Pure decision

export function computeNextStep(inputs: NextStepInputs): NextStep {
  const { course, subscriptionTier, daysAsPremium, journey, signal, readiness, caps } = inputs;

  // ── 1. Hard caps ─────────────────────────────────────────────────────────
  // Always loudest — a capped user should never see a "try X" suggestion that
  // they can't even reach.
  if (caps.practiceCappedToday && subscriptionTier === "FREE") {
    return {
      kind: "capped_today",
      eyebrow: "You've hit today's practice cap",
      headline: "Come back tomorrow — or upgrade for unlimited.",
      body: `Free tier: ${FREE_LIMITS.practiceQuestionsPerDay} questions/day. Premium: unlimited.`,
      primaryCta: {
        label: "Upgrade — $9.99/mo",
        href: "/billing?utm_source=next_step_engine&kind=capped_today",
        variant: "upgrade",
      },
      secondaryCtas: [
        { label: "Review flashcards", href: `/flashcards?course=${course}`, variant: "secondary" },
        { label: "Ask Sage", href: "/ai-tutor", variant: "secondary" },
      ],
      tone: "amber",
      priority: 100,
      analyticsTag: "capped_today",
    };
  }

  if (caps.frqCappedTypes.length > 0 && subscriptionTier === "FREE") {
    const types = caps.frqCappedTypes.join(", ");
    return {
      kind: "frq_capped",
      eyebrow: "Free FRQ attempt used",
      headline: `You've used your free ${types} attempt for this course.`,
      body: "Premium unlocks unlimited attempts and line-by-line rubric coaching.",
      primaryCta: {
        label: "Upgrade — $9.99/mo",
        href: "/billing?utm_source=next_step_engine&kind=frq_capped",
        variant: "upgrade",
      },
      secondaryCtas: [
        { label: "Practice MCQs instead", href: `/practice?course=${course}`, variant: "secondary" },
      ],
      tone: "amber",
      priority: 95,
      analyticsTag: "frq_capped",
    };
  }

  // ── 2. Routing fallbacks (defensive — middleware/layout normally pre-empt) ─
  // If we get here with no journey or mid-journey, the user has bypassed the
  // gate somehow. Route them home rather than render a misleading recommendation.
  if (!journey || journey.currentStep === null) {
    return {
      kind: "start_journey",
      eyebrow: "Welcome",
      headline: "Let's set you up — 5 quick steps.",
      body: "Find your starting point in under 10 minutes.",
      primaryCta: { label: "Start your journey", href: "/journey", variant: "primary" },
      tone: "blue",
      priority: 90,
      analyticsTag: "start_journey",
    };
  }

  if (journey.currentStep >= 0 && journey.currentStep < 5) {
    return {
      kind: "resume_journey",
      eyebrow: "Pick up where you left off",
      headline: `Step ${journey.currentStep + 1} of 5`,
      primaryCta: { label: "Resume journey", href: "/journey", variant: "primary" },
      tone: "indigo",
      priority: 85,
      analyticsTag: "resume_journey",
    };
  }

  // ── 3. Premium paths ─────────────────────────────────────────────────────
  if (subscriptionTier === "PREMIUM") {
    if ((daysAsPremium ?? 99) <= 1) {
      return {
        kind: "premium_welcome",
        eyebrow: "Welcome to Premium",
        headline: "You just unlocked everything. Here's where to start.",
        body: "Take a diagnostic to anchor your starting point — line-by-line FRQ coaching, unlimited practice, and Sage Coach are now active.",
        primaryCta: {
          label: "Take a Diagnostic",
          href: `/diagnostic?course=${course}&src=premium_welcome`,
          variant: "primary",
        },
        secondaryCtas: [
          { label: "Sage Coach", href: "/sage-coach", variant: "secondary" },
          { label: "FRQ practice", href: `/frq-practice?course=${course}&src=premium_welcome`, variant: "secondary" },
        ],
        tone: "blue",
        priority: 80,
        analyticsTag: "premium_welcome",
      };
    }

    // Premium-active — show focused-practice path if there's a weak unit.
    if (readiness?.weakestUnit) {
      const wu = readiness.weakestUnit;
      return {
        kind: "premium_active",
        eyebrow: "Today's practice — Premium",
        headline: `Drill ${wu.unitName}`,
        body: `${Math.round(wu.missRatePct)}% miss rate. Fix this → fastest score lift. No daily cap.`,
        primaryCta: {
          label: `Practice ${wu.unitName}`,
          href: `/practice?mode=focused&unit=${encodeURIComponent(wu.unit)}&course=${course}&src=next_step_engine`,
          variant: "primary",
        },
        secondaryCtas: [
          { label: "FRQ practice", href: `/frq-practice?course=${course}&src=next_step_engine`, variant: "secondary" },
          { label: "Sage Coach", href: "/sage-coach", variant: "secondary" },
        ],
        tone: "emerald",
        priority: 70,
        analyticsTag: "premium_active",
      };
    }

    return {
      kind: "premium_active",
      eyebrow: "Today's practice — Premium",
      headline: "Keep climbing.",
      body: "No daily cap, full coaching, full analytics.",
      primaryCta: {
        label: "Start practice",
        href: `/practice?course=${course}&src=next_step_engine`,
        variant: "primary",
      },
      secondaryCtas: [
        { label: "FRQ practice", href: `/frq-practice?course=${course}&src=next_step_engine`, variant: "secondary" },
        { label: "Sage Coach", href: "/sage-coach", variant: "secondary" },
      ],
      tone: "emerald",
      priority: 70,
      analyticsTag: "premium_active",
    };
  }

  // ── 4. Habit recovery (FREE) ─────────────────────────────────────────────
  // 3+ days inactive AND has done a diagnostic — re-anchor habit before any
  // upgrade pressure.
  if (
    signal.hasDiagnostic &&
    signal.daysSinceLastSession !== null &&
    signal.daysSinceLastSession >= 3
  ) {
    const wu = readiness?.weakestUnit;
    return {
      kind: "returning_after_gap",
      eyebrow: `Welcome back — ${signal.daysSinceLastSession} day${signal.daysSinceLastSession === 1 ? "" : "s"} away`,
      headline: wu ? `Pick up in ${wu.unitName} — your biggest gap.` : "Pick up where you left off.",
      body: "Streaks restart fast. One session today rebuilds momentum.",
      primaryCta: {
        label: wu ? `Practice ${wu.unitName}` : "Start a session",
        href: wu
          ? `/practice?mode=focused&unit=${encodeURIComponent(wu.unit)}&course=${course}&src=returning`
          : `/practice?course=${course}&src=returning`,
        variant: "primary",
      },
      tone: "blue",
      priority: 60,
      analyticsTag: "returning_after_gap",
    };
  }

  // ── 5. In-course progression (FREE, post-journey) ────────────────────────
  // Per-course aware: a user who switched to a fresh course should see brand_new
  // here even if they have a diagnostic in another course.
  const responseInCourse = signal.responseCountInCourse;
  const hasFrqInCourse = signal.hasFrqAttemptInCourse;
  const hasDiagInCourse = signal.hasDiagnosticInCourse;

  if (responseInCourse === 0) {
    return {
      kind: "brand_new",
      eyebrow: "Welcome — let's start",
      headline: "Answer 3 questions to see your level. ~60 seconds.",
      body: "Three questions. No setup.",
      primaryCta: {
        label: "Start your warm-up",
        href: `/practice?mode=focused&count=3&course=${course}&src=next_step_engine&quickstart=1`,
        variant: "primary",
      },
      tone: "blue",
      priority: 55,
      analyticsTag: "brand_new",
    };
  }

  if (responseInCourse > 0 && responseInCourse < 5 && !hasFrqInCourse) {
    return {
      kind: "mcq_fresh",
      eyebrow: "Keep going",
      headline: `${responseInCourse}/5 questions. Finish your warm-up.`,
      body: "A few more and you'll see the real differentiator: AP-rubric FRQ scoring.",
      primaryCta: {
        label: "Continue practice",
        href: `/practice?mode=focused&count=5&course=${course}&src=next_step_engine&quickstart=1`,
        variant: "primary",
      },
      tone: "indigo",
      priority: 50,
      analyticsTag: "mcq_fresh",
    };
  }

  if (!hasFrqInCourse) {
    return {
      kind: "first_frq",
      eyebrow: "Next: try a real FRQ",
      headline: "See exactly how AP rubrics grade your written answers.",
      body: "MCQs warm you up. The exam is graded on essays. Your free attempt scores against the official College Board rubric.",
      primaryCta: {
        label: "Try a real FRQ — free",
        href: `/frq-practice?course=${course}&first_taste=1&src=next_step_engine`,
        variant: "primary",
      },
      tone: "indigo",
      priority: 45,
      analyticsTag: "first_frq",
    };
  }

  if (!hasDiagInCourse) {
    return {
      kind: "first_diagnostic",
      eyebrow: "You've unlocked your score",
      headline: "Want your projected AP score?",
      body: "10 minutes, then you'll see exactly where you stand on a 1–5 scale and which units to fix first.",
      primaryCta: {
        label: "Take 10-min Diagnostic",
        href: `/diagnostic?course=${course}&src=next_step_engine`,
        variant: "primary",
      },
      tone: "amber",
      priority: 40,
      analyticsTag: "first_diagnostic",
    };
  }

  // ── 6. Steady state ──────────────────────────────────────────────────────
  if (readiness?.weakestUnit) {
    const wu = readiness.weakestUnit;
    return {
      kind: "fix_weakest",
      eyebrow: "Today's focused practice",
      headline: `10 questions in ${wu.unitName}`,
      body: `Your biggest gap. ${Math.round(wu.missRatePct)}% miss rate. Fix this → fastest score lift.`,
      primaryCta: {
        label: "Start today's session",
        href: `/practice?mode=focused&unit=${encodeURIComponent(wu.unit)}&course=${course}&src=next_step_engine`,
        variant: "primary",
      },
      secondaryCtas: [
        { label: "FRQ practice", href: `/frq-practice?course=${course}&src=next_step_engine`, variant: "secondary" },
      ],
      upgradeCta: {
        label: "Unlock unlimited practice",
        href: "/billing?utm_source=next_step_engine&kind=fix_weakest",
        variant: "upgrade",
      },
      tone: "emerald",
      priority: 35,
      analyticsTag: "fix_weakest",
    };
  }

  // No weakest unit identified yet — generic daily drill. Better than null.
  return {
    kind: "daily_drill",
    eyebrow: "Keep practicing",
    headline: "10 questions today — keep your score climbing.",
    primaryCta: {
      label: "Start today's session",
      href: `/practice?course=${course}&src=next_step_engine`,
      variant: "primary",
    },
    secondaryCtas: [
      { label: "FRQ practice", href: `/frq-practice?course=${course}&src=next_step_engine`, variant: "secondary" },
    ],
    upgradeCta: {
      label: "Unlock unlimited practice",
      href: "/billing?utm_source=next_step_engine&kind=daily_drill",
      variant: "upgrade",
    },
    tone: "emerald",
    priority: 30,
    analyticsTag: "daily_drill",
  };
}

import { describe, expect, it } from "vitest";
import { computeNextStep, type NextStepInputs } from "./next-step-engine";

/**
 * Table-driven tests for the Next Step Engine.
 *
 * Each scenario builds a base input, overrides only the fields that matter for
 * the kind being tested, and asserts on `kind` + `priority` ordering. Anyone
 * adding a new NextStepKind should add a case here that covers BOTH the kind
 * itself AND its priority relative to neighbouring kinds (so future re-orderings
 * trip a test rather than silently miscategorising users).
 */

function baseInputs(overrides: Partial<NextStepInputs> = {}): NextStepInputs {
  const base: NextStepInputs = {
    course: "AP_BIOLOGY",
    subscriptionTier: "FREE",
    daysAsPremium: null,
    journey: { currentStep: 5, completedAt: new Date(), weakestUnit: null },
    signal: {
      responseCount: 50,
      responseCountInCourse: 50,
      hasDiagnostic: true,
      hasDiagnosticInCourse: true,
      hasFrqAttempt: true,
      hasFrqAttemptInCourse: true,
      answeredToday: 5,
      answeredTodayInCourse: 5,
      daysSinceLastSession: 0,
      cohortAgeDays: 30,
    },
    readiness: {
      weakestUnit: { unit: "BIO_2_CELL_STRUCTURE_FUNCTION", unitName: "Cell Structure", missRatePct: 55 },
      scaledScore: 3,
      scaleMax: 5,
    },
    dailyGoal: { targetQs: 10, answeredToday: 5, goalHit: false, progressPercent: 50 },
    caps: { practiceCappedToday: false, frqCappedTypes: [] },
  };
  return { ...base, ...overrides, signal: { ...base.signal, ...(overrides.signal ?? {}) } };
}

describe("computeNextStep — hard caps win", () => {
  it("returns capped_today when FREE user hit daily cap", () => {
    const out = computeNextStep(baseInputs({
      caps: { practiceCappedToday: true, frqCappedTypes: [] },
    }));
    expect(out.kind).toBe("capped_today");
    expect(out.primaryCta.href).toContain("/billing");
    expect(out.priority).toBeGreaterThanOrEqual(95);
  });

  it("returns frq_capped when FREE user exhausted DBQ in course", () => {
    const out = computeNextStep(baseInputs({
      caps: { practiceCappedToday: false, frqCappedTypes: ["DBQ"] },
    }));
    expect(out.kind).toBe("frq_capped");
    expect(out.headline).toContain("DBQ");
  });

  it("ignores caps for PREMIUM users (engine returns next-action, caps aren't enforced for them)", () => {
    const out = computeNextStep(baseInputs({
      subscriptionTier: "PREMIUM",
      daysAsPremium: 30,
      caps: { practiceCappedToday: true, frqCappedTypes: ["DBQ"] },
    }));
    expect(out.kind).not.toBe("capped_today");
    expect(out.kind).not.toBe("frq_capped");
  });

  it("capped_today wins over frq_capped when both fire", () => {
    const out = computeNextStep(baseInputs({
      caps: { practiceCappedToday: true, frqCappedTypes: ["DBQ"] },
    }));
    expect(out.kind).toBe("capped_today");
  });
});

describe("computeNextStep — routing fallbacks", () => {
  it("returns start_journey when journey is null", () => {
    const out = computeNextStep(baseInputs({ journey: null }));
    expect(out.kind).toBe("start_journey");
    expect(out.primaryCta.href).toBe("/journey");
  });

  it("returns start_journey when currentStep is null", () => {
    const out = computeNextStep(baseInputs({
      journey: { currentStep: null, completedAt: null, weakestUnit: null },
    }));
    expect(out.kind).toBe("start_journey");
  });

  it("returns resume_journey when currentStep < 5", () => {
    const out = computeNextStep(baseInputs({
      journey: { currentStep: 2, completedAt: null, weakestUnit: null },
    }));
    expect(out.kind).toBe("resume_journey");
    expect(out.primaryCta.href).toBe("/journey");
  });

  it("does NOT return resume_journey for completed (currentStep === 5)", () => {
    const out = computeNextStep(baseInputs({
      journey: { currentStep: 5, completedAt: new Date(), weakestUnit: null },
    }));
    expect(out.kind).not.toBe("resume_journey");
    expect(out.kind).not.toBe("start_journey");
  });

  it("does NOT return resume_journey for exited (currentStep === 99)", () => {
    const out = computeNextStep(baseInputs({
      journey: { currentStep: 99, completedAt: null, weakestUnit: null },
    }));
    expect(out.kind).not.toBe("resume_journey");
  });
});

describe("computeNextStep — premium paths", () => {
  it("returns premium_welcome on day 0 of premium", () => {
    const out = computeNextStep(baseInputs({ subscriptionTier: "PREMIUM", daysAsPremium: 0 }));
    expect(out.kind).toBe("premium_welcome");
  });

  it("returns premium_welcome on day 1 of premium", () => {
    const out = computeNextStep(baseInputs({ subscriptionTier: "PREMIUM", daysAsPremium: 1 }));
    expect(out.kind).toBe("premium_welcome");
  });

  it("returns premium_active after day 1", () => {
    const out = computeNextStep(baseInputs({ subscriptionTier: "PREMIUM", daysAsPremium: 5 }));
    expect(out.kind).toBe("premium_active");
    expect(out.headline).toContain("Cell Structure");
    // Premium-active never shows upgrade CTA
    expect(out.upgradeCta).toBeUndefined();
  });

  it("premium_active without weakestUnit still renders generic drill", () => {
    const out = computeNextStep(baseInputs({
      subscriptionTier: "PREMIUM",
      daysAsPremium: 5,
      readiness: { weakestUnit: null, scaledScore: null, scaleMax: 5 },
    }));
    expect(out.kind).toBe("premium_active");
  });
});

describe("computeNextStep — habit recovery (FREE)", () => {
  it("returns returning_after_gap for 3+ day gap with diagnostic", () => {
    const out = computeNextStep(baseInputs({
      signal: { ...baseInputs().signal, daysSinceLastSession: 5 },
    }));
    expect(out.kind).toBe("returning_after_gap");
    expect(out.eyebrow).toContain("5 day");
  });

  it("does NOT return returning_after_gap for 2-day gap", () => {
    const out = computeNextStep(baseInputs({
      signal: { ...baseInputs().signal, daysSinceLastSession: 2 },
    }));
    expect(out.kind).not.toBe("returning_after_gap");
  });

  it("does NOT return returning_after_gap if user has no diagnostic", () => {
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        hasDiagnostic: false,
        hasDiagnosticInCourse: false,
        daysSinceLastSession: 5,
      },
    }));
    expect(out.kind).not.toBe("returning_after_gap");
  });
});

describe("computeNextStep — in-course progression (FREE)", () => {
  it("returns brand_new when responseCountInCourse is 0", () => {
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        responseCountInCourse: 0,
        hasFrqAttemptInCourse: false,
        hasDiagnosticInCourse: false,
      },
    }));
    expect(out.kind).toBe("brand_new");
  });

  it("returns brand_new in NEW course even when other course has responses", () => {
    // Per-course awareness: signal.responseCount = 50 (across all courses) but
    // signal.responseCountInCourse = 0 (this course is fresh).
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        responseCount: 50,
        responseCountInCourse: 0,
        hasFrqAttempt: true,
        hasFrqAttemptInCourse: false,
        hasDiagnostic: true,
        hasDiagnosticInCourse: false,
      },
    }));
    expect(out.kind).toBe("brand_new");
  });

  it("returns mcq_fresh for 1-4 responses, no FRQ", () => {
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        responseCountInCourse: 3,
        hasFrqAttemptInCourse: false,
        hasDiagnosticInCourse: false,
      },
    }));
    expect(out.kind).toBe("mcq_fresh");
    expect(out.headline).toContain("3/5");
  });

  it("returns first_frq for 5+ responses, no FRQ", () => {
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        responseCountInCourse: 8,
        hasFrqAttemptInCourse: false,
        hasDiagnosticInCourse: false,
      },
    }));
    expect(out.kind).toBe("first_frq");
    expect(out.primaryCta.href).toContain("first_taste=1");
  });

  it("returns first_diagnostic when FRQ done but no diagnostic", () => {
    const out = computeNextStep(baseInputs({
      signal: {
        ...baseInputs().signal,
        responseCountInCourse: 8,
        hasFrqAttemptInCourse: true,
        hasDiagnosticInCourse: false,
      },
    }));
    expect(out.kind).toBe("first_diagnostic");
    expect(out.primaryCta.href).toContain("/diagnostic");
  });
});

describe("computeNextStep — steady state (FREE)", () => {
  it("returns fix_weakest when diagnostic done + has weakest unit", () => {
    const out = computeNextStep(baseInputs());
    expect(out.kind).toBe("fix_weakest");
    expect(out.headline).toContain("Cell Structure");
    expect(out.primaryCta.href).toContain("mode=focused");
    expect(out.upgradeCta).toBeDefined();
  });

  it("returns daily_drill when diagnostic done but no weakest unit", () => {
    const out = computeNextStep(baseInputs({
      readiness: { weakestUnit: null, scaledScore: 4, scaleMax: 5 },
    }));
    expect(out.kind).toBe("daily_drill");
    expect(out.upgradeCta).toBeDefined();
  });

  it("returns daily_drill when readiness is null entirely (defensive)", () => {
    const out = computeNextStep(baseInputs({ readiness: null }));
    expect(out.kind).toBe("daily_drill");
  });
});

describe("computeNextStep — priority ordering", () => {
  it("capped_today (priority 100) outranks fix_weakest (priority 35)", () => {
    const cappedOut = computeNextStep(baseInputs({
      caps: { practiceCappedToday: true, frqCappedTypes: [] },
    }));
    const weakOut = computeNextStep(baseInputs());
    expect(cappedOut.priority).toBeGreaterThan(weakOut.priority);
  });

  it("returning_after_gap (priority 60) outranks fix_weakest (priority 35)", () => {
    const gapOut = computeNextStep(baseInputs({
      signal: { ...baseInputs().signal, daysSinceLastSession: 7 },
    }));
    const weakOut = computeNextStep(baseInputs());
    expect(gapOut.priority).toBeGreaterThan(weakOut.priority);
  });

  it("every kind has a unique non-zero priority", () => {
    const scenarios: Array<[string, NextStepInputs]> = [
      ["capped", baseInputs({ caps: { practiceCappedToday: true, frqCappedTypes: [] } })],
      ["frq_capped", baseInputs({ caps: { practiceCappedToday: false, frqCappedTypes: ["DBQ"] } })],
      ["start_journey", baseInputs({ journey: null })],
      ["resume_journey", baseInputs({ journey: { currentStep: 2, completedAt: null, weakestUnit: null } })],
      ["premium_welcome", baseInputs({ subscriptionTier: "PREMIUM", daysAsPremium: 0 })],
      ["premium_active", baseInputs({ subscriptionTier: "PREMIUM", daysAsPremium: 10 })],
      ["returning_after_gap", baseInputs({ signal: { ...baseInputs().signal, daysSinceLastSession: 7 } })],
      ["brand_new", baseInputs({
        signal: { ...baseInputs().signal, responseCountInCourse: 0, hasFrqAttemptInCourse: false, hasDiagnosticInCourse: false },
      })],
      ["fix_weakest", baseInputs()],
      ["daily_drill", baseInputs({ readiness: { weakestUnit: null, scaledScore: 4, scaleMax: 5 } })],
    ];
    const priorities = scenarios.map(([, i]) => computeNextStep(i).priority);
    const unique = new Set(priorities);
    expect(unique.size).toBe(priorities.length);
  });
});

describe("computeNextStep — analytics tags", () => {
  it("each kind sets analyticsTag matching kind", () => {
    expect(computeNextStep(baseInputs()).analyticsTag).toBe("fix_weakest");
    expect(computeNextStep(baseInputs({
      caps: { practiceCappedToday: true, frqCappedTypes: [] },
    })).analyticsTag).toBe("capped_today");
  });
});

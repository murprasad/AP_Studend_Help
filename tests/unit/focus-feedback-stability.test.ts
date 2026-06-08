/**
 * Focus-Mode completion-screen feedback STABILITY — logic-level reproduction.
 *
 * BIQ: docs/BIQ_FOCUS_FEEDBACK_FLICKER_2026-06-07.md
 *
 * Bug: in Focus Mode, after a practice session completes, the completion
 * ("summary") screen's feedback prompt ("How was this session?" / Good /
 * Needs work) FLICKERS — it re-renders / mounts-unmounts on every sprint tick
 * instead of settling.
 *
 * Why a logic-level test (not a rendered-DOM test): PrepLion's vitest env is
 * `node` (no jsdom — see vitest.config.ts). Following the repo convention
 * (tests/unit/dashboard-view.test.ts: "inline helpers mirroring the
 * component's logic"), we model the two render DECISIONS the flicker depends
 * on as pure functions and assert the invariants the flicker violates:
 *
 *   1. The Focus sprint ticker (the `nowTick` interval) must NOT run once the
 *      session has completed (mode === "summary"). A running ticker on the
 *      completion screen is what drives the parent re-render that churns the
 *      feedback subtree.  [shouldSprintTickerRun]
 *
 *   2. The completion-screen feedback prompt must render EXACTLY ONCE and its
 *      identity must NOT depend on `nowTick` — i.e. across many simulated
 *      ticks the prompt's render key is stable (no remount) and there is never
 *      more than one prompt.  [feedbackPromptRenderPlan]
 *
 * A full browser walk lives in tests/focus-session-feedback-stability.spec.ts.
 *
 * Negative-heavy per repo convention.
 */

import { describe, it, expect } from "vitest";

// ── Mirror 1: the Focus sprint ticker gate ──────────────────────────────────
// practice/page.tsx ~L502-L506:
//   useEffect(() => {
//     if (!focusPrefs.focusMode || mode !== "practicing") return;   // <- gate
//     const t = setInterval(() => setNowTick(n => n + 1), 1000);
//     return () => clearInterval(t);
//   }, [focusPrefs.focusMode, mode]);
//
// Invariant: the per-second nowTick interval may run ONLY while actively
// practicing in Focus Mode. It must be OFF on the completion ("summary")
// screen — otherwise its setNowTick churns the parent (and the feedback
// subtree) every second.
type PracticeMode = "select" | "practicing" | "summary";
function shouldSprintTickerRun(focusMode: boolean, mode: PracticeMode): boolean {
  return focusMode && mode === "practicing";
}

// ── Mirror 2: completion-screen feedback prompt render plan ─────────────────
// practice/page.tsx ~L1469-L1507: on the summary screen, exactly one feedback
// affordance renders — inline thumbs ("How was this session?") for short
// sessions (<=5 Qs), else the <SessionFeedbackPopup> (first-only). Once a
// rating is given it collapses to the thank-you line.
//
// The render plan must be a PURE function of session-shape + rating, and must
// be INDEPENDENT of nowTick (the sprint clock). We pass nowTick in only to
// PROVE the output ignores it: a stable render key + count across ticks means
// no flicker/remount.
interface FeedbackPlan {
  // a stable identity for the rendered prompt; if this changes between two
  // ticks with the same inputs, React would remount -> flicker.
  key: string;
  // how many feedback prompts are on screen — must always be exactly 1
  promptCount: number;
  // which affordance: inline thumbs vs popup vs the post-rating thank-you
  variant: "inline-thumbs" | "popup" | "thanks";
}

function feedbackPromptRenderPlan(args: {
  mode: PracticeMode;
  hasSummary: boolean;
  questionCount: number;
  feedbackRating: 1 | -1 | null;
  // deliberately accepted but MUST be ignored:
  nowTick: number;
}): FeedbackPlan | null {
  const { mode, hasSummary, questionCount, feedbackRating } = args;
  // The completion screen only exists when the session is summarized.
  if (mode !== "summary" || !hasSummary) return null;

  if (feedbackRating !== null) {
    return { key: "feedback:thanks", promptCount: 1, variant: "thanks" };
  }
  // <=5 Qs -> inline thumbs prompt; longer -> popup (render-once / first-only).
  const variant: FeedbackPlan["variant"] = questionCount <= 5 ? "inline-thumbs" : "popup";
  // key is derived ONLY from variant — NOT from nowTick — so it never changes
  // tick-to-tick. (If anyone reintroduces nowTick into this key, the stability
  // test below fails.)
  return { key: `feedback:${variant}`, promptCount: 1, variant };
}

// ════════════════════════════════════════════════════════════════════════════
describe("Focus sprint ticker is OFF on the completion screen (no churn source)", () => {
  // positive
  it("runs only while actively practicing in Focus Mode", () => {
    expect(shouldSprintTickerRun(true, "practicing")).toBe(true);
  });

  // negatives — the flicker-causing states
  it("is OFF on the completion/summary screen in Focus Mode (THE BUG)", () => {
    // If this is ever true, the 1s nowTick interval keeps firing on the
    // completion screen and churns the feedback subtree -> flicker.
    expect(shouldSprintTickerRun(true, "summary")).toBe(false);
  });
  it("is OFF at the select screen in Focus Mode", () => {
    expect(shouldSprintTickerRun(true, "select")).toBe(false);
  });
  it("is OFF in Regular Mode while practicing", () => {
    expect(shouldSprintTickerRun(false, "practicing")).toBe(false);
  });
  it("is OFF in Regular Mode on the completion screen", () => {
    expect(shouldSprintTickerRun(false, "summary")).toBe(false);
  });
});

describe("Completion-screen feedback prompt is stable + single (no flicker/dupe)", () => {
  const baseShort = { mode: "summary" as const, hasSummary: true, questionCount: 5, feedbackRating: null as 1 | -1 | null };
  const baseLong = { ...baseShort, questionCount: 20 };

  // positive
  it("renders exactly ONE prompt on the short-session completion screen", () => {
    const plan = feedbackPromptRenderPlan({ ...baseShort, nowTick: 0 });
    expect(plan).not.toBeNull();
    expect(plan!.promptCount).toBe(1);
    expect(plan!.variant).toBe("inline-thumbs");
  });

  // THE flicker invariant: render key is IDENTICAL across many ticks.
  it("does NOT remount across 200 sprint ticks (stable render key — THE BUG)", () => {
    const keys = new Set<string>();
    let totalPrompts = 0;
    for (let tick = 0; tick < 200; tick++) {
      const plan = feedbackPromptRenderPlan({ ...baseShort, nowTick: tick });
      expect(plan).not.toBeNull();
      keys.add(plan!.key);
      totalPrompts = plan!.promptCount; // must stay 1 every tick
      expect(plan!.promptCount).toBe(1);
    }
    // A single stable key across all ticks == React keeps the same element ==
    // no unmount/remount == no flicker. >1 distinct key == remount churn.
    expect(keys.size).toBe(1);
    expect(totalPrompts).toBe(1);
  });

  it("long sessions show exactly one popup, also tick-stable", () => {
    const keys = new Set<string>();
    for (let tick = 0; tick < 50; tick++) {
      const plan = feedbackPromptRenderPlan({ ...baseLong, nowTick: tick * 7 });
      expect(plan!.promptCount).toBe(1);
      expect(plan!.variant).toBe("popup");
      keys.add(plan!.key);
    }
    expect(keys.size).toBe(1);
  });

  // negatives / boundaries
  it("never renders TWO prompts (no inline-thumbs + popup duplicate)", () => {
    // Whatever the question count, exactly one variant is chosen.
    for (const qc of [1, 3, 5, 6, 20, 50]) {
      const plan = feedbackPromptRenderPlan({ mode: "summary", hasSummary: true, questionCount: qc, feedbackRating: null, nowTick: 0 });
      expect(plan!.promptCount).toBe(1);
    }
  });
  it("collapses to a single thank-you line once rated (still exactly one)", () => {
    const up = feedbackPromptRenderPlan({ ...baseShort, feedbackRating: 1, nowTick: 99 });
    expect(up!.variant).toBe("thanks");
    expect(up!.promptCount).toBe(1);
  });
  it("renders NO prompt before the session is summarized", () => {
    expect(feedbackPromptRenderPlan({ mode: "practicing", hasSummary: false, questionCount: 5, feedbackRating: null, nowTick: 0 })).toBeNull();
    expect(feedbackPromptRenderPlan({ mode: "select", hasSummary: false, questionCount: 5, feedbackRating: null, nowTick: 0 })).toBeNull();
  });
  it("renders NO prompt in summary mode without a summary payload", () => {
    expect(feedbackPromptRenderPlan({ mode: "summary", hasSummary: false, questionCount: 5, feedbackRating: null, nowTick: 0 })).toBeNull();
  });
  it("the render key is provably independent of nowTick (two distinct ticks -> same key)", () => {
    const a = feedbackPromptRenderPlan({ ...baseShort, nowTick: 1 })!;
    const b = feedbackPromptRenderPlan({ ...baseShort, nowTick: 123456 })!;
    expect(a.key).toBe(b.key);
  });
});

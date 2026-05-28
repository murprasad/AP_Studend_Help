import { describe, it, expect } from "vitest";
import {
  sageCoachReducer,
  initialSageCoachState,
  secondsLeftFromStart,
  type SageCoachConcept,
  type EvalResult,
} from "@/lib/sage-coach-fsm";

const CONCEPT: SageCoachConcept = {
  conceptId: "c1",
  question: "Explain photosynthesis.",
  course: "AP_BIOLOGY",
};

const EVAL: EvalResult = { score: 8.5, feedback: "Solid coverage of light/dark reactions." };

describe("sageCoachReducer", () => {
  it("starts in checking", () => {
    expect(initialSageCoachState.phase.kind).toBe("checking");
  });

  it("READY transitions to prompt + carries previousScore", () => {
    const s = sageCoachReducer(initialSageCoachState, {
      type: "READY",
      concept: CONCEPT,
      resumable: null,
      previousScore: 7.2,
    });
    expect(s.phase.kind).toBe("prompt");
    expect(s.previousScore).toBe(7.2);
  });

  it("START_RECORDING from prompt with no resumable: empty transcript", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    expect(s.phase.kind).toBe("recording");
    if (s.phase.kind === "recording") {
      expect(s.phase.transcript).toBe("");
      expect(s.phase.startedAt).toBe(1000);
    }
  });

  it("START_RECORDING from prompt with resumable: hydrates transcript", () => {
    let s = sageCoachReducer(initialSageCoachState, {
      type: "READY",
      concept: CONCEPT,
      resumable: { transcript: "Photosynthesis uses light...", conceptId: "c1", conceptQuestion: CONCEPT.question, course: CONCEPT.course, savedAt: 1 },
      previousScore: null,
    });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    expect(s.phase.kind).toBe("recording");
    if (s.phase.kind === "recording") {
      expect(s.phase.transcript).toBe("Photosynthesis uses light...");
    }
  });

  it("STOP_RECORDING → processing carries transcript", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    s = sageCoachReducer(s, { type: "TRANSCRIPT_UPDATED", transcript: "Plants convert light to glucose..." });
    s = sageCoachReducer(s, { type: "STOP_RECORDING", submittedAt: 30000 });
    expect(s.phase.kind).toBe("processing");
    if (s.phase.kind === "processing") {
      expect(s.phase.transcript).toBe("Plants convert light to glucose...");
    }
  });

  it("EVAL_RESOLVED only fires from processing — guards against stale callbacks", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    // Stale eval arriving before stop — must be a no-op.
    const before = s;
    s = sageCoachReducer(s, { type: "EVAL_RESOLVED", evaluation: EVAL });
    expect(s).toBe(before); // exact reference; refuses the transition
  });

  it("EVAL_RESOLVED from processing → feedback", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    s = sageCoachReducer(s, { type: "STOP_RECORDING", submittedAt: 30000 });
    s = sageCoachReducer(s, { type: "EVAL_RESOLVED", evaluation: EVAL });
    expect(s.phase.kind).toBe("feedback");
    if (s.phase.kind === "feedback") expect(s.phase.evaluation.score).toBe(8.5);
  });

  it("TRANSCRIPT_UPDATED is idempotent — same string = same reference", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    s = sageCoachReducer(s, { type: "TRANSCRIPT_UPDATED", transcript: "abc" });
    const after1 = s;
    s = sageCoachReducer(s, { type: "TRANSCRIPT_UPDATED", transcript: "abc" });
    expect(s).toBe(after1);
  });

  it("DAILY_LIMIT_REACHED from processing rolls to daily_limit (preserves concept)", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    s = sageCoachReducer(s, { type: "STOP_RECORDING", submittedAt: 30000 });
    s = sageCoachReducer(s, { type: "DAILY_LIMIT_REACHED" });
    expect(s.phase.kind).toBe("daily_limit");
    if (s.phase.kind === "daily_limit") expect(s.phase.concept.conceptId).toBe("c1");
  });
});

describe("secondsLeftFromStart", () => {
  it("returns null when not recording", () => {
    expect(secondsLeftFromStart(initialSageCoachState, 100000, 60)).toBeNull();
  });

  it("counts down from start", () => {
    let s = sageCoachReducer(initialSageCoachState, { type: "READY", concept: CONCEPT, resumable: null, previousScore: null });
    s = sageCoachReducer(s, { type: "START_RECORDING", startedAt: 1000 });
    expect(secondsLeftFromStart(s, 1000, 60)).toBe(60);
    expect(secondsLeftFromStart(s, 1000 + 15000, 60)).toBe(45);
    expect(secondsLeftFromStart(s, 1000 + 60000, 60)).toBe(0);
    expect(secondsLeftFromStart(s, 1000 + 90000, 60)).toBe(0); // clamps
  });
});

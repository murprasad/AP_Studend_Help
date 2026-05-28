/**
 * D2 — Sage Coach finite-state machine.
 *
 * The current `sage-coach/page.tsx` has 12+ useState slots + 3 racing
 * timers (recording ticker, AbortController watchdog, server-side
 * watchdog fallback). The design audit flagged this as a P0 because
 * a connection loss mid-recording silently loses 60 seconds of
 * student effort AND still consumes the 1/day free attempt.
 *
 * This reducer is the architectural fix — a single discriminated
 * union state where every transition is explicit. No racing timers;
 * an effect drives the recording elapsed time off a single
 * `recordingStartedAt` ref.
 *
 * Shipped 2026-05-28 as D2 design + library + tests. The page.tsx
 * wire-up follows the same Phase 0 → 1 → 2 → 3 pattern as D1 so we
 * can ship behind a flag and observe assertion mismatches before
 * the UI cutover.
 *
 * Pure logic — no hooks, no React, no I/O. Unit-testable.
 */

export type SageCoachPhase =
  | { kind: "checking" }
  | { kind: "loading"; conceptId?: string }
  | { kind: "prompt"; concept: SageCoachConcept; resumable: PersistedTranscript | null }
  | { kind: "recording"; concept: SageCoachConcept; transcript: string; startedAt: number }
  | { kind: "processing"; concept: SageCoachConcept; transcript: string; submittedAt: number }
  | { kind: "feedback"; concept: SageCoachConcept; transcript: string; evaluation: EvalResult }
  | { kind: "daily_limit"; concept: SageCoachConcept }
  | { kind: "error"; concept: SageCoachConcept | null; message: string };

export interface SageCoachConcept {
  conceptId: string;
  question: string;
  course: string;
}

export interface PersistedTranscript {
  transcript: string;
  conceptId: string;
  conceptQuestion: string;
  course: string;
  savedAt: number;
}

export interface EvalResult {
  score: number;
  feedback: string;
  // shape kept loose for forward compatibility
  [k: string]: unknown;
}

export interface SageCoachState {
  phase: SageCoachPhase;
  /** Persisted across phases for the metrics display. */
  previousScore: number | null;
}

export const initialSageCoachState: SageCoachState = {
  phase: { kind: "checking" },
  previousScore: null,
};

export type SageCoachAction =
  | { type: "READY"; concept: SageCoachConcept; resumable: PersistedTranscript | null; previousScore: number | null }
  | { type: "LOAD_FAILED"; message: string }
  | { type: "DISCARD_RESUMABLE" }
  | { type: "START_RECORDING"; startedAt: number }
  | { type: "TRANSCRIPT_UPDATED"; transcript: string }
  | { type: "STOP_RECORDING"; submittedAt: number }
  | { type: "EVAL_RESOLVED"; evaluation: EvalResult }
  | { type: "EVAL_FAILED"; message: string }
  | { type: "DAILY_LIMIT_REACHED" }
  | { type: "RETRY_CONCEPT" }
  | { type: "RESET" };

export function sageCoachReducer(state: SageCoachState, action: SageCoachAction): SageCoachState {
  switch (action.type) {
    case "READY":
      return {
        ...state,
        phase: { kind: "prompt", concept: action.concept, resumable: action.resumable },
        previousScore: action.previousScore,
      };
    case "DISCARD_RESUMABLE": {
      if (state.phase.kind !== "prompt") return state;
      return { ...state, phase: { ...state.phase, resumable: null } };
    }
    case "LOAD_FAILED":
      return {
        ...state,
        phase: { kind: "error", concept: null, message: action.message },
      };
    case "START_RECORDING": {
      if (state.phase.kind !== "prompt") return state;
      // If a resumable transcript exists at start, honour it. Otherwise
      // empty. The page UI shows a "Restore?" prompt before this dispatch.
      const initialTranscript = state.phase.resumable?.transcript ?? "";
      return {
        ...state,
        phase: {
          kind: "recording",
          concept: state.phase.concept,
          transcript: initialTranscript,
          startedAt: action.startedAt,
        },
      };
    }
    case "TRANSCRIPT_UPDATED": {
      if (state.phase.kind !== "recording") return state;
      // Idempotent — no transition if the transcript hasn't changed.
      if (state.phase.transcript === action.transcript) return state;
      return {
        ...state,
        phase: { ...state.phase, transcript: action.transcript },
      };
    }
    case "STOP_RECORDING": {
      if (state.phase.kind !== "recording") return state;
      return {
        ...state,
        phase: {
          kind: "processing",
          concept: state.phase.concept,
          transcript: state.phase.transcript,
          submittedAt: action.submittedAt,
        },
      };
    }
    case "EVAL_RESOLVED": {
      if (state.phase.kind !== "processing") return state;
      return {
        ...state,
        phase: {
          kind: "feedback",
          concept: state.phase.concept,
          transcript: state.phase.transcript,
          evaluation: action.evaluation,
        },
      };
    }
    case "EVAL_FAILED": {
      // Can fail from processing OR from recording (mid-eval network drop).
      const concept = state.phase.kind === "processing" || state.phase.kind === "recording"
        ? state.phase.concept
        : null;
      return {
        ...state,
        phase: { kind: "error", concept, message: action.message },
      };
    }
    case "DAILY_LIMIT_REACHED": {
      const concept = state.phase.kind === "processing" || state.phase.kind === "recording"
        ? state.phase.concept
        : null;
      if (!concept) return state;
      return { ...state, phase: { kind: "daily_limit", concept } };
    }
    case "RETRY_CONCEPT":
      return { ...state, phase: { kind: "loading" } };
    case "RESET":
      return initialSageCoachState;
    default:
      return state;
  }
}

/**
 * Live elapsed-time helper. Drives the on-screen countdown from a single
 * source (`recordingStartedAt`) instead of an interval setState loop that
 * loses time when iOS Safari throttles the tab.
 *
 * @param now Date.now() at render
 * @param recordSeconds session length (60 by default)
 * @returns secondsLeft (clamped 0..recordSeconds). null if not recording.
 */
export function secondsLeftFromStart(
  state: SageCoachState,
  now: number,
  recordSeconds: number,
): number | null {
  if (state.phase.kind !== "recording") return null;
  const elapsedMs = now - state.phase.startedAt;
  const remaining = recordSeconds - Math.floor(elapsedMs / 1000);
  return Math.max(0, Math.min(recordSeconds, remaining));
}

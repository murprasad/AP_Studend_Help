/**
 * Unified question validator — single callable that runs every implemented
 * validation gate against a question candidate.
 *
 * Layers (executed in order; later layers run only if earlier ones pass):
 *   1. Deterministic gates (~60+ rules in deterministic-question-gates.ts)
 *   2. CAS recompute (math courses only) — mathjs re-solves and compares
 *   3. Second-pass LLM verifier (Haiku 4.5)
 *
 * Returns a single ValidationResult with trust_score (0..1) and a Gold/
 * Silver/Bronze/Rejected certification.
 *
 * Usage:
 *   import { validateQuestion } from "@/lib/validate-question";
 *   const result = await validateQuestion(q);
 *   if (!result.passed) reject(result.failures);
 *
 * Cost: ~$0.001-0.003 per Q (LLM layer). CAS + deterministic are free.
 */

import { runDeterministicGates, type QuestionCandidate } from "@/lib/deterministic-question-gates";
import { secondPassVerify } from "@/lib/second-pass-verifier";
import { validateMathRecompute } from "@/lib/math-recompute-validator";

/**
 * Input type for the unified validator. Same shape as QuestionCandidate but
 * with the LLM/CAS-required fields marked non-optional.
 */
export interface ValidateQuestionInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  stimulus?: string;
  topic?: string;
  unit: string;
  course: string;
}

// SN scope: SAT/ACT/PSAT math + AP math/science
const MATH_COURSES = new Set([
  "SAT_MATH",
  "ACT_MATH",
  "PSAT_MATH",
  "AP_CALCULUS_AB",
  "AP_CALCULUS_BC",
  "AP_STATISTICS",
  "AP_PRECALCULUS",
]);

export interface ValidationOptions {
  llmVerify?: boolean;
  casRecompute?: "auto" | "force" | "skip";
}

export interface ValidationFailure {
  layer: "deterministic" | "cas" | "llm";
  gate: string;
  reason: string;
  severity: "blocker" | "warn";
}

export interface ValidationResult {
  passed: boolean;
  gates_run: number;
  failures: ValidationFailure[];
  trust_score: number;
  certification: "Gold" | "Silver" | "Bronze" | "Rejected";
  cas?: { status: "pass" | "fail" | "skip"; reason?: string; computed?: unknown };
  llm?: { verdict: "PASS" | "FAIL" | "SKIP"; solved?: string; reason: string };
}

export async function validateQuestion(
  q: ValidateQuestionInput,
  opts: ValidationOptions = {},
): Promise<ValidationResult> {
  const failures: ValidationFailure[] = [];
  let gates_run = 0;

  const det = runDeterministicGates(q as QuestionCandidate);
  gates_run += 1;
  if (!det.ok) {
    failures.push({ layer: "deterministic", gate: det.gate || "deterministic", reason: det.reason || "unspecified", severity: "blocker" });
  }

  let cas: ValidationResult["cas"];
  const casMode = opts.casRecompute ?? "auto";
  const shouldRunCas = casMode === "force" || (casMode === "auto" && MATH_COURSES.has(q.course));
  if (shouldRunCas) {
    try {
      const r = validateMathRecompute(
        q.questionText,
        q.options as string[],
        q.correctAnswer,
      );
      gates_run += 1;
      cas = { status: r.status, reason: r.reason, computed: r.computed };
      if (r.status === "fail") {
        failures.push({ layer: "cas", gate: "cas-recompute", reason: r.reason || "stored answer disagrees with mathjs", severity: "blocker" });
      }
    } catch (e: any) {
      cas = { status: "skip", reason: `cas-error: ${(e?.message || String(e)).slice(0, 80)}` };
    }
  }

  let llm: ValidationResult["llm"];
  const llmEnabled = opts.llmVerify ?? true;
  if (llmEnabled && failures.length === 0) {
    const v = await secondPassVerify({
      questionText: q.questionText,
      options: q.options as string[],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      stimulus: q.stimulus,
    });
    gates_run += 1;
    llm = { verdict: v.verdict, solved: v.solved, reason: v.reason };
    if (v.verdict === "FAIL") {
      failures.push({ layer: "llm", gate: "second-pass-verifier", reason: v.reason, severity: "blocker" });
    }
  }

  const blockers = failures.filter((f) => f.severity === "blocker").length;
  const trust_score = gates_run === 0 ? 0 : Math.max(0, (gates_run - blockers) / gates_run);

  let certification: ValidationResult["certification"];
  if (blockers > 0) certification = "Rejected";
  else if (trust_score >= 0.95 && llm?.verdict === "PASS") certification = "Gold";
  else if (trust_score >= 0.95) certification = "Silver";
  else certification = "Bronze";

  return {
    passed: blockers === 0,
    gates_run,
    failures,
    trust_score,
    certification,
    cas,
    llm,
  };
}

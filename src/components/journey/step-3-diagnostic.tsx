"use client";

/**
 * Step 3 — Mini diagnostic (Beta 9.5).
 *
 * Creates a DIAGNOSTIC-type session via /api/diagnostic, drives 5–10
 * MCQs in carousel, finalizes with /api/diagnostic/complete to get
 * predicted score + weakest unit. Returns weakestUnit to orchestrator
 * so step 4 can target it.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { QuestionContent } from "@/components/question/question-content";

interface Q {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer?: string;
  topic?: string;
  unit?: string;
  stimulus?: string;
}

interface Props {
  course: string;
  onComplete: (out: {
    diagnosticId: string;
    weakestUnit: string | null;
    weakestUnitName: string | null;
    predictedScore: number | null;
  }) => void;
}

export function Step3Diagnostic({ course, onComplete }: Props) {
  const [phase, setPhase] = useState<"loading" | "qa" | "submitting" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/diagnostic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.sessionId || !Array.isArray(d.questions)) {
          setError(d.error || "Could not start diagnostic");
          setPhase("error");
          return;
        }
        setSessionId(d.sessionId);
        // Cap at 10 to keep journey length reasonable
        setQuestions(d.questions.slice(0, 10));
        setPhase("qa");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error");
          setPhase("error");
        }
      });
    return () => { cancelled = true; };
  }, [course]);

  const submit = async (answer: string) => {
    if (!sessionId || !questions[idx] || submitting) return;
    setSubmitting(true);
    setSelected(answer);
    try {
      // 2026-05-01 fix — server stores correctAnswer as a single letter
      // and grades by letter comparison. Option strings start with
      // "A) ...", "B) ..." etc., so we send the leading letter, not the
      // full option text. Same bug + fix as step-1-mcq.tsx — every Step 3
      // diagnostic answer was being marked incorrect regardless of choice.
      const letter = answer.charAt(0).toUpperCase();
      const res = await fetch(`/api/practice/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[idx].id,
          answer: letter,
          timeSpentSecs: 30,
        }),
      });
      const d = await res.json();
      if (d.isCorrect) setCorrectCount((c) => c + 1);
      setFeedback({ correct: !!d.isCorrect, correctAnswer: d.correctAnswer ?? "" });
    } catch {
      setFeedback({ correct: false, correctAnswer: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      setPhase("submitting");
      try {
        const res = await fetch("/api/diagnostic/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const d = await res.json();
        const unitScores: Record<string, number> = d.diagnostic?.unitScores ?? d.unitScores ?? {};
        const entries = Object.entries(unitScores);
        let weakestUnit: string | null = null;
        let weakestPct = Infinity;
        for (const [unit, pct] of entries) {
          if (typeof pct === "number" && pct < weakestPct) {
            weakestPct = pct;
            weakestUnit = unit;
          }
        }
        const meanPct = entries.length
          ? Math.round(entries.reduce((s, [, p]) => s + (typeof p === "number" ? p : 0), 0) / entries.length)
          : Math.round((correctCount / Math.max(1, questions.length)) * 100);
        const predictedScore =
          meanPct >= 80 ? 5 : meanPct >= 65 ? 4 : meanPct >= 50 ? 3 : meanPct >= 35 ? 2 : 1;

        onComplete({
          diagnosticId: d.diagnostic?.id ?? d.id ?? sessionId ?? "",
          weakestUnit,
          weakestUnitName: weakestUnit, // raw unit code for now; orchestrator can pretty-print
          predictedScore,
        });
      } catch {
        onComplete({ diagnosticId: sessionId ?? "", weakestUnit: null, weakestUnitName: null, predictedScore: null });
      }
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setFeedback(null);
  };

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Calculating your projected score…</p>
      </div>
    );
  }

  if (phase === "error" || questions.length === 0) {
    return (
      <div className="text-center pt-12 space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "No diagnostic available."}</p>
        <Button variant="outline" onClick={() => onComplete({ diagnosticId: "", weakestUnit: null, weakestUnitName: null, predictedScore: null })}>
          Skip step
        </Button>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-5">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Step 3 · Diagnostic
        </p>
        <p className="text-sm mt-0.5">
          Question {idx + 1} of {questions.length}
        </p>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5 sm:p-6 space-y-4">
        {q.stimulus && (
          <div className="rounded-md bg-muted/30 p-3 text-sm border border-border/40">
            <QuestionContent content={q.stimulus} />
          </div>
        )}
        <div className="text-base leading-relaxed font-medium">
          <QuestionContent content={q.questionText} />
        </div>
        <div className="space-y-2 pt-1">
          {q.options.map((opt, i) => {
            const letter = ["A", "B", "C", "D", "E"][i] ?? String(i + 1);
            const isSelected = selected === opt;
            // 2026-05-01 fix — feedback.correctAnswer is a letter ("C"),
            // not the full option string. Compare against this option's
            // letter so the green correct-highlight fires on the right choice.
            const isCorrectAnswer = feedback && feedback.correctAnswer.toUpperCase() === letter;
            const wasSelectedAndWrong = feedback && isSelected && !feedback.correct;
            const cls = feedback
              ? isCorrectAnswer
                ? "border-emerald-500/60 bg-emerald-500/10"
                : wasSelectedAndWrong
                ? "border-red-500/60 bg-red-500/10"
                : "border-border/40 opacity-60"
              : isSelected
              ? "border-blue-500 bg-blue-500/5"
              : "border-border/40 hover:bg-accent";
            return (
              <button
                key={i}
                type="button"
                onClick={() => !feedback && !submitting && submit(opt)}
                disabled={!!feedback || submitting}
                className={`w-full text-left rounded-lg border p-3 transition-all flex gap-3 items-start ${cls}`}
              >
                <span className="font-bold text-sm w-6 flex-shrink-0">({letter})</span>
                <span className="flex-1 text-sm leading-relaxed">
                  <QuestionContent content={opt} />
                </span>
                {feedback && isCorrectAnswer && <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />}
                {wasSelectedAndWrong && <X className="h-4 w-4 text-red-700 dark:text-red-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div className="text-right">
          <Button onClick={next} className="rounded-full gap-2">
            {idx + 1 >= questions.length ? "See my score" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

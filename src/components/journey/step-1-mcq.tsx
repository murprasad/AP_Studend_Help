"use client";

/**
 * Step 1 — 3 MCQs (Beta 9.5).
 *
 * Creates a 3-question MCQ session against /api/practice, drives the
 * student through them in a full-screen carousel with (A)(B)(C)(D)
 * labeled choices and an instant-feedback panel.
 *
 * On completion → calls onComplete(sessionId).
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
  questionCount?: number;
  unit?: string | null;
  /** Friendly label printed at the top — e.g. "Step 1 of 5 · Warm-up" */
  label?: string;
  onComplete: (artifact: { sessionId: string; correctCount: number; total: number }) => void;
}

export function Step1Mcq({ course, questionCount = 3, unit = null, label = "Warm-up", onComplete }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; explanation?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionType: "QUICK_PRACTICE",
        course,
        questionCount,
        difficulty: "ALL",
        unit: unit ?? "ALL",
        questionType: "MCQ",
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.sessionId || !Array.isArray(d.questions)) {
          setError(d.error || "Could not start session");
          setLoading(false);
          return;
        }
        setSessionId(d.sessionId);
        setQuestions(d.questions);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error starting session");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [course, questionCount, unit]);

  const submit = async (answer: string) => {
    if (!sessionId || !questions[idx] || submitting) return;
    setSubmitting(true);
    setSelected(answer);
    try {
      // 2026-05-01 fix — server stores correctAnswer as a single letter
      // ("A"/"B"/"C"/"D"/"E") and grades by `answer.toUpperCase() ===
      // question.correctAnswer.toUpperCase()`. Option strings start with
      // "A) ...", "B) ..." etc., so we send the leading letter, not the
      // full option text. Without this, every Step 1/Step 4 MCQ was
      // marked incorrect regardless of which choice the student picked.
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
      setFeedback({
        correct: !!d.isCorrect,
        correctAnswer: d.correctAnswer ?? "",
        explanation: d.explanation ?? undefined,
      });
    } catch {
      setFeedback({ correct: false, correctAnswer: "", explanation: "Couldn't grade. Continuing." });
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    if (idx + 1 >= questions.length) {
      // Complete the session
      try {
        await fetch(`/api/practice/${sessionId}`, { method: "PATCH", body: JSON.stringify({}) });
      } catch { /* ignore */ }
      onComplete({ sessionId: sessionId ?? "", correctCount, total: questions.length });
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setFeedback(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="text-center pt-12 space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "No questions available."}</p>
        <Button variant="outline" onClick={() => onComplete({ sessionId: sessionId ?? "", correctCount: 0, total: 0 })}>
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
          {label}
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
            // not the full option string ("C) Synthesis..."). Compare to
            // this option's leading letter so the green "this is correct"
            // highlight actually fires on the right choice.
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
        <div className={`rounded-xl border p-4 ${feedback.correct ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          <p className={`text-sm font-semibold ${feedback.correct ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
            {feedback.correct ? "Correct" : "Not quite"}
          </p>
          {feedback.explanation && (
            <div className="text-sm mt-1.5 leading-relaxed text-foreground/90">
              <QuestionContent content={feedback.explanation} />
            </div>
          )}
          <Button onClick={next} className="rounded-full mt-3 gap-2">
            {idx + 1 >= questions.length ? "Continue" : "Next question"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

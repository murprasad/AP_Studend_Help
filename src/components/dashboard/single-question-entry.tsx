"use client";

/**
 * SingleQuestionEntry — the "Q1 commitment" fix.
 *
 * Data shows 80% of sign-ups never answer a single question. The full
 * /practice flow has too much friction (course selection, mode picker,
 * "10 questions" framing, session config). This component drops ONE
 * easy MCQ on the dashboard with zero session framing.
 *
 * Goal: get students to commit to Q1 in <30 seconds. Once they cross
 * that threshold, the rosemarymexum data shows they engage deeply.
 *
 * Flow:
 *   1. Loads 1 EASY MCQ for current course on mount.
 *   2. User picks an answer + submits (no session, no DB write yet).
 *   3. Instant feedback: "Got it!" / "Almost — here's why" with
 *      explanation + a positive percentile framing.
 *   4. CTA: "Keep going — see your full score" → /practice
 *
 * Tracking: fires q1_shown, q1_answered, q1_correct events via
 * existing dashboard-event API for funnel analysis.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { QuestionContent } from "@/components/question/question-content";

interface Q1Question {
  id: string;
  course: string;
  unit: string;
  topic: string | null;
  questionText: string;
  options: unknown;  // string[] or JSON-stringified
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

interface Props {
  course: string;
}

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

async function logEvent(event: string, course: string, extra?: Record<string, unknown>) {
  try {
    await fetch("/api/analytics/dashboard-event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, course, ...extra }),
    });
  } catch { /* silent */ }
}

const Q1_COMPLETED_KEY = (course: string) => `q1_completed_${course}`;

export function SingleQuestionEntry({ course }: Props) {
  const [q, setQ] = useState<Q1Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Once-per-course rule: if the user has already submitted this Quick
    // Check for this course (or has any prior practice history for the
    // course — server-side check), suppress this card forever for that
    // course. Switching to a different course renders a fresh Q1.
    if (typeof window !== "undefined" && localStorage.getItem(Q1_COMPLETED_KEY(course))) {
      setHidden(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/q1?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.hide) {
          // Server says this user already has practice history for the course.
          // Persist the flag so we don't re-fetch on every mount.
          if (typeof window !== "undefined") {
            localStorage.setItem(Q1_COMPLETED_KEY(course), "server-skip");
          }
          setHidden(true);
          return;
        }
        if (!d?.question) {
          setError("Couldn't load a question. Try Practice instead.");
          return;
        }
        setQ(d.question);
        logEvent("q1_shown", course, { questionId: d.question.id });
      })
      .catch(() => { if (!cancelled) setError("Network error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  if (hidden) return null;

  if (loading) {
    return (
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
        <CardContent className="p-6 space-y-3">
          <div className="h-4 bg-muted/40 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-muted/40 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-muted/40 rounded w-full animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (error || !q) {
    return null;
  }

  const options = parseOptions(q.options);
  const isCorrect = submitted && selected === q.correctAnswer;
  // Strip leading "A) ", "B) ", etc. from option strings — present as plain text.
  const stripPrefix = (o: string) => o.replace(/^[A-E][\)\.]?\s*/, "");

  function handleAnswer(letter: string) {
    if (submitted) return;
    setSelected(letter);
  }

  function handleSubmit() {
    if (!selected || submitted || !q) return;
    setSubmitted(true);
    const correct = selected === q.correctAnswer;
    logEvent("q1_answered", course, { questionId: q.id, correct });
    if (correct) logEvent("q1_correct", course, { questionId: q.id });
    // Mark this course's Quick Check as done so the card never re-appears
    // for this course on subsequent dashboard mounts. Switching to a
    // different course renders a fresh Q1.
    if (typeof window !== "undefined") {
      localStorage.setItem(Q1_COMPLETED_KEY(course), "submitted");
    }
  }

  return (
    <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Quick check</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            ~30 sec · No score saved
          </Badge>
        </div>

        <div className="text-sm font-medium leading-relaxed">
          <QuestionContent content={q.questionText} />
        </div>

        <div className="grid gap-2">
          {options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i); // A, B, C, D, E
            const isSelected = selected === letter;
            const isAnswer = submitted && letter === q.correctAnswer;
            const isWrong = submitted && isSelected && letter !== q.correctAnswer;
            return (
              <button
                key={i}
                onClick={() => handleAnswer(letter)}
                disabled={submitted}
                className={`text-left p-3 rounded-lg border transition-colors text-sm ${
                  isAnswer
                    ? "border-emerald-500 bg-emerald-500/10"
                    : isWrong
                    ? "border-rose-500 bg-rose-500/10"
                    : isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-border/50 hover:border-blue-500/40 hover:bg-blue-500/5"
                }`}
              >
                <span className="font-semibold mr-2">{letter}.</span>
                {stripPrefix(opt)}
                {isAnswer && <CheckCircle2 className="inline h-4 w-4 ml-2 text-emerald-600" />}
                {isWrong && <XCircle className="inline h-4 w-4 ml-2 text-rose-600" />}
              </button>
            );
          })}
        </div>

        {!submitted && (
          <Button
            disabled={!selected}
            onClick={handleSubmit}
            className="w-full rounded-full h-10"
          >
            Check my answer
          </Button>
        )}

        {submitted && (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className={`text-sm font-medium ${isCorrect ? "text-emerald-700 dark:text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-700 dark:text-amber-400"}`}>
              {isCorrect
                ? "Got it! That puts you on track for this unit."
                : `Almost — the correct answer is ${q.correctAnswer}.`}
            </div>
            {q.explanation && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                <QuestionContent content={q.explanation} />
              </div>
            )}
            <Link href={`/practice?course=${course}`}>
              <Button className="w-full rounded-full h-11 gap-2 group">
                Keep going — see your full score
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

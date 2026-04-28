"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ApCourse } from "@prisma/client";
import { CheckCircle, XCircle, Loader2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface KCQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

type State = "idle" | "loading" | "answering" | "complete";

export interface KnowledgeCheckProps {
  tutorResponse: string;
  course: ApCourse;
  topic: string | null;
  conversationId: string | null;
}

export function KnowledgeCheck({
  tutorResponse,
  course,
  topic,
  conversationId,
}: KnowledgeCheckProps) {
  const [state, setState] = useState<State>("idle");
  const [questions, setQuestions] = useState<KCQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  // Reset to idle when tutor response changes (new message sent)
  useEffect(() => {
    setState("idle");
    setQuestions([]);
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setShowFeedback(false);
    setScore(0);
  }, [tutorResponse]);

  async function startCheck() {
    setState("loading");
    const snapshot = tutorResponse; // capture to detect stale responses
    try {
      const controller = new AbortController();
      const res = await fetch("/api/ai/tutor/knowledge-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, topic, tutorResponse }),
        signal: controller.signal,
      });
      // If tutorResponse changed while loading, discard result
      if (snapshot !== tutorResponse) return;
      if (!res.ok) {
        setState("idle");
        return;
      }
      const data = (await res.json()) as { questions: KCQuestion[] };
      if (!data.questions || data.questions.length < 3) {
        setState("idle");
        return;
      }
      setQuestions(data.questions);
      setCurrentQ(0);
      setAnswers([]);
      setSelected(null);
      setShowFeedback(false);
      setState("answering");
    } catch {
      setState("idle");
    }
  }

  function handleSelect(optIdx: number) {
    if (showFeedback) return;
    setSelected(optIdx);
    setShowFeedback(true);
  }

  function handleNext() {
    const newAnswers = [...answers, selected ?? -1];
    setAnswers(newAnswers);

    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowFeedback(false);
    } else {
      // Compute score
      const finalScore = newAnswers.reduce((acc, a, i) => {
        return acc + (a === questions[i]?.correctIndex ? 1 : 0);
      }, 0);
      setScore(finalScore);
      setState("complete");

      // Fire-and-forget submit
      fetch("/api/ai/tutor/knowledge-check?action=submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          course,
          topic,
          questions,
          answers: newAnswers,
        }),
      }).catch(() => {});
    }
  }

  const q = questions[currentQ];

  if (state === "idle") {
    return (
      <div className="mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={startCheck}
          className="gap-2 text-xs border-blue-500/40 text-blue-500 hover:bg-blue-500/10 hover:text-blue-700 dark:text-blue-400"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Check your understanding
        </Button>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating questions…
      </div>
    );
  }

  if (state === "complete") {
    const messages: Record<number, string> = {
      3: "Perfect! You've mastered this concept.",
      2: "Good understanding — review the one you missed.",
      1: "Let's revisit this concept — try asking Sage a follow-up.",
      0: "Let's revisit this concept — try asking Sage a follow-up.",
    };
    const colors: Record<number, string> = {
      3: "text-emerald-700 dark:text-emerald-400",
      2: "text-blue-700 dark:text-blue-400",
      1: "text-amber-700 dark:text-amber-400",
      0: "text-red-700 dark:text-red-400",
    };
    return (
      <div className="mt-3 rounded-lg border border-border/40 bg-card p-4 space-y-2">
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-bold", colors[score])}>{score} / 3</span>
          <p className="text-sm text-muted-foreground">{messages[score]}</p>
        </div>
      </div>
    );
  }

  // answering state
  if (!q) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/40 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-blue-500 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Question {currentQ + 1} of {questions.length}
        </p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full",
                i < currentQ
                  ? "bg-blue-500"
                  : i === currentQ
                  ? "bg-blue-500"
                  : "bg-border/60"
              )}
            />
          ))}
        </div>
      </div>

      <p className="text-sm font-medium leading-relaxed">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === q.correctIndex;
          let optClass =
            "w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-colors";

          if (!showFeedback) {
            optClass += " border-border/40 hover:border-blue-500/40 hover:bg-blue-500/5";
          } else if (isCorrect) {
            optClass += " border-emerald-500/60 bg-emerald-500/10 text-emerald-300";
          } else if (isSelected && !isCorrect) {
            optClass += " border-red-500/60 bg-red-500/10 text-red-300";
          } else {
            optClass += " border-border/40 opacity-50";
          }

          return (
            <button key={idx} className={optClass} onClick={() => handleSelect(idx)}>
              <span className="flex items-center gap-2">
                {showFeedback && isCorrect && (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                )}
                {showFeedback && isSelected && !isCorrect && (
                  <XCircle className="h-3.5 w-3.5 text-red-700 dark:text-red-400 flex-shrink-0" />
                )}
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground italic">{q.explanation}</p>
          <Button size="sm" onClick={handleNext} className="text-xs h-7">
            {currentQ + 1 < questions.length ? "Next question" : "See results"}
          </Button>
        </div>
      )}
    </div>
  );
}

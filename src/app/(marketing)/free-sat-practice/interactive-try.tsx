"use client";

/**
 * No-signup "try a few questions first" experience (growth goal item 0, mirrors PL).
 * Duolingo A/B-validated: let a visitor feel a WIN before any signup. Attacks the
 * pre-question bounce at the source (the signup wall). Tutor-mode: answer →
 * immediate encouraging feedback + explanation → small win → convert.
 * Questions are passed from the server component (SSR'd → SEO-safe).
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

export interface TryQuestion {
  subject: string;
  stem: string;
  options: string[];
  correct: string; // letter, e.g. "C"
  explanation: string;
}

// Letter from index (A,B,C…) — robust regardless of option text.
const letterFor = (index: number) => String.fromCharCode(65 + index);

export function InteractiveTry({ questions }: { questions: TryQuestion[] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const answered = picked !== null;
  const isLast = idx === questions.length - 1;

  function choose(letter: string) {
    if (answered) return;
    setPicked(letter);
    if (letter === q.correct) setCorrectCount((c) => c + 1);
  }
  function next() {
    if (isLast) { setDone(true); return; }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <div className="text-4xl">🎉</div>
        <h2 className="text-2xl font-bold">You just answered {questions.length} real exam questions — no account needed.</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {correctCount === questions.length
            ? "And you got every one right — you're tracking ahead."
            : `You got ${correctCount} of ${questions.length}. That's a real start — and every one you missed is a point you'll bank for test day.`}
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Create a free account to save your progress and keep practicing — unlimited questions on your exam, with an explanation on every one.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/register?src=free_try&module=sat">
              Create my free account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setIdx(0); setPicked(null); setCorrectCount(0); setDone(false); }}>
            Try them again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{q.subject}</p>
        <p className="text-xs text-muted-foreground">Question {idx + 1} of {questions.length}</p>
      </div>

      <p className="font-semibold text-lg whitespace-pre-line">{q.stem}</p>

      <div className="space-y-2">
        {q.options.map((opt, oi) => {
          const letter = letterFor(oi);
          const isCorrect = letter === q.correct;
          const isPicked = picked === letter;
          let cls = "w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ";
          if (!answered) cls += "border-border/50 hover:border-primary/50 hover:bg-accent";
          else if (isCorrect) cls += "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
          else if (isPicked) cls += "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
          else cls += "border-border/30 opacity-60";
          return (
            <button key={opt} className={cls} onClick={() => choose(letter)} disabled={answered}>
              <span className="inline-flex items-center gap-2">
                {answered && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                {answered && isPicked && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="pt-2 space-y-3">
          <p className={`text-sm font-semibold ${picked === q.correct ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
            {picked === q.correct ? "Correct — nice." : `Not quite — the answer is ${q.correct}. No worries, this is how you learn it.`}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{q.explanation}</p>
          <Button onClick={next} className="gap-2">
            {isLast ? "See how you did" : "Next question"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!answered && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Pick an answer — you&apos;ll see why it&apos;s right immediately. No signup.
        </p>
      )}
    </div>
  );
}

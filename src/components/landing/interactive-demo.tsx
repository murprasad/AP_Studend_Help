"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// 2026-05-03 — CLEP question + AP/CLEP toggle removed. CLEP lives on
// PrepLion.ai now; StudentNest serves AP/SAT/ACT. The interactive demo
// shows ONE question (AP World History) — the canonical hero example.
const QUESTION = {
  label: "AP World History",
  unit: "MCQ · Unit 5: Revolutions",
  text: "Which of the following BEST explains why the French Revolution spread ideas of democracy across Europe?",
  options: [
    { id: "A", text: "The invention of the printing press" },
    { id: "B", text: "Napoleon's military campaigns" },
    { id: "C", text: "The Black Death epidemic" },
    { id: "D", text: "Trade routes along the Silk Road" },
  ],
  correct: "B",
  explanation:
    "Napoleon's military campaigns (1799–1815) carried Revolutionary ideals of liberty, equality, and nationalism into conquered territories across Europe. He spread the Napoleonic Code, abolished feudal privileges, and dismantled old aristocratic orders — directly exporting the political legacy of the Revolution far beyond France's borders.",
  wrongExplanation:
    "Not quite. The correct answer is B — Napoleon's military campaigns. While the printing press (A) spread ideas earlier, and trade routes (D) facilitated cultural exchange, neither directly spread Revolutionary democratic ideals. Napoleon's conquests explicitly carried the Revolutionary Code into Europe, abolishing feudal systems and installing democratic legal frameworks across conquered nations.",
  diagnostics: {
    A: "You're confusing media history with political diffusion.",
    C: "You're confusing demographic crisis with political revolution.",
    D: "You're confusing economic exchange with ideological export.",
  } as Record<string, string>,
  topicPattern: "Students who pick this miss 3+ more questions on Unit 5 before they recover.",
};

export function InteractiveDemo() {
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const answered = selected !== null && !checking;
  const isCorrect = selected === QUESTION.correct;

  function handleSelect(id: string) {
    if (selected !== null) return;
    userInteractedRef.current = true;
    setSelected(id);
    setChecking(true);
    setTimeout(() => setChecking(false), 650);
  }

  // Auto-pilot: if the visitor hasn't interacted within 2.5s, auto-click a wrong
  // answer so they SEE the tension state without doing anything. Killed at the
  // first user click. This is the load-bearing change that flips the demo from
  // "static product showcase" → "live mistake experience" per Beta 11.0.
  const userInteractedRef = useRef(false);
  useEffect(() => {
    if (selected !== null) return;
    const wrongOption = QUESTION.options.find((o) => o.id !== QUESTION.correct);
    if (!wrongOption) return;
    const timer = setTimeout(() => {
      if (userInteractedRef.current || selected !== null) return;
      setSelected(wrongOption.id);
      setChecking(true);
      setTimeout(() => setChecking(false), 650);
    }, 2500);
    return () => clearTimeout(timer);
  }, [selected]);

  return (
    <div data-testid="interactive-demo" className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-xl max-w-2xl mx-auto">
      {/* Window chrome — no track toggle (CLEP removed 2026-05-03) */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/40">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-muted-foreground">StudentNest · Practice</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground/70">{QUESTION.label}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Question */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            {QUESTION.unit}
          </p>
          <p className="text-sm font-medium text-foreground/90 leading-relaxed">
            {QUESTION.text}
          </p>
        </div>

        {/* Answer choices */}
        <div className="space-y-2">
          {QUESTION.options.map((opt) => {
            const isSelected = selected === opt.id;
            const isRightAnswer = opt.id === QUESTION.correct;

            let borderClass = "border-border/40 bg-secondary/30 hover:border-blue-500/40 hover:bg-blue-500/5 cursor-pointer";
            if (checking && isSelected) {
              borderClass = "border-blue-500/60 bg-blue-500/10 cursor-default animate-pulse";
            } else if (answered) {
              if (isRightAnswer) {
                borderClass = "border-emerald-500/60 bg-emerald-500/10 cursor-default";
              } else if (isSelected && !isRightAnswer) {
                borderClass = "border-red-500/60 bg-red-500/10 cursor-default";
              } else {
                // Drop opacity-50 — combined with text-foreground/90 it failed
                // WCAG AA (2.92:1 on light bg). Muted text on muted bg keeps
                // de-emphasis without breaking contrast.
                borderClass = "border-border/20 bg-secondary/10 text-muted-foreground cursor-default";
              }
            }

            return (
              <button
                key={opt.id}
                disabled={answered || checking}
                onClick={() => handleSelect(opt.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm ${borderClass}`}
              >
                <span className="font-mono font-semibold text-xs text-muted-foreground w-5 flex-shrink-0">
                  {opt.id}
                </span>
                <span className="flex-1 text-foreground/90">{opt.text}</span>
                {answered && isRightAnswer && (
                  <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                )}
                {answered && isSelected && !isRightAnswer && (
                  <XCircle className="h-4 w-4 text-red-700 dark:text-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Checking state — shows briefly between click and reveal */}
        {checking && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span className="inline-flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "240ms" }} />
            </span>
            <span>Checking your answer&hellip;</span>
          </div>
        )}

        {/* Tension banner — wrong-answer diagnostic + topic-pattern warning */}
        {answered && !isCorrect && (
          <div className="rounded-xl border-2 border-red-500/50 bg-red-500/10 p-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 leading-snug">
                  {QUESTION.diagnostics[selected!] ?? "That answer doesn't fit the question."}
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80 leading-relaxed">
                  {QUESTION.topicPattern}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sage explanation */}
        {answered && (
          <div
            className={`rounded-xl border p-4 text-sm space-y-2 ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/20">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-blue-500">
                {isCorrect ? "Correct! Sage explains:" : "Sage explains why:"}
              </span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-xs">
              {isCorrect ? QUESTION.explanation : QUESTION.wrongExplanation}
            </p>
          </div>
        )}

        {/* CTA after answering — outcome-based */}
        {answered && (
          <div className="pt-1">
            <Link href="/register?track=ap">
              <Button size="sm" className="gap-2 w-full">
                {isCorrect ? "Find what you don't know" : "Fix my weak areas"} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* Prompt before answering */}
        {!answered && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Click an answer to see Sage&apos;s explanation
          </p>
        )}
      </div>
    </div>
  );
}

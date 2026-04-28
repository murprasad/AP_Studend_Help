"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AP_QUESTION = {
  label: "AP World History",
  unit: "MCQ Â· Unit 5: Revolutions",
  text: "Which of the following BEST explains why the French Revolution spread ideas of democracy across Europe?",
  options: [
    { id: "A", text: "The invention of the printing press" },
    { id: "B", text: "Napoleon's military campaigns" },
    { id: "C", text: "The Black Death epidemic" },
    { id: "D", text: "Trade routes along the Silk Road" },
  ],
  correct: "B",
  explanation:
    "Napoleon's military campaigns (1799â€“1815) carried Revolutionary ideals of liberty, equality, and nationalism into conquered territories across Europe. He spread the Napoleonic Code, abolished feudal privileges, and dismantled old aristocratic orders â€” directly exporting the political legacy of the Revolution far beyond France's borders.",
  wrongExplanation:
    "Not quite. The correct answer is B â€” Napoleon's military campaigns. While the printing press (A) spread ideas earlier, and trade routes (D) facilitated cultural exchange, neither directly spread Revolutionary democratic ideals. Napoleon's conquests explicitly carried the Revolutionary Code into Europe, abolishing feudal systems and installing democratic legal frameworks across conquered nations.",
  track: "ap" as const,
};

const CLEP_QUESTION = {
  label: "CLEP College Algebra",
  unit: "MCQ Â· Unit 2: Equations & Inequalities",
  text: "If 2x + 7 = 15, what is the value of x?",
  options: [
    { id: "A", text: "3" },
    { id: "B", text: "4" },
    { id: "C", text: "5" },
    { id: "D", text: "8" },
  ],
  correct: "B",
  explanation:
    "Subtract 7 from both sides: 2x = 8. Then divide both sides by 2: x = 4. This is a fundamental linear equation â€” mastering these is essential for the CLEP College Algebra exam, where they appear in both standalone and word-problem formats.",
  wrongExplanation:
    "Not quite. The correct answer is B â€” x = 4. To solve 2x + 7 = 15, subtract 7 from both sides to get 2x = 8, then divide by 2 to get x = 4. Always isolate the variable step-by-step.",
  track: "clep" as const,
};

export function InteractiveDemo() {
  const [activeTrack, setActiveTrack] = useState<"ap" | "clep">("ap");
  const [selected, setSelected] = useState<string | null>(null);

  const QUESTION = activeTrack === "clep" ? CLEP_QUESTION : AP_QUESTION;
  const answered = selected !== null;
  const isCorrect = selected === QUESTION.correct;
  const accentColor = activeTrack === "clep" ? "emerald" : "indigo";

  function switchTrack(track: "ap" | "clep") {
    if (track === activeTrack) return;
    setActiveTrack(track);
    setSelected(null);
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-xl max-w-2xl mx-auto">
      {/* Window chrome with track toggle */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/40">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-2 text-xs text-muted-foreground">StudentNest Â· Practice</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => switchTrack("ap")}
            className={`text-xs px-4 py-2 rounded-full min-h-[44px] transition-colors ${
              activeTrack === "ap"
                ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            AP
          </button>
          <button
            onClick={() => switchTrack("clep")}
            className={`text-xs px-4 py-2 rounded-full min-h-[44px] transition-colors ${
              activeTrack === "clep"
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            CLEP
          </button>
        </div>
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

            let borderClass = `border-border/40 bg-secondary/30 hover:border-${accentColor}-500/40 hover:bg-${accentColor}-500/5 cursor-pointer`;
            if (answered) {
              if (isRightAnswer) {
                borderClass = "border-emerald-500/60 bg-emerald-500/10 cursor-default";
              } else if (isSelected && !isRightAnswer) {
                borderClass = "border-red-500/60 bg-red-500/10 cursor-default";
              } else {
                // Drop opacity-50 â€” combined with text-foreground/90 it failed
                // WCAG AA (2.92:1 on light bg). Muted text on muted bg keeps
                // de-emphasis without breaking contrast.
                borderClass = "border-border/20 bg-secondary/10 text-muted-foreground cursor-default";
              }
            }

            return (
              <button
                key={opt.id}
                disabled={answered}
                onClick={() => setSelected(opt.id)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm ${borderClass}`}
              >
                <span className="font-mono font-semibold text-xs text-muted-foreground w-5 flex-shrink-0">
                  {opt.id}
                </span>
                <span className="flex-1 text-foreground/90">{opt.text}</span>
                {answered && isRightAnswer && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                )}
                {answered && isSelected && !isRightAnswer && (
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sage explanation (shown after answer) */}
        {answered && (
          <div
            className={`rounded-xl border p-4 text-sm space-y-2 ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                activeTrack === "clep" ? "bg-emerald-500/20" : "bg-blue-500/20"
              }`}>
                <Sparkles className={`h-3.5 w-3.5 ${activeTrack === "clep" ? "text-emerald-400" : "text-blue-500"}`} />
              </div>
              <span className={`text-xs font-semibold ${activeTrack === "clep" ? "text-emerald-400" : "text-blue-500"}`}>
                {isCorrect ? "Correct! Sage explains:" : "Sage explains:"}
              </span>
            </div>
            <p className="text-foreground/80 leading-relaxed text-xs">
              {isCorrect ? QUESTION.explanation : QUESTION.wrongExplanation}
            </p>
          </div>
        )}

        {/* CTA after answering */}
        {answered && (
          <div className="pt-1">
            <Link href={`/register?track=${activeTrack}`}>
              <Button size="sm" className={`gap-2 w-full ${
                activeTrack === "clep" ? "bg-emerald-700 hover:bg-emerald-800" : ""
              }`}>
                Want 10 more questions like this? Start free <ArrowRight className="h-4 w-4" />
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

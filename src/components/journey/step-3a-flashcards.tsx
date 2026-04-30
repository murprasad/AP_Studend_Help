"use client";

/**
 * Step 3a — Flashcard micro-step (Beta 9.6).
 *
 * Inserted between transition 3→4 (score reveal) and Step 4 (targeted
 * MCQs). Shows 2-3 flashcards from the user's weakest unit (already
 * known from Step 3). Tap-to-flip front→back, "Got it" to advance.
 * Auto-completes after the last card. Total ~30s.
 *
 * Per user spec: "Quick memory boost before practice" — light touch,
 * not a separate feature, just a micro-step.
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Eye, Check } from "lucide-react";
import { QuestionContent } from "@/components/question/question-content";

interface Card {
  id: string;
  front: string;
  back: string;
  unit?: string;
  topic?: string;
  concept?: string;
}

interface Props {
  course: string;
  weakestUnit?: string | null;
  onComplete: () => void;
}

export function Step3aFlashcards({ course, onComplete, weakestUnit }: Props) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = weakestUnit
      ? `/api/flashcards?course=${course}&unit=${weakestUnit}`
      : `/api/flashcards?course=${course}`;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const all: Card[] = Array.isArray(d?.cards) ? d.cards : [];
        // Take first 3
        setCards(all.slice(0, 3));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course, weakestUnit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No flashcards available for this course/unit — skip the step gracefully
  if (cards.length === 0) {
    return (
      <div className="text-center pt-12 space-y-3">
        <p className="text-sm text-muted-foreground">No flashcards seeded for this course yet — skipping.</p>
        <Button onClick={onComplete} className="rounded-full gap-2">
          Continue to practice
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const card = cards[idx];

  const advance = () => {
    if (idx + 1 >= cards.length) {
      onComplete();
      return;
    }
    setIdx(idx + 1);
    setFlipped(false);
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-5">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Memory boost
        </p>
        <p className="text-base font-semibold mt-1">
          Quick recall before practice — {idx + 1} of {cards.length}
        </p>
      </div>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-8 min-h-[260px] flex flex-col justify-center text-center cursor-pointer hover:border-blue-500/50 transition-colors"
      >
        {!flipped ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400 mb-2">
              Front
            </p>
            <div className="text-base leading-relaxed">
              <QuestionContent content={card.front} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 inline-flex items-center gap-1 justify-center">
              <Eye className="h-3.5 w-3.5" /> Tap to reveal
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
              Back
            </p>
            <div className="text-base leading-relaxed">
              <QuestionContent content={card.back} />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={advance}
          disabled={!flipped}
          className="rounded-full gap-2"
        >
          {flipped ? (
            <>
              <Check className="h-4 w-4" />
              {idx + 1 >= cards.length ? "Continue to practice" : "Got it — next card"}
            </>
          ) : (
            "Reveal back first"
          )}
          {flipped && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

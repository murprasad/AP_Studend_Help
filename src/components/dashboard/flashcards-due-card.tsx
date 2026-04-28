"use client";

/**
 * FlashcardsDueCard — dashboard block surfacing the flashcard review
 * queue. Motivated by 2026-04-23 engagement data: the /flashcards page
 * shipped with 1500 seeded cards but users don't know to go look. This
 * block pulls them in with a single sentence + one CTA.
 *
 * Renders null when:
 *   - fetch fails (don't clutter the dashboard on errors)
 *   - due count is below a minimum threshold (don't bug users with
 *     "1 card due" — not worth the interruption)
 *
 * Estimated time is a rough heuristic: 20s per card. Ceiling at 10 min
 * since the batch endpoint caps at 10 cards anyway.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, ArrowRight } from "lucide-react";

interface Props {
  course: string;
}

interface CountResponse {
  count: number;
  due?: number;
  new?: number;
}

const MIN_TO_SHOW = 5;
const SECONDS_PER_CARD = 20;

export function FlashcardsDueCard({ course }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    fetch(`/api/flashcards/due-count?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CountResponse | null) => { if (!cancelled && d) setCount(d.count); })
      .catch(() => { /* silent — the block hides on error */ });
    return () => { cancelled = true; };
  }, [course]);

  if (count === null || count < MIN_TO_SHOW) return null;

  const minutes = Math.min(10, Math.ceil((count * SECONDS_PER_CARD) / 60));
  const label = count >= 50 ? "50+" : String(count);

  return (
    <Card className="rounded-[16px] border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
      <CardContent className="p-4 sm:p-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5 text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-tight">
            <span className="tabular-nums">{label}</span> cards ready for review
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Spaced repetition · about {minutes} min
          </p>
        </div>
        <Link href="/flashcards">
          <Button size="sm" className="rounded-full h-9 px-4 bg-amber-500 text-white hover:bg-amber-600">
            Review <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

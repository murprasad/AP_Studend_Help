"use client";

/**
 * MicroWinCard — the retention-loop "quick fix" card.
 *
 * Fetches /api/micro-win. If the user has zero past-wrong MCQs in the
 * last 14 days, the component returns null (the card is hidden entirely
 * rather than showing an empty state — per the plan's "no empty cards"
 * rule). Otherwise renders a tiny secondary card with a single small
 * button that routes to /practice?mode=quick&retry=true.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface Props {
  course: string;
}

export function MicroWinCard({ course }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/micro-win?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && typeof d.count === "number") setCount(d.count);
      })
      .catch(() => { /* silent — component returns null on error */ });
    return () => { cancelled = true; };
  }, [course]);

  // Hide entirely when no past mistakes (the card has no empty state).
  if (count === null || count === 0) return null;

  const label = count === 1 ? "Fix 1 mistake (1 min)" : `Fix ${Math.min(count, 5)} mistakes (1–5 min)`;
  const sub = count === 1
    ? "Boost accuracy. You missed this one recently."
    : `${count} past misses to retry. Quick accuracy boost.`;

  return (
    <Card className="rounded-[16px] border-border/40">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-tight">{label}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <Link href={`/practice?mode=quick&retry=true&course=${course}`} className="flex-shrink-0">
            <Button size="sm" variant="outline" className="h-9">
              Start
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

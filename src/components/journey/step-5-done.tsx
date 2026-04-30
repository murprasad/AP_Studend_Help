"use client";

/**
 * Step 5 — Done / cap reached (Beta 9.5).
 *
 * Final screen when the user finishes all 4 active steps in a day.
 * Frames the cap as a completed plan, not a "limit hit" wall. CTA:
 *   1. Upgrade — primary
 *   2. Come back tomorrow — secondary (returns to dashboard)
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, ArrowRight } from "lucide-react";

interface Props {
  predictedScore: number | null;
  course: string;
  weakestUnitName: string | null;
}

export function Step5Done({ predictedScore, weakestUnitName }: Props) {
  return (
    <div className="pt-12 pb-8 max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold">You completed today&apos;s plan</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Great work — you walked the same arc real AP students walk in their first study session.
        </p>
      </div>

      {predictedScore !== null && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Your projected AP score
          </p>
          <p className="text-7xl font-bold text-blue-700 dark:text-blue-400 leading-none">
            {predictedScore}
          </p>
          <p className="text-xs text-muted-foreground mt-2">out of 5</p>
          {weakestUnitName && (
            <p className="text-sm text-muted-foreground mt-3">
              Biggest gap: <span className="font-medium text-foreground">{weakestUnitName}</span>
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Crown className="h-6 w-6 text-amber-700 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-base font-semibold">Keep the momentum — upgrade to Premium</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              $9.99/mo unlocks unlimited practice + every FRQ + AI rubric grading on your essays.
              One subscription covers AP, SAT, ACT.
            </p>
          </div>
        </div>
        <Link href="/billing?utm_source=journey_done&utm_campaign=journey_v95" className="block">
          <Button size="lg" className="w-full rounded-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            Upgrade — $9.99/mo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="text-center">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Or come back tomorrow →
        </Link>
      </div>
    </div>
  );
}

"use client";

/**
 * Step 5 — "You're set up" (Beta 10 redesign — 2026-05-01).
 *
 * Per brutal critique 2026-05-01: the previous "subtle upgrade text link"
 * undersold the conversion moment. Promoted Premium to a co-equal third
 * tile with the actual price visible. ChatGPT's "3 clear options" spec:
 *   1. Continue free practice (FREE)
 *   2. Explore tools (Flashcards / Sage)
 *   3. Unlock full prep (PREMIUM, $9.99/mo)
 *
 * The closure moment matters most for conversion — students should leave
 * the journey with a clear menu, not a forced default.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getExamCopy } from "@/lib/exam-copy";
import {
  Trophy, Check, ArrowRight, Brain, Sparkles, BarChart3, Crown,
} from "lucide-react";

interface Props {
  predictedScore: number | null;
  course: string;
  weakestUnitName: string | null;
}

export function Step5Done({ predictedScore, weakestUnitName, course }: Props) {
  // 2026-05-28 Sprint A5 — exam-family-aware copy. Was hardcoded "AP" /
  // "FRQ" / "/5" which made every SAT/ACT student see the wrong words.
  const copy = getExamCopy(course);
  const checklist = [
    "Practiced real questions",
    ...(copy.hasFreeResponse ? ["Tried an FRQ + saw the rubric"] : []),
    predictedScore !== null
      ? `Got your ${copy.projectedScoreLabel}: ${predictedScore}${copy.scoreSuffix}${weakestUnitName ? ` · weakest unit ${weakestUnitName}` : ""}`
      : `Got your ${copy.projectedScoreLabel}`,
  ];
  return (
    <div className="pt-10 pb-12 max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold">You&apos;re set up</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          You completed your first {copy.examName} session.
        </p>
      </div>

      {/* Two-or-three ✓ summary — FRQ line conditional on whether the exam family has free-response */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2.5">
        {checklist.map((line, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
            </div>
            <p className="text-sm leading-relaxed">{line}</p>
          </div>
        ))}
      </div>

      {/* 2026-06-10 — ONE dominant next action (was 3 co-equal tiles = a
          decision dead-stop, the #1 activation leak per funnel analysis:
          54% never reach a question). Mirrors PL. Winning apps auto-continue
          into a winnable set, not a choose-your-own-adventure menu. */}
      <div className="space-y-3">
        <Button
          asChild
          className="w-full h-auto py-4 px-4 justify-center gap-2 text-base bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="journey-done-continue"
        >
          <Link href="/dashboard?focus=primary-action&src=journey_done">
            <Brain className="h-5 w-5" />
            {weakestUnitName ? `Keep practicing — drill ${weakestUnitName}` : "Keep practicing"}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <Link href="/dashboard?focus=flashcards&src=journey_done" className="hover:text-foreground inline-flex items-center gap-1" data-testid="journey-done-tools">
            <BarChart3 className="h-3 w-3" /> Explore tools
          </Link>
          <Link href="/ai-tutor?src=journey_done" className="hover:text-foreground inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Ask Sage
          </Link>
          <Link href="/billing?utm_source=journey_done&utm_campaign=step5_tile" className="hover:text-foreground inline-flex items-center gap-1" data-testid="journey-done-upgrade">
            <Crown className="h-3 w-3" /> Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}


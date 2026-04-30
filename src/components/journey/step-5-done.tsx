"use client";

/**
 * Step 5 — "You're set up" (Beta 9.6 redesign).
 *
 * Per user spec: replace "Come back tomorrow" wall with a guided exit
 * to the dashboard. Three checkmarks summarize what they did, three
 * tiles route to the dashboard with focus= so the matching feature is
 * highlighted (scroll-and-pulse). Premium upgrade is a subtle link
 * underneath, not a competing CTA.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Trophy, Check, ArrowRight, Brain, Sparkles, BarChart3,
} from "lucide-react";

interface Props {
  predictedScore: number | null;
  course: string;
  weakestUnitName: string | null;
}

export function Step5Done({ predictedScore, weakestUnitName }: Props) {
  return (
    <div className="pt-10 pb-12 max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold">You&apos;re set up</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          You completed your first AP session.
        </p>
      </div>

      {/* Three ✓ summary */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2.5">
        {[
          "Practiced real questions",
          "Tried an FRQ + saw the rubric",
          predictedScore !== null
            ? `Got your projected AP score: ${predictedScore}/5${weakestUnitName ? ` · weakest unit ${weakestUnitName}` : ""}`
            : "Got your projected AP score",
        ].map((line, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
            </div>
            <p className="text-sm leading-relaxed">{line}</p>
          </div>
        ))}
      </div>

      {/* Three next-step tiles — each routes to dashboard with focus=*/}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-1">
          What to do next
        </p>
        <NextTile
          icon={<Brain className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
          title="Continue practice tomorrow"
          subtitle="Pick up your daily plan + drill weakest units."
          href="/dashboard?focus=primary-action"
        />
        <NextTile
          icon={<BarChart3 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
          title="Review flashcards"
          subtitle="Spaced repetition on the concepts you just saw."
          href="/dashboard?focus=flashcards"
        />
        <NextTile
          icon={<Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />}
          title="Ask Sage for help"
          subtitle="Stuck on a concept? Sage explains anything in 30 seconds."
          href="/ai-tutor"
        />
      </div>

      {/* Subtle upgrade link below — not a competing CTA */}
      <div className="text-center pt-2">
        <Link
          href="/billing?utm_source=journey_done&utm_campaign=v96"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Or unlock unlimited everything — Premium $9.99/mo →
        </Link>
      </div>
    </div>
  );
}

function NextTile({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
}) {
  // Beta 9.6.2 (2026-04-30) — fix nav-loop bug. Previous markup was
  // <Link><Button>...</Button></Link> which renders <a><button>…</button></a>.
  // That's invalid HTML (button-in-anchor); browsers handle it inconsistently
  // and some block the <a>'s default navigation when the inner button is
  // clicked. Result: clicking a Step 5 tile did nothing on some browsers.
  // Use shadcn's `asChild` pattern instead — Button renders as the Link's
  // root <a>, so the click reliably navigates.
  return (
    <Button
      asChild
      variant="outline"
      className="w-full h-auto py-3 px-4 justify-start gap-3 border-border/40 hover:bg-accent"
    >
      <Link href={href}>
        <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug whitespace-normal">
            {subtitle}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </Link>
    </Button>
  );
}

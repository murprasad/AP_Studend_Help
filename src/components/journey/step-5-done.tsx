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
import {
  Trophy, Check, ArrowRight, Brain, Sparkles, BarChart3, Crown,
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

      {/* Three co-equal next-step tiles — Continue / Tools / Upgrade */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-1">
          What to do next — pick one
        </p>
        <NextTile
          icon={<Brain className="h-5 w-5 text-blue-700 dark:text-blue-400" />}
          title="Continue free practice"
          subtitle={weakestUnitName ? `Drill ${weakestUnitName} — your weakest unit.` : "Pick up your daily plan + drill weakest units."}
          href="/dashboard?focus=primary-action&src=journey_done"
        />
        <NextTile
          icon={<BarChart3 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />}
          title="Explore tools"
          subtitle="Flashcards, Sage tutor, study plan — all free."
          href="/dashboard?focus=flashcards&src=journey_done"
        />
        {/* 2026-05-01 — promote upgrade from subtle text link to a co-equal
            tinted tile so the price is visible at the conversion moment.
            Previous version hid $9.99 under "or unlock unlimited everything"
            small grey text — undersold the offer. */}
        <UpgradeTile />
      </div>

      {/* Demoted Sage shortcut as a small link — keeps it accessible without
          competing with the three primary tiles. */}
      <div className="text-center pt-1">
        <Link
          href="/ai-tutor?src=journey_done"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Or ask Sage a question first
        </Link>
      </div>
    </div>
  );
}

function UpgradeTile() {
  return (
    <Button
      asChild
      className="w-full h-auto py-3 px-4 justify-start gap-3 border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 hover:from-amber-500/25 hover:via-yellow-500/20 hover:to-amber-500/10 text-foreground"
    >
      <Link href="/billing?utm_source=journey_done&utm_campaign=step5_tile">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold leading-tight">
            Unlock full prep — <span className="text-amber-700 dark:text-amber-400">$9.99/mo</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug whitespace-normal">
            Unlimited daily practice · line-by-line FRQ coaching · Sage Coach.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
      </Link>
    </Button>
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


"use client";

/**
 * LockedInsightOverlay — wraps advanced diagnostic content and blurs it for
 * free users, with a "Start 7-day free trial" CTA sitting on top.
 *
 * This is the paywall moment. FREE users see:
 *   - Their overall predicted score (revealed, headline)
 *   - Blurred: weak units, strong units, per-unit breakdown, recommendation
 *   - A single CTA: "Start 7-day free trial to unlock"
 *
 * Premium users (any tier) see the content plainly — the overlay renders as
 * a transparent pass-through.
 *
 * The blur itself is intentionally legible enough that the user can tell
 * there IS content behind it — that's the tension point. If we returned
 * `null` for free users, they wouldn't know what they're missing.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";

interface Props {
  locked: boolean;
  children: React.ReactNode;
  course?: string;
}

export function LockedInsightOverlay({ locked, children, course }: Props) {
  if (!locked) return <>{children}</>;

  const trialHref = course
    ? `/billing?utm_source=diagnostic&utm_campaign=trial_unlock&course=${course}`
    : `/billing?utm_source=diagnostic&utm_campaign=trial_unlock`;

  return (
    <div className="relative">
      {/* The content is rendered but visually obscured. We set aria-hidden
          so screen readers skip it — the CTA below describes what's gated. */}
      <div className="pointer-events-none select-none blur-md opacity-60" aria-hidden>
        {children}
      </div>

      {/* Overlay CTA — sits absolute center. max-w keeps it readable on
          wide screens; sticks to content width on mobile. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="max-w-sm mx-auto rounded-2xl border border-amber-300 dark:border-amber-700 bg-card shadow-xl p-5 text-center">
          <div className="mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-950 p-2.5 w-fit">
            <Lock className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-base mb-1">
            Unlock your full breakdown
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            See which units are closing your score gap, and get a week-by-week
            pass plan tailored to your answers.
          </p>
          <Link href={trialHref}>
            <Button size="lg" className="w-full gap-2 h-11">
              <Sparkles className="h-4 w-4" />
              Start 7-Day Free Trial
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground mt-2">
            Cancel anytime · No card charged during trial
          </p>
        </div>
      </div>
    </div>
  );
}

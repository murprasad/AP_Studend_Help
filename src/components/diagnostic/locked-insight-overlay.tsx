"use client";

/**
 * LockedInsightOverlay — the diagnostic paywall moment.
 *
 * The feedback review (2026-04-22) called this out as the single highest-
 * leverage conversion lever. The previous version was correct in structure
 * but too passive — a neutral amber card the user could close without
 * consequence. This revision makes the CTA unmissable and ties the
 * unlock directly to the student's predicted-score gap so the tension
 * is EMOTIONAL not transactional.
 *
 * Props now include `predictedScore` + `passingScore` so the headline
 * can read something like "Predicted 2 — need 3 to pass" and the button
 * reinforces the same language. When the props are absent (older
 * consumers), we fall back to generic copy.
 *
 * Premium users pass through unchanged.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, ArrowRight } from "lucide-react";

interface Props {
  locked: boolean;
  children: React.ReactNode;
  course?: string;
  /** Student's predicted score on this exam (AP 1-5, SAT 400-1600, ACT 1-36). */
  predictedScore?: number;
  /** Passing / college-ready threshold for the exam. AP=3, SAT=1200, ACT=24. */
  passingScore?: number;
  /** Human label for the exam family: "AP", "SAT", or "ACT". */
  family?: "AP" | "SAT" | "ACT";
}

export function LockedInsightOverlay({
  locked,
  children,
  course,
  predictedScore,
  passingScore,
  family,
}: Props) {
  if (!locked) return <>{children}</>;

  const trialHref = course
    ? `/billing?utm_source=diagnostic&utm_campaign=trial_unlock&course=${course}`
    : `/billing?utm_source=diagnostic&utm_campaign=trial_unlock`;

  // Is the student below passing? That drives the severity of the
  // visual treatment — below-passing gets a red alarm, at-or-above
  // gets a supportive blue.
  const belowPassing =
    typeof predictedScore === "number" &&
    typeof passingScore === "number" &&
    predictedScore < passingScore;

  const gapCopy = (() => {
    if (typeof predictedScore !== "number" || typeof passingScore !== "number") {
      return "Unlock your full breakdown";
    }
    if (predictedScore >= passingScore) {
      return `You're projected at ${predictedScore} — unlock your path to a higher score`;
    }
    // Below passing — strongest tension
    if (family === "AP") {
      return `Predicted ${predictedScore} — need ${passingScore} to pass`;
    }
    if (family === "SAT") {
      return `Predicted ${predictedScore} — need ${passingScore}+ for college-ready`;
    }
    if (family === "ACT") {
      return `Predicted ${predictedScore} — need ${passingScore}+ for college-ready`;
    }
    return `Predicted ${predictedScore} — need ${passingScore} to pass`;
  })();

  // Colors swap based on severity.
  const cardBorder = belowPassing
    ? "border-red-500/60 dark:border-red-600/70"
    : "border-blue-500/40 dark:border-blue-600/60";
  const cardBg = belowPassing
    ? "bg-gradient-to-br from-red-500/10 via-card to-amber-500/10"
    : "bg-gradient-to-br from-blue-500/10 via-card to-emerald-500/5";
  const iconBg = belowPassing ? "bg-red-500/20" : "bg-blue-500/20";
  const iconColor = belowPassing ? "text-red-500" : "text-blue-500";
  const ctaClass = belowPassing
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const ctaLabel = belowPassing
    ? "Unlock My Pass Plan"
    : "Unlock Full Breakdown";

  return (
    <div className="relative">
      {/* The content is rendered but visually obscured. aria-hidden so
          screen readers skip the blurred copy — the CTA below names
          what's gated. */}
      <div className="pointer-events-none select-none blur-md opacity-50" aria-hidden>
        {children}
      </div>

      {/* Overlay CTA — maximum visibility. Bigger card, bigger headline,
          bigger button. Severity-driven color. */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div
          className={`max-w-md w-full mx-auto rounded-2xl border-2 shadow-2xl p-6 text-center ${cardBorder} ${cardBg}`}
          role="dialog"
          aria-label="Upgrade to unlock full diagnostic breakdown"
        >
          <div className={`mx-auto mb-3 rounded-full ${iconBg} p-3 w-fit`}>
            <Lock className={`h-6 w-6 ${iconColor}`} />
          </div>

          {/* Gap headline — the emotional tension */}
          <h3 className="font-bold text-lg mb-1 leading-tight">
            {gapCopy}
          </h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            {belowPassing
              ? "Your full breakdown shows the exact units dragging your score down — plus the 7-day plan that closes the gap."
              : "See which units are still holding you back + a week-by-week plan to push higher."}
          </p>

          <Link href={trialHref} className="block">
            <Button
              size="lg"
              className={`w-full gap-2 h-12 text-base font-semibold shadow-lg ${ctaClass}`}
            >
              <TrendingUp className="h-4 w-4" />
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground mt-2.5">
            7-day free trial · No card charged · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

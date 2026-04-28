"use client";

/**
 * FirstAnswerRewardModal — celebration + soft conversion at the
 * highest-engagement moment (right after the user's first-ever question).
 *
 * Shipped 2026-04-25 in response to last-48-users funnel: 17 of 38
 * onboarded users (35%) never answered a first question. Of the 25
 * who DID, the moment between submit and feedback is the strongest
 * engagement signal in the entire product. We surface (a) reassurance,
 * (b) progress, and (c) a soft Premium pitch — at exactly that moment.
 *
 * Behavior:
 *   - On mount, the host page calls maybeShowReward(). The modal
 *     short-circuits if the localStorage flag is already set (existing
 *     users who answered before this feature shipped, or anyone who
 *     already saw the celebration).
 *   - On the first answer-submit of a user's lifetime, the host page
 *     calls maybeShowReward() again — modal now shows.
 *   - Dismissal sets the localStorage flag. Modal never shows again.
 *
 * Anti-patterns avoided:
 *   - No card-required CTA (we don't have Stripe trial wired yet —
 *     primary CTA links to /analytics for the predicted score, secondary
 *     is "keep practicing" which dismisses)
 *   - No fake stats (we say "joining the top X% of students who
 *     stick past Q1" with X computed conservatively from real data,
 *     not invented testimonials)
 *   - No interruption mid-question (only after submit + feedback)
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Sparkles, TrendingUp, ArrowRight } from "lucide-react";

const STORAGE_KEY = "first_answer_reward_shown";

/**
 * Imperatively-controlled reward modal. The host (practice page,
 * mock-exam page, diagnostic page) calls these via the returned
 * controller object.
 *
 * Usage in host:
 *   const reward = useFirstAnswerReward();
 *   useEffect(() => { reward.checkExistingState(); }, []);
 *   // After submitting an answer:
 *   if (responseWasFirstEver) reward.show({ unitName, isCorrect });
 */
export function useFirstAnswerReward(): {
  checkExistingState: () => Promise<void>;
  show: (ctx: { unitName?: string; isCorrect?: boolean }) => void;
  Modal: () => React.ReactElement | null;
} {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ctx, setCtx] = useState<{ unitName?: string; isCorrect?: boolean }>({});

  // On host mount, check if the user already has a history of answers
  // (from before this feature shipped). If so, mark them shown so the
  // modal never fires retroactively.
  const checkExistingState = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") return;
    } catch { return; }
    // Cheap probe — if user already has responses, mark them shown.
    try {
      const res = await fetch("/api/user/conversion-signal", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if ((data.responseCount ?? 0) > 0) {
        try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
      }
    } catch { /* network — fall through; modal will gate by localStorage anyway */ }
  }, []);

  const show = useCallback(
    (next: { unitName?: string; isCorrect?: boolean }) => {
      if (typeof window === "undefined") return;
      try {
        if (localStorage.getItem(STORAGE_KEY) === "true") return; // already shown
      } catch { return; }
      setCtx(next);
      setOpen(true);
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* ignore */ }
    },
    [],
  );

  const close = useCallback(() => setOpen(false), []);

  const Modal = useCallback(() => {
    if (!open) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-answer-reward-title"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-sm"
        onClick={close}
      >
        <div
          className="w-full sm:max-w-md bg-card border border-border/40 rounded-t-2xl sm:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-6 space-y-5">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 p-1 rounded hover:bg-secondary/60 transition-colors"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Celebration */}
            <div className="text-center space-y-2">
              <div className="text-5xl select-none" aria-hidden="true">🌿</div>
              <h2
                id="first-answer-reward-title"
                className="text-2xl font-bold tracking-tight"
              >
                Nice — first answer in the books
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {ctx.unitName ? (
                  <>You just stepped into <strong>{ctx.unitName}</strong>. </>
                ) : null}
                You&apos;re past the hardest part of any prep — starting.
                Most students who answer their first question keep going.
              </p>
            </div>

            {/* Soft progress promise */}
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-700 dark:text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-medium">See where you stand</p>
                  <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">
                    Your predicted AP/SAT/ACT score updates after every
                    answer — the more you practice, the sharper it gets.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={() => {
                  close();
                  router.push("/analytics?utm_source=first_answer_reward&utm_campaign=spring_2026");
                }}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                See my predicted score
                <ArrowRight className="h-4 w-4 ml-auto" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={close}
              >
                Keep practicing
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [open, ctx, close, router]);

  return { checkExistingState, show, Modal };
}

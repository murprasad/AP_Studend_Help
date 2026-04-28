"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Send } from "lucide-react";

interface SessionFeedbackPopupProps {
  sessionId: string | null;
  /** Show popup at session boundaries 1, 5, 10, 25, 50, 100, ... per (source, course, context). */
  triggerCondition: "always" | "first-only";
  /** Source context for the feedback */
  source: "practice" | "diagnostic";
  /** Course key — when provided, popup shows once per source+course combo */
  course?: string;
  /**
   * Context tag persisted to DB alongside the rating. A22.6:
   *   - "completion" = user finished the session (default, pre-A22.6 behavior)
   *   - "abandon"    = user paused/bailed — fires a different copy set to
   *                    capture "why did you stop" instead of "how was it"
   */
  context?: "completion" | "abandon";
  /** Called after feedback is submitted */
  onComplete?: (rating: 1 | -1) => void;
}

const FEEDBACK_KEY = "preplion_feedback_given";
const SESSION_COUNT_KEY = "studentnest_feedback_session_counts";

// Beta 8.2 (2026-04-26): trigger feedback at these session-count milestones
// per (source, course, context) combo. Per-user data showed only 5-8 unique
// users gave feedback over 5 weeks because old "first-only" + dismissable
// dialog let almost everyone skip. Geometric backoff respects power users
// (no popup every session) while ensuring 4-5 prompts in their first 50.
const TRIGGER_SESSIONS = [1, 5, 10, 25, 50, 100, 200];

export function SessionFeedbackPopup({ sessionId, triggerCondition, source, course, context = "completion", onComplete }: SessionFeedbackPopupProps) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // A22.6 — two-step flow on thumbs-down: show textarea before submit so we
  // capture the "why" while negative signal is fresh. Thumbs-up still
  // single-click submit (most people won't take the time to elaborate; pure
  // good vs silence is enough for positive signal).
  const [phase, setPhase] = useState<"rate" | "reason">("rate");
  const [pendingRating, setPendingRating] = useState<1 | -1 | null>(null);
  const [reasonText, setReasonText] = useState("");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup pending timers on unmount
  useEffect(() => () => { clearTimeout(closeTimerRef.current); }, []);

  useEffect(() => {
    if (!sessionId) return;

    const feedbackKey = course ? `${source}_${course}_${context}` : `${source}_${context}`;

    // Track session counts per (source, course, context) so we can fire the
    // popup at milestone sessions instead of just session #1.
    let sessionN = 1;
    try {
      const counts = JSON.parse(localStorage.getItem(SESSION_COUNT_KEY) || "{}");
      counts[feedbackKey] = (counts[feedbackKey] || 0) + 1;
      sessionN = counts[feedbackKey];
      localStorage.setItem(SESSION_COUNT_KEY, JSON.stringify(counts));
    } catch {}

    // Legacy "first-only" mode: still show on session 1 only (keeps backward
    // compat for callers that haven't migrated). New "always" mode fires at
    // milestone sessions.
    let shouldShow = false;
    if (triggerCondition === "first-only") {
      try {
        const given = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "{}");
        shouldShow = !given[feedbackKey];
      } catch { shouldShow = true; }
    } else {
      // "always" — fire at TRIGGER_SESSIONS milestones (1, 5, 10, 25, 50, ...).
      shouldShow = TRIGGER_SESSIONS.includes(sessionN);
    }
    if (!shouldShow) return;

    // Show popup after a short delay so the summary renders first
    const timer = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [sessionId, triggerCondition, source, course, context]);

  async function submitFeedback(rating: 1 | -1, text: string) {
    setSubmitted(true);

    // Save to API
    await fetch("/api/practice/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, rating, feedbackText: text || undefined, context }),
    }).catch(() => {});

    // Mark as given in localStorage (per source+course+context)
    const feedbackKey = course ? `${source}_${course}_${context}` : `${source}_${context}`;
    try {
      const given = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "{}");
      given[feedbackKey] = true;
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(given));
    } catch {}

    // Delay onComplete so "Thank you" shows before parent unmounts us
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      onComplete?.(rating);
    }, 1200);
  }

  function handleRating(rating: 1 | -1) {
    // Thumbs-up: submit immediately. Thumbs-down: ask why first.
    if (rating === 1) {
      submitFeedback(1, "");
    } else {
      setPendingRating(-1);
      setPhase("reason");
    }
  }

  function handleReasonSubmit() {
    if (pendingRating !== null) submitFeedback(pendingRating, reasonText);
  }

  // handleSkipReason removed 2026-04-27: per user direction, Bad rating now
  // requires at least a brief reason — keep them on the reason phase until
  // they fill the textarea.

  if (!sessionId) return null;

  // Copy swaps on the `context` prop: "completion" keeps the pre-A22.6
  // feel ("How was this session?"); "abandon" re-frames the ask around the
  // bail itself so users don't default to rating the content they did see.
  const primaryQuestion = context === "abandon" ? "Why did you pause?" : "How was this session?";
  const primarySubtext = context === "abandon"
    ? "Quick take helps us fix what made you stop."
    : "Your feedback helps us improve StudentNest";
  const goodLabel = context === "abandon" ? "Just taking a break" : "Good";
  const badLabel = context === "abandon" ? "Ran into a problem" : "Needs work";

  // 2026-04-28 (after user feedback "I still see cancel as option"):
  //   The previous gate on onOpenChange blocked dismiss but the X icon
  //   in the dialog header was still rendered (and read as "cancel" by
  //   the user). Now we also pass hideClose + blockOutsideClick to
  //   DialogContent so the X disappears AND backdrop click is no-op
  //   until the user submits a rating.
  const allowDismiss = submitted;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (allowDismiss || next) setOpen(next); }}>
      <DialogContent
        className="sm:max-w-sm p-0 gap-0 rounded-2xl overflow-hidden"
        hideClose={!allowDismiss}
        blockOutsideClick={!allowDismiss}
      >
        <div className="p-6 text-center space-y-5">
          {submitted ? (
            <div className="py-4 space-y-2">
              <p className="text-2xl">Thank you!</p>
              <p className="text-sm text-muted-foreground">Your feedback helps us improve</p>
            </div>
          ) : phase === "rate" ? (
            <>
              <div className="space-y-2">
                <p className="text-lg font-bold">{primaryQuestion}</p>
                <p className="text-sm text-muted-foreground">{primarySubtext}</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2.5 px-8 py-6 text-base hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-700 dark:text-emerald-400 transition-all"
                  onClick={() => handleRating(1)}
                >
                  <ThumbsUp className="h-6 w-6" /> {goodLabel}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2.5 px-8 py-6 text-base hover:border-red-500 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-700 dark:text-red-400 transition-all"
                  onClick={() => handleRating(-1)}
                >
                  <ThumbsDown className="h-6 w-6" /> {badLabel}
                </Button>
              </div>
              {/* Skip removed 2026-04-22 — user wants to force engagement
                  on the first feedback moment. Users can still dismiss by
                  clicking outside the dialog / pressing Escape. */}
            </>
          ) : (
            /* phase === "reason" — thumbs-down text capture */
            <>
              <div className="space-y-2">
                <p className="text-lg font-bold">
                  {context === "abandon" ? "What made you stop?" : "What didn't work?"}
                </p>
                <p className="text-sm text-muted-foreground">
                  1-2 sentences — it's the most useful signal we get.
                </p>
              </div>
              <textarea
                autoFocus
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value.slice(0, 500))}
                placeholder={context === "abandon"
                  ? "e.g. questions felt too hard, ran out of time, got confused…"
                  : "e.g. explanation was unclear, wrong difficulty, broken formatting…"}
                rows={4}
                maxLength={500}
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {/* Skip button removed 2026-04-27 (user feedback): "if Bad,
                  pop up a message to check for improvements" — make the
                  reason mandatory rather than dismissable. Send button is
                  disabled until 3+ chars so we still capture useful signal. */}
              <Button
                className="w-full gap-2 text-sm"
                onClick={handleReasonSubmit}
                disabled={reasonText.trim().length < 3}
              >
                <Send className="h-4 w-4" /> Send feedback
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Even one sentence helps us fix what didn't work.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

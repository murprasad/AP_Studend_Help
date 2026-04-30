"use client";

/**
 * Exit-intent feedback modal — Beta 9.6 (2026-04-30).
 *
 * Shown when a user clicks "Exit" in the JourneyShell. Captures one
 * preloaded reason (radio) + optional free-text. POSTs to
 * /api/journey {action:"exit", reason, feedback} which records on the
 * UserJourney row (exitReason, exitFeedback, exitAt).
 *
 * The modal can be skipped — clicking "Skip" still calls exit (no
 * feedback). Closing the dialog also calls exit.
 */

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the API write completes — typically pushes /dashboard. */
  onExited: () => void;
}

const REASONS: Array<{ value: string; label: string }> = [
  { value: "too_long", label: "Too long" },
  { value: "didnt_help", label: "Didn't help" },
  { value: "not_what_i_need", label: "Not what I need right now" },
  { value: "too_hard", label: "Questions too hard" },
  { value: "too_easy", label: "Questions too easy" },
  { value: "other", label: "Other" },
];

export function ExitIntentModal({ open, onOpenChange, onExited }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exit",
          reason: reason ?? null,
          feedback: feedback.trim() || null,
        }),
      });
    } catch { /* fire-and-forget — exit succeeds even if API errors */ }
    setSubmitting(false);
    onOpenChange(false);
    onExited();
  };

  const skip = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "exit" }),
      });
    } catch { /* ignore */ }
    setSubmitting(false);
    onOpenChange(false);
    onExited();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 gap-3">
        <button
          type="button"
          onClick={skip}
          className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-accent z-10"
          aria-label="Close and skip feedback"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-1">
          <h2 className="text-lg font-bold leading-tight">Before you go — what&apos;s missing?</h2>
          <p className="text-xs text-muted-foreground">
            Helps us improve. One sentence is enough.
          </p>
        </div>

        <div className="space-y-2 mt-1">
          {REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                reason === r.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border/40 hover:bg-accent"
              }`}
            >
              <input
                type="radio"
                name="exit-reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="sr-only"
              />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional — anything else?"
          rows={2}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-border/40 bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex items-center gap-2 mt-1">
          <Button
            size="sm"
            onClick={submit}
            disabled={submitting || (!reason && !feedback.trim())}
            className="flex-1"
          >
            {submitting ? "Saving…" : "Send + exit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={skip}
            disabled={submitting}
          >
            Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

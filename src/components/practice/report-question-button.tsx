"use client";

/**
 * "Report this question" button + modal.
 *
 * Companion to POST /api/questions/[id]/report (which auto-quarantines a
 * question when 3 distinct users report it). Provides students a way to
 * flag semantic errors the deterministic gates can't catch — wrong
 * answers, contradictory explanations, ambiguous stems, etc.
 *
 * Per the user feedback (E. Papouti hit 3 letter-mismatch bugs in his warmup
 * 2026-05-21), this closes the loop: students who hit a bug can flag it in
 * one click, and after 3 flags it's pulled from circulation automatically.
 *
 * Renders as an unobtrusive text-button under the explanation. Click opens
 * a small modal with reason dropdown + optional details textarea.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

interface Props {
  questionId: string;
}

const REASONS = [
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "wrong_explanation", label: "Explanation contradicts the answer" },
  { value: "typo_or_unclear", label: "Typo or unclear question" },
  { value: "off_topic", label: "Off-topic for this exam" },
  { value: "duplicate", label: "Duplicate question" },
  { value: "other", label: "Other" },
] as const;

export function ReportQuestionButton({ questionId }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(questionId)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details: details.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Couldn't submit report",
          description: data?.error ?? "Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      toast({
        title: data?.autoQuarantined ? "Thanks — question removed" : "Thanks — we'll review this",
        description: data?.autoQuarantined
          ? "This question won't be served again. Reported by 3+ users — auto-removed."
          : "We log every report. After three flags a question is auto-removed from circulation.",
      });
      setOpen(false);
      // Reset for next time
      setTimeout(() => { setSubmitted(false); setReason(""); setDetails(""); }, 500);
    } catch {
      toast({ title: "Network error", description: "Try again in a moment.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-amber-300/60 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors mt-3"
        data-testid="report-question-trigger"
        disabled={submitted}
      >
        <Flag className="h-4 w-4" />
        {submitted ? "Reported — thanks!" : "🚩 Report a problem with this question"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report this question</DialogTitle>
            <DialogDescription>
              Help us catch bad questions. After 3 reports a question is automatically removed from circulation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-reason">What's wrong?</Label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="report-question-reason"
              >
                <option value="">Pick a reason…</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-details">Details (optional)</Label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g., The explanation says 'C is correct' but B is highlighted as correct."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                maxLength={500}
                data-testid="report-question-details"
              />
              <p className="text-xs text-muted-foreground">{details.length}/500</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason || submitting}
              data-testid="report-question-submit"
            >
              {submitting ? "Submitting…" : "Submit report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

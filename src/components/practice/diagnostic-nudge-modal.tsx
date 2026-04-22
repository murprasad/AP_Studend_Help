"use client";

/**
 * DiagnosticNudgeModal — the "see your predicted AP score" interruption.
 *
 * Mounts inside the practice flow. After each correct/wrong answer submit,
 * the parent calls `checkAndShow()` which fetches `/api/user/conversion-signal`.
 * If the user has crossed a threshold (5 or 10 lifetime responses) AND has
 * no diagnostic result yet AND hasn't dismissed the modal today, we open it.
 *
 * Framing is reward-based: "You've answered N questions. Want to see your
 * predicted score?" — not a barrier, not a warning. User's feedback was
 * explicit: this should feel like unlocking a benefit, not friction.
 *
 * One-impression-per-day cap prevents the modal from becoming annoying —
 * stored in localStorage keyed by date, so if a user skips today they see
 * it again tomorrow.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, TrendingUp } from "lucide-react";

const STORAGE_KEY = "diagnostic_nudge_last_shown";
const THRESHOLDS = [5, 10] as const;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function wasShownToday(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === todayKey();
  } catch {
    return false;
  }
}

function markShownToday(): void {
  try {
    localStorage.setItem(STORAGE_KEY, todayKey());
  } catch {
    /* ignore */
  }
}

interface Props {
  course: string;
}

export function DiagnosticNudgeModal({ course }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [responseCount, setResponseCount] = useState<number>(0);
  // Ref so the parent can call `checkAndShow` without recreating the modal.
  const lastFiredForCountRef = useRef<number | null>(null);

  const checkAndShow = useCallback(async () => {
    if (wasShownToday()) return;
    try {
      const res = await fetch("/api/user/conversion-signal", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        responseCount: number;
        hasDiagnostic: boolean;
        hasTrial: boolean;
      };
      if (data.hasDiagnostic) return; // already took it
      const hitThreshold = THRESHOLDS.includes(data.responseCount as 5 | 10);
      if (!hitThreshold) return;
      if (lastFiredForCountRef.current === data.responseCount) return;
      lastFiredForCountRef.current = data.responseCount;
      setResponseCount(data.responseCount);
      setOpen(true);
    } catch {
      /* silent — this is a nudge, not critical */
    }
  }, []);

  // Expose the method on window so the practice page can call it without
  // prop-drilling through 400 lines of render code. Documented escape hatch.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__preplion_checkDiagnosticNudge = checkAndShow;
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__preplion_checkDiagnosticNudge;
    };
  }, [checkAndShow]);

  const onAccept = () => {
    markShownToday();
    setOpen(false);
    router.push(`/diagnostic?course=${course}&nudged=1`);
  };

  const onDismiss = () => {
    markShownToday();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onDismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-amber-100 dark:bg-amber-950 p-3">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Want to see your predicted AP score?
          </DialogTitle>
          <DialogDescription className="text-center pt-1">
            You've answered <strong>{responseCount} question{responseCount === 1 ? "" : "s"}</strong>.
            A 10-minute diagnostic reveals your current score range and
            the units closing the gap between you and a <strong>3+</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button onClick={onAccept} className="flex-1 h-11" size="lg">
            <TrendingUp className="h-4 w-4 mr-2" />
            See My Score
          </Button>
          <Button onClick={onDismiss} variant="outline" className="flex-1 h-11" size="lg">
            Keep Practicing
          </Button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-2">
          10 minutes · unlocks a personalized pass plan
        </p>
      </DialogContent>
    </Dialog>
  );
}

"use client";

/**
 * FrqMidSessionModal — Beta 9.3 (2026-04-29).
 *
 * Critical conversion fix: 97% of users today never see FRQ because the
 * existing FrqTasteNudge only fires on session-completion summary. Many
 * users bail before completing a full session.
 *
 * This modal interrupts the MCQ flow AFTER Q3 with a single CTA to try
 * a real FRQ. No alternatives. The "this is real AP" moment moves
 * earlier in the funnel where engagement is highest, not later where
 * fatigue + bail rate sets in.
 *
 * Triggers:
 *   - User has answered exactly 3 MCQs in their current session
 *   - User has 0 prior FRQ attempts in this course
 *   - Modal hasn't been shown for this (user, course) pair before
 *
 * Behavior:
 *   - Modal blocks the next-question prompt
 *   - Primary CTA: "Try 1 FRQ" → routes to /frq-practice with first_taste
 *   - Secondary: "Continue MCQs" — respect autonomy, don't force
 *   - Either way: localStorage flag prevents re-fire for this course
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  course: string;
  onContinue: () => void;
}

const STORAGE_KEY_PREFIX = "frq_mid_session_shown_v1::";

export function shouldShowFrqMidSession(course: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY_PREFIX + course) !== "true";
  } catch {
    return false;
  }
}

export function markFrqMidSessionShown(course: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + course, "true");
  } catch { /* ignore */ }
}

export function FrqMidSessionModal({ open, course, onContinue }: Props) {
  const router = useRouter();

  const tryFrq = () => {
    markFrqMidSessionShown(course);
    router.push(`/frq-practice?course=${course}&first_taste=1&src=mid_session_q3`);
  };

  const dismiss = () => {
    markFrqMidSessionShown(course);
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="rounded-full bg-blue-500/15 p-3">
              <ScrollText className="h-6 w-6 text-blue-700 dark:text-blue-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            You&apos;ve tried practice — now try a real AP question
          </DialogTitle>
          <DialogDescription className="text-center pt-1 leading-relaxed">
            MCQs warm you up. The AP exam itself is graded on written answers (FRQs).
            See exactly how the official rubric scores yours — your free first attempt.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={tryFrq} size="lg" className="w-full h-11 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ScrollText className="h-4 w-4" />
            Try 1 FRQ
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
          <Button onClick={dismiss} variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground">
            Continue MCQs
          </Button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-2">
          ~3 minutes · graded against the official College Board rubric
        </p>
      </DialogContent>
    </Dialog>
  );
}

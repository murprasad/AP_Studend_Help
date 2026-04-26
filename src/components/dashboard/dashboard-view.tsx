"use client";

/**
 * DashboardView — Dashboard v2 collapse (2026-04-22).
 *
 * Reviewer feedback: "too many messages → decision paralysis." Collapsed
 * 9 cards to 5 blocks, each answering ONE question for the student.
 *
 *   0. MasteryTierUpCard     — celebration overlay (renders null when no tier-up)
 *   1. Resume OR Start       — ResumeCard (when in-progress), else PrimaryActionStrip
 *                              (one CTA, not two — PrimaryActionStrip returns null
 *                              when inProgressSession exists)
 *   2. OutcomeProgressStrip  — predicted native-scale score + accuracy delta
 *   3. WeaknessFocusCard     — "Fix this unit" — the fastest path to improve
 *   4. DailyGoalCard         — today's goal + streak
 *   5. LockedValueCard       — contextual paywall with price + "Send to parent"
 *
 * Intentionally removed from main dashboard:
 *   - MicroWinCard       → retention nudge was cluttering; can re-add as
 *                          secondary link inside WeaknessFocusCard later.
 *   - PathProgression    → moved off main dashboard (future /progress route).
 *   - InviteParentCard   → superseded by LockedValueCard.
 *   - CLEPUpsellCard     → cross-sell didn't belong on main prep dashboard.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/use-course";
import { MasteryTierUpCard } from "@/components/dashboard/mastery-tier-up-card";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { PrimaryActionStrip } from "@/components/dashboard/primary-action-strip";
import { OutcomeProgressStrip } from "@/components/dashboard/outcome-progress-strip";
import { WeaknessFocusCard } from "@/components/dashboard/weakness-focus-card";
import { SageCoachPromoCard } from "@/components/dashboard/sage-coach-promo-card";
import { CramModeCard } from "@/components/dashboard/cram-mode-card";
import { DailyStudyOSCard } from "@/components/dashboard/daily-study-os-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { LockedValueCard } from "@/components/dashboard/locked-value-card";
import { AutoLaunchNudge } from "@/components/dashboard/auto-launch-nudge";
import { FlashcardsDueCard } from "@/components/dashboard/flashcards-due-card";

function DashboardSkeleton() {
  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2 animate-pulse">
      <div className="rounded-[20px] border border-border/30 bg-secondary/10 p-6">
        <div className="h-5 w-48 bg-secondary/40 rounded mb-3" />
        <div className="h-4 w-64 bg-secondary/30 rounded mb-4" />
        <div className="h-12 w-full bg-primary/20 rounded-xl" />
      </div>
      <div className="rounded-[16px] border border-border/30 bg-secondary/10 p-5 space-y-2">
        <div className="h-6 w-40 bg-secondary/40 rounded" />
        <div className="h-2 w-full bg-secondary/30 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardView() {
  const { status } = useSession();
  const router = useRouter();
  const [course] = useCourse();
  const [impressionId, setImpressionId] = useState<string | null>(null);

  // Fire one `loaded` POST per (user, course) pair.
  //
  // The previous version raced: `useCourse()` returns the default
  // `AP_WORLD_HISTORY` on first render, then flips to the selected course
  // once localStorage is read. Both values ran through this effect back-to-
  // back, creating two impression rows within 10ms and clobbering
  // `impressionId` mid-flight. Downstream `coach_requested` then never
  // fired because `PrimaryActionStrip` saw `impressionId=null` for most of
  // its lifetime. Funnel ran 0/67 for 24h until this fix.
  //
  // Guard with a ref of courses we've already fired for, plus a 120ms
  // debounce so the default→selected transition settles into a single
  // `loaded` event.
  const loadedForCoursesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!course) return;
    if (loadedForCoursesRef.current.has(course as string)) return;

    const t = setTimeout(() => {
      loadedForCoursesRef.current.add(course as string);
      setImpressionId(null);
      fetch("/api/analytics/dashboard-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, event: "loaded" }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.impressionId) {
            setImpressionId(d.impressionId);
          } else {
            // Fallback so downstream funnel events still fire with a client-
            // side stamp. Flagged with prefix so we can filter in reports.
            const synthetic = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            setImpressionId(synthetic);
          }
        })
        .catch(() => {
          const synthetic = `client_err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          setImpressionId(synthetic);
        });
    }, 120);

    return () => clearTimeout(t);
  }, [course, status]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <DashboardSkeleton />;

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2">
      {/* Nawal-pattern nudge — renders null unless user has 2+ dashboard
          views today AND zero questions answered today. One-shot modal
          offering a 3-Q warmup so dashboard-staring converts to action. */}
      <AutoLaunchNudge course={course as string} />

      {/* 0. Celebration — renders null when no unread tier-up */}
      <MasteryTierUpCard />

      {/* 1a. Resume — renders only when in-progress session exists */}
      <ResumeCard course={course as string} />

      {/* 1b. Start — renders null when ResumeCard would show. One CTA, not two. */}
      <PrimaryActionStrip course={course as string} impressionId={impressionId} />

      {/* 1c. Phase C (Beta 8.3) — Cram Mode countdown + today's plan.
          Renders ONLY when User.examDate is set AND <30 days out. Placed
          high in the stack because urgency demands attention. Mode 3
          per docs/requirements-mode-switching.md. */}
      <CramModeCard course={course as string} />

      {/* 1d. Phase D (Beta 8.3) — Daily Study OS. Adaptive plan based on
          yesterday's performance. Hides when CramModeCard renders (Cram
          takes precedence). Standard mode for non-cram-window users —
          Mode 1 + Mode 2 in the time-aware framework. */}
      <DailyStudyOSCard course={course as string} />

      {/* 2. Predicted native-scale score + delta */}
      <OutcomeProgressStrip course={course as string} />

      {/* 3. Fastest path to improve — single weakest unit */}
      <WeaknessFocusCard course={course as string} />

      {/* 3a. Phase B (Beta 8.3) — Sage Coach FRQ-grader promotion. Renders
          null if course has 0 FRQs OR free user (where it shows the
          paywalled variant inline). Placed right after the weakest-unit
          card because the user's natural next thought is "OK, how do I
          get help writing this answer?" — Sage Coach IS that help. */}
      <SageCoachPromoCard course={course as string} />

      {/* 3b. Flashcards queue — renders null when <5 cards due */}
      <FlashcardsDueCard course={course as string} />

      {/* 4. Daily goal — habit-formation loop. Renders null pre-signal. */}
      <DailyGoalCard course={course as string} />

      {/* 5. Contextual paywall — FREE users only. Parent-friendly. */}
      <LockedValueCard />
    </div>
  );
}

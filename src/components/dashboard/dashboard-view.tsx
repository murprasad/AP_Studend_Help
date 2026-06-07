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
import { getExamCopy } from "@/lib/exam-copy";
import { MasteryTierUpCard } from "@/components/dashboard/mastery-tier-up-card";
// 2026-05-28 PRD-passprob (mirror of PL — SN uses "Readiness" framing)
import { PassProbabilityHero } from "@/components/dashboard/pass-probability-hero";
import { TodaysSetCard } from "@/components/dashboard/todays-set-card";
import { SatSkillHeatmap } from "@/components/dashboard/sat-skill-heatmap";
import { ActivationGate, PreDiagnosticSuppress, PostDiagnosticSuppress } from "@/components/dashboard/activation-gate";
import { PassReadyCertGate } from "@/components/dashboard/pass-ready-cert-gate";
import { ResumeCard } from "@/components/dashboard/resume-card";
import { PrimaryActionStrip } from "@/components/dashboard/primary-action-strip";
import { OutcomeProgressStrip } from "@/components/dashboard/outcome-progress-strip";
import { WeaknessFocusCard } from "@/components/dashboard/weakness-focus-card";
import { SageCoachPromoCard } from "@/components/dashboard/sage-coach-promo-card";
import { CramModeCard } from "@/components/dashboard/cram-mode-card";
import { ExamDatePromptCard } from "@/components/dashboard/exam-date-prompt-card";
import { DailyStudyOSCard } from "@/components/dashboard/daily-study-os-card";
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card";
import { LockedValueCard } from "@/components/dashboard/locked-value-card";
import { AutoLaunchNudge } from "@/components/dashboard/auto-launch-nudge";
import { useDaysSinceOnboard } from "@/lib/use-new-user";
import { FlashcardsDueCard } from "@/components/dashboard/flashcards-due-card";
import { SingleQuestionEntry } from "@/components/dashboard/single-question-entry";
import { DiagnosticPromptCard } from "@/components/dashboard/diagnostic-prompt-card";
import { FocusFriendlyPromptCard } from "@/components/dashboard/focus-friendly-prompt-card";
import { GreetingCard } from "@/components/dashboard/greeting-card";
import { JourneyHeroCard } from "@/components/dashboard/journey-hero-card";
import { PostJourneyHero } from "@/components/dashboard/post-journey-hero";
import { useJourneyForcing } from "@/hooks/use-journey-forcing";
import type { ApCourse } from "@prisma/client";
import { useDashboardFocus } from "@/hooks/use-dashboard-focus";
import { useFocusPrefs } from "@/hooks/use-focus-prefs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Focus } from "lucide-react";
import { PassGuaranteeBadge } from "@/components/marketing/pass-guarantee-badge";

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

  return <DashboardBody course={course as string} impressionId={impressionId} />;
}

function DashboardBody({ course, impressionId }: { course: string; impressionId: string | null }) {
  const { data: sessionData } = useSession();
  // 2026-05-14 NurseHub Batch 2 — Pass Guarantee qualified banner. Renders
  // only when the eligibility cron has flipped User.passGuaranteeEligible.
  const passGuaranteeEligible = sessionData?.user?.passGuaranteeEligible === true;
  // Beta 9.3.3 (2026-04-30) — when JourneyHeroCard is forcing a single
  // next-step (any state except mature), suppress competing surfaces so
  // the brand-new user sees ONE welcome + ONE start, not 4 stacked
  // "warm up" / "try it" CTAs. Without this gate, dashboard-view rendered:
  //   GreetingCard + JourneyHero("Welcome — let's start") +
  //   PrimaryActionStrip("Warm up") + SingleQuestionEntry("TRY IT") +
  //   DiagnosticPrompt + OutcomeProgressStrip — duplicated welcome vibe.
  const { forcing, loading: journeyLoading, postJourney } = useJourneyForcing(course);
  const { prefs: focusPrefs } = useFocusPrefs();
  // 2026-06-01 — minimal post-onboarding dashboard for brand-new users.
  // < 24h: hide AutoLaunchNudge (they JUST did the journey warm-up).
  // < 3d: hide ExamDatePromptCard (don't ask for another form fill).
  // GreetingCard's upsell gates itself via useIsFirstWeekUser.
  const daysSinceOnboard = useDaysSinceOnboard();
  const isFreshlyOnboarded = daysSinceOnboard < 1;
  const isFirstWeek = daysSinceOnboard < 3;
  // Beta 9.6 — focus pulse when arriving from /journey "What to do next" tile
  useDashboardFocus();
  // Beta 9.7 — post-journey streamlined dashboard. For users who completed
  // the journey rail in the last 3 days, show ONE diagnostic-derived
  // hero card + 3 tools tiles (no buffet). Graduates to standard dashboard
  // after Day 3.
  const inPostJourney = postJourney?.active ?? false;

  // Beta 10 (2026-05-01) — when next_step_engine_enabled is on, the engine
  // computes the post-journey hero from actual user state (first_frq,
  // first_diagnostic, fix_weakest, etc.) — not just days-since-completed.
  // Skip the legacy PostJourneyHero branch in that case so the engine
  // owns the decision end-to-end.
  const [engineEnabled, setEngineEnabled] = useState<boolean>(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setEngineEnabled(Boolean(d?.flags?.nextStepEngineEnabled));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Beta 9.7 — Post-journey streamlined view (Day 0-3 after Step 5).
  // Replaces the buffet with ONE diagnostic-derived action + 3 tools.
  if (inPostJourney && postJourney && !engineEnabled) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2">
        <GreetingCard />
        <PostJourneyHero
          course={postJourney.course ?? (course as string)}
          weakestUnit={postJourney.weakestUnit}
          daysSinceCompleted={postJourney.daysSinceCompleted}
        />
        <DashboardSecondaryCards course={course as string} />
      </div>
    );
  }

  // Focus Mode — minimal one-action dashboard. The sidebar + all chrome are
  // already hidden by the layout; here we strip the dashboard to ONE next step
  // + a focused-session CTA. The top-right Focus pill restores Regular (full
  // sidebar + dashboard).
  if (focusPrefs.focusMode) {
    return (
      <div className="space-y-4 max-w-[640px] mx-auto py-2" data-testid="focus-dashboard">
        <GreetingCard />
        <PassProbabilityHero course={course as string} courseDisplayName={course as string} />
        <div data-focus-target="weakness"><WeaknessFocusCard course={course} /></div>
        <Link href="/practice" className="block">
          <Button className="w-full gap-2" size="lg">
            <Focus className="h-4 w-4" /> Start a focused session
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-0 sm:px-2 py-2">
      {/* 2026-05-14 NurseHub Batch 2 — Pass Guarantee qualifier banner.
          Renders only when the user has crossed the eligibility threshold
          (≥80% study plan + ≥3 mocks @≥75 + paid subscription). Tap routes
          to the claim flow (Batch 3). */}
      {passGuaranteeEligible && (
        <PassGuaranteeBadge variant="banner" examLabel={getExamCopy(course).examName} />
      )}

      {/* Beta 9.1.2 — personalized greeting + plan badge. */}
      <GreetingCard />

      {/* Beta 9.1.4 — JourneyHeroCard: ONE forced next-step CTA based on
          user's funnel state. Replaces the buffet of competing cards
          (Diagnostic prompt + Weakness focus + Daily plan + ...) for
          users mid-onboarding. Hides itself for mature users (cohort>14d
          AND hasDiagnostic) so the standard dashboard renders. Capped
          users always see the cap message regardless of journey stage. */}
      <JourneyHeroCard course={course as string} />

      {/* Nawal-pattern nudge — renders null unless user has 2+ dashboard
          views today AND zero questions answered today. One-shot modal
          offering a 3-Q warmup so dashboard-staring converts to action.
          2026-06-01 — hidden for brand-new (< 24h post-onboard) users
          since they JUST finished the journey's warm-up + diagnostic. */}
      {!isFreshlyOnboarded && <AutoLaunchNudge course={course as string} />}

      {/* 0. Celebration — renders null when no unread tier-up */}
      <MasteryTierUpCard />

      {/* 2026-05-28 PRD-passprob — SN Readiness hero + Today's Set CTA +
          Exam Ready cert gate. Default ON per goal "Implement all
          recommendation". Opt-out via NEXT_PUBLIC_PASS_PROB_LEGACY=true.
          Renders BEFORE existing CTAs; legacy CTAs remain so Pass Plan +
          Free users keep all existing affordances. */}
      {process.env.NEXT_PUBLIC_PASS_PROB_LEGACY !== "true" && (
        <>
          {/* 2026-06-01 Fix C — ActivationGate gates the readiness +
              heatmap cards behind 10+ responses. First-week users see a
              single focused "answer N more to unlock" CTA instead of the
              4-CTA traffic jam Yin (3-Q ACT_ENGLISH bouncer) hit. */}
          <ActivationGate course={course as string}>
            <PassProbabilityHero course={course as string} courseDisplayName={course as string} />
            <SatSkillHeatmap course={course as string} />
          </ActivationGate>
          {/* 2026-06-02 — suppress premature weak-area recs when user
              has no diagnostic. JourneyHeroCard at the top already
              pushes 'Take 10-min Diagnostic' as the single primary
              CTA. Showing 'Strengthen Geometry' on top of that for a
              4-Q-of-noisy-data user gave 3 conflicting next-step
              cards (user-reported task #14). */}
          <PreDiagnosticSuppress course={course as string}>
            <TodaysSetCard course={course as string} />
          </PreDiagnosticSuppress>
          <PassReadyCertGate
            course={course as string}
            courseDisplayName={course as string}
            studentName={(sessionData?.user as { firstName?: string; name?: string } | undefined)?.firstName ?? sessionData?.user?.name ?? "You"}
          />
        </>
      )}

      {/* 1a. Resume — renders only when in-progress session exists */}
      <ResumeCard course={course as string} />

      {/* 1b. Start — renders null when ResumeCard would show. One CTA, not two.
          Beta 9.3.3: also hidden when JourneyHeroCard is forcing (the journey
          card already supplies the start CTA — showing this strip too gave
          users 2 competing "Warm up / TRY IT" buttons). */}
      {/* 2026-06-02 — PrimaryActionStrip is suppressed POST-diagnostic.
          Once the user has a diagnostic, TodaysSetCard surfaces a
          specific weak-area CTA ('Start today's 10 in Algebra') with
          a clear reason. PrimaryActionStrip adds 3+ competing tool
          tiles (Flashcards/Sage/Mock Exam/Show more tools) which the
          user reported as "No clear action to improve the score."
          Suppressing post-diagnostic restores the single-CTA model.
          Pre-diagnostic, it still renders as the entry-point set. */}
      {!forcing && !journeyLoading && (
        <PostDiagnosticSuppress course={course as string}>
          <div data-focus-target="primary-action">
            <PrimaryActionStrip course={course} impressionId={impressionId} />
          </div>
        </PostDiagnosticSuppress>
      )}

      {/* 1b-Q1. Single-question entry — Q1 commitment fix (2026-04-27).
          Beta 9.3.3: hidden during journey-forcing for the same reason as
          PrimaryActionStrip. The JourneyHero "brand-new" state owns the
          first-question CTA for new users; this card returns once the user
          matures past the forcing gate. */}
      {!forcing && !journeyLoading && (
        <SingleQuestionEntry course={course} />
      )}

      {/* 1c-pre. (2026-05-01) — Exam-date prompt. Renders ONLY when the
          user hasn't set their exam date yet. Without this entry point,
          CramModeCard + DailyStudyOSCard's exam-aware behaviour stays
          dark for everyone. Disappears the moment a date is saved.
          2026-06-01 — also hidden for first-week (< 3 days post-onboard)
          users; adding a second form fill on day-0 dashboard kills flow. */}
      {!isFirstWeek && <ExamDatePromptCard course={course as ApCourse} />}

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

      {/* 1e. DiagnosticPromptCard — superseded by JourneyHeroCard at top
          of stack (Beta 9.1.4). The hero card now covers the
          "take a diagnostic" prompt as one of its journey states. Keeping
          this import as a fallback in case JourneyHero is hidden but a
          mature user's hasDiagnostic flag drifts. Renders null when user
          has taken diagnostic. */}
      <DiagnosticPromptCard course={course as string} />

      {/* 1f. Focus-friendly activation (2026-06-05) — one-tap opt-in for the
          ADHD/focus tools, which otherwise ship OFF and undiscoverable. Self-
          suppresses once actioned or if the student already enabled a focus
          tool. Placed below the diagnostic CTA so it never competes with the
          day-0 primary conversion. */}
      <FocusFriendlyPromptCard />

      {/* 2. Predicted native-scale score + delta — hide when new Readiness
            hero is rendering to avoid two stacked scaled-score widgets. */}
      {process.env.NEXT_PUBLIC_PASS_PROB_LEGACY === "true" && (
        <div data-focus-target="analytics">
          <OutcomeProgressStrip course={course as string} />
        </div>
      )}

      {/* Secondary cards collapsed behind "Show more" toggle.
          User-directed (2026-04-27): "reduce dashboard to ONE primary
          action." Default view shows Q1 + PrimaryActionStrip + Predicted
          Score only. Secondary cards (weakness, daily goal, flashcards,
          sage promo, paywall) are one click away — preserves the value
          for engaged users without overwhelming new sign-ups. */}
      <DashboardSecondaryCards course={course as string} />
    </div>
  );
}

function DashboardSecondaryCards({ course }: { course: string }) {
  // Beta 9.6 — auto-expand if user arrived with a focus target inside this
  // collapsed section. Otherwise scrollIntoView fails because the card is
  // hidden behind the "Show more" button.
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    const focus = new URLSearchParams(window.location.search).get("focus");
    return focus === "flashcards" || focus === "sage" || focus === "weakness" || focus === "daily-goal";
  });
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
      >
        Show more tools (weakness, goals, flashcards) →
      </button>
    );
  }
  return (
    <div className="space-y-4">
      <div data-focus-target="weakness"><WeaknessFocusCard course={course} /></div>
      <div data-focus-target="sage"><SageCoachPromoCard course={course} /></div>
      <div data-focus-target="flashcards"><FlashcardsDueCard course={course} /></div>
      <div data-focus-target="daily-goal"><DailyGoalCard course={course} /></div>
      <LockedValueCard />
      <button
        onClick={() => setExpanded(false)}
        className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1"
      >
        ↑ Hide tools
      </button>
    </div>
  );
}

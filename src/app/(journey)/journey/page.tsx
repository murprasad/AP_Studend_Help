"use client";

/**
 * /journey — Journey Mode orchestrator (Beta 9.5).
 *
 * Owns the 5-step rail state machine. Pulls /api/journey on mount,
 * routes to the correct step based on currentStep, and prefetches the
 * NEXT step's data in parallel with the current one to minimize
 * transition latency (per user's "do this in parallel" guidance).
 *
 * Step flow:
 *   0 — course pick
 *   1 — 3 MCQs (warm-up)            → transition: "Good start. Now try a real AP question."
 *   2 — 1 curated FRQ + reveal      → transition: "This is how AP is graded. See your projected score."
 *   3 — 5–10 Q diagnostic            → transition: score reveal + weak area
 *   4 — 5–10 targeted MCQs           → transition: completion + buffet unlock
 *   5 — done / upgrade screen
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { JourneyShell } from "@/components/journey/journey-shell";
import { Step0CoursePick } from "@/components/journey/step-0-course-pick";
import { Step1Mcq } from "@/components/journey/step-1-mcq";
import { Step2Frq } from "@/components/journey/step-2-frq";
import { Step3Diagnostic } from "@/components/journey/step-3-diagnostic";
import { Step3aFlashcards } from "@/components/journey/step-3a-flashcards";
import { Step5Done } from "@/components/journey/step-5-done";
import { TransitionCard } from "@/components/journey/transition-card";
import { COURSE_REGISTRY } from "@/lib/courses";
import { getExamCopy } from "@/lib/exam-copy";
import type { ApCourse } from "@prisma/client";

type Mode = "loading" | "step0" | "step1" | "trans12" | "step2" | "trans23" | "step3" | "trans34" | "step3a" | "step4" | "step5";

interface Journey {
  id: string;
  course: string;
  currentStep: number;
  weakestUnit: string | null;
}

interface FrqRow {
  id: string;
  course: string;
  unit: string | null;
  year: number | null;
  questionNumber: number | null;
  type: string;
  sourceUrl: string | null;
  promptText: string;
  stimulus: string | null;
  totalPoints: number | null;
}

// 2026-05-13 — mirror of useCourse's storage write path (src/hooks/use-course.ts).
// Kept inline rather than importing useCourse because this page already has its
// own course state machine driven by the user_journeys DB row; useCourse would
// fight it. We just need to sync the chosen course outward so /dashboard reads
// the right value when the journey finishes.
const COURSE_STORAGE_KEY = "ap_selected_course";
const COURSE_CHANGE_EVENT = "ap-course-change";
function writeCourseToBrowserStorage(course: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, course);
    document.cookie = `${COURSE_STORAGE_KEY}=${course}; path=/; max-age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent(COURSE_CHANGE_EVENT, { detail: course }));
  } catch { /* storage not available */ }
}

export default function JourneyPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { data: sessionData } = useSession();
  const [mode, setMode] = useState<Mode>("loading");
  // 2026-05-13 — Track-aware default. Saranya (Grade 11, AP track) was getting
  // silently defaulted to AP_CHEMISTRY because the previous hardcoded literal
  // looked like she had "chosen" it before Step 0 even rendered. She bounced
  // after 4 silent practice sessions in 80s, never answered a question.
  //
  // Now: derive default from user's track (ap→world history, sat→math,
  // act→math), but Step 0 still requires an explicit confirmation tap and
  // shows the pick UI rather than a pre-filled "Your course" card.
  const userTrack = sessionData?.user?.track ?? "ap";
  const trackDefault = userTrack === "sat" ? "SAT_MATH" : userTrack === "act" ? "ACT_MATH" : "AP_WORLD_HISTORY";
  const [course, setCourse] = useState<string>(trackDefault);
  const [weakestUnit, setWeakestUnit] = useState<string | null>(null);
  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [prefetchedFrq, setPrefetchedFrq] = useState<FrqRow | null>(null);
  // 2026-05-13 — true for never-started-or-exited users; tells Step 0 to
  // require an explicit pick instead of presenting a pre-filled "Your course"
  // card the user might tap through.
  const [mustPickCourse, setMustPickCourse] = useState<boolean>(true);
  const prefetchedRef = useRef<{ frq?: boolean }>({});

  // ── Boot: load journey state ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/journey", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const j: Journey | null = d?.journey ?? null;
        if (!j || j.currentStep === 99) {
          // No journey or user-exited — start at step 0, force explicit pick
          setMustPickCourse(true);
          setMode("step0");
          return;
        }
        setCourse(j.course);
        setMustPickCourse(false);
        // 2026-05-13 — sync course into localStorage + cookie so when the
        // journey finishes (or user navigates to /dashboard mid-flight), the
        // dashboard's useCourse hook sees the right course. Before this,
        // users completed the journey on AP X but landed on /dashboard
        // showing the default AP_WORLD_HISTORY and had to re-pick.
        writeCourseToBrowserStorage(j.course);
        setWeakestUnit(j.weakestUnit);
        // Resume at saved step (with transition for steps that need one)
        if (j.currentStep === 0) setMode("step0");
        else if (j.currentStep === 1) setMode("step1");
        else if (j.currentStep === 2) setMode("step2");
        else if (j.currentStep === 3) setMode("step3");
        else if (j.currentStep === 4) setMode("step4");
        else if (j.currentStep >= 5) setMode("step5");
      })
      .catch(() => {
        if (!cancelled) setMode("step0");
      });
    return () => { cancelled = true; };
  }, []);

  // ── API helper for advance/start ───────────────────────────────────────────
  const apiPost = useCallback(async (
    action: string,
    payload?: Record<string, unknown>,
  ) => {
    return fetch("/api/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
  }, []);

  // ── Beta 9.7.3 — JWT refresh on Step 5 (any path) ─────────────────────────
  // The 9.7.2 fix only refreshed the JWT inside handleStep4Done. If the user
  // ever lands on Step 5 via the boot resume path (currentStep>=5 in DB),
  // updateSession() never fires and middleware can bounce subsequent
  // /dashboard navigations back to /journey. Always refresh on step5 mount.
  // Idempotent — useSession().update() is cheap and trigger==="update" only
  // re-reads onboardingCompletedAt/track/subscriptionTier from DB.
  const sessionUpdatedRef = useRef(false);
  useEffect(() => {
    if (mode !== "step5" || sessionUpdatedRef.current) return;
    sessionUpdatedRef.current = true;
    (async () => {
      try { await updateSession(); } catch { /* non-fatal */ }
    })();
  }, [mode, updateSession]);

  // ── Auto-redirect to dashboard when step 5 is reached (trim 2026-05-28). ──
  // Replaces the Step5Done celebration screen. Brief delay lets the JWT
  // refresh land and middleware sees onboardingCompletedAt before /dashboard
  // does its own check. focus=primary-action makes dashboard scroll to the
  // primary CTA so the next click goes to practice.
  useEffect(() => {
    if (mode !== "step5") return;
    const t = setTimeout(() => {
      router.push("/dashboard?focus=primary-action&src=journey_done");
    }, 600);
    return () => clearTimeout(t);
  }, [mode, router]);

  // ── Prefetch step 2 FRQ when step 1 starts ─────────────────────────────────
  useEffect(() => {
    if (mode !== "step1" || prefetchedRef.current.frq) return;
    prefetchedRef.current.frq = true;
    fetch(`/api/frq?course=${course}&limit=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.frqs) && d.frqs.length > 0) {
          setPrefetchedFrq(d.frqs[0]);
        }
      })
      .catch(() => {});
  }, [mode, course]);

  // ── Step 0 → diagnostic (compressed flow, 2026-06-01) ────────────────────
  // 2026-06-01 — Compressed journey per user feedback. Previously: 7 screens
  // (course-pick → warm-up MCQs → trans → FRQ → trans → diagnostic → done)
  // for AP, 5 for SAT/ACT/PSAT. Compressed to:
  //   AP:        course-pick → diagnostic → FRQ → /dashboard       (4 steps)
  //   SAT/ACT/PSAT: course-pick → diagnostic → /dashboard          (3 steps)
  // Step 1 (warm-up) was 3 MCQs without diagnostic logic — folded into the
  // 9-Q diagnostic (which already touches all units). Transitions trans12 /
  // trans23 / trans34 dropped — they were single-button pages between
  // sessions that drove dropoff per real-user data (Abhipsa, ASNAP, Rithik).
  // Step 5 (done card) replaced by PostJourneyHero on the dashboard itself.
  const handleStart = useCallback(async (chosenCourse: string) => {
    setCourse(chosenCourse);
    writeCourseToBrowserStorage(chosenCourse);
    await apiPost("start", { course: chosenCourse });
    // Jump straight to step 3 (diagnostic). Skip step 1 (warm-up).
    await apiPost("advance", { step: 3 });
    setMode("step3");
  }, [apiPost]);

  // Legacy handler — only reachable for users mid-flight on the old FSM.
  // After 2026-06-01 deploy, step1 is never entered from step0; this just
  // routes anyone with currentStep === 1 in the DB to step 3 so they're not
  // stranded on a removed mode.
  const handleStep1Done = useCallback(async (artifact: { sessionId: string }) => {
    await apiPost("advance", { step: 3, artifactId: artifact.sessionId });
    setMode("step3");
  }, [apiPost]);

  // Legacy: trans12 → step 2 (FRQ). After compression, no fresh entrants.
  const handleTrans12 = () => setMode("step2");

  // ── Step 2 (FRQ) done → /dashboard ───────────────────────────────────────
  // 2026-06-01 — FRQ is the terminal screen for AP. After it completes,
  // mark journey complete and go to dashboard (the new PostJourneyHero
  // shows the projected score + weakest unit there).
  const handleStep2Done = useCallback(async (frqId: string) => {
    await apiPost("advance", { step: 5, artifactId: frqId });
    try { await updateSession(); } catch { /* non-fatal */ }
    router.push("/dashboard");
  }, [apiPost, updateSession, router]);

  // Legacy: trans23 — no fresh entrants after compression.
  const handleTrans23 = () => setMode("step3");

  // ── Step 3 (diagnostic) done → FRQ (AP) or /dashboard (non-AP) ───────────
  // 2026-06-01 — Branch on track. AP students need the FRQ as their final
  // step (it's the differentiator). Non-AP tracks have no FRQ; the
  // diagnostic IS the final step, redirect to dashboard immediately.
  const handleStep3Done = useCallback(async (out: {
    diagnosticId: string;
    weakestUnit: string | null;
    weakestUnitName: string | null;
    predictedScore: number | null;
  }) => {
    setWeakestUnit(out.weakestUnit);
    setPredictedScore(out.predictedScore);
    const hasFrq = getExamCopy(course).hasFreeResponse;
    if (hasFrq) {
      // AP: advance to step 2 (FRQ); the FRQ component will mark complete
      // when done.
      await apiPost("advance", {
        step: 2,
        artifactId: out.diagnosticId,
        weakestUnit: out.weakestUnit ?? undefined,
      });
      setMode("step2");
    } else {
      // SAT/ACT/PSAT: diagnostic is the terminal step.
      await apiPost("advance", {
        step: 5,
        artifactId: out.diagnosticId,
        weakestUnit: out.weakestUnit ?? undefined,
      });
      try { await updateSession(); } catch { /* non-fatal */ }
      router.push("/dashboard");
    }
  }, [apiPost, updateSession, course, router]);

  // Legacy handlers preserved for users with currentStep === 3a/4 mid-flight.
  const handleTrans34 = () => setMode("step3a");
  const handleStep3aDone = () => setMode("step4");

  // Legacy: step 4 (targeted MCQs) → /dashboard. Old FSM remnant; only
  // reachable for users mid-flight before the 2026-05-28 trim.
  const handleStep4Done = useCallback(async (artifact: { sessionId: string }) => {
    await apiPost("advance", { step: 5, artifactId: artifact.sessionId });
    try { await updateSession(); } catch { /* non-fatal */ }
    router.push("/dashboard");
  }, [apiPost, updateSession, router]);

  // ── Helper: pretty unit name ───────────────────────────────────────────────
  const courseConfig = COURSE_REGISTRY[course as ApCourse] ?? null;
  const weakestUnitName = (() => {
    if (!weakestUnit || !courseConfig) return null;
    // courseConfig.units is Partial<Record<ApUnit, UnitMeta>> — keyed lookup, not find()
    const unitMeta = courseConfig.units?.[weakestUnit as keyof typeof courseConfig.units];
    return unitMeta?.name ?? weakestUnit;
  })();

  // ── Render ─────────────────────────────────────────────────────────────────
  if (mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mode === "step0") {
    return (
      <JourneyShell step={0} totalSteps={5}>
        <Step0CoursePick defaultCourse={course} mustPick={mustPickCourse} onStart={handleStart} />
      </JourneyShell>
    );
  }

  if (mode === "step1") {
    return (
      <JourneyShell step={1} totalSteps={5} raw>
        <Step1Mcq
          course={course}
          questionCount={3}
          label="Step 1 · Warm-up"
          onComplete={handleStep1Done}
        />
      </JourneyShell>
    );
  }

  if (mode === "trans12") {
    const examName = getExamCopy(course).examName;
    return (
      <JourneyShell step={2} totalSteps={5}>
        <TransitionCard
          eyebrow="Good start"
          title={`Now try a real ${examName} question`}
          body={`One ${examName}-style FRQ. You'll see the official rubric and how ${examName} graders score it — the part most students never see.`}
          cta="Continue"
          tone="indigo"
          icon="scroll"
          onContinue={handleTrans12}
        />
      </JourneyShell>
    );
  }

  if (mode === "step2") {
    return (
      <JourneyShell step={2} totalSteps={5} raw>
        <div className="max-w-3xl mx-auto px-4">
          <Step2Frq course={course} prefetchedFrq={prefetchedFrq} onComplete={handleStep2Done} />
        </div>
      </JourneyShell>
    );
  }

  if (mode === "trans23") {
    const examName = getExamCopy(course).examName;
    return (
      <JourneyShell step={3} totalSteps={5}>
        <TransitionCard
          eyebrow={`Now estimate your ${examName} score`}
          title="A quick diagnostic — 5 minutes"
          body={`One question per unit. We'll show you a projected ${examName} score and the unit you should fix first.`}
          cta="Start diagnostic"
          tone="purple"
          icon="telescope"
          onContinue={handleTrans23}
        />
      </JourneyShell>
    );
  }

  if (mode === "step3") {
    return (
      <JourneyShell step={3} totalSteps={5} raw>
        <Step3Diagnostic course={course} onComplete={handleStep3Done} />
      </JourneyShell>
    );
  }

  if (mode === "trans34") {
    // Beta 9.6 — tightened copy per user spec: "You're at a 3.2 / Focus:
    // Unit 3 (weakest)". Score and weak unit on the same screen, no
    // dashboard chrome — that IS the analytics moment.
    return (
      <JourneyShell step={4} totalSteps={5}>
        <div className="pt-8 space-y-5">
          {predictedScore !== null && (
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                You&apos;re at a
              </p>
              <p className="text-7xl font-bold text-blue-700 dark:text-blue-400 leading-none">
                {predictedScore}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {/* 2026-05-28 Sprint A5 — exam-family-aware copy. Was hardcoded
                    "projected AP score · out of 5" which made SAT/ACT students
                    see "AP score 3/5" on the score reveal. */}
                {getExamCopy(course).projectedScoreLabel} · {getExamCopy(course).scoreSuffix.replace(/^\//, "out of ")}
              </p>
              {weakestUnitName && (
                <p className="text-sm mt-4 font-medium">
                  Focus: <span className="text-foreground">{weakestUnitName}</span> <span className="text-muted-foreground">(weakest)</span>
                </p>
              )}
            </div>
          )}
          <TransitionCard
            eyebrow="Here's how to improve"
            title={weakestUnitName ? `5 questions in ${weakestUnitName}` : "Targeted practice next"}
            body={weakestUnitName
              ? "These move your projected score the most. Plus a quick memory boost first."
              : "5 quick MCQs to lock in what you've learned. Plus a quick memory boost first."}
            cta="Continue"
            tone="emerald"
            icon="target"
            onContinue={handleTrans34}
          />
        </div>
      </JourneyShell>
    );
  }

  if (mode === "step3a") {
    // Beta 9.6 — flashcard micro-step (between trans34 reveal and step 4)
    return (
      <JourneyShell step={4} totalSteps={5} raw>
        <Step3aFlashcards
          course={course}
          weakestUnit={weakestUnit}
          onComplete={handleStep3aDone}
        />
      </JourneyShell>
    );
  }

  if (mode === "step4") {
    return (
      <JourneyShell step={4} totalSteps={5} raw>
        <Step1Mcq
          course={course}
          questionCount={5}
          unit={weakestUnit}
          label="Step 4 · Targeted practice"
          onComplete={handleStep4Done}
        />
      </JourneyShell>
    );
  }

  // step5 — auto-redirect to dashboard (trim 2026-05-28).
  // User feedback: "Celebration after a 9-Q diagnostic feels patronizing to a
  // Grade 11 student." Replaced Step5Done celebration with an immediate
  // hand-off to /dashboard?focus=primary-action so the next click lands the
  // user on practice. Brief loading state keeps the transition non-jarring.
  // Step5Done component is still exported in case we need a fallback render.
  void Step5Done; // keep import live for type-graph + dynamic-import safety
  return (
    <JourneyShell step={5} totalSteps={5}>
      <div className="pt-16 flex flex-col items-center gap-3" data-testid="journey-done-redirect">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Setting up your dashboard…</p>
      </div>
    </JourneyShell>
  );
}

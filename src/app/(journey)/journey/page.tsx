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

export default function JourneyPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [mode, setMode] = useState<Mode>("loading");
  const [course, setCourse] = useState<string>("AP_WORLD_HISTORY");
  const [weakestUnit, setWeakestUnit] = useState<string | null>(null);
  const [predictedScore, setPredictedScore] = useState<number | null>(null);
  const [prefetchedFrq, setPrefetchedFrq] = useState<FrqRow | null>(null);
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
          // No journey or user-exited — start at step 0
          setMode("step0");
          return;
        }
        setCourse(j.course);
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

  // ── Step 0 → start journey ─────────────────────────────────────────────────
  const handleStart = useCallback(async (chosenCourse: string) => {
    setCourse(chosenCourse);
    await apiPost("start", { course: chosenCourse });
    await apiPost("advance", { step: 1 });
    setMode("step1");
  }, [apiPost]);

  // ── Step 1 → trans12 ───────────────────────────────────────────────────────
  const handleStep1Done = useCallback(async (artifact: { sessionId: string }) => {
    await apiPost("advance", { step: 2, artifactId: artifact.sessionId });
    setMode("trans12");
  }, [apiPost]);

  // ── trans12 → step 2 ───────────────────────────────────────────────────────
  const handleTrans12 = () => setMode("step2");

  // ── Step 2 → trans23 ───────────────────────────────────────────────────────
  const handleStep2Done = useCallback(async (frqId: string) => {
    await apiPost("advance", { step: 3, artifactId: frqId });
    setMode("trans23");
  }, [apiPost]);

  // ── trans23 → step 3 ───────────────────────────────────────────────────────
  const handleTrans23 = () => setMode("step3");

  // ── Step 3 → trans34 ───────────────────────────────────────────────────────
  const handleStep3Done = useCallback(async (out: {
    diagnosticId: string;
    weakestUnit: string | null;
    weakestUnitName: string | null;
    predictedScore: number | null;
  }) => {
    setWeakestUnit(out.weakestUnit);
    setPredictedScore(out.predictedScore);
    await apiPost("advance", {
      step: 4,
      artifactId: out.diagnosticId,
      weakestUnit: out.weakestUnit ?? undefined,
    });
    setMode("trans34");
  }, [apiPost]);

  // ── trans34 → step 3a (flashcards) → step 4 ───────────────────────────────
  // Beta 9.6 — insert flashcard micro-step between score reveal and
  // targeted MCQ practice. Per user spec: "Quick memory boost before
  // practice" — light touch, no separate feature, just micro-step.
  const handleTrans34 = () => setMode("step3a");
  const handleStep3aDone = () => setMode("step4");

  // ── Step 4 → step 5 (done) ─────────────────────────────────────────────────
  const handleStep4Done = useCallback(async (artifact: { sessionId: string }) => {
    await apiPost("advance", { step: 5, artifactId: artifact.sessionId });
    // Beta 9.7.2 — force NextAuth to refresh the JWT from DB. The advance
    // handler just wrote `onboardingCompletedAt = NOW` to the User row;
    // without this update() call, the cookie-based session in the
    // browser still has the OLD value (null) until next sign-in. With
    // it, the next request to /dashboard sees a fresh JWT and middleware
    // doesn't bounce the user back to /journey.
    try { await updateSession(); } catch { /* non-fatal */ }
    setMode("step5");
  }, [apiPost, updateSession]);

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
        <Step0CoursePick defaultCourse={course} onStart={handleStart} />
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
    return (
      <JourneyShell step={2} totalSteps={5}>
        <TransitionCard
          eyebrow="Good start"
          title="Now try a real AP question"
          body="One AP-style FRQ. You'll see the official rubric and how AP graders score it — the part most students never see."
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
    return (
      <JourneyShell step={3} totalSteps={5}>
        <TransitionCard
          eyebrow="Now estimate your AP score"
          title="A quick diagnostic — 5 minutes"
          body="One question per unit. We'll show you a projected AP score and the unit you should fix first."
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
              <p className="text-xs text-muted-foreground mt-2">projected AP score · out of 5</p>
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

  // step5
  return (
    <JourneyShell step={5} totalSteps={5}>
      <Step5Done
        predictedScore={predictedScore}
        course={course}
        weakestUnitName={weakestUnitName}
      />
    </JourneyShell>
  );
}

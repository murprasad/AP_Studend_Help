"use client";

/**
 * Step 0 — Course pick (Beta 9.5).
 *
 * 2026-05-13 — `mustPick` forces an explicit tap-to-select for users who
 * have never started or have exited the journey. Earlier behaviour
 * presented a pre-filled "Your course: AP Chemistry" card that one user
 * (Saranya R., Grade 11) tapped through, was dropped into a hard chem
 * MEDIUM question, and bounced after 4 silent practice sessions. We now
 * mount in picker mode for new users and disable "Start my plan" until
 * the user has affirmatively chosen a course.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
import type { ApCourse } from "@prisma/client";

interface Props {
  defaultCourse: string;
  /** If true, force the picker UI on mount and require an explicit tap before "Start" enables. */
  mustPick?: boolean;
  onStart: (course: string) => void | Promise<void>;
}

export function Step0CoursePick({ defaultCourse, mustPick = false, onStart }: Props) {
  const [course, setCourse] = useState<string>(defaultCourse);
  const [picking, setPicking] = useState(mustPick);
  const [hasUserPicked, setHasUserPicked] = useState(!mustPick);
  const [submitting, setSubmitting] = useState(false);

  // 2026-05-28 — was "Only AP courses for now" but VISIBLE_AP_COURSES has
  // included SAT/ACT/PSAT for months. Stale comment + the picker labeled
  // itself "AP course" while showing SAT_MATH, ACT_ENGLISH, etc. — Dev Ya
  // hit it today (picked SAT_MATH, bounced in 9 min).
  const exams = VISIBLE_AP_COURSES;

  const handleStart = async () => {
    if (!hasUserPicked) return;
    setSubmitting(true);
    await onStart(course);
  };

  if (picking) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Pick your exam</h1>
        <p className="text-sm text-muted-foreground text-center">
          {mustPick && !hasUserPicked
            ? "Choose the AP, SAT, ACT, or PSAT exam you're preparing for. You can switch anytime later."
            : "You can switch exams anytime later."}
        </p>
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
          {exams.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCourse(c); setHasUserPicked(true); setPicking(false); }}
              className={`text-left rounded-xl border p-4 transition-all ${
                hasUserPicked && course === c
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border/40 hover:bg-accent active:bg-accent"
              }`}
            >
              <p className="font-medium text-sm">{COURSE_REGISTRY[c as ApCourse]?.name ?? c}</p>
            </button>
          ))}
        </div>
        {hasUserPicked && (
          <Button
            variant="outline"
            onClick={() => setPicking(false)}
            className="w-full"
          >
            Back
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 pt-12">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center mx-auto">
        <Sparkles className="h-8 w-8 text-blue-700 dark:text-blue-400" />
      </div>
      <div>
        <h1 className="text-3xl font-bold">Welcome to StudentNest</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          A guided plan to see your projected score in about 10 minutes.
        </p>
      </div>

      <div className="rounded-2xl border border-border/40 p-5 max-w-md mx-auto text-left space-y-3 bg-card">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Your course</p>
        <p className="text-base font-semibold">{COURSE_REGISTRY[course as ApCourse]?.name ?? course}</p>
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="text-xs text-blue-700 dark:text-blue-400 hover:underline"
        >
          Change course →
        </button>
      </div>

      <Button
        size="lg"
        className="rounded-full gap-2 px-8"
        onClick={handleStart}
        disabled={submitting || !hasUserPicked}
      >
        {submitting ? "Starting…" : "Start my plan"}
        <ArrowRight className="h-4 w-4" />
      </Button>

      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
        ~15 minutes · 3 MCQs → 1 FRQ → quick diagnostic → 5 targeted MCQs.
        See your projected AP score at the end.
      </p>
    </div>
  );
}

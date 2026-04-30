"use client";

/**
 * Step 0 — Course pick (Beta 9.5).
 *
 * Default: AP_WORLD_HISTORY. User can change before starting.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
import type { ApCourse } from "@prisma/client";

interface Props {
  defaultCourse: string;
  onStart: (course: string) => void | Promise<void>;
}

export function Step0CoursePick({ defaultCourse, onStart }: Props) {
  const [course, setCourse] = useState<string>(defaultCourse);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Only AP courses for now — SAT/ACT/CLEP/DSST coming as journey expands
  const apCourses = VISIBLE_AP_COURSES;

  const handleStart = async () => {
    setSubmitting(true);
    await onStart(course);
  };

  if (picking) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Pick your course</h1>
        <p className="text-sm text-muted-foreground text-center">
          You can switch courses anytime later.
        </p>
        <div className="grid gap-2 max-h-[60vh] overflow-y-auto">
          {apCourses.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setCourse(c); setPicking(false); }}
              className={`text-left rounded-xl border p-4 transition-all ${
                course === c
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border/40 hover:bg-accent"
              }`}
            >
              <p className="font-medium text-sm">{COURSE_REGISTRY[c as ApCourse]?.name ?? c}</p>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={() => setPicking(false)}
          className="w-full"
        >
          Back
        </Button>
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
          A 5-step guided plan to see your projected AP score in about 15 minutes.
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
        disabled={submitting}
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

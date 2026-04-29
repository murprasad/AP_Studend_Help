// Beta 8.12 — Funnel fix: post-signup quickstart flow.
//
// Per persona walkthrough (docs/beta-8.12-persona-walkthrough.md):
// New student needs to PICK their AP exam (otherwise we'd default them to
// AP World History which would be wrong for ~93% of users). One screen,
// 10 buttons, click → 5-Q EASY session in that course.
//
// Returning students never reach this page — dashboard layout only routes
// here when onboardingCompletedAt is NULL.
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { ApCourse } from "@prisma/client";
import { useCourse } from "@/hooks/use-course";

// 10 marketed AP courses (matches landing-page courses[] block, AP only).
// Shown in popularity order per CB exam-taker counts.
const QUICKSTART_COURSES: { course: ApCourse; label: string; topics: string }[] = [
  { course: "AP_US_HISTORY",                  label: "AP US History",            topics: "1491–present" },
  { course: "AP_PSYCHOLOGY",                  label: "AP Psychology",            topics: "5 units, redesigned 2024-25" },
  { course: "AP_BIOLOGY",                     label: "AP Biology",               topics: "Cells, genetics, ecology" },
  { course: "AP_CHEMISTRY",                   label: "AP Chemistry",             topics: "Atomic structure → thermo" },
  { course: "AP_CALCULUS_AB",                 label: "AP Calculus AB",           topics: "Limits, derivatives, integrals" },
  { course: "AP_CALCULUS_BC",                 label: "AP Calculus BC",           topics: "AB plus series, polar" },
  { course: "AP_STATISTICS",                  label: "AP Statistics",            topics: "Data, probability, inference" },
  { course: "AP_WORLD_HISTORY",               label: "AP World History",         topics: "1200–present" },
  { course: "AP_PHYSICS_1",                   label: "AP Physics 1",             topics: "8 units, includes Fluids" },
  { course: "AP_COMPUTER_SCIENCE_PRINCIPLES", label: "AP Computer Science Principles", topics: "Algorithms, data, computing" },
];

export default function QuickstartPage() {
  const router = useRouter();
  const [, setCourse] = useCourse();
  const [picked, setPicked] = useState<ApCourse | null>(null);
  const startedRef = useRef(false);

  // Beta 8.12.2 fix (2026-04-29): pure client-side course set + redirect.
  // The previous flow called a /api/practice/quickstart endpoint that
  // returned a sessionId and redirected to /practice/SESSION_ID — but
  // /practice has no [sessionId] dynamic route, AND the practice page
  // reads its course from useCourse() (localStorage) not URL. Result:
  // user picked AP Biology, page loaded AP World History (the default).
  //
  // Correct flow: setCourse() pushes to localStorage + cookie + dispatches
  // an event the practice page subscribes to. Then router.push to the
  // existing auto-start URL pattern that the dashboard auto-launch nudge
  // already uses successfully — practice page auto-creates the session.
  function startSession(course: ApCourse) {
    if (startedRef.current) return;
    startedRef.current = true;
    setPicked(course);
    setCourse(course);
    router.push(`/practice?mode=focused&count=5&course=${course}&src=quickstart`);
  }

  // While the API call + redirect is in-flight, swap the picker for a
  // single calm reassurance line. No spinner, no skeleton — per spec.
  if (picked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <h1 className="text-xl font-semibold">Loading your first question…</h1>
          <p className="text-sm text-muted-foreground">5 quick questions. No setup.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <Sparkles className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Pick your AP exam</h1>
          <p className="text-sm text-muted-foreground">
            One click. 5 questions. ~3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICKSTART_COURSES.map((c) => (
            <button
              key={c.course}
              onClick={() => startSession(c.course)}
              className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card hover:border-primary/60 hover:bg-primary/5 transition-all px-4 py-4 text-left"
            >
              <div>
                <div className="font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.topics}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

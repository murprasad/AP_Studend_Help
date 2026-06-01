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
 *
 * 2026-06-01 — User feedback: "all courses are listed AP, SAT, ACT
 * flat". Reorganized picker to 4 family cards (AP / SAT / ACT / PSAT),
 * each with a sensible default course pre-selected and a "Change"
 * affordance to swap within the family. User picks a family card to
 * commit. Single flat list still available behind "See all courses".
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
import type { ApCourse } from "@prisma/client";

interface Props {
  defaultCourse: string;
  /** If true, force the picker UI on mount and require an explicit tap before "Start" enables. */
  mustPick?: boolean;
  onStart: (course: string) => void | Promise<void>;
}

type Family = "AP" | "SAT" | "ACT" | "PSAT";

const FAMILY_ORDER: Family[] = ["AP", "SAT", "ACT", "PSAT"];

const FAMILY_DEFAULTS: Record<Family, string> = {
  AP: "AP_WORLD_HISTORY",
  SAT: "SAT_MATH",
  ACT: "ACT_MATH",
  PSAT: "PSAT_MATH",
};

const FAMILY_LABELS: Record<Family, string> = {
  AP: "AP",
  SAT: "SAT",
  ACT: "ACT",
  PSAT: "PSAT",
};

function familyOf(course: string): Family | null {
  if (course.startsWith("AP_")) return "AP";
  if (course.startsWith("SAT_")) return "SAT";
  if (course.startsWith("ACT_")) return "ACT";
  if (course.startsWith("PSAT_")) return "PSAT";
  return null;
}

function coursesInFamily(family: Family, allCourses: readonly string[]): string[] {
  return allCourses.filter((c) => familyOf(c) === family);
}

export function Step0CoursePick({ defaultCourse, mustPick = false, onStart }: Props) {
  const [course, setCourse] = useState<string>(defaultCourse);
  const [picking, setPicking] = useState(mustPick);
  const [hasUserPicked, setHasUserPicked] = useState(!mustPick);
  const [submitting, setSubmitting] = useState(false);
  // 2026-06-01 — per-family selected course; defaults from FAMILY_DEFAULTS.
  // If the user comes in with a defaultCourse already in a family, override
  // that family's default with the user's prior choice.
  const initialFamilyCourses: Record<Family, string> = (() => {
    const base = { ...FAMILY_DEFAULTS };
    const fam = familyOf(defaultCourse);
    if (fam) base[fam] = defaultCourse;
    return base;
  })();
  const [familyCourses, setFamilyCourses] = useState<Record<Family, string>>(initialFamilyCourses);
  // Which family card is currently expanded for "change course"; null = none.
  const [expanded, setExpanded] = useState<Family | null>(null);
  // Fallback: link to legacy flat-list picker view.
  const [showFlatList, setShowFlatList] = useState(false);

  const exams = VISIBLE_AP_COURSES;

  const handleStart = async () => {
    if (!hasUserPicked) return;
    setSubmitting(true);
    await onStart(course);
  };

  if (picking) {
    // ── Legacy flat-list view (still accessible behind "See all courses") ──
    if (showFlatList) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Pick your exam</h1>
          <p className="text-sm text-muted-foreground text-center">
            All courses, alphabetical.
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
          <Button variant="outline" onClick={() => setShowFlatList(false)} className="w-full">
            Back to categories
          </Button>
        </div>
      );
    }

    // ── 4-family category cards (default view) ──────────────────────────────
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Pick your exam</h1>
        <p className="text-sm text-muted-foreground text-center">
          {mustPick && !hasUserPicked
            ? "Choose the AP, SAT, ACT, or PSAT exam you're preparing for. Defaults shown — tap Change to swap. Switch anytime later."
            : "You can switch exams anytime later."}
        </p>

        <div className="space-y-3">
          {FAMILY_ORDER.map((family) => {
            const familyCourses_ = coursesInFamily(family, exams);
            if (familyCourses_.length === 0) return null;
            const chosen = familyCourses[family];
            const chosenInFamily = familyCourses_.includes(chosen) ? chosen : familyCourses_[0];
            const chosenName = COURSE_REGISTRY[chosenInFamily as ApCourse]?.name ?? chosenInFamily;
            const isExpanded = expanded === family;
            return (
              <div
                key={family}
                className="rounded-xl border border-border/40 overflow-hidden"
              >
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => {
                      setCourse(chosenInFamily);
                      setHasUserPicked(true);
                      setPicking(false);
                    }}
                    className="flex-1 text-left p-4 hover:bg-accent active:bg-accent"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {FAMILY_LABELS[family]}
                    </p>
                    <p className="font-medium text-sm mt-0.5">{chosenName}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : family)}
                    aria-expanded={isExpanded}
                    aria-label={`Change ${FAMILY_LABELS[family]} course`}
                    className="px-4 border-l border-border/40 flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 hover:bg-accent"
                  >
                    Change
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-border/40 max-h-64 overflow-y-auto bg-muted/30">
                    {familyCourses_.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setFamilyCourses({ ...familyCourses, [family]: c });
                          setExpanded(null);
                        }}
                        className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-accent ${
                          c === chosenInFamily ? "font-semibold text-blue-700 dark:text-blue-400" : ""
                        }`}
                      >
                        {COURSE_REGISTRY[c as ApCourse]?.name ?? c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowFlatList(true)}
          className="block mx-auto text-xs text-muted-foreground hover:underline"
        >
          See all courses →
        </button>

        {hasUserPicked && (
          <Button variant="outline" onClick={() => setPicking(false)} className="w-full">
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
        {(() => {
          const fam = familyOf(course);
          // 2026-06-01 — compressed FSM. AP: course-pick → diagnostic → FRQ
          // → dashboard (4 steps). SAT/ACT/PSAT: course-pick → diagnostic
          // → dashboard (3 steps). Old funnel was 7 / 5 screens; compressed
          // for activation. See journey/page.tsx handleStart for routing.
          if (fam === "SAT" || fam === "ACT" || fam === "PSAT") {
            return `~5 minutes · 9-Q diagnostic → see your projected ${FAMILY_LABELS[fam]} score.`;
          }
          return "~10 minutes · 9-Q diagnostic → 1 FRQ with rubric reveal → see your projected AP score.";
        })()}
      </p>
    </div>
  );
}

// Beta 8.13.2 (2026-04-29) — smart-default version.
//
// User-feedback critique on the prior 10-card grid: choice paralysis +
// "configure before value." Replaced with one big card that says
// "Most students start with AP World History" + an immediate Start CTA.
// Secondary "Pick a different exam" link expands the full list inline.
//
// Replaces both the legacy /onboarding wizard (now redirect-only) and
// the prior 10-card quickstart picker.
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import { ApCourse } from "@prisma/client";
import { useCourse } from "@/hooks/use-course";

// Track-aware course catalogs. Beta 8.13.4 fix (FMEA gap 1.N1):
// SAT/ACT signups were seeing the AP-only picker which is wrong.
type TrackCourses = { recommended: { course: ApCourse; label: string; topics: string }; others: { course: ApCourse; label: string; topics: string }[] };
const COURSES_BY_TRACK: Record<string, TrackCourses> = {
  ap: {
    recommended: { course: "AP_WORLD_HISTORY", label: "AP World History", topics: "1200–present" },
    others: [
      { course: "AP_US_HISTORY",                  label: "AP US History",            topics: "1491–present" },
      { course: "AP_PSYCHOLOGY",                  label: "AP Psychology",            topics: "5 units (CB redesign 2024-25)" },
      { course: "AP_BIOLOGY",                     label: "AP Biology",               topics: "Cells, genetics, ecology" },
      { course: "AP_CHEMISTRY",                   label: "AP Chemistry",             topics: "Atomic structure → thermo" },
      { course: "AP_CALCULUS_AB",                 label: "AP Calculus AB",           topics: "Limits, derivatives, integrals" },
      { course: "AP_CALCULUS_BC",                 label: "AP Calculus BC",           topics: "AB plus series, polar" },
      { course: "AP_STATISTICS",                  label: "AP Statistics",            topics: "Data, probability, inference" },
      { course: "AP_PHYSICS_1",                   label: "AP Physics 1",             topics: "8 units, includes Fluids" },
      { course: "AP_COMPUTER_SCIENCE_PRINCIPLES", label: "AP Computer Science Principles", topics: "Algorithms, data, computing" },
    ],
  },
  sat: {
    recommended: { course: "SAT_MATH", label: "SAT Math", topics: "Algebra, advanced math, geometry" },
    others: [
      { course: "SAT_READING_WRITING", label: "SAT Reading & Writing", topics: "Passages, evidence, grammar" },
    ],
  },
  act: {
    recommended: { course: "ACT_MATH", label: "ACT Math", topics: "Pre-algebra through trig, 5-choice" },
    others: [
      { course: "ACT_ENGLISH", label: "ACT English",  topics: "Grammar, rhetoric" },
      { course: "ACT_SCIENCE", label: "ACT Science",  topics: "Data interpretation" },
      { course: "ACT_READING", label: "ACT Reading",  topics: "Literary, social, humanities" },
    ],
  },
};

export default function QuickstartPage() {
  const router = useRouter();
  const [, setCourse] = useCourse();
  const [picked, setPicked] = useState<ApCourse | null>(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [track, setTrack] = useState<string>("ap"); // default before user fetch
  const startedRef = useRef(false);

  // Fetch user track to pick the right course catalog.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: { track?: string } } | null) => {
        if (cancelled) return;
        if (d?.user?.track && COURSES_BY_TRACK[d.user.track]) setTrack(d.user.track);
      })
      .catch(() => { /* fail open — default ap */ });
    return () => { cancelled = true; };
  }, []);

  const catalog = COURSES_BY_TRACK[track] ?? COURSES_BY_TRACK.ap;
  const RECOMMENDED = catalog.recommended;
  const OTHERS = catalog.others;

  // setCourse() pushes to localStorage + cookie + dispatches an event the
  // practice page subscribes to. Then router.push to the existing
  // auto-start URL pattern (already used by dashboard auto-launch nudge)
  // — practice page auto-creates the session.
  function startSession(course: ApCourse) {
    if (startedRef.current) return;
    startedRef.current = true;
    setPicked(course);
    setCourse(course);
    // Beta 9.0.1 hotfix (2026-04-29) — also pass quickstart=1 to satisfy
    // both middleware AND DashboardLayout's "exempt this nav from new-user
    // bounce-to-quickstart" check. Without this, fresh user click → /practice
    // → middleware sees onboardingCompletedAt=null → bounces back to here.
    router.push(`/practice?mode=focused&count=3&course=${course}&src=quickstart&quickstart=1`);
  }

  if (picked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <h1 className="text-xl font-semibold">Loading your first question…</h1>
          <p className="text-sm text-muted-foreground">3 quick questions. ~60 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Headline reframed per user critique — the value prop is "see how
            close you are to passing", not "set up your account". */}
        <div className="text-center mb-6 space-y-2">
          <Sparkles className="h-10 w-10 mx-auto text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold">Let&apos;s start with one question</h1>
          <p className="text-sm text-muted-foreground">
            See how close you are to passing your {track === "sat" ? "SAT" : track === "act" ? "ACT" : "AP"}. ~3 minutes.
          </p>
        </div>

        {/* Recommended card — single dominant CTA, smart-default to most-popular */}
        <button
          onClick={() => startSession(RECOMMENDED.course)}
          className="group w-full mb-3 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-blue-500/5 to-primary/5 hover:border-primary/60 hover:from-primary/10 transition-all px-5 py-5 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1">Most students start here</p>
              <p className="text-lg font-bold">{RECOMMENDED.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{RECOMMENDED.topics}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </div>
          <p className="text-[13px] font-semibold text-primary mt-3 inline-flex items-center gap-1">
            Start your first question <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </button>

        {/* Secondary: pick a different exam — collapsed by default to avoid
            choice paralysis. Click reveals the other 9 in a tight grid. */}
        <button
          onClick={() => setBrowseOpen((v) => !v)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 inline-flex items-center justify-center gap-1"
        >
          {browseOpen ? "Hide other exams" : "Or choose a different exam"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${browseOpen ? "rotate-180" : ""}`} />
        </button>

        {browseOpen && OTHERS.length > 0 && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OTHERS.map((c) => (
              <button
                key={c.course}
                onClick={() => startSession(c.course)}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card hover:border-primary/60 hover:bg-primary/5 transition-all px-3 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{c.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.topics}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

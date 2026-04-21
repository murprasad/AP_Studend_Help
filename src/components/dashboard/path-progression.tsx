"use client";

/**
 * PathProgression — Duolingo-style vertical path of units for the current
 * course. Replaces the flat "Path to Passing" stepper. Each unit is a
 * dot + label; current unit is highlighted, completed units show a
 * check, upcoming units are gray outlines, and a locked "Mock Exam"
 * milestone sits at the bottom.
 *
 * Tapping an unlocked unit → focused practice on that unit.
 * Tapping the mock milestone (if unlocked) → /mock-exam.
 *
 * For long courses (>7 units), shows current +/- 2 plus mock, truncating
 * the rest with a "… N more units" line so the card stays short.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { COURSE_REGISTRY } from "@/lib/courses";

interface Props {
  course: string;
}

type UnitState = "completed" | "current" | "upcoming" | "locked";

interface UnitNode {
  unit: string;
  label: string;
  state: UnitState;
  mastery: number;
  href?: string;
}

interface MasteryRow {
  unit: string;
  masteryScore: number;
  totalAttempts: number;
}

const MOCK_UNLOCK_SESSIONS = 3; // matches the existing gating rule (see mock-exam page)

export function PathProgression({ course }: Props) {
  const [mastery, setMastery] = useState<MasteryRow[]>([]);
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Pull mastery + session count in parallel via the dashboard's existing
    // API surface. If either fails, we render a reasonable default.
    Promise.all([
      fetch(`/api/dashboard?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([dash]) => {
        if (cancelled || !dash) return;
        if (Array.isArray(dash.mastery)) {
          setMastery(dash.mastery.map((m: any) => ({
            unit: m.unit,
            masteryScore: m.masteryScore ?? 0,
            totalAttempts: m.totalAttempts ?? 0,
          })));
        }
        if (typeof dash.totalSessions === "number") setSessionCount(dash.totalSessions);
        else if (Array.isArray(dash.recentSessions)) setSessionCount(dash.recentSessions.length);
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [course]);

  const courseConfig = COURSE_REGISTRY[course as keyof typeof COURSE_REGISTRY];
  if (!courseConfig) return null;

  // Use `keyof typeof courseConfig.units` via Object.entries for type-flex.
  const unitEntries = Object.entries((courseConfig as { units: Record<string, { name: string }> }).units);
  if (unitEntries.length === 0) return null;

  const masteryMap = new Map(mastery.map((m) => [m.unit, m]));

  // Classify each unit. "Current" = the lowest-mastery unit that has at
  // least one attempt (i.e. the one you're actively working). If no
  // attempts anywhere, the FIRST unit is "current" (fresh start).
  const attempted = unitEntries
    .map(([unit]) => ({ unit, row: masteryMap.get(unit) }))
    .filter((x) => (x.row?.totalAttempts ?? 0) > 0);

  let currentUnit: string | null = null;
  if (attempted.length > 0) {
    const sorted = [...attempted].sort((a, b) => (a.row?.masteryScore ?? 0) - (b.row?.masteryScore ?? 0));
    const weakest = sorted.find((x) => (x.row?.masteryScore ?? 0) < 80);
    currentUnit = weakest?.unit ?? unitEntries[unitEntries.length - 1][0];
  } else {
    currentUnit = unitEntries[0][0];
  }

  const nodes: UnitNode[] = unitEntries.map(([unit, meta]) => {
    const mScore = masteryMap.get(unit)?.masteryScore ?? 0;
    let state: UnitState;
    if (mScore >= 80) state = "completed";
    else if (unit === currentUnit) state = "current";
    else state = "upcoming";
    return {
      unit,
      label: (meta as { name: string }).name,
      state,
      mastery: mScore,
      href: `/practice?mode=focused&unit=${encodeURIComponent(unit)}&course=${course}`,
    };
  });

  const sessionsDone = sessionCount ?? 0;
  const mockState: UnitState = sessionsDone >= MOCK_UNLOCK_SESSIONS ? "upcoming" : "locked";
  const sessionsToMock = Math.max(0, MOCK_UNLOCK_SESSIONS - sessionsDone);

  // Truncation: if more than 7 units, show current +/- 2 + mock.
  const displayNodes = (() => {
    if (nodes.length <= 7) return { before: nodes as UnitNode[], hiddenAfter: 0 };
    const currentIdx = nodes.findIndex((n) => n.state === "current");
    const i = currentIdx === -1 ? 0 : currentIdx;
    const start = Math.max(0, i - 2);
    const end = Math.min(nodes.length, i + 3);
    const slice = nodes.slice(start, end);
    return { before: slice, hiddenAfter: nodes.length - end };
  })();

  return (
    <Card className="rounded-[16px] border-border/40">
      <CardContent className="p-5">
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">Your path</p>
        <ol className="space-y-0">
          {displayNodes.before.map((node, idx) => {
            const isLast = idx === displayNodes.before.length - 1;
            return (
              <li key={node.unit} className="relative">
                <div className="flex items-center gap-3 py-1.5">
                  <Dot state={node.state} />
                  {node.state !== "locked" && node.href ? (
                    <Link href={node.href} className="flex-1 min-w-0 group">
                      <p className={`text-[14px] truncate ${labelClasses(node.state)} group-hover:underline`}>
                        {node.label}
                      </p>
                    </Link>
                  ) : (
                    <p className={`flex-1 text-[14px] truncate ${labelClasses(node.state)}`}>
                      {node.label}
                    </p>
                  )}
                  {node.state === "current" && (
                    <span className="text-[11px] font-medium text-primary whitespace-nowrap">← you are here</span>
                  )}
                </div>
                {!isLast && <div className="absolute left-[11px] top-[30px] bottom-[-6px] w-[2px] bg-border" />}
              </li>
            );
          })}
          {displayNodes.hiddenAfter > 0 && (
            <li>
              <div className="flex items-center gap-3 py-1.5">
                <div className="w-6 flex justify-center">
                  <span className="text-[18px] leading-none text-muted-foreground">…</span>
                </div>
                <p className="text-[13px] text-muted-foreground italic">
                  {displayNodes.hiddenAfter} more unit{displayNodes.hiddenAfter === 1 ? "" : "s"}
                </p>
              </div>
              <div className="ml-[11px] w-[2px] h-[12px] bg-border" />
            </li>
          )}

          {/* Mock milestone */}
          <li className="relative">
            <div className="flex items-center gap-3 py-1.5">
              <Dot state={mockState} isMilestone />
              {mockState === "upcoming" ? (
                <Link href="/mock-exam" className="flex-1 min-w-0 group">
                  <p className="text-[14px] font-medium text-foreground group-hover:underline">Mock Exam</p>
                </Link>
              ) : (
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-muted-foreground">Mock Exam</p>
                  <p className="text-[11px] text-muted-foreground/80">
                    {sessionsToMock} more session{sessionsToMock === 1 ? "" : "s"} to unlock
                  </p>
                </div>
              )}
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

function Dot({ state, isMilestone }: { state: UnitState; isMilestone?: boolean }) {
  const base = "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 relative z-10";
  if (state === "completed") {
    return (
      <div className={`${base} bg-emerald-500 text-white`}>
        <Check className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (state === "current") {
    return (
      <div className={`${base} bg-primary text-primary-foreground ring-4 ring-primary/15`}>
        <span className="h-2 w-2 rounded-full bg-primary-foreground" />
      </div>
    );
  }
  if (state === "locked") {
    return (
      <div className={`${base} bg-muted text-muted-foreground border border-border`}>
        {isMilestone ? <Lock className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />}
      </div>
    );
  }
  return (
    <div className={`${base} bg-background border-2 border-border`}>
      <span className="h-1.5 w-1.5 rounded-full bg-border" />
    </div>
  );
}

function labelClasses(state: UnitState): string {
  if (state === "completed") return "text-muted-foreground line-through decoration-1";
  if (state === "current") return "font-semibold text-foreground";
  if (state === "locked") return "text-muted-foreground";
  return "text-foreground/80";
}

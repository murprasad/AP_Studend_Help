"use client";

/**
 * CramModeCard — Phase C (Beta 8.3 prep), 2026-04-26.
 *
 * Renders an exam countdown + today's prioritized cram plan when the
 * student's exam is <30 days away. The "Cram Mode" framing makes the
 * urgency tangible (vs. an abstract calendar) and the plan removes the
 * "what should I do today?" decision tax that crushes cram-week morale.
 *
 * Plan generation is purely client-side from /api/coach-plan data:
 *   - Days remaining: (examDate - today) in calendar days
 *   - Today's focus: weakest action from coach-plan.actions[0]
 *   - Today's stretch: 2nd weakest action OR a randomized unit
 *   - Mock-exam suggestion: enabled when ≤14 days
 *   - Sage Coach FRQ practice: enabled at all times if course has FRQs
 *
 * Render rules:
 *   - Hide if user.examDate is null (no urgency context)
 *   - Hide if examDate > 30 days out (Optimize mode, not Cram)
 *   - Hide if examDate has passed (Retake mode — future Phase E)
 *
 * Tied to docs/requirements-mode-switching.md — this is the explicit
 * Mode 3 (Cram) surface called out in the time-aware mode-switching
 * requirement. Mode 2 (Optimize) is the existing dashboard layout.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, ArrowRight, Target, PenLine, Mic } from "lucide-react";
import { fetchCached } from "@/lib/dashboard-cache";

interface Props {
  course: string;
}

interface UserSnippet {
  examDate: string | null;
}

interface CoachAction {
  unit: string;
  unitLabel: string;
  currentMastery: number;
  estQuestionsToTier: number;
  href: string;
  reason: string;
}

interface CoachSnippet {
  actions?: CoachAction[];
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const exam = new Date(dateStr);
  if (isNaN(exam.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const diffMs = exam.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function CramModeCard({ course }: Props) {
  const [examDate, setExamDate] = useState<string | null>(null);
  const [actions, setActions] = useState<CoachAction[]>([]);
  const [hasFrqs, setHasFrqs] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchCached("/api/user"),
      fetchCached(`/api/coach-plan?course=${course}`),
      fetchCached(`/api/frq?course=${course}&limit=1`),
    ] as const)
      .then((results) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userR = results[0] as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coach = results[1] as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const frqR = results[2] as any;
        const u = userR?.user as UserSnippet | undefined;
        setExamDate(u?.examDate ?? null);
        setActions((coach as CoachSnippet | null)?.actions ?? []);
        const list = frqR?.frqs ?? frqR?.list ?? frqR ?? [];
        setHasFrqs(Array.isArray(list) && list.length > 0);
      })
      .catch(() => { /* graceful — card just stays hidden */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [course]);

  if (!loaded) return null;
  const days = daysUntil(examDate);
  // Hide when no exam date OR > 30 days OR exam already passed.
  if (days === null || days > 30 || days < 0) return null;

  // Tier the urgency framing.
  const tier =
    days <= 3 ? { label: "Final 3 days", urgency: "critical", color: "red" } :
    days <= 7 ? { label: "Final week", urgency: "high", color: "red" } :
    days <= 14 ? { label: "Two weeks out", urgency: "medium", color: "amber" } :
    { label: "Cram window", urgency: "low", color: "amber" };

  const palette = tier.color === "red"
    ? { bg: "bg-red-500/5", border: "border-red-500/40", chip: "text-red-700 dark:text-red-400 border-red-500/40 bg-red-500/10", icon: "text-red-600 dark:text-red-400", iconBg: "bg-red-500/15", btn: "bg-red-600 hover:bg-red-700" }
    : { bg: "bg-amber-500/5", border: "border-amber-500/40", chip: "text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-500/15", btn: "bg-amber-600 hover:bg-amber-700" };

  // Today's focus = weakest unit (or null if no signal yet).
  const focus = actions[0] ?? null;
  const stretch = actions[1] ?? null;
  // Suggest mock exam when in final 14 days.
  const suggestMock = days <= 14;

  return (
    <Card className={`rounded-[16px] ${palette.border} ${palette.bg}`}>
      <CardContent className="p-5 space-y-3">
        {/* Header: countdown + tier badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${palette.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Flame className={`h-5 w-5 ${palette.icon}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[16px] font-semibold leading-tight">Cram Mode</p>
                <Badge variant="outline" className={`text-[10px] ${palette.chip}`}>{tier.label}</Badge>
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span><span className={`font-semibold tabular-nums ${palette.icon}`}>{days}</span> day{days === 1 ? "" : "s"} until your exam</span>
              </p>
            </div>
          </div>
        </div>

        {/* Today's plan */}
        <div className="space-y-1.5 pt-2 border-t border-border/30">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Today&apos;s plan</p>

          {focus ? (
            <Link
              href={focus.href}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[13px] font-medium truncate">
                  <Target className={`inline-block h-3.5 w-3.5 mr-1 -mt-0.5 ${palette.icon}`} />
                  Drill {focus.unitLabel}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Your weakest unit · {focus.currentMastery}% mastery · ~{focus.estQuestionsToTier} Qs to next tier
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          ) : (
            <div className="p-2.5 rounded-lg bg-secondary/40 text-[13px] text-muted-foreground">
              Run a quick diagnostic so we can target your weakest unit.
            </div>
          )}

          {stretch && days <= 14 && (
            <Link
              href={stretch.href}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[13px] font-medium truncate">
                  Bonus: drill {stretch.unitLabel}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {stretch.currentMastery}% mastery · ~{stretch.estQuestionsToTier} Qs
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}

          {hasFrqs && (
            <Link
              href={`/frq-practice?course=${course}`}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[13px] font-medium truncate">
                  <PenLine className={`inline-block h-3.5 w-3.5 mr-1 -mt-0.5 ${palette.icon}`} />
                  Write 1 official FRQ
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Past College Board prompt with official rubric
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}

          {suggestMock && (
            <Link
              href={`/mock-exam?course=${course}`}
              className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
            >
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[13px] font-medium truncate">
                  <Mic className={`inline-block h-3.5 w-3.5 mr-1 -mt-0.5 ${palette.icon}`} />
                  Take a timed mock section
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Build pacing — final {days <= 7 ? "week" : "two weeks"} is when this matters most
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}
        </div>

        {/* Footer hint */}
        {days <= 7 && (
          <p className="text-[11px] text-muted-foreground italic pt-1">
            Final week — sleep, hydration, and short focused sessions beat marathon cramming.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

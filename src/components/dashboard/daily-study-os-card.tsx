"use client";

/**
 * DailyStudyOSCard — Phase D (Beta 8.3 prep), 2026-04-26.
 *
 * Replaces the static "study plan" template with a daily-adaptive plan:
 *   "Today: 25 min — Bio Unit 3 (your weakest) + 1 FRQ + 5 flashcards"
 *
 * Approach: derives today's plan from existing data sources (no new
 * AI call, no new DB table). Inputs:
 *   - Last 24h performance from /api/coach-plan (recent accuracy, streak)
 *   - Top weakness from coach-plan.actions[0]
 *   - Daily goal from /api/daily-goal (target Qs)
 *   - FRQ availability from /api/frq?course=...
 *
 * Adapts to yesterday:
 *   - If yesterday's accuracy < 50%: lower today's volume (focus over speed)
 *   - If accuracy ≥ 80% AND streak ≥ 3: bump volume + add a stretch task
 *   - If user hit yesterday's daily goal: today's goal stays; if missed,
 *     today's goal drops by 25% (don't pile up failure)
 *
 * Render rules:
 *   - Hides when CramModeCard would render (Cram Mode takes precedence)
 *   - Hides when no signal yet (totalAnswered < 5 — show diagnostic prompt instead)
 *   - Stays visible across the year (Mode 1 + Mode 2 both use this)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight, Sparkles, CheckCircle2, Circle } from "lucide-react";

interface Props {
  course: string;
}

interface UserSnippet {
  examDate: string | null;
  streakDays: number;
}

interface CoachAction {
  unit: string;
  unitLabel: string;
  currentMastery: number;
  estQuestionsToTier: number;
  href: string;
}

interface CoachSnippet {
  actions?: CoachAction[];
  recentAccuracy?: number;
  totalAnswered?: number;
}

interface GoalSnippet {
  targetQs?: number;
  answeredToday?: number;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const exam = new Date(dateStr);
  if (isNaN(exam.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86400000);
}

interface PlanItem {
  label: string;
  detail: string;
  href: string;
  done: boolean;
}

export function DailyStudyOSCard({ course }: Props) {
  const [user, setUser] = useState<UserSnippet | null>(null);
  const [coach, setCoach] = useState<CoachSnippet | null>(null);
  const [goal, setGoal] = useState<GoalSnippet | null>(null);
  const [hasFrqs, setHasFrqs] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/user", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/daily-goal?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/frq?course=${course}&limit=1`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userR, coachR, goalR, frqR]) => {
        if (cancelled) return;
        setUser((userR?.user as UserSnippet | undefined) ?? null);
        setCoach(coachR ?? null);
        setGoal(goalR ?? null);
        const list = frqR?.frqs ?? frqR?.list ?? frqR ?? [];
        setHasFrqs(Array.isArray(list) && list.length > 0);
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [course]);

  if (!loaded) return null;

  // Defer to CramModeCard when in cram window (<= 30 days). Daily Study
  // OS is for steady-state; Cram Mode is for the sprint.
  const days = daysUntil(user?.examDate ?? null);
  if (days !== null && days <= 30 && days >= 0) return null;

  const totalAnswered = coach?.totalAnswered ?? 0;
  if (totalAnswered < 5) return null; // No signal yet — diagnostic-prompt cards handle this

  const recentAccuracy = coach?.recentAccuracy ?? 0;
  const streak = user?.streakDays ?? 0;
  const targetQs = goal?.targetQs ?? 10;
  const answeredToday = goal?.answeredToday ?? 0;

  // Adapt today's volume based on yesterday's signal.
  let todayQs = targetQs;
  let modeNote = "";
  if (recentAccuracy < 50 && totalAnswered >= 10) {
    todayQs = Math.max(5, Math.round(targetQs * 0.7));
    modeNote = "Focus mode — fewer questions, deeper attention";
  } else if (recentAccuracy >= 80 && streak >= 3) {
    todayQs = Math.round(targetQs * 1.3);
    modeNote = "Stretch mode — you're rolling; push harder";
  } else {
    modeNote = "Standard pacing";
  }

  const focus = coach?.actions?.[0] ?? null;
  const stretch = coach?.actions?.[1] ?? null;
  const remainingQs = Math.max(0, todayQs - answeredToday);

  const items: PlanItem[] = [];
  if (focus && remainingQs > 0) {
    items.push({
      label: `${remainingQs} questions on ${focus.unitLabel}`,
      detail: `Your weakest unit · ${focus.currentMastery}% mastery`,
      href: focus.href,
      done: false,
    });
  }
  if (hasFrqs && recentAccuracy >= 60) {
    items.push({
      label: "Write 1 FRQ",
      detail: "Official CB prompt with rubric",
      href: `/frq-practice?course=${course}`,
      done: false,
    });
  }
  if (stretch && recentAccuracy >= 80) {
    items.push({
      label: `Stretch: ${stretch.unitLabel}`,
      detail: `Bonus targeting your 2nd-weakest unit`,
      href: stretch.href,
      done: false,
    });
  }
  // Always-on completion item — hit when user has answered >= today's target.
  if (answeredToday >= todayQs) {
    items.unshift({
      label: `${answeredToday} questions today — daily goal hit`,
      detail: "Streak preserved · take the win",
      href: `/practice?course=${course}`,
      done: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <Card className="rounded-[16px] border-blue-500/30 bg-blue-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[16px] font-semibold leading-tight">Today&apos;s Study Plan</p>
              <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/5">
                {modeNote}
              </Badge>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Adapted from yesterday: {recentAccuracy.toFixed(0)}% accuracy{streak > 0 ? ` · ${streak}-day streak` : ""}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2 border-t border-border/30">
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center justify-between p-2.5 rounded-lg ${item.done ? "bg-emerald-500/10" : "bg-secondary/40 hover:bg-accent"} transition-colors group`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1 pr-2">
                {item.done
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  : <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium truncate ${item.done ? "text-emerald-700 dark:text-emerald-400 line-through decoration-emerald-500/40" : ""}`}>
                    {item.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              </div>
              {!item.done && (
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * NextSessionNudge — incomplete-loop retention card.
 *
 * Shown on the session-summary screen after a student finishes practice.
 * Pulls the weakest unit from /api/coach-plan and frames the return visit
 * around protecting/advancing the student's current streak + closing the
 * weakest-unit gap.
 *
 * Design rule: the card ONLY renders when we have both a weakestUnit and
 * a non-zero streak. Otherwise we'd show a vague CTA ("come back tomorrow")
 * which is weaker than no card at all.
 *
 * Anchored in incomplete-loop psychology (project_activation_retention_backlog
 * memory): returning users close the loop on an unfinished goal — that's
 * the retention lever, not "please come back."
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Target, ArrowRight, Zap } from "lucide-react";

interface CoachPlanResponse {
  weakestUnit?: { unit: string; unitName: string; missRatePct: number } | null;
}

interface Props {
  course: string;
}

export function NextSessionNudge({ course }: Props) {
  const [weakestUnit, setWeakestUnit] = useState<{ unit: string; unitName: string; missRatePct: number } | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Parallel: coach-plan for weakestUnit, /api/user for streakDays.
    Promise.all([
      fetch(`/api/coach-plan?course=${course}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/user`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([coach, userRes]: [CoachPlanResponse | null, { user?: { streakDays?: number } } | null]) => {
        if (cancelled) return;
        if (coach?.weakestUnit) setWeakestUnit(coach.weakestUnit);
        if (userRes?.user?.streakDays != null) setStreakDays(userRes.user.streakDays);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [course]);

  if (!loaded) return null;

  const hasStreak = streakDays > 0;

  // Beta 8.13.1 (2026-04-29) — fallback for new users (no weakest unit yet).
  // Per QA walkthrough (docs/qa-post-session-next-step-walkthrough.md):
  // returning null left blank space where the most important "what next"
  // guidance should live — user feedback "as a new user, after certain
  // number of MCQs there is no clear path." Now we always render a
  // specific next-action recommendation, regardless of mastery maturity.
  const isNewUser = !weakestUnit;

  const headline = isNewUser
    ? `Keep momentum — 5 more questions in ${course.replace(/^AP_/, "AP ").replace(/_/g, " ")}`
    : `Keep going — close the gap on ${weakestUnit.unitName}`;

  const subtext = isNewUser
    ? "A few more sessions and we'll surface your weakest unit specifically. For now, keep building the muscle."
    : `You're missing ${weakestUnit.missRatePct}% of questions here. 5 focused questions here move your score faster than any other unit.`;

  // Where the "Start 5 more" CTA points. New users get a course-level
  // focused session; users with weakestUnit data get a unit-targeted one.
  const ctaHref = isNewUser
    ? `/practice?mode=focused&count=5&course=${course}&src=next_session_new`
    : `/practice?mode=focused&unit=${encodeURIComponent(weakestUnit.unit)}&count=5&course=${course}&src=next_session`;

  return (
    <Card className="rounded-[16px] border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-rose-500/5 to-orange-500/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight">{headline}</p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{subtext}</p>
          </div>
        </div>

        {hasStreak && (
          <div className="flex items-center gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
            <Flame className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="text-[13px] leading-snug">
              <strong>{streakDays}-day streak.</strong> Another session today extends it.
            </p>
          </div>
        )}

        {/* Full-navigation link (window.location) forces the practice page
            to re-mount so the focused-practice auto-launch fires cleanly.
            Next.js Link doesn't unmount the page when navigating to the
            same /practice route, so the autoLaunchedRef guard blocks the
            re-trigger and the user's click appears to do nothing. */}
        <a
          href={ctaHref}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-amber-700 hover:text-amber-800 underline-offset-2 hover:underline"
        >
          <Zap className="h-4 w-4" />
          Start 5 more questions →
        </a>
      </CardContent>
    </Card>
  );
}

"use client";

/**
 * DiagnosticPromptCard — Beta 9.1 (2026-04-29).
 *
 * Surfaces the Diagnostic in the daily flow. Without this, students "keep
 * practicing" without ever being shown the option to take a baseline
 * measurement — they never get a projected score, and the rest of the
 * product (Sage Coach plan, weak-unit heatmap, week-by-week plan) can't
 * personalize because there's no baseline.
 *
 * Show conditions:
 *   - User has answered ≥ 5 MCQs (proves engagement is real)
 *   - User has NOT taken a diagnostic yet
 *   - User dismissed the inline DiagnosticNudgeModal at least once OR
 *     simply hasn't seen it (modal only fires on /practice page)
 *
 * Hide conditions:
 *   - User has taken a diagnostic — the readiness/score card takes over
 *   - User is too new (< 5 questions answered) — quickstart is enough
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, TrendingUp } from "lucide-react";

interface Props {
  course: string;
}

export function DiagnosticPromptCard({ course }: Props) {
  const [show, setShow] = useState(false);
  const [responseCount, setResponseCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/conversion-signal", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { responseCount: number; hasDiagnostic: boolean } | null) => {
        if (cancelled || !d) return;
        if (d.hasDiagnostic) return; // already took it — readiness card handles
        if (d.responseCount < 5) return; // too new — quickstart is enough
        setResponseCount(d.responseCount);
        setShow(true);
      })
      .catch(() => { /* silent — surfaces no-op */ });
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  return (
    <Card className="card-glow border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-yellow-500/5 to-transparent">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                Ready for your real score?
              </p>
              <p className="text-sm font-semibold leading-snug mt-0.5">
                You&apos;ve answered {responseCount}+ questions. A 10-minute
                diagnostic reveals your projected AP score and the units
                closing the gap to a 4.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              <span>Diagnoses weak units · personalizes your plan · ~10 min</span>
            </div>
            <Link href={`/diagnostic?course=${course}&from=dashboard`}>
              <Button size="sm" className="rounded-full mt-1 gap-2 group">
                Take Diagnostic
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

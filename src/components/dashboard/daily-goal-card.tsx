"use client";

/**
 * Dashboard daily goal card — tied to score delta, not raw Q count.
 *
 * Reads /api/daily-goal (single source — wraps `computeDailyGoal` on top of
 * `projectImprovement` + `loadReadinessSnapshot`). When the user is pre-
 * signal (no diagnostic, no practice) we render a gentle "first session"
 * nudge instead of a fake "+0.0" goal.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  course: string;
}

interface DailyGoalResponse {
  targetQs: number;
  answeredToday: number;
  scoreDeltaProjected: number;
  goalHit: boolean;
  progressPercent: number;
  beforeScore: number | null;
  currentScore: number | null;
  projectedScore: number | null;
  family: "AP" | "SAT" | "ACT";
  scaleMax: number;
  hasSignal: boolean;
  defaultTarget: number;
}

function formatScore(family: "AP" | "SAT" | "ACT", s: number): string {
  if (family === "SAT") return String(Math.round(s));
  // AP + ACT → one decimal
  return s.toFixed(1);
}

function formatDelta(family: "AP" | "SAT" | "ACT", pp: number): string {
  // Convert pp (0-100) → family-native delta so the card's "+X today" line
  // matches the beforeScore/projectedScore on the same scale.
  if (family === "AP") {
    const ap = (pp / 100) * 4;
    return `+${ap.toFixed(1)} AP`;
  }
  if (family === "SAT") {
    const sat = (pp / 100) * 1200;
    return `+${Math.round(sat / 10) * 10} SAT`;
  }
  const act = (pp / 100) * 35;
  return `+${act.toFixed(1)} ACT`;
}

export function DailyGoalCard({ course }: Props) {
  const [data, setData] = useState<DailyGoalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/daily-goal?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* graceful degrade — card just hides */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Setting today's goal…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Pre-signal state: no readiness data yet.
  if (!data.hasSignal || data.beforeScore === null || data.projectedScore === null) {
    return (
      <Card className="card-glow border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Today's goal</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keep practicing — your score appears after your first session.
              </p>
            </div>
            <Link href="/practice" className="ml-auto">
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                Start
              </Badge>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const deltaLabel = formatDelta(data.family, data.scoreDeltaProjected);
  const beforeLabel = formatScore(data.family, data.beforeScore);
  const projectedLabel = formatScore(data.family, data.projectedScore);

  if (data.goalHit) {
    return (
      <Card className="card-glow border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-500">
                Daily goal hit — {data.answeredToday} questions answered
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your projected score today: <span className="font-semibold text-foreground">{beforeLabel}</span> → <span className="font-semibold text-emerald-500">{projectedLabel}</span>
              </p>
            </div>
          </div>
          <Progress
            value={100}
            className="h-2"
            indicatorClassName="bg-emerald-500"
            aria-label="Today's goal: 100% complete"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-glow border-blue-500/20 bg-blue-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Today's goal</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{deltaLabel} today</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Projected: <span className="font-medium text-foreground">{beforeLabel}</span> → <span className="font-medium text-blue-700 dark:text-blue-400">{projectedLabel}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="flex-shrink-0 text-xs">
            {data.answeredToday}/{data.targetQs} Qs
          </Badge>
        </div>

        <div>
          <Progress
            value={data.progressPercent}
            className="h-2"
            indicatorClassName="bg-blue-500"
            aria-label={`Today's goal progress: ${data.answeredToday} of ${data.targetQs} questions answered`}
          />
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            Answer {Math.max(0, data.targetQs - data.answeredToday)} more to hit today's goal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

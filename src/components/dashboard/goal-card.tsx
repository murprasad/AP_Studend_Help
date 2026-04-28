"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, X, CheckCircle } from "lucide-react";

const AP_GOALS = ["Score 5", "Score 4", "Score 3"];
const CLEP_GOALS = ["Pass CLEP exam", "Score 60+", "Score 70+"];
const DAILY_TARGET_OPTIONS = [5, 10, 15, 20];
const DEFAULT_DAILY_TARGET = 10;

// Static Tailwind class maps — dynamic interpolation breaks Tailwind's compiler
const ACCENT = {
  indigo: {
    card: "border-blue-500/20 bg-blue-500/5",
    iconBg: "w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center",
    iconText: "h-5 w-5 text-blue-500",
    progressBar: "bg-blue-500",
  },
  emerald: {
    card: "border-emerald-500/20 bg-emerald-500/5",
    iconBg: "w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center",
    iconText: "h-5 w-5 text-emerald-700 dark:text-emerald-400",
    progressBar: "bg-emerald-500",
  },
} as const;

export function GoalCard({ course, track, todayQuestions = 0 }: { course: string; track: string; todayQuestions?: number }) {
  const storageKey = `goal_${course}`;
  const targetKey = `goal_target_${course}`;
  const [goal, setGoal] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [dailyTarget, setDailyTarget] = useState(DEFAULT_DAILY_TARGET);

  useEffect(() => {
    try {
      setGoal(localStorage.getItem(storageKey));
      const saved = localStorage.getItem(targetKey);
      if (saved) setDailyTarget(parseInt(saved, 10) || DEFAULT_DAILY_TARGET);
    } catch { /* ignore */ }
  }, [storageKey, targetKey]);

  function selectGoal(g: string) {
    setGoal(g);
    setPicking(false);
    try { localStorage.setItem(storageKey, g); } catch { /* ignore */ }
  }

  function clearGoal() {
    setGoal(null);
    setPicking(false);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }

  const goals = track === "clep" ? CLEP_GOALS : AP_GOALS;
  const accent = track === "clep" ? ACCENT.emerald : ACCENT.indigo;

  const dailyPct = Math.min(100, Math.round((todayQuestions / dailyTarget) * 100));
  const dailyDone = todayQuestions >= dailyTarget;

  if (goal) {
    return (
      <Card className={accent.card}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={accent.iconBg}>
                <Target className={accent.iconText} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Your target</p>
                <p className="font-semibold text-sm">{goal}</p>
              </div>
            </div>
            <button onClick={clearGoal} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {dailyDone ? (
              <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
            ) : null}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">
                    Today: {todayQuestions}/{dailyTarget}
                  </p>
                  <select
                    value={dailyTarget}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setDailyTarget(v);
                      try { localStorage.setItem(targetKey, String(v)); } catch { /* ignore */ }
                    }}
                    className="text-[10px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer p-0"
                  >
                    {DAILY_TARGET_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}/day</option>
                    ))}
                  </select>
                </div>
                {dailyDone && <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Done!</span>}
              </div>
              <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${dailyDone ? "bg-emerald-500" : accent.progressBar}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (picking) {
    return (
      <Card className="border-border/40">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-medium">Set your target</p>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <Button key={g} size="sm" variant="outline" onClick={() => selectGoal(g)} className="text-xs">
                {g}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <button
      onClick={() => setPicking(true)}
      className="w-full p-4 rounded-xl border border-dashed border-border/40 hover:border-blue-500/30 hover:bg-blue-500/5 transition-colors text-left flex items-center gap-3"
    >
      <Target className="h-5 w-5 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">Set a target score</p>
        <p className="text-xs text-muted-foreground">Stay motivated with a clear goal</p>
      </div>
    </button>
  );
}

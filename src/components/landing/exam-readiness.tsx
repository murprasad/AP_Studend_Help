"use client";

import { useEffect, useState } from "react";

const units = [
  { name: "Unit 1: Algebraic Expressions", pct: 92, ready: true },
  { name: "Unit 3: Functions & Graphs", pct: 71, ready: true },
  { name: "Unit 4: Polynomial Functions", pct: 58, ready: false },
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TARGET_PCT = 78;

export function ExamReadinessMockup() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Small delay so the animation is visible after mount
    const t = setTimeout(() => setProgress(TARGET_PCT), 80);
    return () => clearTimeout(t);
  }, []);

  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div className="bg-card border border-border/40 rounded-xl p-5 space-y-5 max-w-sm">
      {/* Header */}
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        CLEP Readiness
      </p>

      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-32 h-32">
          <svg
            viewBox="0 0 128 128"
            className="w-full h-full -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              className="text-secondary/50"
              strokeWidth="10"
            />
            {/* Filled ring */}
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              className="text-emerald-500"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{progress}%</span>
            <span className="text-[10px] text-muted-foreground">ready</span>
          </div>
        </div>
        <p className="text-sm text-emerald-400 font-medium">
          You&apos;re ready to schedule your exam
        </p>
      </div>

      {/* Unit breakdown */}
      <div className="space-y-2">
        {units.map((u) => (
          <div key={u.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground truncate pr-2">
                {u.name}
              </span>
              <span
                className={`text-[11px] font-semibold tabular-nums ${
                  u.ready ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {u.pct}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  u.ready ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${progress > 0 ? u.pct : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Passing threshold indicator */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
          70% = ready to pass
        </span>
        <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
      </div>
    </div>
  );
}

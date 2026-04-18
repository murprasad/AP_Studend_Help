"use client";

/**
 * REQ-029 — Confidence-repair screen for post-diagnostic low scores.
 *
 * Renders between diagnostic completion and any subsequent modal for
 * users with passPercent < 60. Tells them honestly: "low starting score
 * is not a verdict" — here's where you'll be in 7 and 14 days if you
 * practice, here are your two weakest units, here's the guarantee if
 * you don't pass.
 *
 * Shown ONCE per diagnostic completion (sessionStorage flag keyed on
 * the diagnostic sessionId).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, ShieldCheck, Target, ArrowRight } from "lucide-react";
import { projectImprovement } from "@/lib/pass-engine";

interface UnitRow {
  unit: string;
  unitName: string;
  masteryScore: number;
}

interface Props {
  passPercent: number;
  units: UnitRow[];
  courseName: string;
  onContinue: () => void;
}

export function ConfidenceRepairScreen({ passPercent, units, courseName, onContinue }: Props) {
  const [shown] = useState(true);
  void shown;

  const in7 = projectImprovement(passPercent, 7);
  const in14 = projectImprovement(passPercent, 14);
  const sortedUnits = [...units].sort((a, b) => a.masteryScore - b.masteryScore);
  const weakest = sortedUnits.slice(0, 2);

  // Re-routing nudge for AP/SAT/ACT content-heavy courses where 2+ zero
  // units means the 2-week ramp may not be realistic — surface easier
  // alternatives first (exam momentum lifts later harder exams).
  const zeroUnits = units.filter((u) => u.masteryScore === 0).length;
  const HARD_COURSES = new Set([
    "AP Chemistry", "AP Biology", "AP Calculus BC", "AP Calculus AB",
    "AP Physics 1", "AP US History", "AP Statistics",
  ]);
  const suggestEasier = zeroUnits >= 2 && HARD_COURSES.has(courseName);

  const honestFraming = passPercent < 30
    ? "That's a big gap — but the diagnostic tells us exactly which units to fix."
    : passPercent < 45
    ? "You're at the starting line. Most students in this range close the gap in 3-4 weeks."
    : "You're closer than you think. Focused practice on 2-3 units is what gets you over the line.";

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full bg-card rounded-2xl border border-border/40 shadow-xl p-6 md:p-8 space-y-6 my-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagnostic complete</p>
          <h2 className="text-2xl md:text-3xl font-bold">Your {courseName} pass probability: <span className="text-primary">{Math.round(passPercent)}%</span></h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{honestFraming}</p>
        </header>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <p className="font-semibold text-sm">Here&apos;s where you can be with daily practice</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Now</p>
              <p className="text-2xl font-bold">{Math.round(passPercent)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">In 7 days</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">~{in7}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">In 14 days</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">~{in14}%</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Conservative projection from our practice-cohort data. Students who work harder beat this curve.</p>
        </div>

        {weakest.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <p className="font-semibold text-sm">Your two most fixable units</p>
            </div>
            <ul className="space-y-1.5">
              {weakest.map((u) => (
                <li key={u.unit} className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/30">
                  <span className="font-medium">{u.unitName}</span>
                  <span className="text-muted-foreground">{Math.round(u.masteryScore)}%</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Fix these two and your projected pass rate lifts faster than the average curve above.</p>
          </div>
        )}

        {suggestEasier && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-200">Honest suggestion — {courseName} is a tough first AP</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {zeroUnits} of your units are at 0%, and {courseName} is one of the content-heaviest AP exams. Many students start with <strong className="text-foreground">AP Psychology</strong> or <strong className="text-foreground">AP World History: Modern</strong> for momentum, then tackle the harder exams after building confidence. The score counts the same regardless of order.
            </p>
            <p className="text-xs text-muted-foreground">Still want to push through {courseName}? No problem — keep going below.</p>
          </div>
        )}

        <div className="rounded-xl border border-border/40 bg-secondary/30 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">Pass Confident Guarantee</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">If we show you 80%+ ready and you don&apos;t pass the real exam, you get 60 extra days free plus a full refund. Low starting score is fine — we&apos;ve built a path.</p>
        </div>

        <Button size="lg" className="w-full" onClick={onContinue}>
          Keep going <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Helper: should we show the repair screen for this user right now?
 * Kept separate so callers (and tests) can use it without pulling in the UI.
 */
export function shouldShowConfidenceRepair(opts: {
  passPercent: number;
  hasDiagnostic: boolean;
  diagnosticSessionId: string | null;
}): boolean {
  if (!opts.hasDiagnostic) return false;
  if (opts.passPercent >= 60) return false;
  if (typeof window === "undefined") return false;
  if (!opts.diagnosticSessionId) return false;
  try {
    const key = `confidence-repair-shown-${opts.diagnosticSessionId}`;
    return sessionStorage.getItem(key) !== "1";
  } catch {
    return true; // storage unavailable — err on the side of showing
  }
}

export function markConfidenceRepairShown(diagnosticSessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`confidence-repair-shown-${diagnosticSessionId}`, "1");
  } catch { /* non-blocking */ }
}

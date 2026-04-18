"use client";

/**
 * Post-session score-delta card — renders on the practice summary screen
 * once the session is completed. Fetches current readiness, compares to a
 * `beforeScore` captured when the session started, and animates the
 * between-number transition.
 *
 * Fire-and-forget: this is a pure UI addition, not a data write. If the
 * fetch fails we silently hide the card rather than break the summary.
 */

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles } from "lucide-react";

interface Readiness {
  family: "AP" | "SAT" | "ACT";
  scaledScore: number;
  scaleMax: number;
  showScore: boolean;
}

interface Props {
  /** Course in play — used to hit /api/readiness on the right exam. */
  course: string;
  /** Score captured BEFORE the session began. Pass `null` on first-ever session. */
  beforeScore: number | null;
  /** Family of beforeScore — needed to render the "3.2 → 3.5" copy correctly. */
  family?: "AP" | "SAT" | "ACT";
  /** Session summary bits for the sub-text. */
  totalQuestions: number;
  correctAnswers: number;
}

function formatScore(family: "AP" | "SAT" | "ACT", s: number): string {
  if (family === "SAT") return String(Math.round(s));
  return s.toFixed(1);
}

function formatDelta(family: "AP" | "SAT" | "ACT", delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  if (family === "SAT") return `${sign}${Math.round(delta)} SAT`;
  return `${sign}${delta.toFixed(1)} ${family}`;
}

/**
 * Simple rAF-driven tween from `from` → `to` over `durationMs`.
 * If `from` is null/undefined the value initializes to `to` (no animation).
 */
function useAnimatedNumber(to: number, from: number | null, durationMs = 900): number {
  // Start at `from` (if provided) so the user visually sees the climb.
  const initial = from ?? to;
  const [value, setValue] = useState(initial);
  const fromRef = useRef(initial);

  useEffect(() => {
    const start0 = fromRef.current;
    if (start0 === to) return;
    let raf = 0;
    const tStart = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - tStart) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(start0 + (to - start0) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);

  return value;
}

export function SessionDeltaCard({ course, beforeScore, family, totalQuestions, correctAnswers }: Props) {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setReadiness(d); })
      .catch(() => { if (!cancelled) setErrored(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  // Fire-and-forget: if the readiness call fails, hide entirely.
  const effFamily: "AP" | "SAT" | "ACT" = readiness?.family ?? family ?? "AP";
  const targetScore = readiness?.showScore ? readiness.scaledScore : null;
  const animated = useAnimatedNumber(targetScore ?? 0, beforeScore);

  if (loading) {
    return (
      <Card className="card-glow border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Updating your projected score…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errored || !readiness || targetScore === null) return null;

  // Pre-signal — first session ever, no `beforeScore` to compare against.
  if (beforeScore === null || !Number.isFinite(beforeScore)) {
    return (
      <Card className="card-glow border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Your first projected score: {formatScore(effFamily, animated)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalQuestions} questions answered · {correctAnswers} correct — keep practicing to calibrate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const delta = targetScore - beforeScore;
  const improved = delta > 0;
  const borderClass = improved ? "border-emerald-500/30 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5";
  const accentText = improved ? "text-emerald-500" : "text-blue-500";
  const accentBg = improved ? "bg-emerald-500/20" : "bg-blue-500/20";

  return (
    <Card className={`card-glow ${borderClass}`}>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${accentBg} flex items-center justify-center flex-shrink-0`}>
            <TrendingUp className={`h-5 w-5 ${accentText}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Projected {effFamily} score
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-muted-foreground">{formatScore(effFamily, beforeScore)}</span>
              <span className="text-muted-foreground">→</span>
              <span className={`text-3xl font-bold ${accentText} tabular-nums`}>
                {formatScore(effFamily, animated)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalQuestions} questions answered · {correctAnswers} correct ·{" "}
              <span className={improved ? accentText : undefined}>
                {formatDelta(effFamily, delta)} projected
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

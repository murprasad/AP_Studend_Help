"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, TrendingUp, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

interface Props {
  course: string;
}

interface ScoreAction {
  unit: string;
  unitLabel: string;
  currentMastery: number;
  totalAttempts: number;
  estQuestionsToTier: number;
  href: string;
  reason: string;
}

interface Readiness {
  family: "AP" | "SAT" | "ACT";
  scaledScore: number;
  scaledDisplay: string;
  scaleMax: number;
  label: string;
  confidence: "low" | "medium" | "high";
  showScore: boolean;
  sectionBreakdown?: Array<{ label: string; score: number; max: number }>;
  percentile?: number;
  disclaimer: string;
  totalSessions: number;
  totalAnswered: number;
  hasDiagnostic: boolean;
  /** Phase A (Beta 8.1): top-3 actions to boost score. AP only. */
  actions?: ScoreAction[];
}

export function ReadinessCard({ course }: Props) {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* graceful degrade */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <Card className="card-glow">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Calculating your projected score…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const familyColor = data.family === "AP" ? "text-blue-500" : data.family === "SAT" ? "text-emerald-500" : "text-violet-500";
  const familyBg = data.family === "AP" ? "bg-blue-500/10" : data.family === "SAT" ? "bg-emerald-500/10" : "bg-violet-500/10";
  const scaleLabel = data.family === "AP" ? "/5" : data.family === "SAT" ? "" : "/36";

  const confBadge = {
    low: { label: "Low confidence", cls: "text-muted-foreground border-border/40" },
    medium: { label: "Medium confidence", cls: "text-amber-700 dark:text-amber-400 dark:text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-500/5" },
    high: { label: "High confidence", cls: "text-emerald-600 dark:text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/5" },
  }[data.confidence];

  return (
    <Card className={`card-glow ${familyBg.replace("/10", "/5")} border-${data.family === "AP" ? "blue" : data.family === "SAT" ? "emerald" : "violet"}-500/20`}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-lg ${familyBg} flex items-center justify-center flex-shrink-0`}>
              <Target className={`h-5 w-5 ${familyColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Projected {data.family} Score</p>
              {data.showScore ? (
                <div className="flex items-baseline gap-1">
                  <p className={`text-3xl font-bold ${familyColor}`}>{data.scaledDisplay}</p>
                  {scaleLabel && <span className="text-sm text-muted-foreground">{scaleLabel}</span>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Rough estimate — more practice sharpens it</p>
              )}
              <p className="text-sm font-medium mt-0.5">{data.label}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${confBadge.cls}`}>
            {confBadge.label}
          </Badge>
        </div>

        {data.sectionBreakdown && data.sectionBreakdown.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-border/30">
            {data.sectionBreakdown.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${familyColor}`}>{s.score}<span className="text-xs text-muted-foreground">/{s.max}</span></p>
              </div>
            ))}
          </div>
        )}

        {typeof data.percentile === "number" && data.showScore && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>~{data.percentile}th national percentile</span>
          </div>
        )}

        {!data.hasDiagnostic && (
          <Link href="/diagnostic" className="block">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors">
              <span className="text-sm font-medium">Calibrate in 10 min → sharper score</span>
            </div>
          </Link>
        )}

        {data.actions && data.actions.length > 0 && (
          <div className="pt-2 border-t border-border/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide font-medium">
              <Zap className="h-3 w-3" />
              <span>Boost your score — do these next</span>
            </div>
            {data.actions.map((a) => (
              <Link
                key={a.unit}
                href={a.href}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40 hover:bg-accent transition-colors group"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-medium truncate">{a.unitLabel}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">{a.reason}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {a.totalAttempts > 0
                        ? `${a.currentMastery}% mastery · ~${a.estQuestionsToTier} Qs to next tier`
                        : `Untouched · start here · ~${a.estQuestionsToTier} Qs`}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/70 leading-relaxed pt-1">
          {data.disclaimer} <Link href="/methodology" className="underline hover:text-foreground">How we calculate this</Link>.
        </p>
      </CardContent>
    </Card>
  );
}

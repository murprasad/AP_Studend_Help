"use client";

/**
 * Projected-Score Hero — the ONE score surface on the dashboard.
 *
 * 2026-06-06 (Dashboard clarity ICA, defect D2). Previously this read
 * /api/pass-probability and rendered a 0-100 "Readiness" number, while the
 * sidebar (SidebarReadiness) AND analytics read /api/readiness and rendered
 * the native 400-1600 scaled score. Result: a student saw "781" (sidebar),
 * "45" (this hero), and "765" (analytics) for the same exam — three numbers,
 * two scales, no explanation.
 *
 * Fix: this hero now reads the SAME /api/readiness source as the sidebar, so
 * there is exactly ONE number on ONE scale everywhere (e.g. "Projected SAT
 * 780"). The "what to drill next" recommendation lives in WeaknessFocusCard
 * (the ?focus=weakness target) — the hero stays a clean single-number card to
 * reduce dashboard clutter.
 *
 * Component name kept as PassProbabilityHero so the dashboard-view import
 * doesn't break — only the data source + rendered copy changed.
 */

import { useEffect, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Readiness {
  family: "AP" | "SAT" | "ACT";
  scaledDisplay: string; // e.g. "780"
  scaleMax: number; // e.g. 1600
  label: string; // "On track for 1300+" / "Building from the base"
  confidence: "low" | "medium" | "high";
  showScore: boolean;
}

interface Props {
  course: string;
  courseDisplayName: string;
}

export function PassProbabilityHero({ course, courseDisplayName }: Props) {
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    // SAME source as SidebarReadiness — guarantees one number, no drift.
    fetch(`/api/readiness?course=${encodeURIComponent(course)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [course]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card p-6 text-center" data-testid="readiness-hero-loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">Reading your projected score…</p>
      </div>
    );
  }

  if (error) return null;

  // No baseline yet → prompt the diagnostic (the only way to unlock a score).
  if (!data || !data.showScore) {
    return (
      <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6" data-testid="readiness-hero-empty">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{courseDisplayName}</p>
        <h2 className="text-xl font-semibold mb-2">Take a 10-min diagnostic to see your projected {data?.family ?? "exam"} score.</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Every session after that updates this one number on the real {familyScaleText(data?.family)} scale.
        </p>
        <Button asChild>
          <Link href="/diagnostic">Start diagnostic →</Link>
        </Button>
      </div>
    );
  }

  const scaleSuffix = data.family === "AP" ? " / 5" : data.family === "SAT" ? " / 1600" : " / 36";
  const tier = data.label.replace(/^On track for /, "").trim();

  return (
    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6" data-testid="readiness-hero">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Projected {data.family} score · {courseDisplayName}</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-6xl font-bold text-emerald-700 dark:text-emerald-400 leading-none" data-testid="readiness-score">{data.scaledDisplay}</span>
        <span className="text-lg text-muted-foreground">{scaleSuffix}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{tier}</p>
      {data.confidence === "low" && (
        <p className="text-xs text-muted-foreground mt-1">Early estimate — answer more to sharpen it.</p>
      )}

      <div className="mt-4 pt-4 border-t border-border/30">
        <Link
          href="/dashboard?focus=weakness"
          className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:gap-2 transition-all"
          data-testid="readiness-lift-link"
        >
          See what would lift your number
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function familyScaleText(family?: "AP" | "SAT" | "ACT"): string {
  if (family === "AP") return "1–5";
  if (family === "ACT") return "1–36";
  return "400–1600";
}

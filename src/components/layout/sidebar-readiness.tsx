"use client";

import { useEffect, useState } from "react";
import { useCourse } from "@/hooks/use-course";
import { Target } from "lucide-react";
import Link from "next/link";

interface Readiness {
  family: "AP" | "SAT" | "ACT";
  scaledDisplay: string;
  scaleMax: number;
  label: string;
  confidence: "low" | "medium" | "high";
  showScore: boolean;
}

/**
 * Compact sidebar pill showing the user's projected score for the
 * current selected course. Reads from /api/readiness so it always
 * matches the dashboard hero (no drift).
 */
export function SidebarReadiness() {
  const [course] = useCourse();
  const [data, setData] = useState<Readiness | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!course) return;
    fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [course]);

  if (!data) return null;
  if (!data.showScore) return null;

  const color =
    data.family === "AP" ? "text-blue-500" :
    data.family === "SAT" ? "text-emerald-500" :
    "text-violet-500";
  const scaleSuffix = data.family === "AP" ? "/5" : data.family === "SAT" ? "" : "/36";

  return (
    <Link
      href="/dashboard"
      className="mx-2 my-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 hover:bg-accent transition-colors"
    >
      <Target className={`h-4 w-4 ${color} flex-shrink-0`} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Projected {data.family}</p>
        <p className="text-sm font-semibold">
          <span className={color}>{data.scaledDisplay}</span>
          <span className="text-muted-foreground text-xs">{scaleSuffix}</span>
          <span className="text-xs text-muted-foreground ml-1.5">· {data.label.replace("On track for ", "")}</span>
        </p>
      </div>
    </Link>
  );
}

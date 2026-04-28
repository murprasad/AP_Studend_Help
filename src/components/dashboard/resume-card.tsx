"use client";

/**
 * ResumeCard — retention loop's "Continue where you left off" hook.
 *
 * Renders ONLY when the user has an IN_PROGRESS PracticeSession for the
 * currently-selected course. Goal: surface the unfinished session at the
 * top of the dashboard so returning users have one obvious next action.
 *
 * Part of task #56 (StudentNest retention loop). The post-session copy
 * ("You're 72% done with Unit N") and the +24h email nudge are future
 * increments; this component is the minimum viable hook.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlayCircle } from "lucide-react";

interface InProgress {
  id: string;
  sessionType: string;
  totalQuestions: number;
  answered: number;
  startedAt: string;
}

export function ResumeCard({ course }: { course: string }) {
  const [data, setData] = useState<InProgress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/practice/in-progress?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d?.session || null);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [course]);

  if (!loaded || !data) return null;

  const remaining = Math.max(0, (data.totalQuestions || 0) - (data.answered || 0));
  const percent = data.totalQuestions
    ? Math.round((data.answered / data.totalQuestions) * 100)
    : 0;

  const href =
    data.sessionType === "DIAGNOSTIC" ? "/diagnostic"
    : data.sessionType === "MOCK_EXAM" ? "/mock-exam"
    : `/practice?resume=${data.id}`;

  const label =
    data.sessionType === "DIAGNOSTIC" ? "Diagnostic"
    : data.sessionType === "MOCK_EXAM" ? "Mock Exam"
    : "Practice Session";

  return (
    <Card className="rounded-[16px] border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-amber-500/10 shadow-sm">
      <CardContent className="p-4 sm:p-5 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <PlayCircle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold leading-tight">
            Continue where you left off
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {label} · {percent}% done
            {remaining > 0 ? ` · ${remaining} question${remaining === 1 ? "" : "s"} left` : ""}
          </p>
        </div>
        <Link href={href}>
          <Button size="sm" className="rounded-full h-9 px-4 bg-amber-500 text-white hover:bg-amber-600">
            Resume <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

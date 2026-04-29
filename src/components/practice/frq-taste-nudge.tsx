"use client";

/**
 * FrqTasteNudge — first-time-user FRQ insertion (Beta 8.13.3).
 *
 * Renders on the MCQ session-summary screen ONLY for users who have:
 *   - 0 prior FRQ submissions for this course
 *   - just finished an MCQ session (parent gates this — we just check FRQ count)
 *
 * CTA routes to /frq-practice?course=X&first_taste=1 — that page will auto-
 * surface the highest-quality FRQ with a "your first free FRQ" banner.
 *
 * Strategic intent (per ChatGPT spec critique 2026-04-29):
 * The differentiator vs every other MCQ tool is FRQ + AI rubric grading.
 * If the user finishes a 5-Q MCQ session and never sees that, the product
 * looks like "yet another MCQ tool" and conversion stays flat. This nudge
 * inserts the FRQ taste between Q5 and the dashboard so the perception
 * shifts to "this place actually grades like CB."
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollText, ArrowRight, ShieldCheck } from "lucide-react";

interface Props {
  course: string;
}

export function FrqTasteNudge({ course }: Props) {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/practice/frq-attempts-count?course=${course}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { count?: number } | null) => {
        if (cancelled) return;
        // Only show when user has 0 prior FRQ attempts in this course.
        // First-time taste — we want the "try a real FRQ" moment to land
        // exactly once per (user, course) pair.
        setShow((data?.count ?? 0) === 0);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [course]);

  if (!loaded || !show) return null;

  return (
    <Card className="rounded-[16px] border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-blue-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <ScrollText className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight">
              Now try one real AP-style FRQ
            </p>
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              MCQs warm up your brain. The AP exam is graded on written answers — write one and see exactly how it scores against the official College Board rubric.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <p className="text-[13px] leading-snug">
            <strong>Free first attempt</strong> — no card, no upgrade. See the rubric, write your answer, get scored.
          </p>
        </div>

        <a
          href={`/frq-practice?course=${course}&first_taste=1`}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
        >
          Try a real FRQ now <ArrowRight className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}

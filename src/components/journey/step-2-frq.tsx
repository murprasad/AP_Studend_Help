"use client";

/**
 * Step 2 — 1 curated FRQ (Beta 9.5).
 *
 * Picks the first available FRQ for the course, embeds the existing
 * FrqPracticeCard. On reveal complete → continue.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { FrqPracticeCard } from "@/components/practice/frq-practice-card";

interface FrqRow {
  id: string;
  course: string;
  unit: string | null;
  year: number | null;
  questionNumber: number | null;
  type: string;
  sourceUrl: string | null;
  promptText: string;
  stimulus: string | null;
  totalPoints: number | null;
}

interface Props {
  course: string;
  /** When the FRQ is already in flight from a parent prefetch. */
  prefetchedFrq?: FrqRow | null;
  onComplete: (frqId: string) => void;
}

export function Step2Frq({ course, prefetchedFrq, onComplete }: Props) {
  const [frq, setFrq] = useState<FrqRow | null>(prefetchedFrq ?? null);
  const [loading, setLoading] = useState(!prefetchedFrq);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (frq) return;
    let cancelled = false;
    fetch(`/api/frq?course=${course}&limit=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const first = Array.isArray(d.frqs) && d.frqs.length > 0 ? d.frqs[0] : null;
        if (!first) {
          setError("No FRQ available for this course yet.");
        } else {
          setFrq(first);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [course, frq]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !frq) {
    return (
      <div className="text-center pt-12 space-y-3">
        <p className="text-sm text-muted-foreground">{error ?? "No FRQ found."}</p>
        <Button variant="outline" onClick={() => onComplete("")}>
          Skip step
        </Button>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Step 2 · Real AP question
        </p>
        <p className="text-sm mt-0.5">
          Try one — see how AP is graded.
        </p>
        {/* 2026-05-01 — official-source provenance badge. The FRQ is a real
            College Board released exam, not AI-generated. Showing year +
            source builds trust at the conversion moment. */}
        {(frq.year || frq.sourceUrl) && (
          <p className="text-[11px] mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <span aria-hidden>📋</span>
            {frq.year ? `From ${frq.year} College Board released exam` : "Official College Board released exam"}
            {frq.questionNumber ? ` · Q${frq.questionNumber}` : ""}
          </p>
        )}
      </div>

      <FrqPracticeCard
        frqId={frq.id}
        onRevealed={() => setRevealed(true)}
      />

      {revealed && (
        <div className="space-y-3">
          {/* Beta 9.6 — Sage taste at the moment of need. Pre-loads tutor
              with this FRQ's prompt so the user sees Sage's value
              right after seeing the rubric. Opens in a new tab so the
              journey state on this tab survives the diversion. */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Want help improving this answer?
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sage can explain the rubric, suggest stronger evidence, or grade your draft. One free chat.
              </p>
              <Link
                href={`/ai-tutor?prompt=${encodeURIComponent(
                  `I'm working on this AP FRQ. Can you help me improve my answer based on the rubric?\n\nQuestion:\n${frq.promptText.slice(0, 800)}\n\nWhat are the key things AP graders look for in a strong response here?`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2"
              >
                <Button size="sm" variant="outline" className="rounded-full gap-2 border-indigo-500/40 hover:bg-indigo-500/10">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask Sage
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center space-y-3">
            <p className="text-base font-semibold">That&apos;s how AP scores work.</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Now a quick diagnostic to estimate your overall AP score.
            </p>
            <Button onClick={() => onComplete(frq.id)} className="rounded-full gap-2">
              See my projected score
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

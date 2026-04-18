"use client";

/**
 * Shared primitives used across every per-type FRQ input & reveal component.
 *
 * Kept intentionally small — the per-type components hold all the structural
 * logic; this file only covers visual atoms (rubric checklist item, word
 * counter, section header) that would otherwise repeat in 14 files.
 */
import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Quick word count — naive whitespace split is good enough for the UI hint;
 * the real exam doesn't cap words, but CollegeBoard recommends ~200 for SAQ
 * sub-parts and ~1200+ for DBQ/LEQ essays.
 */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function WordCounter({
  text,
  recommended,
}: {
  text: string;
  recommended?: number;
}) {
  const words = wordCount(text);
  const over = recommended ? words > recommended * 1.5 : false;
  const under = recommended ? words < Math.max(10, recommended * 0.25) : false;
  return (
    <p
      className={cn(
        "text-xs",
        over
          ? "text-amber-500"
          : under
          ? "text-muted-foreground"
          : "text-muted-foreground"
      )}
    >
      {words} word{words === 1 ? "" : "s"}
      {recommended ? ` · recommended ~${recommended}` : ""}
    </p>
  );
}

export function SectionHeading({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>
      {right}
    </div>
  );
}

/**
 * A single rubric line that the student can check off during self-grade.
 * Used by every reveal component.
 */
export function RubricChecklistItem({
  label,
  criterion,
  points,
  keywords,
  checked,
  onToggle,
}: {
  label?: string;
  criterion: string;
  points: number;
  keywords?: string[];
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full text-left flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent/30",
        checked ? "border-amber-500/40 bg-amber-500/5" : "border-border"
      )}
    >
      {checked ? (
        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
      ) : (
        <Circle className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            {label ? <span className="text-amber-500 mr-1">{label}.</span> : null}
            {criterion || "(no criterion text)"}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {points} pt{points !== 1 ? "s" : ""}
          </span>
        </div>
        {keywords && keywords.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Look for: {keywords.join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
}

/**
 * "Your answer" echo shown on the reveal screen. Accepts the answers record
 * and walks it in the same order the input component used.
 */
export function StudentAnswerEcho({
  answers,
  labels,
}: {
  answers: Record<string, string>;
  labels: { key: string; display?: string }[];
}) {
  const anyAnswered = labels.some(
    (l) => answers[l.key] && answers[l.key].trim().length > 0
  );
  if (!anyAnswered) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm">
        <span className="text-muted-foreground italic">
          (no answer recorded)
        </span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {labels.map(({ key, display }) => {
        const text = answers[key];
        if (!text || !text.trim()) return null;
        return (
          <div key={key} className="rounded-md border bg-muted/40 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px]">
                {display ?? key}
              </Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Self-score badge rendered on every reveal component header.
 */
export function SelfScoreBadge({
  score,
  total,
}: {
  score: number;
  total: number;
}) {
  return (
    <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30">
      Self-score: {score}/{total}
    </Badge>
  );
}

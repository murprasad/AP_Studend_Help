"use client";

/**
 * LEQ reveal — 5-section rubric checklist + essay echo + sample.
 */
import { useMemo, useState } from "react";
import type { LeqRubric } from "@/lib/frq-types";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
} from "./shared";

interface LeqRevealProps {
  rubric: LeqRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function LeqReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: LeqRevealProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () => [
      {
        key: "thesis",
        label: "Thesis",
        points: rubric.sections.thesis.points,
        criterion: rubric.sections.thesis.criterion,
      },
      {
        key: "context",
        label: "Context",
        points: rubric.sections.context.points,
        criterion: rubric.sections.context.criterion,
      },
      {
        key: "evidence",
        label: "Evidence",
        points: rubric.sections.evidence.points,
        criterion: rubric.sections.evidence.criterion,
      },
      {
        key: "reasoning",
        label: "Reasoning",
        points: rubric.sections.reasoning.points,
        criterion: rubric.sections.reasoning.criterion,
      },
      {
        key: "complexity",
        label: "Complexity",
        points: rubric.sections.complexity.points,
        criterion: rubric.sections.complexity.criterion,
      },
    ],
    [rubric]
  );

  const selfScore = useMemo(
    () =>
      rows.reduce((sum, r) => sum + (checked.has(r.key) ? r.points : 0), 0),
    [rows, checked]
  );

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const essay = studentAnswers.essay ?? "";

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Your essay</SectionHeading>
        <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
          {essay || (
            <span className="text-muted-foreground italic">
              (no answer recorded)
            </span>
          )}
        </div>
      </section>

      <section>
        <SectionHeading
          right={
            <SelfScoreBadge score={selfScore} total={rubric.totalPoints} />
          }
        >
          Official rubric — check what you got
        </SectionHeading>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key}>
              <RubricChecklistItem
                label={r.label}
                criterion={r.criterion}
                points={r.points}
                checked={checked.has(r.key)}
                onToggle={() => toggle(r.key)}
              />
            </li>
          ))}
        </ul>
      </section>

      {sampleResponse && (
        <section>
          <SectionHeading>High-scoring sample essay</SectionHeading>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm whitespace-pre-wrap">
            {sampleResponse}
          </div>
        </section>
      )}
    </div>
  );
}

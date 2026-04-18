"use client";

/**
 * Investigative reveal — dataset recap + per-part rubric checklist.
 */
import { useMemo, useState } from "react";
import type { InvestigativeRubric } from "@/lib/frq-types";
import { Database } from "lucide-react";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
  StudentAnswerEcho,
} from "./shared";

interface InvestigativeRevealProps {
  rubric: InvestigativeRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function InvestigativeReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: InvestigativeRevealProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const selfScore = useMemo(
    () =>
      rubric.parts.reduce(
        (sum, p, i) => sum + (checked.has(i) ? p.points : 0),
        0
      ),
    [rubric.parts, checked]
  );

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const echoLabels =
    rubric.parts.length > 0
      ? rubric.parts.map((p) => ({
          key: p.label,
          display:
            p.label === "full" ? "Your response" : `Part ${p.label.toUpperCase()}`,
        }))
      : [{ key: "full", display: "Your response" }];

  return (
    <div className="space-y-6">
      {rubric.datasetNotes && (
        <section className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <Database className="h-3.5 w-3.5" />
            Dataset / scenario notes
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {rubric.datasetNotes}
          </p>
        </section>
      )}

      <section>
        <SectionHeading>Your answer</SectionHeading>
        <StudentAnswerEcho answers={studentAnswers} labels={echoLabels} />
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
          {rubric.parts.map((p, i) => (
            <li key={`${p.label}-${i}`}>
              <RubricChecklistItem
                label={
                  p.label && p.label !== "full"
                    ? p.label.toUpperCase()
                    : undefined
                }
                criterion={p.criterion}
                points={p.points}
                keywords={p.keywords}
                checked={checked.has(i)}
                onToggle={() => toggle(i)}
              />
            </li>
          ))}
        </ul>
      </section>

      {sampleResponse && (
        <section>
          <SectionHeading>High-scoring sample response</SectionHeading>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm whitespace-pre-wrap">
            {sampleResponse}
          </div>
        </section>
      )}
    </div>
  );
}

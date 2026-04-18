"use client";

/**
 * SAQ reveal — per-part rubric checklist + student echo + optional sample.
 */
import { useMemo, useState } from "react";
import type { SaqRubric } from "@/lib/frq-types";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
  StudentAnswerEcho,
} from "./shared";

interface SaqRevealProps {
  rubric: SaqRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function SaqReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: SaqRevealProps) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const selfScore = useMemo(
    () =>
      rubric.subParts.reduce(
        (sum, sp, i) => sum + (checked.has(i) ? sp.points : 0),
        0
      ),
    [rubric.subParts, checked]
  );

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Your answer</SectionHeading>
        <StudentAnswerEcho
          answers={studentAnswers}
          labels={rubric.subParts.map((sp) => ({
            key: sp.label,
            display: `Part ${sp.label}`,
          }))}
        />
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
          {rubric.subParts.map((sp, i) => (
            <li key={`${sp.label}-${i}`}>
              <RubricChecklistItem
                label={sp.label}
                criterion={sp.criterion}
                points={sp.points}
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

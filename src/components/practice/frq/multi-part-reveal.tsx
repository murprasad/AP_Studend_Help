"use client";

/**
 * Multi-part reveal — per-part rubric checklist + student echo + sample.
 *
 * Shared by SHORT, LONG, MULTI_PART FRQ types. Legacy Physics rubrics (before
 * this refactor) also flow through here via the parseRubric coercer — they
 * get rendered as a flat list of parts with no label prefix.
 */
import { useMemo, useState } from "react";
import type { MultiPartRubric } from "@/lib/frq-types";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
  StudentAnswerEcho,
} from "./shared";

interface MultiPartRevealProps {
  rubric: MultiPartRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function MultiPartReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: MultiPartRevealProps) {
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

  // Build labels for the student-echo. SHORT / LONG collapse to a single
  // `full` response to match the input component; MULTI_PART labels per part.
  const collapseToSingle = rubric.type === "SHORT" || rubric.type === "LONG";
  const echoLabels =
    !collapseToSingle && rubric.parts.length > 0
      ? rubric.parts.map((p) => ({
          key: p.label,
          display: p.label === "full" ? "Your response" : `Part ${p.label.toUpperCase()}`,
        }))
      : [{ key: "full", display: "Your response" }];

  return (
    <div className="space-y-6">
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

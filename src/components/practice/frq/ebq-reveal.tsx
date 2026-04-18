"use client";

/**
 * EBQ reveal — excerpt cards recap + per-part rubric checklist.
 */
import { useMemo, useState } from "react";
import { Quote } from "lucide-react";
import type { EbqRubric } from "@/lib/frq-types";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
  StudentAnswerEcho,
} from "./shared";

interface EbqRevealProps {
  rubric: EbqRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function EbqReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: EbqRevealProps) {
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

  const excerpts = rubric.excerpts.slice(0, 3);

  const echoLabels =
    rubric.parts.length > 0
      ? rubric.parts.map((p) => ({
          key: p.label,
          display:
            p.label === "full"
              ? "Your response"
              : `Part ${p.label.toUpperCase()}`,
        }))
      : [{ key: "full", display: "Your response" }];

  return (
    <div className="space-y-6">
      {excerpts.length > 0 && (
        <section className="space-y-2">
          <SectionHeading>Excerpts (refresher)</SectionHeading>
          <div className="grid gap-2 sm:grid-cols-3">
            {excerpts.map((ex) => (
              <div
                key={ex.id}
                className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <Quote className="h-3 w-3" />
                  {ex.id}
                </div>
                {ex.source && (
                  <p className="italic text-muted-foreground">{ex.source}</p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {ex.excerpt}
                </p>
              </div>
            ))}
          </div>
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

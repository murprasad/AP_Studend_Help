"use client";

/**
 * EBQ (Evidence-Based Question) — AP Psychology.
 *
 * Up to 3 short excerpts (sources or scenarios) shown as cards at the top,
 * followed by per-part textareas. Similar shape to AAQ but with excerpts
 * instead of article meta.
 */
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Quote } from "lucide-react";
import type { EbqRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface EbqInputProps {
  rubric: EbqRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

export function EbqInput({ rubric, onSubmit, submitting }: EbqInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const parts =
    rubric.parts.length > 0
      ? rubric.parts
      : [{ label: "full", points: rubric.totalPoints, criterion: "" }];

  // Display up to 3 excerpts; the rubric may ship more but the AP exam format
  // never does. Extra excerpts are dropped visually but stay in the JSON.
  const excerpts = rubric.excerpts.slice(0, 3);

  const isEmpty =
    Object.values(answers).filter((v) => v.trim().length > 0).length === 0;

  return (
    <div className="space-y-5">
      {excerpts.length > 0 && (
        <section className="space-y-2">
          <SectionHeading>Excerpts</SectionHeading>
          <div className="grid gap-2 sm:grid-cols-3">
            {excerpts.map((ex) => (
              <article
                key={ex.id}
                className="rounded-md border bg-muted/30 p-3 text-sm space-y-1.5"
              >
                <header className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                  <Quote className="h-3.5 w-3.5" />
                  {ex.id}
                </header>
                {ex.source && (
                  <p className="text-[11px] italic text-muted-foreground">
                    {ex.source}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                  {ex.excerpt}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {parts.map((part, i) => (
        <section key={`${part.label}-${i}`} className="space-y-1.5">
          <SectionHeading
            right={
              <Badge variant="outline" className="text-[10px]">
                {part.points} pt{part.points !== 1 ? "s" : ""}
              </Badge>
            }
          >
            {part.label === "full" ? "Your response" : `Part ${part.label.toUpperCase()}`}
          </SectionHeading>
          <Textarea
            value={answers[part.label] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [part.label]: e.target.value }))
            }
            placeholder={`Use the excerpts as evidence. Cite them explicitly (e.g. "Source 1 shows...").`}
            rows={part.label === "full" ? 10 : 5}
            className="text-sm"
          />
          <WordCounter text={answers[part.label] ?? ""} recommended={150} />
        </section>
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          onClick={() => onSubmit(answers)}
          disabled={submitting || isEmpty}
          className="gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Reveal rubric &amp; sample response
        </Button>
      </div>
    </div>
  );
}

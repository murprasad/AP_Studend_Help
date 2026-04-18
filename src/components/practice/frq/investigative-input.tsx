"use client";

/**
 * Investigative FRQ — AP Statistics Q6.
 *
 * Like a multi-part input but the student also sees a `datasetNotes` panel
 * above the parts. That's where we stash the table / summary / scenario
 * description — stats Q6 always leans on a dataset.
 */
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database } from "lucide-react";
import type { InvestigativeRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface InvestigativeInputProps {
  rubric: InvestigativeRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

export function InvestigativeInput({
  rubric,
  onSubmit,
  submitting,
}: InvestigativeInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const parts =
    rubric.parts.length > 0
      ? rubric.parts
      : [{ label: "full", points: rubric.totalPoints, criterion: "" }];

  const isEmpty =
    Object.values(answers).filter((v) => v.trim().length > 0).length === 0;

  return (
    <div className="space-y-5">
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
            placeholder={
              part.label === "full"
                ? "Work through the investigation. Reference the dataset explicitly."
                : `Answer part ${part.label.toUpperCase()} — reference the dataset.`
            }
            rows={part.label === "full" ? 12 : 6}
            className="font-mono text-sm"
          />
          <WordCounter text={answers[part.label] ?? ""} />
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

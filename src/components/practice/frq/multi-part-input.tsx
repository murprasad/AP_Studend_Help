"use client";

/**
 * Multi-part FRQ — AP Physics, Chem, Bio, Calc AB/BC.
 *
 * Students see one labelled textarea per part (a, b, c, d, ...) with the
 * point value for that part. We encourage free-form math + prose (the real
 * exam answer booklet is similarly unstructured — this just gives the student
 * a visual anchor for "am I on part (c) yet?").
 *
 * Covers FrqType: SHORT, LONG, MULTI_PART. (SHORT/LONG still use this
 * component — on the real exam those only differ by total points and time
 * budget, not structure.)
 */
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { MultiPartRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface MultiPartInputProps {
  rubric: MultiPartRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

export function MultiPartInput({
  rubric,
  onSubmit,
  submitting,
}: MultiPartInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // SHORT / LONG Physics-style rubrics list scoring criteria as `parts`, but
  // the student writes ONE response across all prompt parts (the prompt itself
  // already has "(a) derive...", "(b) sketch..."). So we collapse to a single
  // textarea for SHORT / LONG and only render per-part textareas when the
  // type is explicitly MULTI_PART.
  const collapseToSingle = rubric.type === "SHORT" || rubric.type === "LONG";

  const parts =
    collapseToSingle || rubric.parts.length === 0
      ? [{ label: "full", points: rubric.totalPoints, criterion: "" }]
      : rubric.parts;

  const isEmpty =
    Object.values(answers).filter((v) => v.trim().length > 0).length === 0;

  return (
    <div className="space-y-5">
      {parts.map((part, i) => (
        <section key={`${part.label}-${i}`} className="space-y-1.5">
          <SectionHeading
            right={
              <Badge variant="outline" className="text-[10px]">
                {part.points} pt{part.points !== 1 ? "s" : ""}
              </Badge>
            }
          >
            {renderPartHeader(part.label)}
            {part.criterion ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                — {truncate(part.criterion)}
              </span>
            ) : null}
          </SectionHeading>
          <Textarea
            value={answers[part.label] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [part.label]: e.target.value }))
            }
            placeholder={
              part.label === "full"
                ? "Work through each part. Show your equations, reasoning, and final answer with units."
                : `Show your work for part ${prettyLabel(part.label)}.`
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

/** Turn "a" / "b" / "(a)" / "Part a" into a consistent "Part A" header. */
function renderPartHeader(raw: string): string {
  if (raw === "full") return "Your response";
  return `Part ${prettyLabel(raw)}`;
}

function prettyLabel(raw: string): string {
  const clean = raw.replace(/^part\s*/i, "").replace(/[()\s]/g, "");
  return clean.toUpperCase();
}

function truncate(s: string, max = 90): string {
  return s.length > max ? `${s.slice(0, max).trim()}…` : s;
}

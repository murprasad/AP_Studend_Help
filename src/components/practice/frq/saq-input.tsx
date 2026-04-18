"use client";

/**
 * SAQ (Short-Answer Question) — AP History.
 *
 * Real exam format: 3 sub-parts (A, B, C), each worth 1 point. Students write
 * 3–5 sentences per part, with CollegeBoard recommending ~150 words per sub.
 *
 * We enforce the 3-part structure at the UI level, but read the actual labels
 * and criterion from the typed rubric so prompts can vary.
 */
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { SaqRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface SaqInputProps {
  rubric: SaqRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

export function SaqInput({ rubric, onSubmit, submitting }: SaqInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const isEmpty =
    Object.values(answers).filter((v) => v.trim().length > 0).length === 0;

  // If the rubric has no sub-parts (fallback shape), fall back to the standard
  // A/B/C scaffold so the student can still write something.
  const subParts =
    rubric.subParts.length > 0
      ? rubric.subParts
      : ([
          { label: "A", points: 1, criterion: "" },
          { label: "B", points: 1, criterion: "" },
          { label: "C", points: 1, criterion: "" },
        ] as SaqRubric["subParts"]);

  return (
    <div className="space-y-5">
      {subParts.map((sp) => (
        <section key={sp.label} className="space-y-1.5">
          <SectionHeading
            right={
              <Badge variant="outline" className="text-[10px]">
                {sp.points} pt{sp.points !== 1 ? "s" : ""}
              </Badge>
            }
          >
            Part {sp.label}
            {sp.criterion ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                — {truncateCriterion(sp.criterion)}
              </span>
            ) : null}
          </SectionHeading>
          <Textarea
            value={answers[sp.label] ?? ""}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [sp.label]: e.target.value }))
            }
            placeholder={`Write 3–5 sentences for part ${sp.label}.`}
            rows={5}
            className="text-sm"
          />
          <WordCounter text={answers[sp.label] ?? ""} recommended={150} />
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

/** Keep long criteria from eating the whole header row. */
function truncateCriterion(s: string, max = 80): string {
  return s.length > max ? `${s.slice(0, max).trim()}…` : s;
}

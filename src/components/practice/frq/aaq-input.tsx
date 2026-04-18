"use client";

/**
 * AAQ (Article Analysis Question) — AP Psychology.
 *
 * Students read a short research-article summary (methodology, participants,
 * findings) and answer multi-part questions about it. Article meta displays
 * above the parts.
 */
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen } from "lucide-react";
import type { AaqRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface AaqInputProps {
  rubric: AaqRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

export function AaqInput({ rubric, onSubmit, submitting }: AaqInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const parts =
    rubric.parts.length > 0
      ? rubric.parts
      : [{ label: "full", points: rubric.totalPoints, criterion: "" }];

  const isEmpty =
    Object.values(answers).filter((v) => v.trim().length > 0).length === 0;

  const hasMeta =
    !!rubric.articleMeta.title ||
    !!rubric.articleMeta.methodology ||
    !!rubric.articleMeta.participants;

  return (
    <div className="space-y-5">
      {hasMeta && (
        <section className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
            <BookOpen className="h-3.5 w-3.5" />
            Article under analysis
          </div>
          {rubric.articleMeta.title && (
            <p className="text-sm font-medium">{rubric.articleMeta.title}</p>
          )}
          {rubric.articleMeta.methodology && (
            <MetaRow label="Methodology" value={rubric.articleMeta.methodology} />
          )}
          {rubric.articleMeta.participants && (
            <MetaRow
              label="Participants"
              value={rubric.articleMeta.participants}
            />
          )}
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
            placeholder={`Answer part ${
              part.label === "full" ? "" : part.label.toUpperCase()
            } — cite the article.`}
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs">
      <span className="font-semibold text-muted-foreground">{label}: </span>
      <span className="whitespace-pre-wrap">{value}</span>
    </p>
  );
}

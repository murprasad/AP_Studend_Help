"use client";

/**
 * LEQ (Long Essay Question) — AP History.
 *
 * Same idea as DBQ but *without* documents — students argue from their own
 * outside knowledge. 6-point rubric: thesis, context, evidence, reasoning,
 * complexity. Word target is ~800 words.
 */
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bookmark } from "lucide-react";
import type { LeqRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface LeqInputProps {
  rubric: LeqRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

const BOOKMARKS: { label: string; key: keyof LeqRubric["sections"] }[] = [
  { label: "Thesis", key: "thesis" },
  { label: "Context", key: "context" },
  { label: "Evidence", key: "evidence" },
  { label: "Reasoning", key: "reasoning" },
  { label: "Complexity", key: "complexity" },
];

export function LeqInput({ rubric, onSubmit, submitting }: LeqInputProps) {
  const [essay, setEssay] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function insertSectionHeader(label: string) {
    const ta = textareaRef.current;
    const snippet = `## ${label}\n`;
    if (!ta) {
      setEssay((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
      return;
    }
    const start = ta.selectionStart ?? essay.length;
    const end = ta.selectionEnd ?? essay.length;
    const before = essay.slice(0, start);
    const after = essay.slice(end);
    const lead = before && !before.endsWith("\n\n") ? "\n\n" : "";
    const next = `${before}${lead}${snippet}${after}`;
    setEssay(next);
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = before.length + lead.length + snippet.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="space-y-3">
      <SectionHeading
        right={
          <Badge variant="outline" className="text-[10px]">
            {rubric.totalPoints} pts
          </Badge>
        }
      >
        Your essay
      </SectionHeading>

      <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 p-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground pr-1">
          <Bookmark className="h-3 w-3" />
          Insert section:
        </span>
        {BOOKMARKS.map((b) => (
          <Button
            key={b.key}
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px]"
            onClick={() => insertSectionHeader(b.label)}
          >
            {b.label} ({rubric.sections[b.key].points} pt)
          </Button>
        ))}
      </div>

      <Textarea
        ref={textareaRef}
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="Write your LEQ. Use `## Thesis`, `## Context`, etc. headers to signal each rubric category."
        rows={20}
        className="text-sm font-mono"
      />
      <WordCounter text={essay} recommended={800} />

      <div className="flex justify-end pt-1">
        <Button
          onClick={() => onSubmit({ essay })}
          disabled={submitting || essay.trim().length === 0}
          className="gap-2"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Reveal rubric &amp; sample response
        </Button>
      </div>
    </div>
  );
}

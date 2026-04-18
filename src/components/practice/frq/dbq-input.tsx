"use client";

/**
 * DBQ (Document-Based Question) — AP History.
 *
 * Real exam UX:
 *   - 7 short primary-source documents shown left of the essay
 *   - Students write ~one long essay weaving citations `[Doc 1]` etc.
 *   - Rubric has 6 sections (thesis, context, evidence from docs, evidence
 *     beyond docs, HIPP analysis, complexity) totaling 7 points.
 *
 * Our input has two pieces:
 *   - Document pane (left, scrollable on desktop; stacked on mobile)
 *   - Essay pane (right) with:
 *       · section-bookmark helper buttons that insert headers
 *       · "Cite Doc X" buttons that append `[Doc X]` to the essay
 *       · word counter (recommended ~1000 words)
 *
 * We store the whole essay under the key `essay`. The dispatcher wraps the
 * single-string record so the submit API still gets `Record<string,string>`.
 */
import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Bookmark } from "lucide-react";
import type { DbqRubric } from "@/lib/frq-types";
import { SectionHeading, WordCounter } from "./shared";

interface DbqInputProps {
  rubric: DbqRubric;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
}

const BOOKMARKS: { label: string; key: keyof DbqRubric["sections"] }[] = [
  { label: "Thesis", key: "thesis" },
  { label: "Context", key: "context" },
  { label: "Evidence", key: "evidenceFromDocs" },
  { label: "Beyond Docs", key: "evidenceBeyondDocs" },
  { label: "HIPP", key: "hipp" },
  { label: "Complexity", key: "complexity" },
];

export function DbqInput({ rubric, onSubmit, submitting }: DbqInputProps) {
  const [essay, setEssay] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function appendAtCursor(snippet: string, addSpacing = true) {
    const ta = textareaRef.current;
    if (!ta) {
      setEssay((prev) => prev + (addSpacing && prev ? "\n\n" : "") + snippet);
      return;
    }
    const start = ta.selectionStart ?? essay.length;
    const end = ta.selectionEnd ?? essay.length;
    const before = essay.slice(0, start);
    const after = essay.slice(end);
    const lead = addSpacing && before && !before.endsWith("\n\n") ? "\n\n" : "";
    const next = `${before}${lead}${snippet}${after}`;
    setEssay(next);
    // Put cursor after the inserted snippet on next tick.
    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      const pos = before.length + lead.length + snippet.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos);
    });
  }

  function insertSectionHeader(label: string) {
    appendAtCursor(`## ${label}\n`);
  }

  function insertDocCitation(docId: string) {
    appendAtCursor(` [${docId}]`, false);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* ── Document pane ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <SectionHeading
            right={
              <Badge variant="outline" className="text-[10px]">
                {rubric.documents.length} doc
                {rubric.documents.length === 1 ? "" : "s"}
              </Badge>
            }
          >
            Documents
          </SectionHeading>
          <div className="space-y-3 lg:max-h-[640px] lg:overflow-y-auto pr-1">
            {rubric.documents.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground">
                No documents attached to this DBQ.
              </div>
            ) : (
              rubric.documents.map((doc) => (
                <article
                  key={doc.id}
                  className="rounded-md border bg-muted/30 p-3 text-sm space-y-1.5"
                >
                  <header className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                      <FileText className="h-3.5 w-3.5" />
                      {doc.id}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => insertDocCitation(doc.id)}
                    >
                      Cite [{doc.id}]
                    </Button>
                  </header>
                  {doc.sourceCitation && (
                    <p className="text-[11px] italic text-muted-foreground">
                      {doc.sourceCitation}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                    {doc.excerpt}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        {/* ── Essay pane ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <SectionHeading
            right={
              <Badge variant="outline" className="text-[10px]">
                {rubric.totalPoints} pts
              </Badge>
            }
          >
            Your essay
          </SectionHeading>

          {/* Section bookmarks — insert markdown-style section headers */}
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
            placeholder="Write your DBQ essay. Use `## Thesis`, `## Context`, etc. headers to signal each rubric category, and cite documents inline like `[Doc 1]`."
            rows={22}
            className="text-sm font-mono"
          />
          <WordCounter text={essay} recommended={1000} />
        </div>
      </div>

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

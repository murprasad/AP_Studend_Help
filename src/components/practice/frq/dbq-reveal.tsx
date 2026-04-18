"use client";

/**
 * DBQ reveal — 6-section rubric checklist + document refresher + sample.
 *
 * Each of the 6 rubric sections is its own checkable row. Students typically
 * eyeball their essay against each criterion, tick the ones they hit, and
 * read the sample for the missing sections.
 */
import { useMemo, useState } from "react";
import type { DbqRubric } from "@/lib/frq-types";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import {
  RubricChecklistItem,
  SectionHeading,
  SelfScoreBadge,
} from "./shared";

interface DbqRevealProps {
  rubric: DbqRubric;
  studentAnswers: Record<string, string>;
  sampleResponse?: string | null;
}

export function DbqReveal({
  rubric,
  studentAnswers,
  sampleResponse,
}: DbqRevealProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const rows = useMemo(
    () => [
      {
        key: "thesis",
        label: "Thesis",
        points: rubric.sections.thesis.points,
        criterion: rubric.sections.thesis.criterion,
      },
      {
        key: "context",
        label: "Context",
        points: rubric.sections.context.points,
        criterion: rubric.sections.context.criterion,
      },
      {
        key: "evidenceFromDocs",
        label: "Evidence from Documents",
        points: rubric.sections.evidenceFromDocs.points,
        criterion: `${rubric.sections.evidenceFromDocs.criterion}${
          rubric.sections.evidenceFromDocs.minDocs
            ? ` (cite ≥${rubric.sections.evidenceFromDocs.minDocs} docs)`
            : ""
        }`,
      },
      {
        key: "evidenceBeyondDocs",
        label: "Evidence Beyond Documents",
        points: rubric.sections.evidenceBeyondDocs.points,
        criterion: rubric.sections.evidenceBeyondDocs.criterion,
      },
      {
        key: "hipp",
        label: "HIPP Analysis",
        points: rubric.sections.hipp.points,
        criterion: `${rubric.sections.hipp.criterion}${
          rubric.sections.hipp.minDocsAnalyzed
            ? ` (≥${rubric.sections.hipp.minDocsAnalyzed} docs analyzed)`
            : ""
        }`,
      },
      {
        key: "complexity",
        label: "Complexity",
        points: rubric.sections.complexity.points,
        criterion: rubric.sections.complexity.criterion,
      },
    ],
    [rubric]
  );

  const selfScore = useMemo(
    () =>
      rows.reduce(
        (sum, r) => sum + (checked.has(r.key) ? r.points : 0),
        0
      ),
    [rows, checked]
  );

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const essay = studentAnswers.essay ?? "";

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading>Your essay</SectionHeading>
        <div className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-wrap">
          {essay || (
            <span className="text-muted-foreground italic">
              (no answer recorded)
            </span>
          )}
        </div>
      </section>

      {rubric.documents.length > 0 && (
        <section>
          <SectionHeading>Documents (refresher)</SectionHeading>
          <div className="grid gap-2 sm:grid-cols-2">
            {rubric.documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-md border bg-muted/20 p-2.5 text-xs space-y-1"
              >
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <FileText className="h-3 w-3" />
                  {doc.id}
                </div>
                {doc.sourceCitation && (
                  <p className="italic text-muted-foreground">
                    {doc.sourceCitation}
                  </p>
                )}
                <p className="whitespace-pre-wrap leading-relaxed line-clamp-4">
                  {doc.excerpt}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading
          right={
            <SelfScoreBadge score={selfScore} total={rubric.totalPoints} />
          }
        >
          Official rubric — check what you got
        </SectionHeading>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key}>
              <RubricChecklistItem
                label={r.label}
                criterion={r.criterion}
                points={r.points}
                checked={checked.has(r.key)}
                onToggle={() => toggle(r.key)}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="mr-2 text-[10px]">
            DBQ total
          </Badge>
          Canonically {rubric.totalPoints} points — thesis (1) + context (1) +
          evidence from docs (2/3) + evidence beyond docs (1) + HIPP (1) +
          complexity (1).
        </p>
      </section>

      {sampleResponse && (
        <section>
          <SectionHeading>High-scoring sample essay</SectionHeading>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-sm whitespace-pre-wrap">
            {sampleResponse}
          </div>
        </section>
      )}
    </div>
  );
}

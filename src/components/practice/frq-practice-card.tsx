"use client";

/**
 * FrqPracticeCard — the thin dispatcher that wraps per-type FRQ components.
 *
 * The card owns:
 *   - fetch-on-mount (if only `frqId` passed)
 *   - submit round-trip to `/api/frq/[id]/submit`
 *   - the prompt / revealed / empty 3-state visual shell
 *
 * It does NOT own:
 *   - input UI (delegated to `frq/<type>-input.tsx`)
 *   - rubric UI (delegated to `frq/<type>-reveal.tsx`)
 *   - rubric typing (delegated to `src/lib/frq-types.ts`)
 *
 * Submit payload is now `{ studentText: Record<string,string> }`. The API
 * JSON-stringifies the record before writing to `FrqAttempt.studentText`, so
 * the Prisma column stays unchanged.
 */

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, ArrowRight, Loader2 } from "lucide-react";
import { QuestionContent } from "@/components/question/question-content";

import {
  parseRubric,
  parseAnswersFromStored,
  type FrqType,
  type FrqRubric,
  type MultiPartRubric,
  type InvestigativeRubric,
  type SaqRubric,
  type DbqRubric,
  type LeqRubric,
  type AaqRubric,
  type EbqRubric,
} from "@/lib/frq-types";

import { SaqInput } from "./frq/saq-input";
import { SaqReveal } from "./frq/saq-reveal";
import { DbqInput } from "./frq/dbq-input";
import { DbqReveal } from "./frq/dbq-reveal";
import { LeqInput } from "./frq/leq-input";
import { LeqReveal } from "./frq/leq-reveal";
import { MultiPartInput } from "./frq/multi-part-input";
import { MultiPartReveal } from "./frq/multi-part-reveal";
import { InvestigativeInput } from "./frq/investigative-input";
import { InvestigativeReveal } from "./frq/investigative-reveal";
import { AaqInput } from "./frq/aaq-input";
import { AaqReveal } from "./frq/aaq-reveal";
import { EbqInput } from "./frq/ebq-input";
import { EbqReveal } from "./frq/ebq-reveal";

interface FrqFull {
  id: string;
  course: string;
  unit: string | null;
  year: number;
  questionNumber: number;
  type: FrqType;
  sourceUrl: string;
  promptText: string;
  stimulus?: string | null;
  totalPoints: number;
  rubric?: unknown;
  sampleResponse?: string | null;
}

interface FrqPracticeCardProps {
  /** If provided, the card fetches the FRQ prompt on mount. */
  frqId?: string;
  /** If provided, skips the fetch and uses this prompt directly. */
  initialFrq?: FrqFull;
  /** Called when the student clicks "Next FRQ" after self-grading. */
  onNext?: () => void;
}

export function FrqPracticeCard({
  frqId,
  initialFrq,
  onNext,
}: FrqPracticeCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(!initialFrq && !!frqId);
  const [submitting, setSubmitting] = useState(false);
  const [frq, setFrq] = useState<FrqFull | null>(initialFrq ?? null);
  const [revealed, setRevealed] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>(
    {}
  );

  // ── Fetch prompt on mount if only the id was provided ─────────────────────
  useEffect(() => {
    if (initialFrq || !frqId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/frq/${frqId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { frq: FrqFull; unlocked: boolean }) => {
        if (cancelled) return;
        setFrq(data.frq);
        if (data.unlocked && data.frq.rubric) setRevealed(true);
      })
      .catch(() => {
        if (cancelled) return;
        toast({ title: "Could not load FRQ", variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [frqId, initialFrq, toast]);

  // ── Submit to reveal rubric + sample response ─────────────────────────────
  async function handleSubmit(answers: Record<string, string>) {
    if (!frq) return;
    const anyContent = Object.values(answers).some(
      (v) => typeof v === "string" && v.trim().length > 0
    );
    if (!anyContent) {
      toast({
        title: "Write something first",
        description: "Your answer can't be empty.",
        variant: "destructive",
      });
      return;
    }
    // Beta 8.13.4 (FMEA gap 6.N2/6.N4): a 1-2 sentence FRQ submit gets
    // graded 0/6 by the AI, which demoralizes first-time users seeing
    // their FIRST FRQ score. Hard-block submits under 100 chars total
    // and surface guidance. Avoids the "0/6 from a 5-word answer" UX.
    const totalChars = Object.values(answers).reduce(
      (n, v) => n + (typeof v === "string" ? v.trim().length : 0),
      0,
    );
    const MIN_CHARS = 100;
    if (totalChars < MIN_CHARS) {
      toast({
        title: "Write a bit more before submitting",
        description: `AP rubrics expect developed evidence + analysis. Aim for at least 1-2 paragraphs (${totalChars}/${MIN_CHARS} characters so far).`,
        variant: "destructive",
      });
      return;
    }
    setStudentAnswers(answers);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/frq/${frq.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentText: answers }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { frq: FrqFull };
      setFrq(data.frq);
      setRevealed(true);
    } catch (e) {
      toast({
        title: "Submission failed",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Parse rubric once the FRQ loads. Memoize so we don't re-parse on every
  // keystroke in the reveal-state rubric checklist.
  const parsedRubric: FrqRubric | null = useMemo(() => {
    if (!frq || !frq.rubric) return null;
    return parseRubric(frq.rubric, frq.type);
  }, [frq]);

  // ── Empty/loading states ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!frq) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-2">
          <p className="text-lg font-medium">
            No FRQs available for this unit yet.
          </p>
          <p className="text-sm text-muted-foreground">
            We&apos;re expanding the FRQ bank. Check back soon or pick a
            different unit.
          </p>
        </CardContent>
      </Card>
    );
  }

  const header = (
    <CardHeader className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-xl">
          FRQ {frq.year} Q{frq.questionNumber}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-500"
          >
            {frq.type}
          </Badge>
          <Badge variant="outline">{frq.totalPoints} pts</Badge>
        </div>
      </div>
      <a
        href={frq.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        College Board source <ExternalLink className="h-3 w-3" />
      </a>
    </CardHeader>
  );

  // ── Revealed state ────────────────────────────────────────────────────────
  if (revealed && parsedRubric) {
    // If the student just submitted, `studentAnswers` is already structured.
    // If we arrived here via an auto-unlock (prior attempt), there's no in-
    // memory structure yet — we leave it empty and the reveal components
    // display the "(no answer recorded)" fallback. Future work: fetch the
    // most recent FrqAttempt and rehydrate.
    const answersForReveal = studentAnswers;
    return (
      <Card>
        {header}
        <CardContent className="space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Prompt
            </h3>
            <p className="text-sm whitespace-pre-wrap">{frq.promptText}</p>
          </section>

          {renderReveal(
            parsedRubric,
            answersForReveal,
            frq.sampleResponse ?? null
          )}

          {onNext && (
            <div className="flex justify-end pt-2">
              <Button onClick={onNext} className="gap-2">
                Next FRQ <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Prompt (input) state ──────────────────────────────────────────────────
  // We need a rubric shape for the input too (for point labels, doc lists,
  // etc.). If the server hasn't sent a rubric yet (locked), we synthesize an
  // empty one so the student still gets the right shape of input. The rubric
  // itself remains hidden — only structure (doc list for DBQ, part count for
  // multi-part) ever reaches the client here if the API sent it.
  const inputRubric: FrqRubric =
    parsedRubric ?? parseRubric({ type: frq.type, parts: [] }, frq.type);

  return (
    <Card>
      {header}
      <CardContent className="space-y-5">
        {frq.stimulus && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">
              Stimulus
            </h3>
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
              <QuestionContent content={frq.stimulus} />
            </div>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1">
            Prompt
          </h3>
          <p className="text-sm whitespace-pre-wrap">{frq.promptText}</p>
        </section>

        {renderInput(inputRubric, handleSubmit, submitting)}
      </CardContent>
    </Card>
  );
}

/* ── Dispatch helpers ──────────────────────────────────────────────────── */

function renderInput(
  rubric: FrqRubric,
  onSubmit: (answers: Record<string, string>) => void,
  submitting: boolean
) {
  switch (rubric.type) {
    case "SAQ":
      return (
        <SaqInput
          rubric={rubric as SaqRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "DBQ":
      return (
        <DbqInput
          rubric={rubric as DbqRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "LEQ":
      return (
        <LeqInput
          rubric={rubric as LeqRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "INVESTIGATIVE":
      return (
        <InvestigativeInput
          rubric={rubric as InvestigativeRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "AAQ":
      return (
        <AaqInput
          rubric={rubric as AaqRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "EBQ":
      return (
        <EbqInput
          rubric={rubric as EbqRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
    case "SHORT":
    case "LONG":
    case "MULTI_PART":
    default:
      return (
        <MultiPartInput
          rubric={rubric as MultiPartRubric}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      );
  }
}

function renderReveal(
  rubric: FrqRubric,
  studentAnswers: Record<string, string>,
  sampleResponse: string | null
) {
  // Back-compat: a legacy FrqAttempt may have a raw string saved instead of a
  // structured record. The parent re-hydrates via `studentAnswers`, but if
  // that's empty (e.g. auto-unlocked session) we still render the reveal
  // without a student echo.
  const answers =
    Object.keys(studentAnswers).length > 0
      ? studentAnswers
      : attemptParseLegacy(studentAnswers);

  switch (rubric.type) {
    case "SAQ":
      return (
        <SaqReveal
          rubric={rubric as SaqRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "DBQ":
      return (
        <DbqReveal
          rubric={rubric as DbqRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "LEQ":
      return (
        <LeqReveal
          rubric={rubric as LeqRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "INVESTIGATIVE":
      return (
        <InvestigativeReveal
          rubric={rubric as InvestigativeRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "AAQ":
      return (
        <AaqReveal
          rubric={rubric as AaqRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "EBQ":
      return (
        <EbqReveal
          rubric={rubric as EbqRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
    case "SHORT":
    case "LONG":
    case "MULTI_PART":
    default:
      return (
        <MultiPartReveal
          rubric={rubric as MultiPartRubric}
          studentAnswers={answers}
          sampleResponse={sampleResponse}
        />
      );
  }
}

/**
 * Tries to rehydrate a record from a stringified JSON blob if the caller only
 * has a single-field `studentAnswers`. Returns the record unchanged otherwise.
 */
function attemptParseLegacy(
  answers: Record<string, string>
): Record<string, string> {
  const raw = answers.__legacy ?? "";
  if (!raw) return answers;
  const { structured } = parseAnswersFromStored(raw);
  return structured ?? answers;
}

"use client";

/**
 * /flashcards — Spaced-repetition review page (v1).
 *
 * One card at a time. Front shown first; tap "Show answer" to reveal back +
 * explanation, then rate (Forgot / Hard / Good / Easy). Rating posts to
 * /api/flashcards/review and the next card from the batch slides in.
 *
 * Why no swipe gesture in v1? Swipe is tempting but carries an
 * accessibility cost (no keyboard equivalent, harder to undo). The four
 * rating buttons are clearer for first-time users; we can layer swipe-as-
 * shortcut later. PrepLion shipped buttons-only first too.
 *
 * Premium gate: not enforced here. Flashcards are a free retention loop —
 * Option B locks Sage Coach Deep Plan and full analytics, not flashcards.
 */

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/use-course";
import { useExamMode } from "@/hooks/use-exam-mode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { Loader2, ArrowRight, Check, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { QuestionContent } from "@/components/question/question-content";

interface Flashcard {
  id: string;
  course: string;
  unit: string;
  topic: string;
  concept: string;
  cardType: string;
  difficulty: string;
  front: string;
  back: string;
  explanation: string;
  isNew: boolean;
  sm2: { easeFactor: number; interval: number; repetitions: number };
}

interface ApiResponse {
  cards: Flashcard[];
  counts: { dueReturned: number; newReturned: number };
}

export default function FlashcardsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [course] = useCourse();
  const { enterExamMode, exitExamMode } = useExamMode();

  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shownAt, setShownAt] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);

  // Full-screen mode — hides the sidebar and gives the whole viewport to
  // one card at a time. Real user 2026-04-23 asked for this; flashcards
  // deserve the same focus treatment as /diagnostic and /mock-exam.
  useEffect(() => {
    enterExamMode();
    return () => exitExamMode();
  }, [enterExamMode, exitExamMode]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Human-readable course name for the header banner so users always
  // know which course's cards they're seeing. If they signed up for
  // AP Physics but their useCourse() state fell back to something
  // else (stale localStorage, etc), the banner makes that visible
  // instead of silently showing wrong-subject cards.
  const courseName = course && COURSE_REGISTRY[course as ApCourse]?.name
    ? COURSE_REGISTRY[course as ApCourse].name
    : "(selecting course…)";

  const loadBatch = useCallback(async () => {
    if (!course) return;
    setCards(null);
    setIndex(0);
    setShowBack(false);
    try {
      const r = await fetch(`/api/flashcards?course=${course}`, { cache: "no-store" });
      if (!r.ok) {
        setCards([]);
        return;
      }
      const d = (await r.json()) as ApiResponse;
      setCards(d.cards);
      if (d.cards.length > 0) setShownAt(Date.now());
    } catch {
      setCards([]);
    }
  }, [course]);

  useEffect(() => {
    if (status === "authenticated" && course) loadBatch();
  }, [status, course, loadBatch]);

  const submitRating = async (rating: number) => {
    if (!cards || submitting) return;
    const card = cards[index];
    if (!card) return;
    const responseTimeMs = shownAt ? Date.now() - shownAt : 0;

    setSubmitting(true);
    try {
      await fetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: card.id, rating, responseTimeMs }),
      });
    } catch {
      // Fire-and-forget — even if the write fails, advance the UI so the
      // user isn't stuck. Lost reviews show up again on next batch fetch.
    } finally {
      setSubmitting(false);
      setCompleted((c) => c + 1);
      // Advance to next card or load a new batch
      if (index + 1 < cards.length) {
        setIndex(index + 1);
        setShowBack(false);
        setShownAt(Date.now());
      } else {
        // End of batch — fetch the next one
        loadBatch();
      }
    }
  };

  if (status === "loading" || cards === null) {
    return (
      <div className="max-w-2xl mx-auto py-8 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading your flashcards…
      </div>
    );
  }

  // Empty state — no cards available for this course (rare; only when the
  // global deck has zero cards for the course).
  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Reviewing</span>
          <span className="text-[15px] font-semibold text-foreground">{courseName}</span>
        </div>
        <CourseSelectorInline />
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">No flashcards yet for {courseName}</h2>
            <p className="text-sm text-muted-foreground">
              The flashcard deck is being built for this course. Try a
              different course using the selector above, or come back later.
            </p>
            <Link href="/practice">
              <Button>Practice questions instead</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const card = cards[index];
  const progress = ((index + (showBack ? 0.5 : 0)) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6 space-y-4 px-2">
      {/* Prominent course header — lets the user verify which course's
          cards they're reviewing. If wrong, they can switch via the
          inline selector below. Prevents the "I'm on AP Physics but
          seeing world history cards" confusion reported 2026-04-23. */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Reviewing</span>
        <span className="text-[15px] font-semibold text-foreground">{courseName}</span>
      </div>
      <CourseSelectorInline />

      {/* Progress bar — batch progress + completed counter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Progress value={progress} className="h-1.5" />
        </div>
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {index + 1} / {cards.length}
        </span>
        {completed > 0 && (
          <Badge variant="outline" className="text-[11px] gap-1">
            <Check className="h-3 w-3" /> {completed} done today
          </Badge>
        )}
      </div>

      {/* The card */}
      <Card className="rounded-2xl border-border/50 min-h-[300px] sm:min-h-[360px]">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">{card.unit.replace(/^[A-Z0-9_]+_/, "").replace(/_/g, " ")}</Badge>
            <Badge variant="outline" className="text-[11px]">{card.cardType}</Badge>
            {card.isNew && (
              <Badge className="text-[11px] bg-blue-500/15 text-blue-600 border-blue-500/30 gap-1">
                <Sparkles className="h-3 w-3" /> New
              </Badge>
            )}
          </div>

          {/* Front — markdown rendered via QuestionContent so tables and
              LaTeX render properly (B7 fix extended to flashcards 2026-04-25). */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Front</p>
            <div className="text-[18px] sm:text-[20px] leading-snug font-medium">
              <QuestionContent content={card.front} />
            </div>
          </div>

          {/* Back — hidden until reveal */}
          {showBack && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-emerald-600">Answer</p>
                <div className="text-[16px] sm:text-[18px] leading-snug mt-1">
                  <QuestionContent content={card.back} />
                </div>
              </div>
              {card.explanation && (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Why</p>
                  <div className="text-[14px] text-muted-foreground leading-relaxed mt-1">
                    <QuestionContent content={card.explanation} />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {!showBack ? (
        <Button
          size="lg"
          onClick={() => setShowBack(true)}
          className="w-full h-12 text-base"
        >
          Show answer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => submitRating(0)}
            className="h-12 border-red-500/40 text-red-600 hover:bg-red-500/10"
          >
            Forgot
          </Button>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => submitRating(1)}
            className="h-12 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
          >
            Hard
          </Button>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => submitRating(2)}
            className="h-12 border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
          >
            Good
          </Button>
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => submitRating(3)}
            className="h-12 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
          >
            Easy
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Spaced repetition: Hard cards return sooner, Easy ones later. Be honest — your future self thanks you.
      </p>
    </div>
  );
}

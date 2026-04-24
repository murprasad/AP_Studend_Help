"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ApCourse } from "@prisma/client";
import {
  readinessForAp,
  readinessForSat,
  readinessForAct,
  EXAM_FAMILY_DISCLAIMER,
  type ExamFamily,
  type UnifiedReadiness,
} from "@/lib/score-predictors";
import { ExitIntentCapture } from "@/components/marketing/exit-intent-capture";
import { QuestionContent } from "@/components/question/question-content";
import {
  ArrowRight,
  ArrowLeft,
  Target,
  Loader2,
  ChevronRight,
  Trophy,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type Step = "intro" | "quiz" | "results";

// Server returns answerKey separately from questions; client scores locally.
interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  unit: string;
  topic: string;
}

interface Props {
  course: ApCourse;
  courseName: string;
  family: ExamFamily;
  unitCount: number;
}

// ── Section assignment ────────────────────────────────────────────────────────
// SAT/ACT predictors expect per-section mastery. Each course corresponds to a
// single section, so we fill that section from the quiz and leave the others
// empty (avgMastery: 0, mock: null) — the predictor still returns a composite
// but marks confidence "low" since only one section has signal. That's the
// honest read for a 5-question preview.
type SatSection = "math" | "reading_writing";
type ActSection = "english" | "math" | "reading" | "science";

function satSectionFor(course: ApCourse): SatSection | null {
  if (course === "SAT_MATH") return "math";
  if (course === "SAT_READING_WRITING") return "reading_writing";
  return null;
}

function actSectionFor(course: ApCourse): ActSection | null {
  if (course === "ACT_MATH") return "math";
  if (course === "ACT_ENGLISH") return "english";
  if (course === "ACT_READING") return "reading";
  if (course === "ACT_SCIENCE") return "science";
  return null;
}

function emptySatMastery() {
  return {
    math: { avgMastery: 0, totalAttempts: 0 },
    reading_writing: { avgMastery: 0, totalAttempts: 0 },
  } as const;
}
function emptySatMocks() {
  return { math: null, reading_writing: null } as const;
}
function emptyActMastery() {
  return {
    english: { avgMastery: 0, totalAttempts: 0 },
    math: { avgMastery: 0, totalAttempts: 0 },
    reading: { avgMastery: 0, totalAttempts: 0 },
    science: { avgMastery: 0, totalAttempts: 0 },
  } as const;
}
function emptyActMocks() {
  return {
    english: null,
    math: null,
    reading: null,
    science: null,
  } as const;
}

// ── Verdict helpers ───────────────────────────────────────────────────────────
// Each family has its own "passing" threshold. We surface a plain-English
// verdict derived from the scaled score so results are readable without
// knowing the family's scoring quirks.
function verdictFor(
  family: ExamFamily,
  scaledScore: number,
  confidence: UnifiedReadiness["confidence"],
): { verdict: string; tone: "good" | "mid" | "low"; emoji: string } {
  if (confidence === "low")
    return {
      verdict: "Early signal",
      tone: "mid",
      emoji: "🌱",
    };
  if (family === "AP") {
    if (scaledScore >= 4) return { verdict: "On track", tone: "good", emoji: "✅" };
    if (scaledScore >= 3)
      return { verdict: "Passing range", tone: "good", emoji: "👍" };
    if (scaledScore >= 2) return { verdict: "Building", tone: "mid", emoji: "🔨" };
    return { verdict: "Just starting", tone: "low", emoji: "🚧" };
  }
  if (family === "SAT") {
    if (scaledScore >= 1400)
      return { verdict: "Competitive", tone: "good", emoji: "🎯" };
    if (scaledScore >= 1200)
      return { verdict: "Above average", tone: "good", emoji: "📈" };
    if (scaledScore >= 1000) return { verdict: "Building", tone: "mid", emoji: "🔨" };
    return { verdict: "Just starting", tone: "low", emoji: "🚧" };
  }
  // ACT
  if (scaledScore >= 28)
    return { verdict: "Selective range", tone: "good", emoji: "🎯" };
  if (scaledScore >= 22)
    return { verdict: "Above average", tone: "good", emoji: "📈" };
  if (scaledScore >= 18) return { verdict: "Building", tone: "mid", emoji: "🔨" };
  return { verdict: "Just starting", tone: "low", emoji: "🚧" };
}

function toneClasses(tone: "good" | "mid" | "low") {
  if (tone === "good")
    return {
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "border-emerald-500/30 bg-emerald-500/5",
    };
  if (tone === "mid")
    return {
      color: "text-amber-700 dark:text-amber-300",
      bg: "border-amber-500/30 bg-amber-500/5",
    };
  return {
    color: "text-red-700 dark:text-red-300",
    bg: "border-red-500/30 bg-red-500/5",
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export function ReadinessAssessment({
  course,
  courseName,
  family,
  unitCount,
}: Props) {
  const [step, setStep] = useState<Step>("intro");

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answerKey, setAnswerKey] = useState<Record<string, string>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<
    | { answer: string; correct: boolean }
    | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Results
  const [result, setResult] = useState<UnifiedReadiness | null>(null);

  const scaleLabel =
    family === "AP"
      ? "1–5"
      : family === "SAT"
        ? "400–1600"
        : "1–36";

  // ── Load quiz ───────────────────────────────────────────────────────────────
  const loadQuiz = async () => {
    setLoading(true);
    setQuizError(null);
    try {
      const res = await fetch(
        `/api/am-i-ready-quiz?course=${course}`,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to load questions");
      }
      const data = (await res.json()) as {
        questions: QuizQuestion[];
        answerKey: Record<string, string>;
      };
      setQuestions(data.questions);
      setAnswerKey(data.answerKey || {});
      setQuizIndex(0);
      setQuizAnswers({});
      setQuizCorrect(0);
      setQuizFeedback(null);
      setStep("quiz");
    } catch (e) {
      setQuizError(
        e instanceof Error
          ? e.message
          : "Could not load quiz questions. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Compute readiness from the 5-Q quiz ─────────────────────────────────────
  const computeResult = (finalCorrect: number): UnifiedReadiness => {
    const rawPercent = Math.round((finalCorrect / questions.length) * 100);

    // Shared inputs: 5 Q's answered, no mock, no prior sessions.
    const totalAnswered = questions.length;
    const recentAccuracy = rawPercent;
    const totalSessions = 0;

    if (family === "AP") {
      // Per-unit mastery from this quiz's answers.
      const unitAgg: Record<string, { correct: number; total: number }> = {};
      for (const q of questions) {
        const u = q.unit || "UNKNOWN";
        if (!unitAgg[u]) unitAgg[u] = { correct: 0, total: 0 };
        unitAgg[u].total += 1;
        const picked = quizAnswers[q.id];
        if (picked && picked === answerKey[q.id]) unitAgg[u].correct += 1;
      }
      const masteryData = Object.entries(unitAgg).map(([unit, s]) => ({
        unit,
        masteryScore: s.total > 0 ? (s.correct / s.total) * 100 : 0,
        totalAttempts: s.total,
      }));
      return readinessForAp(
        course,
        {
          masteryData,
          bestMockPercent: null,
          recentAccuracy,
          totalSessions,
          totalAnswered,
        },
        /* hasDiagnostic */ true,
      );
    }

    if (family === "SAT") {
      const section = satSectionFor(course);
      const sectionMastery = { ...emptySatMastery() } as {
        math: { avgMastery: number; totalAttempts: number };
        reading_writing: { avgMastery: number; totalAttempts: number };
      };
      if (section) {
        sectionMastery[section] = {
          avgMastery: rawPercent,
          totalAttempts: totalAnswered,
        };
      }
      return readinessForSat(
        {
          sectionMastery,
          sectionMockPercent: { ...emptySatMocks() },
          recentAccuracy,
          totalSessions,
          totalAnswered,
        },
        /* hasDiagnostic */ true,
      );
    }

    // ACT
    const section = actSectionFor(course);
    const sectionMastery = { ...emptyActMastery() } as {
      english: { avgMastery: number; totalAttempts: number };
      math: { avgMastery: number; totalAttempts: number };
      reading: { avgMastery: number; totalAttempts: number };
      science: { avgMastery: number; totalAttempts: number };
    };
    if (section) {
      sectionMastery[section] = {
        avgMastery: rawPercent,
        totalAttempts: totalAnswered,
      };
    }
    return readinessForAct(
      {
        sectionMastery,
        sectionMockPercent: { ...emptyActMocks() },
        recentAccuracy,
        totalSessions,
        totalAnswered,
      },
      /* hasDiagnostic */ true,
    );
  };

  // ── Step 1: Intro ───────────────────────────────────────────────────────────
  if (step === "intro") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 space-y-10">
        <div className="text-center space-y-4">
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-semibold">
            {family} Readiness Check
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Am I Ready for {courseName}?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Take a 5-question mini quiz and get an estimated score on the{" "}
            {scaleLabel} scale, a confidence signal, and next steps. No account
            needed.
          </p>
        </div>

        {/* What you get */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
            <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Estimated Score</p>
            <p className="text-xs text-muted-foreground mt-1">
              Where you likely fall on the {scaleLabel} scale
            </p>
          </div>
          <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Confidence Signal</p>
            <p className="text-xs text-muted-foreground mt-1">
              How much to trust a 5-question preview
            </p>
          </div>
          <div className="p-5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-center">
            <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <p className="font-semibold text-sm">Next Steps</p>
            <p className="text-xs text-muted-foreground mt-1">
              A plain-English read on what to do next
            </p>
          </div>
        </div>

        {quizError && (
          <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>{quizError}</span>
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={loadQuiz}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Start Assessment <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Free. No account required. Takes about 3 minutes.
          </p>
        </div>

        {/* Legal */}
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed text-center max-w-2xl mx-auto">
          {EXAM_FAMILY_DISCLAIMER[family]}
        </p>
      </div>
    );
  }

  // ── Step 2: Mini Quiz ───────────────────────────────────────────────────────
  if (step === "quiz") {
    const currentQ = questions[quizIndex];
    if (!currentQ) return null;

    const handleAnswer = (optionText: string) => {
      if (quizFeedback) return; // locked once answered
      // Options are formatted "A) ..." — extract letter to compare to key.
      const letter =
        optionText.match(/^([A-E])\)/)?.[1]?.toUpperCase() ||
        optionText.toUpperCase();
      const correctLetter = (answerKey[currentQ.id] || "").toUpperCase();
      const correct = letter === correctLetter;
      setQuizAnswers((prev) => ({
        ...prev,
        [currentQ.id]: letter,
      }));
      if (correct) setQuizCorrect((c) => c + 1);
      setQuizFeedback({ answer: optionText, correct });
    };

    const handleNext = () => {
      const isLast = quizIndex + 1 >= questions.length;
      setQuizFeedback(null);
      if (isLast) {
        const finalCorrect = quizCorrect; // already incremented on correct answer
        const res = computeResult(finalCorrect);
        setResult(res);
        setStep("results");
      } else {
        setQuizIndex((i) => i + 1);
      }
    };

    const progress = ((quizIndex + (quizFeedback ? 1 : 0)) / questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div>
          <button
            onClick={() => setStep("intro")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <Progress value={progress} className="h-1.5 mb-6" />
          <p className="text-xs text-muted-foreground mb-1">
            Question {quizIndex + 1} of {questions.length}
          </p>
          <h2 className="text-lg font-bold">Mini Quiz: {courseName}</h2>
        </div>

        <div className="p-5 rounded-xl border border-border/40 bg-card space-y-4">
          <div className="text-sm font-medium leading-relaxed">
            <QuestionContent content={currentQ.questionText} />
          </div>

          <div className="space-y-2">
            {currentQ.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const correctLetter = (answerKey[currentQ.id] || "").toUpperCase();
              const optLetter =
                opt.match(/^([A-E])\)/)?.[1]?.toUpperCase() || letter;
              const isCorrect = optLetter === correctLetter;
              const isSelected = quizFeedback?.answer === opt;
              const showCorrect = quizFeedback && isCorrect;
              const showWrong = quizFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={`${currentQ.id}-${i}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!quizFeedback}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                    showCorrect
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : showWrong
                        ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300"
                        : quizFeedback
                          ? "border-border/20 text-muted-foreground/50"
                          : "border-border/40 hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      showCorrect
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : showWrong
                          ? "border-red-500 bg-red-500 text-white"
                          : "border-border/40"
                    }`}
                  >
                    {showCorrect ? "✓" : showWrong ? "✗" : letter}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {quizFeedback && (
            <div
              className={`p-3 rounded-lg text-sm ${
                quizFeedback.correct
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-500/10 text-red-700 dark:text-red-300"
              }`}
            >
              {quizFeedback.correct ? "Correct!" : "Not quite."}{" "}
              {quizIndex + 1 < questions.length
                ? "Let's continue."
                : "Let's see your results."}
            </div>
          )}
        </div>

        {quizFeedback && (
          <Button size="lg" className="w-full gap-2" onClick={handleNext}>
            {quizIndex + 1 >= questions.length
              ? "See My Results"
              : "Next Question"}
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          {quizCorrect}/{quizIndex + (quizFeedback ? 1 : 0)} correct so far
        </p>
      </div>
    );
  }

  // ── Step 3: Results ─────────────────────────────────────────────────────────
  if (step === "results" && result) {
    const v = verdictFor(family, result.scaledScore, result.confidence);
    const tc = toneClasses(v.tone);
    const quizPct = Math.round((quizCorrect / questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div>
          <Progress value={100} className="h-1.5 mb-6" />
          <p className="text-xs text-muted-foreground mb-1">Your Results</p>
          <h2 className="text-2xl font-bold">Your {courseName} Readiness</h2>
        </div>

        {/* Hero result */}
        <div className={`p-6 rounded-2xl border ${tc.bg} space-y-4`}>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start gap-3">
              <span
                className="text-3xl leading-none mt-1"
                aria-hidden="true"
              >
                {v.emoji}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">
                  Our read on your readiness
                </p>
                <p className={`text-2xl sm:text-3xl font-bold ${tc.color}`}>
                  {v.verdict}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {result.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Est. {family} Score
              </p>
              <p className={`text-2xl sm:text-3xl font-bold ${tc.color}`}>
                {result.showScore ? result.scaledDisplay : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                / {result.scaleMax}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/20 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Confidence:</span>{" "}
              <span className="font-semibold text-foreground capitalize">
                {result.confidence}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Quiz:</span>{" "}
              <span className="font-semibold text-foreground">
                {quizCorrect}/{questions.length} ({quizPct}%)
              </span>
            </div>
            {typeof result.percentile === "number" && result.showScore && (
              <div>
                <span className="text-muted-foreground">~Percentile:</span>{" "}
                <span className="font-semibold text-foreground">
                  {result.percentile}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section breakdown (SAT/ACT only) */}
        {result.sectionBreakdown && result.sectionBreakdown.length > 0 && (
          <div className="p-4 rounded-xl border border-border/40 bg-card space-y-3">
            <p className="text-sm font-semibold">Section Estimate</p>
            <div className="grid grid-cols-2 gap-2">
              {result.sectionBreakdown.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-lg bg-background/60 text-center"
                >
                  <p className="text-xl font-bold text-foreground">
                    {result.showScore ? s.score : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.label} / {s.max}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
              Only the {courseName} section is measured in this quiz. Estimates
              for the other section assume a neutral baseline — take the full
              diagnostic for a calibrated composite.
            </p>
          </div>
        )}

        {/* Low-confidence honesty note */}
        {result.confidence === "low" && (
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                5 questions is a weak signal — don&apos;t over-index on this
                number. Take the full diagnostic for a score you can trust.
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="p-5 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent space-y-3 text-center">
          <p className="text-sm font-semibold">
            Unlock a full breakdown across {unitCount} units
          </p>
          <p className="text-xs text-muted-foreground">
            Create a free account to get your weak-area map, a personalized
            study plan, and full-length timed mock exams.
          </p>
          <Link
            href={`/register?course=${course}&from=readiness`}
            className="block"
          >
            <Button size="lg" className="w-full gap-2">
              Create free account to continue{" "}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-[11px] text-muted-foreground">
            No credit card. Takes 30 seconds.
          </p>
        </div>

        {/* Alt CTAs */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href={`/register?course=${course}&from=readiness`}>
            <Button size="lg" variant="outline" className="w-full gap-2">
              <Trophy className="h-5 w-5" />
              Take Full Diagnostic
            </Button>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            className="w-full gap-2"
            onClick={() => {
              setStep("intro");
              setResult(null);
              setQuestions([]);
              setAnswerKey({});
              setQuizAnswers({});
              setQuizCorrect(0);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
            Retake Assessment
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed pt-6 border-t border-border/40">
          {result.disclaimer}
        </p>

        <ExitIntentCapture
          courseName={courseName}
          scaledScore={result.scaledScore}
          family={family}
          scaleMax={result.scaleMax}
          course={course}
        />
      </div>
    );
  }

  return null;
}

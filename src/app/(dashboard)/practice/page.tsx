"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { COURSE_UNITS, AP_COURSES, formatTime } from "@/lib/utils";
import { ApCourse, ApUnit } from "@prisma/client";
import { getCourseConfig } from "@/lib/courses";
import { isPremiumForTrack } from "@/lib/tiers";
import { Textarea } from "@/components/ui/textarea";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import { SessionFeedbackPopup } from "@/components/feedback/session-feedback-popup";
import { SessionDeltaCard } from "@/components/practice/session-delta-card";
import { NextSessionNudge } from "@/components/practice/next-session-nudge";
import { DiagnosticNudgeModal } from "@/components/practice/diagnostic-nudge-modal";
import { useExamMode } from "@/hooks/use-exam-mode";
import { useSearchParams } from "next/navigation";
import { hapticSuccess, hapticError } from "@/lib/haptics";
import { FirstSessionCelebration } from "@/components/practice/first-session-celebration";
import { SessionLimitHitCard } from "@/components/practice/session-limit-hit-card";
import {
  Zap,
  BookOpen,
  CheckCircle,
  XCircle,
  ChevronRight,
  Clock,
  Trophy,
  RotateCcw,
  Loader2,
  GraduationCap,
  Lock,
  Crown,
  PenLine,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { MarkdownContent } from "@/components/tutor/section-cards";

interface Question {
  id: string;
  course: string;
  unit: string;
  topic: string;
  subtopic?: string;
  difficulty: string;
  questionType: string;
  questionText: string;
  stimulus?: string;
  stimulusImageUrl?: string;
  options?: string;
}

interface SessionSummary {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSecs: number;
  xpEarned: number;
  apScoreEstimate: number;
  previousAccuracy?: number | null;
}

interface FrqScore {
  pointsEarned: number;
  totalPoints: number;
  feedback: string;
  modelAnswer: string;
}

type PracticeMode = "select" | "practicing" | "summary";

const CODING_WAIT_MESSAGES = [
  "Ooh, a coding challenge! Let me cook something up... 🧑‍💻",
  "Checking AP CSP pseudocode standards...",
  "Adding algorithm tracing rubric... this one's spicy 🌶️",
  "Almost ready! Get your thinking cap on 🎓",
];

const FRQ_WAIT_MESSAGES = [
  "Crafting your free response question... Sage is on it! ✍️",
  "Pulling in the AP rubric criteria...",
  "Take a deep breath — you've got this 🌿",
  "Almost done! Loading your question now...",
];

export default function PracticePage() {
  const { toast } = useToast();
  const [course] = useCourse();

  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [userTrack, setUserTrack] = useState<string>("ap");
  const [premiumRestricted, setPremiumRestricted] = useState(false);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);
  // Admin-toggleable knowledge check after wrong MCQs. Default ON.
  const [knowledgeCheckEnabled, setKnowledgeCheckEnabled] = useState(true);

  const [mode, setMode] = useState<PracticeMode>("select");

  // Full-screen exam mode for active practice sessions. Hides sidebar +
  // Sage + mobile header while the student is in a question, matching
  // diagnostic / mock-exam / ai-tutor. Auto-exits on unmount.
  const { enterExamMode, exitExamMode } = useExamMode();
  useEffect(() => {
    if (mode === "practicing") enterExamMode();
    else exitExamMode();
  }, [mode, enterExamMode, exitExamMode]);
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [questionCount, setQuestionCount] = useState(10);
  const [sessionType, setSessionType] = useState("QUICK_PRACTICE");
  const [questionType, setQuestionType] = useState<"MCQ" | "FRQ" | "SAQ" | "LEQ" | "DBQ" | "CODING">("MCQ");

  useEffect(() => {
    // Use allSettled so one slow/failed call doesn't silently leave every
    // downstream gating flag undefined. Each branch sets sensible defaults
    // on rejection.
    Promise.allSettled([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/feature-flags").then((r) => r.json()),
    ]).then(([userRes, flagsRes]) => {
      if (userRes.status === "fulfilled") {
        setSubscriptionTier(userRes.value.user?.subscriptionTier ?? "FREE");
        setUserTrack(userRes.value.user?.track ?? "ap");
      } else {
        setSubscriptionTier("FREE");
        setUserTrack("ap");
      }
      if (flagsRes.status === "fulfilled") {
        setPremiumRestricted(flagsRes.value.premiumRestrictionEnabled ?? false);
        setKnowledgeCheckEnabled(flagsRes.value.knowledgeCheckEnabled ?? true);
      } else {
        setPremiumRestricted(false);
      }
    });
  }, []);

  // Restore session if returning from Sage ("Continue Practice" button)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sage_session_snapshot");
      if (!raw) return;
      sessionStorage.removeItem("sage_session_snapshot");
      const snap = JSON.parse(raw) as {
        sessionId: string;
        questions: Question[];
        currentIndex: number;
        results: Array<{ correct: boolean; timeSecs: number }>;
        startTime: string;
      };
      if (snap.sessionId && Array.isArray(snap.questions) && snap.questions.length > 0) {
        questionsRef.current = snap.questions;
        setSessionId(snap.sessionId);
        setQuestions(snap.questions);
        setCurrentIndex(snap.currentIndex);
        setResults(snap.results);
        setStartTime(new Date(snap.startTime));
        setQuestionStartTime(new Date());
        setFeedback(null);
        setSelectedAnswer(null);
        setMode("practicing");
      }
    } catch {
      // Malformed snapshot — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const questionsRef = useRef<Question[]>([]);  // always up-to-date for async callbacks
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    frqScore?: FrqScore;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [results, setResults] = useState<Array<{ correct: boolean; timeSecs: number }>>([]);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<1 | -1 | null>(null);
  const [startMsgIndex, setStartMsgIndex] = useState(0);
  // Embedded knowledge check after wrong MCQ answers
  const [checkQuestion, setCheckQuestion] = useState<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  } | null>(null);
  const [checkAnswer, setCheckAnswer] = useState<number | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  // Snapshot of the projected score before this session started — used by
  // SessionDeltaCard on the summary to render "3.2 → 3.5".
  const [beforeScore, setBeforeScore] = useState<number | null>(null);
  const [beforeFamily, setBeforeFamily] = useState<"AP" | "SAT" | "ACT" | undefined>(undefined);

  // Reset unit selection when course changes
  useEffect(() => {
    setSelectedUnit("ALL");
  }, [course]);

  // ── Focused-practice auto-launch (diagnostic funnel port) ──────────────
  //
  // When the URL carries `?mode=focused&unit=X&count=N`, skip the select
  // screen and POST directly to /api/practice. The diagnostic results page
  // generates these links via `buildFocusedPracticeUrl` so a student who
  // just saw their weakest unit can land in a 5-Q session in one click.
  //
  // Guards:
  //   - Wait until subscriptionTier is set so we don't race the user fetch
  //   - Only fire once per mount (autoLaunchedRef)
  //   - Only if course is loaded
  const searchParams = useSearchParams();
  // Track the last URL signature we auto-launched against — bumps when
  // the user navigates /practice?mode=focused&... again from a different
  // origin (NextSessionNudge on the summary screen, PrimaryActionStrip
  // on the dashboard, etc.) so clicking the same CTA twice actually
  // re-triggers the session. Previously a plain boolean ref blocked all
  // re-launches after the first — user-reported bug 2026-04-22.
  const autoLaunchedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!course || subscriptionTier === null) return;
    if (searchParams?.get("mode") !== "focused") return;

    const unitParam = searchParams.get("unit");
    const countParam = Number(searchParams.get("count") || "5");
    const count = Number.isFinite(countParam) && countParam > 0 ? Math.min(20, Math.floor(countParam)) : 5;

    // Signature = every input that determines the session shape, plus
    // the `src` or `t` query params if present so explicit "do it again"
    // clicks can re-trigger.
    const sig = `${course}|${unitParam ?? "ALL"}|${count}|${searchParams.get("src") ?? ""}|${searchParams.get("t") ?? ""}`;
    if (autoLaunchedRef.current === sig) return;
    autoLaunchedRef.current = sig;

    if (unitParam) setSelectedUnit(unitParam);
    setSelectedDifficulty("ALL");
    setQuestionCount(count);
    setSessionType("QUICK_PRACTICE");
    setQuestionType("MCQ");

    // Defer to next tick so React applies the state updates above before
    // startSession reads selectedUnit/questionCount from closure. We pass
    // the values explicitly to startSession below to avoid the closure race.
    void startSessionWithOverrides({ unit: unitParam ?? "ALL", count });
  }, [course, subscriptionTier, searchParams]);

  async function startSessionWithOverrides(opts: { unit: string; count: number }) {
    // Mirror of startSession with explicit params so we don't depend on
    // React state that may not have flushed yet from the URL-param effect.
    setIsStarting(true);
    setSessionLimitReached(false);
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "QUICK_PRACTICE",
          unit: opts.unit,
          difficulty: "ALL",
          questionCount: opts.count,
          course,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.limitExceeded) { setSessionLimitReached(true); return; }
        toast({ title: "Error", description: data.error || "Failed to start session", variant: "destructive" });
        return;
      }
      if (data.aiGenerationWarning) {
        toast({ title: "AI questions generated", description: data.aiGenerationWarning });
      }
      const qs: Question[] = data.questions ?? [];
      questionsRef.current = qs;
      setSessionId(data.sessionId);
      setQuestions(qs);
      setCurrentIndex(0);
      setResults([]);
      setFeedback(null);
      setSelectedAnswer(null);
      setStartTime(new Date());
      setQuestionStartTime(new Date());
      setMode("practicing");
    } finally {
      setIsStarting(false);
    }
  }

  useEffect(() => {
    if (!isStarting || questionType === "MCQ") return;
    setStartMsgIndex(0);
    const interval = setInterval(() => {
      setStartMsgIndex((prev) => Math.min(prev + 1, CODING_WAIT_MESSAGES.length - 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isStarting, questionType]);

  const currentQuestion = questions[currentIndex];
  const parsedOptions: string[] = (() => {
    if (!currentQuestion?.options) return [];
    const raw = currentQuestion.options;
    if (Array.isArray(raw)) return raw as string[];
    try { return JSON.parse(raw as string) as string[]; } catch { return []; }
  })();

  const courseUnits = COURSE_UNITS[course];

  function saveSessionSnapshot() {
    if (!sessionId || questions.length === 0) return;
    try {
      sessionStorage.setItem("sage_session_snapshot", JSON.stringify({
        sessionId,
        questions,
        currentIndex,
        results,
        startTime: startTime?.toISOString() ?? new Date().toISOString(),
      }));
      sessionStorage.setItem("sage_practice_return", "1");
    } catch {
      // sessionStorage full or unavailable — ignore
    }
  }

  function buildSagePrefill(isCorrect: boolean) {
    if (!currentQuestion || !feedback) return "";
    const qText = currentQuestion.questionText.slice(0, 300);
    const opts = (() => {
      try {
        const o = typeof currentQuestion.options === "string"
          ? JSON.parse(currentQuestion.options)
          : currentQuestion.options;
        return Array.isArray(o) ? (o as string[]).join(" | ") : "";
      } catch { return ""; }
    })();
    if (isCorrect) {
      return `I just answered this ${currentQuestion.course.replace(/_/g, " ")} question correctly and want to go deeper:\n\n"${qText}"${opts ? `\nOptions: ${opts}` : ""}\n\nCorrect answer: ${feedback.correctAnswer}\n\nExplain the core concept behind this question and what I should know about it for the exam.`;
    }
    return `I got this ${currentQuestion.course.replace(/_/g, " ")} question wrong and need help understanding it:\n\n"${qText}"${opts ? `\nOptions: ${opts}` : ""}\n\nI chose the wrong answer. The correct answer is: ${feedback.correctAnswer}\n\nWhy is that the correct answer? Walk me through the concept step by step.`;
  }

  async function startSession() {
    setIsStarting(true);
    setSessionLimitReached(false);
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          unit: selectedUnit,
          difficulty: selectedDifficulty,
          questionCount,
          course,
          questionType: questionType !== "MCQ" ? questionType : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.limitExceeded) {
          setSessionLimitReached(true);
          return;
        }
        toast({ title: "Error", description: data.error || "Failed to start session", variant: "destructive" });
        return;
      }

      if (data.aiGenerationWarning) {
        toast({ title: "✨ AI questions generated", description: data.aiGenerationWarning });
      } else if (data.lowBankWarning) {
        toast({ title: "Limited questions available", description: data.lowBankWarning });
      }

      const qs: Question[] = data.questions ?? [];
      questionsRef.current = qs;
      setSessionId(data.sessionId);
      setQuestions(qs);
      setCurrentIndex(0);
      setResults([]);
      setFeedback(null);
      setSelectedAnswer(null);
      setStartTime(new Date());
      setQuestionStartTime(new Date());
      setMode("practicing");

      // Fire-and-forget snapshot of readiness BEFORE this session's answers
      // land, so the post-session delta card can render "before → after".
      // Failure here is silent — the summary just falls back to the
      // first-session copy path inside SessionDeltaCard.
      fetch(`/api/readiness?course=${course}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && d.showScore && typeof d.scaledScore === "number") {
            setBeforeScore(d.scaledScore);
            setBeforeFamily(d.family);
          } else {
            setBeforeScore(null);
            setBeforeFamily(d?.family);
          }
        })
        .catch(() => { /* silent — pre-signal path handles null */ });
    } catch {
      toast({ title: "Error", description: "Failed to start session. Check your connection.", variant: "destructive" });
    } finally {
      setIsStarting(false);
    }
  }

  async function submitAnswer(answer: string) {
    if (!sessionId || !currentQuestion || isSubmitting) return;
    setSelectedAnswer(answer);
    setIsSubmitting(true);

    const timeSecs = questionStartTime
      ? Math.round((Date.now() - questionStartTime.getTime()) / 1000)
      : 0;

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answer,
          timeSpentSecs: timeSecs,
        }),
        signal: AbortSignal.timeout(35000),
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to submit answer", variant: "destructive" });
        setSelectedAnswer(null);
        return;
      }
      setFeedback(data);
      setResults((prev) => [...prev, { correct: data.isCorrect, timeSecs }]);

      // Haptic feedback — success pattern on correct, error pattern on wrong.
      // No-op on platforms without navigator.vibrate (desktop, iOS Safari
      // pre-18). Fire-and-forget; never blocks.
      if (data.isCorrect) void hapticSuccess();
      else void hapticError();

      // Fire the diagnostic nudge check after each successful submit. The
      // modal self-gates against: already-shown-today / already-has-diagnostic /
      // not-at-threshold. See DiagnosticNudgeModal for the rules.
      if (typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (window as any).__preplion_checkDiagnosticNudge;
        if (typeof fn === "function") void fn();
      }

      // A22.4 port — Fail-downshift. If this is the 2nd consecutive wrong
      // in the current unit, reorder the upcoming queue so the student sees
      // a different-unit (or easier) question next. Pure helper at
      // lib/fail-downshift.ts.
      if (!data.isCorrect) {
        const { applyDownshift } = await import("@/lib/fail-downshift");
        const resultsForCheck = [
          ...results.map((r, i) => ({
            unit: questionsRef.current[i]?.unit ?? "",
            correct: r.correct,
          })),
          { unit: currentQuestion.unit, correct: false },
        ];
        const reordered = applyDownshift(questionsRef.current as { id: string; unit: string; difficulty: "EASY" | "MEDIUM" | "HARD" }[], resultsForCheck, currentIndex);
        if (reordered) {
          questionsRef.current = reordered as typeof questionsRef.current;
          setQuestions(reordered as typeof questions);
          toast({
            title: "Tough spot — let's shift gears",
            description: "Next question comes from a different angle to help you build momentum.",
          });
        }
      }

      // Auto-trigger embedded knowledge check for wrong MCQ answers.
      // Gated by the admin-toggleable knowledge_check_enabled flag so
      // admins can suppress this extra layer if it's confusing users.
      if (knowledgeCheckEnabled && !data.isCorrect && parsedOptions.length > 0) {
        setCheckQuestion(null);
        setCheckAnswer(null);
        setCheckLoading(true);
        fetch("/api/ai/tutor/knowledge-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutorResponse: `${currentQuestion.questionText}\nCorrect Answer: ${data.correctAnswer}\nExplanation: ${data.explanation}`,
            topic: currentQuestion.topic,
            course: currentQuestion.course,
            count: 1,
          }),
          signal: AbortSignal.timeout(25000),
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.questions?.[0]) setCheckQuestion(d.questions[0]);
          })
          .catch(() => {})
          .finally(() => setCheckLoading(false));
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit answer. Check your connection.", variant: "destructive" });
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function nextQuestion() {
    // Use ref so this always sees the live questions array, not a stale closure value
    const total = questionsRef.current.length;
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= total) {
        // trigger session completion
        completeSession();
        return prev;
      }
      setSelectedAnswer(null);
      setFeedback(null);
      setOpenEndedAnswer("");
      setCheckQuestion(null);
      setCheckAnswer(null);
      setCheckLoading(false);
      setQuestionStartTime(new Date());
      return next;
    });
  }

  async function completeSession() {
    const fallbackSummary: SessionSummary = {
      totalQuestions: questionsRef.current.length,
      correctAnswers: results.filter((r) => r.correct).length,
      accuracy: questionsRef.current.length > 0
        ? Math.round((results.filter((r) => r.correct).length / questionsRef.current.length) * 100)
        : 0,
      timeSpentSecs: startTime ? Math.round((Date.now() - startTime.getTime()) / 1000) : 0,
      xpEarned: 0,
      apScoreEstimate: 0,
    };
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to save session results", variant: "destructive" });
        setSessionSummary(fallbackSummary);
        setMode("summary");
        return;
      }
      setSessionSummary(data.summary);
      setMode("summary");
    } catch {
      toast({ title: "Connection issue", description: "Session results may not be saved. Here's your local summary.", variant: "destructive" });
      setSessionSummary(fallbackSummary);
      setMode("summary");
    }
  }

  async function submitFeedback(rating: 1 | -1) {
    if (!sessionId || feedbackRating !== null) return;
    setFeedbackRating(rating);
    await fetch("/api/practice/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, rating }),
    }).catch(() => {});
  }

  function resetSession() {
    questionsRef.current = [];
    setMode("select");
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setSessionSummary(null);
    setResults([]);
    setStartTime(null);
    setQuestionStartTime(null);
    setSessionLimitReached(false);
    setOpenEndedAnswer("");
    setFeedbackRating(null);
    setCheckQuestion(null);
    setCheckAnswer(null);
    setCheckLoading(false);
    setBeforeScore(null);
    setBeforeFamily(undefined);
  }

  if (mode === "summary" && sessionSummary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* First-session celebration — fires confetti once on the very
            first summary screen the user ever sees, and a smaller Medium
            celebration on subsequent ≥80% sessions. Gated by
            sessionStorage so a hot reload / tab reopen doesn't retrigger. */}
        <FirstSessionCelebration accuracy={sessionSummary.accuracy} />
        {/* A22.6 port — Session feedback popup. Shows once per source+course
            after the first completed session, asks rating + text on thumbs-down. */}
        <SessionFeedbackPopup
          sessionId={sessionId}
          triggerCondition="first-only"
          source="practice"
          course={course}
          context="completion"
        />
        <div className="text-center">
          <Trophy className={`h-16 w-16 mx-auto mb-4 ${sessionSummary.accuracy >= 80 ? "text-yellow-400" : "text-muted-foreground/60"}`} />
          <h1 className="text-3xl font-bold mb-2">
            {sessionSummary.accuracy >= 90 ? "Outstanding!" : sessionSummary.accuracy >= 80 ? "Great Job!" : sessionSummary.accuracy >= 60 ? "Session Complete!" : "Keep Going!"}
          </h1>
          <p className="text-muted-foreground">
            {sessionSummary.accuracy >= 80
              ? "You're showing real mastery — keep this up."
              : sessionSummary.accuracy >= 50
              ? "Every question builds your understanding."
              : "Focus on your weakest units and you'll see improvement fast."}
          </p>
        </div>

        {/* Score-delta card — "You just moved from 3.2 → 3.5". Fire-and-forget
            read of /api/readiness; silently hides if pre-signal or the call
            fails so the rest of the summary still renders. */}
        <SessionDeltaCard
          course={course}
          beforeScore={beforeScore}
          family={beforeFamily}
          totalQuestions={sessionSummary.totalQuestions}
          correctAnswers={sessionSummary.correctAnswers}
        />

        {/* Incomplete-loop retention nudge — surfaces weakest unit +
            streak protection as a reason to return tomorrow. Renders null
            if we don't have a weakestUnit to reference. */}
        <NextSessionNudge course={course} />

        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-400">{sessionSummary.accuracy}%</p>
                <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-blue-500">+{sessionSummary.xpEarned}</p>
                <p className="text-sm text-muted-foreground mt-1">XP Earned</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{sessionSummary.correctAnswers}/{sessionSummary.totalQuestions}</p>
                <p className="text-sm text-muted-foreground mt-1">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{formatTime(sessionSummary.timeSpentSecs)}</p>
                <p className="text-sm text-muted-foreground mt-1">Time Spent</p>
              </div>
            </div>

            {sessionSummary.apScoreEstimate > 0 && (
              <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-6">
                <p className="text-sm text-muted-foreground">Estimated {userTrack === "clep" ? "CLEP" : "AP"} Score</p>
                <p className="text-4xl font-bold text-blue-500">{userTrack === "clep" ? `${Math.round(sessionSummary.apScoreEstimate * 16)}/80` : `${sessionSummary.apScoreEstimate}/5`}</p>
              </div>
            )}

            {/* Improvement message */}
            {sessionSummary.previousAccuracy != null ? (
              sessionSummary.accuracy > sessionSummary.previousAccuracy ? (
                <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <p className="text-sm font-medium text-emerald-400">
                    Your accuracy improved {sessionSummary.accuracy - sessionSummary.previousAccuracy}% from your last session
                  </p>
                </div>
              ) : sessionSummary.accuracy === sessionSummary.previousAccuracy ? (
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                  <p className="text-sm text-blue-400">Consistent performance — keep building on it</p>
                </div>
              ) : (
                <div className="text-center p-3 rounded-lg bg-secondary/50 border border-border/40 mb-4">
                  <p className="text-sm text-muted-foreground">Keep at it — consistency builds mastery</p>
                </div>
              )
            ) : (
              <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                <p className="text-sm text-blue-400">Great first session! Keep practicing to track your improvement</p>
              </div>
            )}

            {/* Quick feedback — always above the fold */}
            <div className="border-t border-border/40 pt-4">
              {feedbackRating === null ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">How was this session?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:border-emerald-500 hover:text-emerald-400"
                      onClick={() => submitFeedback(1)}
                    >
                      <ThumbsUp className="h-4 w-4" /> Good
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 hover:border-red-500 hover:text-red-400"
                      onClick={() => submitFeedback(-1)}
                    >
                      <ThumbsDown className="h-4 w-4" /> Needs work
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  {feedbackRating === 1 ? "👍 Thanks for the feedback!" : "👎 Thanks — we'll keep improving!"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                  {r.correct ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-sm">Question {i + 1}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{formatTime(r.timeSecs)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={resetSession} variant="outline" className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            Practice Again
          </Button>
          <Link href="/analytics" className="flex-1">
            <Button className="w-full gap-2">
              View Analytics <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (mode === "practicing" && currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Diagnostic nudge — shows at 5 and 10 lifetime responses if
            user has no diagnostic yet. Self-gated. Exposes a hook on
            window that submitAnswer() calls after each successful submit. */}
        <DiagnosticNudgeModal course={course as string} />

        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            <Badge variant="secondary">{currentQuestion.topic}</Badge>
            {currentQuestion.course?.startsWith("CLEP_") && (
              <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950">
                <ShieldCheck className="h-3 w-3" />
                CB-Aligned
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>Question {currentIndex + 1} of {questionsRef.current.length}</span>
          </div>
        </div>

        <Progress
          value={(currentIndex / Math.max(questionsRef.current.length, 1)) * 100}
          className="h-2"
          indicatorClassName="bg-blue-500"
        />

        {/* Question card */}
        <Card className="card-glow">
          <CardContent className="p-6 space-y-4">
            {(currentQuestion.stimulus || currentQuestion.stimulusImageUrl) && (
              <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-blue-500 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Source / Context</p>
                {currentQuestion.stimulusImageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQuestion.stimulusImageUrl}
                      alt="Historical context"
                      className="max-h-52 rounded-lg border border-border/40 object-contain"
                    />
                  </div>
                )}
                {currentQuestion.stimulus && (
                  <div className="text-sm text-muted-foreground">
                    <MarkdownContent content={currentQuestion.stimulus} useMermaid={true} />
                  </div>
                )}
              </div>
            )}

            <div className="text-base font-medium leading-relaxed">
              <MarkdownContent content={currentQuestion.questionText} useMermaid={false} />
            </div>

            {/* Open-ended response for FRQ/SAQ/DBQ/LEQ/CODING */}
            {parsedOptions.length === 0 && !feedback && (
              <div className="space-y-3">
                {currentQuestion.questionType === "CODING" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your algorithm explanation or pseudocode solution below using AP CSP syntax.</p>
                    <p className="text-xs text-blue-500">Tip: Use AP pseudocode — DISPLAY, IF/ELSE, REPEAT TIMES, FOR EACH, PROCEDURE, RETURN</p>
                  </div>
                ) : currentQuestion.questionType === "DBQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Document-Based Question essay below. Include: thesis, contextualization, document analysis, and outside evidence.</p>
                    <p className="text-xs text-blue-500">Tip: Aim for ~5–7 paragraphs. Reference specific documents and explain their purpose (HAPP).</p>
                  </div>
                ) : currentQuestion.questionType === "LEQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Long Essay Question response below. Include: thesis, contextualization, evidence, and historical reasoning skill.</p>
                    <p className="text-xs text-blue-500">Tip: Aim for ~3–5 paragraphs. Use specific historical evidence to support your argument.</p>
                  </div>
                ) : currentQuestion.questionType === "SAQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Short Answer response below. Answer each labeled part (a), (b), (c) in 3–6 sentences each.</p>
                    <p className="text-xs text-blue-500">Tip: No thesis required. Be direct, use specific evidence, and address every part.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Free Response answer below. Show all work — equations, substitutions, units, and reasoning.</p>
                    <p className="text-xs text-blue-500">Tip: Label each part (a), (b), (c). Partial credit is awarded — show your reasoning even if unsure.</p>
                  </div>
                )}
                <Textarea
                  value={openEndedAnswer}
                  onChange={(e) => setOpenEndedAnswer(e.target.value)}
                  placeholder={
                    currentQuestion.questionType === "CODING"
                      ? "Write your explanation or pseudocode here...\n\nExample:\nPROCEDURE findMax(nums)\n  max ← nums[1]\n  FOR EACH n IN nums\n    IF n > max THEN max ← n\n  RETURN max"
                      : currentQuestion.questionType === "DBQ" || currentQuestion.questionType === "LEQ"
                      ? "Introduction / Thesis:\n\nBody Paragraph 1:\n\nBody Paragraph 2:\n\nConclusion:"
                      : "Part (a):\n\nPart (b):\n\nPart (c) (if applicable):"
                  }
                  className="min-h-[160px] text-sm font-mono leading-relaxed"
                  disabled={isSubmitting}
                />
                <Button
                  onClick={() => submitAnswer(openEndedAnswer || "student_response")}
                  disabled={!openEndedAnswer.trim() || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit & See Rubric"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {parsedOptions.map((option, i) => {
                const letter = option.charAt(0);
                let optionClass = "border border-border/40 hover:bg-accent cursor-pointer";

                if (feedback && selectedAnswer) {
                  if (letter === feedback.correctAnswer) {
                    optionClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  } else if (letter === selectedAnswer && !feedback.isCorrect) {
                    optionClass = "border-red-500 bg-red-500/10 text-red-400";
                  } else {
                    optionClass = "border border-border/20 opacity-50";
                  }
                } else if (selectedAnswer === letter) {
                  optionClass = "border-blue-500 bg-blue-500/10";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !feedback && !isSubmitting && submitAnswer(letter)}
                    disabled={!!feedback || isSubmitting}
                    className={`w-full text-left p-4 rounded-lg transition-all min-h-[48px] ${optionClass}`}
                  >
                    <span className="text-sm leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking answer...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {feedback && (
          <Card className={`card-glow border ${feedback.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <CardContent className="p-5 space-y-4">
              {feedback.frqScore ? (
                // FRQ Score Card
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${feedback.isCorrect ? "text-emerald-400" : "text-yellow-400"}`}>
                      {feedback.frqScore.pointsEarned}/{feedback.frqScore.totalPoints}
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={(feedback.frqScore.pointsEarned / feedback.frqScore.totalPoints) * 100}
                        className="h-2"
                        indicatorClassName={feedback.isCorrect ? "bg-emerald-500" : "bg-yellow-500"}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round((feedback.frqScore.pointsEarned / feedback.frqScore.totalPoints) * 100)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Response</p>
                    <p className="text-sm bg-secondary/50 rounded-lg p-3 leading-relaxed">{openEndedAnswer}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Feedback</p>
                    <p className="text-sm leading-relaxed">{feedback.frqScore.feedback}</p>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">Model Answer</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feedback.frqScore.modelAnswer}</p>
                  </div>
                </div>
              ) : (
                // MCQ feedback
                <div className="flex items-start gap-3">
                  {feedback.isCorrect ? (
                    <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {feedback.isCorrect ? "Correct!" : `Incorrect — Answer: ${feedback.correctAnswer}`}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feedback.explanation}
                    </p>
                    {currentQuestion.course?.startsWith("CLEP_") && (
                      <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground/60">
                        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> 8-criterion validated</span>
                        <span className="inline-flex items-center gap-1">Cross-model verified</span>
                        <span className="inline-flex items-center gap-1">CB topic-aligned</span>
                      </div>
                    )}
                    <Link
                      href="/ai-tutor"
                      onClick={() => {
                        saveSessionSnapshot();
                        sessionStorage.setItem("sage_prefill", buildSagePrefill(feedback.isCorrect));
                      }}
                      className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                        feedback.isCorrect
                          ? "bg-teal-500/10 text-teal-400 hover:bg-teal-500/20"
                          : "bg-blue-500/15 text-blue-400 hover:bg-blue-500/25"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {feedback.isCorrect ? "Go deeper with Sage →" : "Ask Sage to explain this →"}
                    </Link>
                  </div>
                </div>
              )}

              {/* Embedded knowledge check — auto-appears after wrong MCQ.
                  Gated on knowledgeCheckEnabled so the header doesn't
                  render with an empty body when admin disables the flag. */}
              {knowledgeCheckEnabled && !feedback.isCorrect && !feedback.frqScore && (
                <div className="border-t border-border/40 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Quick Check — Before You Move On
                  </p>
                  {checkLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating comprehension check…
                    </div>
                  )}
                  {checkQuestion && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium leading-relaxed">{checkQuestion.question}</p>
                      <div className="space-y-1.5">
                        {checkQuestion.options.map((opt, i) => {
                          let cls = "border border-border/40 hover:bg-accent cursor-pointer";
                          if (checkAnswer !== null) {
                            if (i === checkQuestion.correctIndex) {
                              cls = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                            } else if (i === checkAnswer) {
                              cls = "border-red-500 bg-red-500/10 text-red-400";
                            } else {
                              cls = "border border-border/20 opacity-50";
                            }
                          }
                          return (
                            <button
                              key={i}
                              disabled={checkAnswer !== null}
                              onClick={() => setCheckAnswer(i)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${cls}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {checkAnswer !== null && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {checkAnswer === checkQuestion.correctIndex ? "✓ " : "✗ "}
                          {checkQuestion.explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={nextQuestion} className="w-full gap-2">
                {currentIndex + 1 >= questionsRef.current.length ? "See Results" : `Next Question (${currentIndex + 2} of ${questionsRef.current.length})`}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Session selection screen
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Practice</h1>
        <p className="text-muted-foreground">Choose your practice mode and settings</p>
      </div>

      <CourseSelectorInline />

      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setSessionType("QUICK_PRACTICE"); setQuestionCount(10); setQuestionType("MCQ"); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            sessionType === "QUICK_PRACTICE" && questionType === "MCQ"
              ? "border-blue-500 bg-blue-500/10"
              : "border-border/40 hover:bg-accent"
          }`}
        >
          <Zap className="h-6 w-6 text-yellow-400 mb-2" />
          <p className="font-medium">Quick Practice</p>
          <p className="text-xs text-muted-foreground">10 MCQs · Free</p>
        </button>
        <button
          onClick={() => { setSessionType("FOCUSED_STUDY"); setQuestionCount(20); setQuestionType("MCQ"); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            sessionType === "FOCUSED_STUDY" && questionType === "MCQ"
              ? "border-blue-500 bg-blue-500/10"
              : "border-border/40 hover:bg-accent"
          }`}
        >
          <BookOpen className="h-6 w-6 text-blue-400 mb-2" />
          <p className="font-medium">Focused Study</p>
          <p className="text-xs text-muted-foreground">20 MCQs · Free</p>
        </button>

        {/* For MCQ-only courses (CLEP), show session limit indicator when premium restriction is enabled */}
        {(() => {
          const courseConfig = getCourseConfig(course as ApCourse);
          const availableFrqTypes = Object.keys(courseConfig?.questionTypeFormats ?? {}).filter((t) => t !== "MCQ");
          if (availableFrqTypes.length > 0) return null; // AP/SAT/ACT courses — FRQ card handles this
          if (!premiumRestricted || isPremiumForTrack(subscriptionTier ?? "FREE", userTrack)) return null;
          return (
            <div className="col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-xs text-yellow-300/80">
              <Crown className="h-3.5 w-3.5 flex-shrink-0 text-yellow-400" />
              <span>You&apos;re on the Free plan — 3 sessions/day. {userTrack === "clep"
                ? <>Want unlimited practice + all 34 CLEP courses? <Link href="/pricing" className="underline hover:text-blue-300">Upgrade to CLEP Premium</Link></>
                : <>Want unlimited practice + FRQ scoring? <Link href="/pricing" className="underline hover:text-blue-300">Upgrade to AP Premium</Link></>
              }</span>
            </div>
          );
        })()}

        {/* FRQ Practice — Premium only, shown for any course that has FRQ/SAQ/DBQ/LEQ */}
        {(() => {
          const courseConfig = getCourseConfig(course as ApCourse);
          const availableFrqTypes = Object.keys(courseConfig?.questionTypeFormats ?? {}).filter((t) => t !== "MCQ");
          if (availableFrqTypes.length === 0) return null;
          const defaultFrqType = availableFrqTypes[0] as "FRQ" | "SAQ" | "LEQ" | "DBQ" | "CODING";
          const typeLabel = availableFrqTypes.join(" · ");
          const isLocked = premiumRestricted && !isPremiumForTrack(subscriptionTier ?? "FREE", userTrack);
          return (
            <button
              onClick={() => {
                if (isLocked) return;
                setSessionType("FOCUSED_STUDY");
                setQuestionCount(5);
                setQuestionType(defaultFrqType);
              }}
              className={`p-4 rounded-xl border text-left transition-all col-span-2 ${
                questionType !== "MCQ"
                  ? "border-blue-500 bg-blue-500/10"
                  : isLocked
                  ? "border-border/40 opacity-70 cursor-not-allowed"
                  : "border-border/40 hover:bg-accent"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <PenLine className="h-5 w-5 text-purple-400" />
                    {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="font-medium">FRQ Practice</p>
                  <p className="text-xs text-muted-foreground">{typeLabel} — AI-scored rubric feedback</p>
                </div>
                {isLocked && (
                  <Badge className="bg-blue-600 text-white text-xs">Premium</Badge>
                )}
                {!premiumRestricted && !isPremiumForTrack(subscriptionTier ?? "FREE", userTrack) && (
                  <Badge className="bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">Limited Time Access</Badge>
                )}
              </div>
              {questionType !== "MCQ" && (
                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  {availableFrqTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setQuestionType(t as "FRQ" | "SAQ" | "LEQ" | "DBQ" | "CODING")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                        questionType === t
                          ? "border-purple-500 bg-purple-500/20 text-purple-300"
                          : "border-border/40 hover:bg-accent"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </button>
          );
        })()}
      </div>

      {/* Session limit reached — sharpened lock copy + projected-time-
          to-pass comparison (Option B, reviewer 2026-04-22). */}
      {sessionLimitReached && <SessionLimitHitCard course={course} />}

      {/* Premium upsell — only when the premium-restriction flag is ON.
          When the flag is OFF (dev/QA), non-premium users have full FRQ
          access so no banner is needed — previously we showed a
          "limited time free" banner here that would have misled paying
          users if the flag ever flipped by accident. */}
      {!isPremiumForTrack(subscriptionTier ?? "FREE", userTrack) && Object.keys(getCourseConfig(course as ApCourse)?.questionTypeFormats ?? {}).some((t) => t !== "MCQ") && !sessionLimitReached && premiumRestricted && (
        <Card className="card-glow border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Crown className="h-5 w-5 text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Unlock FRQ Practice</p>
              <p className="text-xs text-muted-foreground">SAQ, LEQ & DBQ with AI rubric scoring — Premium only</p>
            </div>
            <Link href="/pricing">
              <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 text-xs">
                Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sage loading bubble — shown while FRQ/CODING session is starting */}
      {isStarting && questionType !== "MCQ" && (
        <Card className="card-glow border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-bold text-blue-400">Sage 🌿</p>
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {questionType === "CODING"
                    ? CODING_WAIT_MESSAGES[startMsgIndex]
                    : FRQ_WAIT_MESSAGES[startMsgIndex]}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-base">Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Unit</label>
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                {(Object.keys(courseUnits) as ApUnit[]).map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {courseUnits[unit]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number of Questions</label>
            <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 questions</SelectItem>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="15">15 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startSession} disabled={isStarting || sessionLimitReached} className="w-full gap-2">
            {isStarting ? (
              <><Loader2 className="h-4 w-4 animate-spin" />
                {questionType !== "MCQ" ? " AI is preparing your question…" : " Starting…"}
              </>
            ) : (
              <><Zap className="h-4 w-4" /> Start Session</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

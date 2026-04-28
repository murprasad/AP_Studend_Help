"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useExamMode } from "@/hooks/use-exam-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useCourse } from "@/hooks/use-course";
import { formatTime } from "@/lib/utils";
import { ApCourse } from "@prisma/client";
import { getCourseTrack, getMockExamConfig } from "@/lib/courses";
import { isPremiumForTrack, type ModuleSub } from "@/lib/tiers";
import { QuestionContent } from "@/components/question/question-content";
import {
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  Play,
  Zap,
  GraduationCap,
} from "lucide-react";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
import { CourseExamOverview } from "@/components/practice/course-exam-overview";
import Link from "next/link";
import { FREE_LIMITS, LOCK_COPY, projectedDaysToTarget } from "@/lib/tier-limits";

type ExamPhase = "intro" | "section1" | "complete";
type ExamMode = "full" | "quick";

interface ExamQuestion {
  id: string;
  questionText: string;
  stimulus?: string;
  options?: unknown;
  topic: string;
  unit: string;
}

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSecs: number;
  xpEarned: number;
  apScoreEstimate: number;
}

export default function MockExamPage() {
  const { toast } = useToast();
  const [course] = useCourse();
  const { data: session } = useSession();
  const [phase, setPhase] = useState<ExamPhase>("intro");

  // Premium check — default Full for premium, Quick for free-trial.
  const hasPremium = useMemo(() => {
    if (!session?.user) return false;
    const track = session.user.track ?? "ap";
    const tier = session.user.subscriptionTier ?? "FREE";
    const moduleSubs: ModuleSub[] = session.user.moduleSubs ?? [];
    // Any module premium OR legacy track-based premium counts.
    if (isPremiumForTrack(tier, track)) return true;
    return moduleSubs.some((s) => s.status === "active" || s.status === "canceling");
    // (hasModulePremium not called directly — we accept premium on ANY module
    // since Full-length mock value is generic.)
  }, [session]);

  const [mode, setMode] = useState<ExamMode>("full");
  // Reset mode default whenever premium status resolves.
  useEffect(() => {
    setMode(hasPremium ? "full" : "quick");
  }, [hasPremium]);

  // Full-screen exam mode while a section is in progress.
  const { enterExamMode, exitExamMode } = useExamMode();
  useEffect(() => {
    if (phase === "section1") enterExamMode();
    else exitExamMode();
  }, [phase, enterExamMode, exitExamMode]);
  useEffect(() => { return () => exitExamMode(); }, [exitExamMode]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const questionsRef = useRef<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  // Conversion-lever item #3 (feedback 2026-04-22): partial-lock mock
  // for FREE users after Q5. Track correct-count on the fly so the
  // paywall can reveal a projected score based on mid-exam performance.
  const [correctCount, setCorrectCount] = useState(0);
  const [showPartialPaywall, setShowPartialPaywall] = useState(false);

  // Resolve both Full + Quick configs so the toggle can preview each without
  // waiting for re-render. Pacing (secsPerQuestion) is identical between the
  // two — that's the whole point of the derived formula.
  const fullInfo = useMemo(() => getMockExamConfig(course as ApCourse, "full"), [course]);
  const quickInfo = useMemo(() => getMockExamConfig(course as ApCourse, "quick"), [course]);
  const selectedInfo = mode === "full" ? fullInfo : quickInfo;
  const isClep = getCourseTrack(course as ApCourse) === "clep";
  const trackLabel = isClep ? "CLEP" : "AP";

  // Timer
  useEffect(() => {
    if (phase !== "section1") return;
    if (timeLeft <= 0) { completeExam(); return; }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Beta 7.7 (2026-04-25): mock-exam crash-recovery via sessionStorage.
  // The mock exam can run 3+ hours for full AP. A browser refresh, tab
  // close, or laptop reboot mid-exam previously meant losing every answer
  // typed so far (no server-side state, only React in-memory state).
  // Saves on each answer/timer-tick (debounced via state change), restores
  // on mount with explicit "Resume?" UX that respects the user's choice.
  // Only persists during phase === "section1" (active exam). Cleared on
  // completion to avoid stale-resume prompts on next mock attempt.
  const STORAGE_KEY = `mock_exam_snapshot_${course}`;
  // 12-hour TTL covers the most paranoid edge case: a student starts an
  // evening 3.5h full AP mock, closes their laptop near midnight, opens it
  // the following morning before school wanting to finish. Original 4h TTL
  // silently dropped the snapshot in this scenario — student lost work.
  const STORAGE_TTL_MS = 12 * 60 * 60 * 1000;

  useEffect(() => {
    if (phase !== "section1" || !sessionId) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        sessionId,
        questions: questionsRef.current,
        currentIndex,
        answers,
        timeLeft,
        correctCount,
        mode,
        savedAt: Date.now(),
      }));
    } catch { /* sessionStorage full or disabled — ignore */ }
  }, [phase, sessionId, currentIndex, answers, timeLeft, correctCount, mode, STORAGE_KEY]);

  useEffect(() => {
    if (phase !== "complete") return;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [phase, STORAGE_KEY]);

  // On mount: detect a saved in-progress mock and offer resume. If the
  // user accepts, restore all state in one batch. If they decline, clear
  // sessionStorage so the prompt doesn't reappear on next visit.
  const [resumePrompt, setResumePrompt] = useState<{
    sessionId: string;
    currentIndex: number;
    timeLeft: number;
    questionCount: number;
    answersGiven: number;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const snap = JSON.parse(raw);
      if (!snap?.sessionId || !Array.isArray(snap.questions)) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      if (Date.now() - (snap.savedAt ?? 0) > STORAGE_TTL_MS) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      // Stage the resume prompt; don't auto-resume in case the user
      // intentionally abandoned and is starting a new attempt.
      setResumePrompt({
        sessionId: snap.sessionId,
        currentIndex: snap.currentIndex ?? 0,
        timeLeft: snap.timeLeft ?? 0,
        questionCount: snap.questions.length,
        answersGiven: Object.keys(snap.answers ?? {}).length,
      });
    } catch {
      try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function acceptResume() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) { setResumePrompt(null); return; }
      const snap = JSON.parse(raw);
      questionsRef.current = snap.questions;
      setSessionId(snap.sessionId);
      setQuestions(snap.questions);
      setCurrentIndex(snap.currentIndex ?? 0);
      setAnswers(snap.answers ?? {});
      setTimeLeft(snap.timeLeft ?? 0);
      setCorrectCount(snap.correctCount ?? 0);
      if (snap.mode === "full" || snap.mode === "quick") setMode(snap.mode);
      setFeedback(null);
      setPhase("section1");
    } catch { /* ignore — user can start fresh */ }
    setResumePrompt(null);
  }

  function declineResume() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setResumePrompt(null);
  }

  async function startExam() {
    setIsLoading(true);
    try {
      // CB-fidelity mock when mode === "full" — pulls a mix of MCQ + SAQ +
      // DBQ + LEQ in CB proportions (added 2026-04-27 to close the credibility
      // gap where the structure card said "MCQ + SAQ + DBQ + LEQ" but the
      // actual mock served only MCQs). "quick" mode keeps the legacy
      // MCQ-only path for users who want a fast 30-min check.
      const usesCBFidelity = mode === "full";
      const response = await fetch(usesCBFidelity ? "/api/mock-exam" : "/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          usesCBFidelity
            ? { course, mode: "full" }  // full CB count for serious-prep simulation
            : {
                sessionType: "MOCK_EXAM",
                questionCount: selectedInfo.questionCount,
                unit: "ALL",
                difficulty: "ALL",
                course,
              },
        ),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      questionsRef.current = data.questions ?? [];
      setSessionId(data.sessionId);
      setQuestions(data.questions ?? []);
      // Scale timer to actual questions served — bank may be smaller than target.
      const servedQs = (data.questions ?? []).length;
      const totalSecs = servedQs > 0
        ? selectedInfo.secsPerQuestion * servedQs
        : selectedInfo.totalSecs;
      setTimeLeft(totalSecs);
      setCurrentIndex(0);
      setAnswers({});
      setFeedback(null);
      setPhase("section1");
    } catch {
      toast({ title: "Error", description: "Failed to start exam", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function submitAnswer(answer: string) {
    if (!sessionId || !questions[currentIndex] || isSubmitting) return;
    setIsSubmitting(true);
    const qId = questions[currentIndex].id;
    setAnswers((prev) => ({ ...prev, [qId]: answer }));

    const total = questionsRef.current.length || selectedInfo.questionCount;
    const totalSecs = selectedInfo.secsPerQuestion * total;
    const elapsed = totalSecs - timeLeft;
    const timeSecs = Math.round(elapsed / Math.max(currentIndex + 1, 1));

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: qId, answer, timeSpentSecs: timeSecs }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to submit", variant: "destructive" });
        return;
      }
      setFeedback(data);
      // Track correctness for the mid-exam projected-score reveal.
      if (data.isCorrect) setCorrectCount((c) => c + 1);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const completeExam = useCallback(async () => {
    if (!sessionId) return;
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      setResult(data.summary);
      setPhase("complete");
    } catch {
      toast({ title: "Error completing exam", variant: "destructive" });
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  function nextQuestion() {
    const total = questionsRef.current.length;
    // Partial-lock gate for FREE users: after the tier-limit-configured
    // preview (default 5 Qs), surface the projected-score paywall instead
    // of advancing. Premium users flow through normally. Limit lives in
    // src/lib/tier-limits.ts so a future spec change is one-file.
    if (!hasPremium && currentIndex === FREE_LIMITS.mockExamQuestions - 1 && currentIndex + 1 < total) {
      setShowPartialPaywall(true);
      return;
    }
    if (currentIndex + 1 >= total) {
      completeExam();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
    }
  }

  const currentQ = questions[currentIndex];
  const parsedOptions: string[] = (() => {
    if (!currentQ?.options) return [];
    const raw = currentQ.options;
    if (Array.isArray(raw)) return raw as string[];
    try { return JSON.parse(raw as string) as string[]; } catch { return []; }
  })();

  const timeWarning = timeLeft < 60 * 2; // less than 2 min

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const minutesDisplay = Math.round(selectedInfo.totalSecs / 60);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mock {trackLabel} Exam</h1>
          <p className="text-muted-foreground mt-1">
            Timed section simulation with official {trackLabel} pacing
          </p>
        </div>

        {/* CB exam structure card — added 2026-04-27 so students know
            the real exam shape (MCQ + SAQ + DBQ + LEQ) even when our
            mock currently is MCQ-only. Transparency over surprise. */}
        <CourseExamOverview course={course} isFreeTier={false} />

        {/* Beta 7.7 (2026-04-25): resume-in-progress mock prompt. If the
            user crashed/refreshed mid-exam (browser, laptop reboot, tab
            close), sessionStorage holds their answers + position + remaining
            time. Show explicit choose-your-path UI so they don't lose hours
            of work. */}
        {resumePrompt && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-700 dark:text-amber-700 dark:text-amber-400">You have an exam in progress</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Question {resumePrompt.currentIndex + 1} of {resumePrompt.questionCount} · {resumePrompt.answersGiven} answered · {Math.floor(resumePrompt.timeLeft / 60)}m {resumePrompt.timeLeft % 60}s remaining.
                    Continue where you left off, or start fresh (your in-progress answers will be lost).
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={declineResume}>
                  Start fresh
                </Button>
                <Button size="sm" onClick={acceptResume} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                  Resume exam
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <CourseSelectorInline />

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Section Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Length toggle — Quick Mock vs Full Section */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Length</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("quick")}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    mode === "quick"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-border/40 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    <span className="font-semibold">Quick Mock</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {quickInfo.questionCount} Qs · ~{Math.round(quickInfo.totalSecs / 60)} min
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real per-Q pacing
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("full")}
                  disabled={!hasPremium}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    mode === "full"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border/40 hover:border-border"
                  } ${!hasPremium ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-semibold">Full Section</span>
                    {!hasPremium && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fullInfo.questionCount} Qs · {fullInfo.mcqTimeMinutes} min
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real exam length
                  </p>
                </button>
              </div>
              {!hasPremium && (
                <p className="text-xs text-muted-foreground">
                  Upgrade for the Full Section experience —{" "}
                  <Link href="/billing" className="text-blue-700 dark:text-blue-400 hover:underline">
                    Go Premium
                  </Link>
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground mb-1">Questions</p>
                <p className="text-2xl font-bold text-blue-500">{selectedInfo.questionCount}</p>
                <p className="text-xs text-muted-foreground">MCQ</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground mb-1">Time Allowed</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{minutesDisplay} min</p>
                <p className="text-xs text-muted-foreground">{selectedInfo.secsPerQuestion}s per question</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-sm text-muted-foreground mb-1">Result</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{isClep ? "Pass/Fail" : "1–5"}</p>
                <p className="text-xs text-muted-foreground">{isClep ? "CLEP Score" : "AP Score"}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  The timer runs from the moment you start. No notes allowed — simulate real exam conditions.
                </p>
              </div>
            </div>

            <Button onClick={startExam} disabled={isLoading} size="lg" className="w-full gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Preparing Exam...</>
              ) : (
                <><Play className="h-4 w-4" /> Start Timed Exam</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === "complete" && result) {
    const scoreColors: Record<number, string> = {
      5: "text-emerald-700 dark:text-emerald-400", 4: "text-blue-700 dark:text-blue-400", 3: "text-yellow-700 dark:text-yellow-400",
      2: "text-orange-700 dark:text-orange-400",  1: "text-red-700 dark:text-red-400",
    };
    const scoreMessages: Record<number, string> = {
      5: "Excellent! You're exam ready!",
      4: isClep ? "Great work! You're close to a passing score!" : "Great work! A few more sessions and you'll hit 5!",
      3: "Good foundation. Focus on weak units to improve.",
      2: "Keep practicing. Review the units you struggled with.",
      1: "Don't give up! More practice will make a big difference.",
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-yellow-700 dark:text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Exam Complete!</h1>
        </div>

        <Card className="card-glow">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Estimated {trackLabel} Score</p>
            <p className={`text-8xl font-bold ${scoreColors[result.apScoreEstimate] || "text-foreground"}`}>
              {result.apScoreEstimate}
            </p>
            <p className="text-muted-foreground mt-2 mb-6">{isClep ? "out of 80 (pass: 50+)" : "out of 5"}</p>
            <p className="text-base font-medium">
              {scoreMessages[result.apScoreEstimate] || "Keep practicing!"}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Accuracy",    value: `${result.accuracy}%`,                  color: "text-emerald-700 dark:text-emerald-400" },
            { label: "Correct",     value: `${result.correctAnswers}/${result.totalQuestions}`, color: "text-blue-700 dark:text-blue-400" },
            { label: "Time Spent",  value: formatTime(result.timeSpentSecs),        color: "text-purple-700 dark:text-purple-400" },
            { label: "XP Earned",   value: `+${result.xpEarned}`,                  color: "text-yellow-700 dark:text-yellow-400" },
          ].map((stat) => (
            <Card key={stat.label} className="card-glow">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => { setPhase("intro"); setResult(null); }} variant="outline" className="flex-1">
            Retake Exam
          </Button>
          <Link href="/study-plan" className="flex-1">
            <Button className="w-full gap-2">
              Update Study Plan <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Section 1 ─────────────────────────────────────────────────────────────
  if (phase === "section1" && currentQ) {
    const total = questionsRef.current.length;

    // Mid-exam partial paywall (conversion item #3, feedback 2026-04-22).
    // At Q5 with nextQuestion() blocked, reveal a projected score so
    // the user feels the mid-investment moment, then gate continuation.
    if (showPartialPaywall) {
      const previewCount = FREE_LIMITS.mockExamQuestions;
      const pct = Math.round((correctCount / previewCount) * 100);
      // AP 1-5 mapping: ≥80% = 5, ≥65% = 4, ≥50% = 3, ≥35% = 2, else 1
      const projected = pct >= 80 ? 5 : pct >= 65 ? 4 : pct >= 50 ? 3 : pct >= 35 ? 2 : 1;
      const passing = projected >= 3;
      const cardBorder = passing ? "border-blue-500/60" : "border-red-500/60";
      const cardBg = passing
        ? "bg-gradient-to-br from-blue-500/10 via-card to-emerald-500/5"
        : "bg-gradient-to-br from-red-500/10 via-card to-amber-500/10";
      return (
        <div className="max-w-md mx-auto pt-8">
          <Card className={`border-2 shadow-2xl ${cardBorder} ${cardBg}`}>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Halfway preview</p>
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Projected AP Score</p>
                <p className={`text-7xl font-bold leading-none ${passing ? "text-blue-500" : "text-red-500"}`}>
                  {projected}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {correctCount}/{FREE_LIMITS.mockExamQuestions} correct so far
                </p>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {LOCK_COPY.mockExamPaywall}
                </p>
              </div>
              <p className="text-sm leading-relaxed">
                {passing
                  ? "You're trending toward passing — finish the full exam to see your real score and claim your path to a higher number."
                  : `You're trending toward a ${projected}. Finish the full exam to see your real score and unlock the week-by-week plan that gets you to a 3.`}
              </p>
              {/* Projected time-to-pass comparison — Option B conversion lever
                  (reviewer 2026-04-22). Roughly 300 Qs to go from 2 → 3 on
                  most AP exams; the math is coarse on purpose so students
                  feel the compression, not chase precision. */}
              {!passing && (() => {
                const approxQsToTarget = 300;
                const { freeDays, premiumDays } = projectedDaysToTarget(approxQsToTarget);
                return (
                  <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-[12px] text-left">
                    <p className="text-muted-foreground">At your current pace</p>
                    <p className="font-semibold text-foreground tabular-nums">~{freeDays} days to passing</p>
                    <p className="text-muted-foreground mt-2">With unlimited practice</p>
                    <p className="font-semibold text-emerald-600 tabular-nums">~{premiumDays} days to passing</p>
                  </div>
                );
              })()}
              <Link href={`/billing?utm_source=mock_exam&utm_campaign=q5_paywall&course=${course}`}>
                <Button size="lg" className={`w-full h-12 text-base font-semibold shadow-lg ${passing ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"} text-white`}>
                  Finish Full Exam — Upgrade $9.99/mo
                </Button>
              </Link>
              <button
                onClick={() => { setShowPartialPaywall(false); completeExam(); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                End here instead — see limited results
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Exam header */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Section 1 · MCQ</Badge>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeWarning ? "text-red-700 dark:text-red-400 animate-pulse" : "text-foreground"}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress
          value={(currentIndex / Math.max(total, 1)) * 100}
          className="h-2"
          indicatorClassName="bg-blue-500"
        />

        <p className="text-sm text-muted-foreground text-center">
          Question {currentIndex + 1} of {total}
        </p>

        <Card className="card-glow">
          <CardContent className="p-6 space-y-4">
            {currentQ.stimulus && (
              <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-blue-500">
                <div className="text-sm leading-relaxed italic text-muted-foreground">
                  <QuestionContent content={currentQ.stimulus} />
                </div>
              </div>
            )}

            <div className="text-base font-medium leading-relaxed">
              <QuestionContent content={currentQ.questionText} />
            </div>

            <div className="space-y-2">
              {parsedOptions.map((option, i) => {
                const letter = option.charAt(0);
                let cls = "border border-border/40 hover:bg-accent cursor-pointer";
                if (feedback) {
                  if (letter === feedback.correctAnswer) cls = "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
                  else if (answers[currentQ.id] === letter && !feedback.isCorrect) cls = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                  else cls = "border border-border/20 opacity-50";
                } else if (answers[currentQ.id] === letter) {
                  cls = "border-blue-500 bg-blue-500/10";
                }
                return (
                  <button
                    key={i}
                    onClick={() => !feedback && !isSubmitting && submitAnswer(letter)}
                    disabled={!!feedback || isSubmitting}
                    className={`w-full text-left p-4 rounded-lg transition-all min-h-[48px] ${cls}`}
                  >
                    <span className="text-sm leading-relaxed">{option}</span>
                  </button>
                );
              })}
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {feedback && (
          <Card className={`card-glow border ${feedback.isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                {feedback.isCorrect
                  ? <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="h-6 w-6 text-red-700 dark:text-red-400 flex-shrink-0 mt-0.5" />
                }
                <div>
                  <p className="font-semibold mb-1">
                    {feedback.isCorrect ? "Correct!" : `Incorrect — Correct: ${feedback.correctAnswer}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{feedback.explanation}</p>
                </div>
              </div>
              <Button onClick={nextQuestion} className="w-full mt-4 gap-2">
                {currentIndex + 1 >= total ? "Finish Exam" : `Next Question (${currentIndex + 2} of ${total})`}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return null;
}

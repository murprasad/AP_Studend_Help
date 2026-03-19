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
import { Textarea } from "@/components/ui/textarea";
import { CourseSelectorInline } from "@/components/layout/course-selector-inline";
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

  const [subscriptionTier, setSubscriptionTier] = useState<"FREE" | "PREMIUM" | null>(null);
  const [premiumRestricted, setPremiumRestricted] = useState(false);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);

  const [mode, setMode] = useState<PracticeMode>("select");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [questionCount, setQuestionCount] = useState(10);
  const [sessionType, setSessionType] = useState("QUICK_PRACTICE");
  const [questionType, setQuestionType] = useState<"MCQ" | "FRQ" | "SAQ" | "LEQ" | "DBQ" | "CODING">("MCQ");

  useEffect(() => {
    Promise.all([
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/feature-flags").then((r) => r.json()),
    ])
      .then(([userData, flagsData]) => {
        setSubscriptionTier(userData.user?.subscriptionTier ?? "FREE");
        setPremiumRestricted(flagsData.premiumRestrictionEnabled ?? false);
      })
      .catch(() => {});
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

  // Reset unit selection when course changes
  useEffect(() => {
    setSelectedUnit("ALL");
  }, [course]);

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
      // Auto-trigger embedded knowledge check for wrong MCQ answers
      if (!data.isCorrect && parsedOptions.length > 0) {
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
  }

  if (mode === "summary" && sessionSummary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
          <p className="text-muted-foreground">Here&apos;s how you did</p>
        </div>

        <Card className="card-glow">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <p className="text-5xl font-bold text-emerald-400">{sessionSummary.accuracy}%</p>
                <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-5xl font-bold text-indigo-400">+{sessionSummary.xpEarned}</p>
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
              <div className="text-center p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <p className="text-sm text-muted-foreground">Estimated AP Score</p>
                <p className="text-4xl font-bold text-indigo-400">{sessionSummary.apScoreEstimate}/5</p>
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
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            <Badge variant="secondary">{currentQuestion.topic}</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>Question {currentIndex + 1} of {questionsRef.current.length}</span>
          </div>
        </div>

        <Progress
          value={(currentIndex / Math.max(questionsRef.current.length, 1)) * 100}
          className="h-2"
          indicatorClassName="bg-indigo-500"
        />

        {/* Question card */}
        <Card className="card-glow">
          <CardContent className="p-6 space-y-4">
            {(currentQuestion.stimulus || currentQuestion.stimulusImageUrl) && (
              <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-indigo-500 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Source / Context</p>
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
                    <p className="text-xs text-indigo-400">Tip: Use AP pseudocode — DISPLAY, IF/ELSE, REPEAT TIMES, FOR EACH, PROCEDURE, RETURN</p>
                  </div>
                ) : currentQuestion.questionType === "DBQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Document-Based Question essay below. Include: thesis, contextualization, document analysis, and outside evidence.</p>
                    <p className="text-xs text-indigo-400">Tip: Aim for ~5–7 paragraphs. Reference specific documents and explain their purpose (HAPP).</p>
                  </div>
                ) : currentQuestion.questionType === "LEQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Long Essay Question response below. Include: thesis, contextualization, evidence, and historical reasoning skill.</p>
                    <p className="text-xs text-indigo-400">Tip: Aim for ~3–5 paragraphs. Use specific historical evidence to support your argument.</p>
                  </div>
                ) : currentQuestion.questionType === "SAQ" ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Short Answer response below. Answer each labeled part (a), (b), (c) in 3–6 sentences each.</p>
                    <p className="text-xs text-indigo-400">Tip: No thesis required. Be direct, use specific evidence, and address every part.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Write your Free Response answer below. Show all work — equations, substitutions, units, and reasoning.</p>
                    <p className="text-xs text-indigo-400">Tip: Label each part (a), (b), (c). Partial credit is awarded — show your reasoning even if unsure.</p>
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
                  optionClass = "border-indigo-500 bg-indigo-500/10";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !feedback && !isSubmitting && submitAnswer(letter)}
                    disabled={!!feedback || isSubmitting}
                    className={`w-full text-left p-4 rounded-lg transition-all ${optionClass}`}
                  >
                    <span className="text-sm">{option}</span>
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
                    {!feedback.isCorrect && (
                      <Link
                        href="/ai-tutor"
                        onClick={() => {
                          if (currentQuestion) {
                            sessionStorage.setItem(
                              "sage_prefill",
                              `Why is "${feedback.correctAnswer}" the correct answer for this question? "${currentQuestion.questionText.slice(0, 200)}"`
                            );
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors"
                      >
                        🌿 Still confused? Ask Sage to explain this →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Embedded knowledge check — auto-appears after wrong MCQ */}
              {!feedback.isCorrect && !feedback.frqScore && (
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
              ? "border-indigo-500 bg-indigo-500/10"
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
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-border/40 hover:bg-accent"
          }`}
        >
          <BookOpen className="h-6 w-6 text-blue-400 mb-2" />
          <p className="font-medium">Focused Study</p>
          <p className="text-xs text-muted-foreground">20 MCQs · Free</p>
        </button>

        {/* FRQ Practice — Premium only, shown for any course that has FRQ/SAQ/DBQ/LEQ */}
        {(() => {
          const courseConfig = getCourseConfig(course as ApCourse);
          const availableFrqTypes = Object.keys(courseConfig?.questionTypeFormats ?? {}).filter((t) => t !== "MCQ");
          if (availableFrqTypes.length === 0) return null;
          const defaultFrqType = availableFrqTypes[0] as "FRQ" | "SAQ" | "LEQ" | "DBQ" | "CODING";
          const typeLabel = availableFrqTypes.join(" · ");
          const isLocked = premiumRestricted && subscriptionTier !== "PREMIUM";
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
                  ? "border-indigo-500 bg-indigo-500/10"
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
                  <Badge className="bg-indigo-600 text-white text-xs">Premium</Badge>
                )}
                {!premiumRestricted && subscriptionTier === "FREE" && (
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

      {/* Session limit reached */}
      {sessionLimitReached && (
        <Card className="card-glow border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Crown className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-yellow-300">Daily limit reached</p>
                <p className="text-sm text-muted-foreground">
                  Free accounts get 3 MCQ practice sessions per day. Upgrade to Premium for unlimited practice + FRQ with AI scoring.
                </p>
                <Link href="/pricing">
                  <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 mt-1">
                    <Crown className="h-4 w-4" /> Upgrade to Premium
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium upsell / limited-time banner for FRQ */}
      {subscriptionTier === "FREE" && Object.keys(getCourseConfig(course as ApCourse)?.questionTypeFormats ?? {}).some((t) => t !== "MCQ") && !sessionLimitReached && (
        premiumRestricted ? (
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
        ) : (
          <Card className="card-glow border-indigo-500/20 bg-indigo-500/5">
            <CardContent className="p-4">
              <p className="text-sm">🎉 Premium access is available to all users for a limited time — enjoy FRQ practice free!</p>
            </CardContent>
          </Card>
        )
      )}

      {/* Sage loading bubble — shown while FRQ/CODING session is starting */}
      {isStarting && questionType !== "MCQ" && (
        <Card className="card-glow border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-sm font-bold text-indigo-300">Sage 🌿</p>
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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

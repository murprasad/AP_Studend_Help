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
import { ApUnit } from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import Link from "next/link";

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

type PracticeMode = "select" | "practicing" | "summary";

export default function PracticePage() {
  const { toast } = useToast();
  const [course] = useCourse();

  const [mode, setMode] = useState<PracticeMode>("select");
  const [selectedUnit, setSelectedUnit] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [questionCount, setQuestionCount] = useState(10);
  const [sessionType, setSessionType] = useState("QUICK_PRACTICE");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const questionsRef = useRef<Question[]>([]);  // always up-to-date for async callbacks
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [results, setResults] = useState<Array<{ correct: boolean; timeSecs: number }>>([]);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");

  // Reset unit selection when course changes
  useEffect(() => {
    setSelectedUnit("ALL");
  }, [course]);

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
        }),
      });

      const data = await response.json();
      if (!response.ok) {
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
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to submit answer", variant: "destructive" });
        setSelectedAnswer(null);
        return;
      }
      setFeedback(data);
      setResults((prev) => [...prev, { correct: data.isCorrect, timeSecs }]);
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
      setQuestionStartTime(new Date());
      return next;
    });
  }

  async function completeSession() {
    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error || "Failed to complete session", variant: "destructive" });
        return;
      }
      setSessionSummary(data.summary);
      setMode("summary");
    } catch {
      toast({ title: "Error", description: "Failed to complete session. Check your connection.", variant: "destructive" });
    }
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
            {currentQuestion.stimulus && (
              <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-indigo-500">
                <p className="text-sm leading-relaxed italic text-muted-foreground">
                  {currentQuestion.stimulus}
                </p>
              </div>
            )}

            <p className="text-base font-medium leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {/* Open-ended response for SAQ/DBQ/LEQ */}
            {parsedOptions.length === 0 && !feedback && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Write your response below, then submit to see the scoring rubric.</p>
                <Textarea
                  value={openEndedAnswer}
                  onChange={(e) => setOpenEndedAnswer(e.target.value)}
                  placeholder="Write your answer here..."
                  className="min-h-[120px] text-sm"
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
            <CardContent className="p-5">
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
                </div>
              </div>
              <Button onClick={nextQuestion} className="w-full mt-4 gap-2">
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

      {/* Current course indicator */}
      <Card className="card-glow border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-indigo-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">{AP_COURSES[course]}</p>
            <p className="text-xs text-muted-foreground">Switch course from the sidebar</p>
          </div>
        </CardContent>
      </Card>

      {/* Mode selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => { setSessionType("QUICK_PRACTICE"); setQuestionCount(10); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            sessionType === "QUICK_PRACTICE"
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-border/40 hover:bg-accent"
          }`}
        >
          <Zap className="h-6 w-6 text-yellow-400 mb-2" />
          <p className="font-medium">Quick Practice</p>
          <p className="text-xs text-muted-foreground">10 questions</p>
        </button>
        <button
          onClick={() => { setSessionType("FOCUSED_STUDY"); setQuestionCount(20); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            sessionType === "FOCUSED_STUDY"
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-border/40 hover:bg-accent"
          }`}
        >
          <BookOpen className="h-6 w-6 text-blue-400 mb-2" />
          <p className="font-medium">Focused Study</p>
          <p className="text-xs text-muted-foreground">20 questions</p>
        </button>
      </div>

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

          <Button onClick={startSession} disabled={isStarting} className="w-full gap-2">
            {isStarting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting...</>
            ) : (
              <><Zap className="h-4 w-4" /> Start Session</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

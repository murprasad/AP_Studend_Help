"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/utils";
import {
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";

type ExamPhase = "intro" | "section1" | "break" | "section2" | "complete";

interface ExamQuestion {
  id: string;
  questionText: string;
  stimulus?: string;
  options?: string;
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

const SECTION1_TIME = 55 * 60; // 55 minutes in seconds
const SECTION1_QUESTIONS = 10; // Using 10 for demo (real: 55)

export default function MockExamPage() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECTION1_TIME);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "section1" && phase !== "section2") return;
    if (timeLeft <= 0) {
      completeExam();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timeLeft]);

  async function startExam() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: "MOCK_EXAM",
          questionCount: SECTION1_QUESTIONS,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setTimeLeft(SECTION1_TIME);
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
    setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: answer }));

    const timeSecs = Math.round((SECTION1_TIME - timeLeft) / questions.length);

    try {
      const response = await fetch(`/api/practice/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[currentIndex].id,
          answer,
          timeSpentSecs: timeSecs,
        }),
      });
      const data = await response.json();
      setFeedback(data);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeExam() {
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
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      completeExam();
    } else {
      setCurrentIndex((prev) => prev + 1);
      setFeedback(null);
    }
  }

  const currentQ = questions[currentIndex];
  const parsedOptions: string[] = currentQ?.options ? JSON.parse(currentQ.options as string) : [];
  const timeWarning = timeLeft < 300; // less than 5 min

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mock AP Exam</h1>
          <p className="text-muted-foreground mt-1">Simulate the real AP World History exam experience</p>
        </div>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle>Exam Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="font-medium mb-1">Section 1</p>
                <p className="text-2xl font-bold text-indigo-400">{SECTION1_QUESTIONS} MCQ</p>
                <p className="text-sm text-muted-foreground">55 minutes (demo: shortened)</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="font-medium mb-1">Result</p>
                <p className="text-2xl font-bold text-emerald-400">AP Score</p>
                <p className="text-sm text-muted-foreground">Estimated 1-5 score</p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400 text-sm">Important</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is a practice exam. Questions are AI-generated to match AP difficulty.
                    The timer runs during Section 1. Do your best without using notes.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={startExam} disabled={isLoading} size="lg" className="w-full gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Preparing Exam...</>
              ) : (
                <><Play className="h-4 w-4" /> Start Mock Exam</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam results
  if (phase === "complete" && result) {
    const scoreColors = {
      5: "text-emerald-400",
      4: "text-blue-400",
      3: "text-yellow-400",
      2: "text-orange-400",
      1: "text-red-400",
    };

    const scoreMessages = {
      5: "Excellent! You're exam ready!",
      4: "Great work! A few more sessions and you'll hit 5!",
      3: "Good foundation. Focus on weak units to improve.",
      2: "Keep practicing. Review the units you struggled with.",
      1: "Don't give up! More practice will make a big difference.",
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Exam Complete!</h1>
        </div>

        <Card className="card-glow">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Estimated AP Score</p>
            <p className={`text-8xl font-bold ${scoreColors[result.apScoreEstimate as keyof typeof scoreColors] || "text-foreground"}`}>
              {result.apScoreEstimate}
            </p>
            <p className="text-muted-foreground mt-2 mb-6">out of 5</p>
            <p className="text-base font-medium">
              {scoreMessages[result.apScoreEstimate as keyof typeof scoreMessages]}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Accuracy", value: `${result.accuracy}%`, color: "text-emerald-400" },
            { label: "Correct", value: `${result.correctAnswers}/${result.totalQuestions}`, color: "text-blue-400" },
            { label: "Time Spent", value: formatTime(result.timeSpentSecs), color: "text-purple-400" },
            { label: "XP Earned", value: `+${result.xpEarned}`, color: "text-yellow-400" },
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
          <Button onClick={() => setPhase("intro")} variant="outline" className="flex-1">
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

  // Section 1 exam
  if (phase === "section1" && currentQ) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Exam header */}
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="secondary">Section 1 · MCQ</Badge>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold ${timeWarning ? "text-red-400" : "text-foreground"}`}>
            <Clock className="h-5 w-5" />
            {formatTime(timeLeft)}
          </div>
        </div>

        <Progress
          value={((currentIndex) / questions.length) * 100}
          className="h-2"
          indicatorClassName="bg-indigo-500"
        />

        <p className="text-sm text-muted-foreground text-center">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <Card className="card-glow">
          <CardContent className="p-6 space-y-4">
            {currentQ.stimulus && (
              <div className="p-4 rounded-lg bg-secondary/50 border-l-4 border-indigo-500">
                <p className="text-sm leading-relaxed italic text-muted-foreground">
                  {currentQ.stimulus}
                </p>
              </div>
            )}

            <p className="text-base font-medium leading-relaxed">{currentQ.questionText}</p>

            <div className="space-y-2">
              {parsedOptions.map((option, i) => {
                const letter = option.charAt(0);
                let cls = "border border-border/40 hover:bg-accent cursor-pointer";
                if (feedback) {
                  if (letter === feedback.correctAnswer) cls = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                  else if (answers[currentQ.id] === letter && !feedback.isCorrect) cls = "border-red-500 bg-red-500/10 text-red-400";
                  else cls = "border border-border/20 opacity-50";
                } else if (answers[currentQ.id] === letter) {
                  cls = "border-indigo-500 bg-indigo-500/10";
                }
                return (
                  <button
                    key={i}
                    onClick={() => !feedback && !isSubmitting && submitAnswer(letter)}
                    disabled={!!feedback || isSubmitting}
                    className={`w-full text-left p-4 rounded-lg transition-all ${cls}`}
                  >
                    <span className="text-sm">{option}</span>
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
                {feedback.isCorrect ? (
                  <CheckCircle className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold mb-1">
                    {feedback.isCorrect ? "Correct!" : `Incorrect — Correct: ${feedback.correctAnswer}`}
                  </p>
                  <p className="text-sm text-muted-foreground">{feedback.explanation}</p>
                </div>
              </div>
              <Button onClick={nextQuestion} className="w-full mt-4 gap-2">
                {currentIndex + 1 >= questions.length ? "Finish Exam" : "Next Question"}
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

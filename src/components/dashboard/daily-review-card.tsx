"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ApCourse } from "@prisma/client";

interface ReviewQuestion {
  id: string;
  topic: string;
  difficulty: string;
  questionText: string;
  options: string | string[] | null;
  correctAnswer: string;   // letter e.g. "A"
  explanation: string;
}

type ReviewState = "idle" | "reviewing" | "done";

interface Props {
  course: ApCourse;
}

export function DailyReviewCard({ course }: Props) {
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [state, setState] = useState<ReviewState>("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    fetch(`/api/review?course=${course}`)
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((d) => {
        setQuestions(d.questions || []);
        setCount(d.count || 0);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [course]);

  function parseOptions(q: ReviewQuestion): string[] {
    if (!q.options) return [];
    if (Array.isArray(q.options)) return q.options as string[];
    try { return JSON.parse(q.options as string) as string[]; } catch { return []; }
  }

  function startReview() {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setState("reviewing");
  }

  function handleAnswer(letter: string) {
    if (selectedAnswer) return;
    setSelectedAnswer(letter);
    setShowExplanation(true);
    const q = questions[currentIdx];
    if (letter === q.correctAnswer) setScore((s) => s + 1);
  }

  function next() {
    if (currentIdx + 1 >= questions.length) {
      setState("done");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }

  if (loading) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            Couldn&apos;t load review questions. Try refreshing.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-2">
            No questions to review today.{" "}
            <span className="text-emerald-400">Keep practicing!</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === "idle") {
    return (
      <Card className="card-glow border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {count} question{count !== 1 ? "s" : ""} from 3â€“7 days ago need a refresher.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span>â±</span>
            <span>~{count * 30}s Â· Spaced Repetition</span>
          </div>
          <Button size="sm" onClick={startReview} className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800">
            <RotateCcw className="h-3.5 w-3.5" />
            Start Daily Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (state === "done") {
    return (
      <Card className="card-glow border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Daily Review Complete!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-3xl font-bold text-emerald-400">{score}/{questions.length}</p>
          <p className="text-sm text-muted-foreground">
            {score === questions.length ? "Perfect! ðŸŽ‰" : "Keep it up â€” practice makes progress!"}
          </p>
          <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
            +{score * 5} XP Daily Boost
          </Badge>
        </CardContent>
      </Card>
    );
  }

  const q = questions[currentIdx];
  const options = parseOptions(q);
  const isAnswered = selectedAnswer !== null;

  return (
    <Card className="card-glow border-emerald-500/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-emerald-400" />
            Review {currentIdx + 1}/{questions.length}
          </span>
          <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium leading-relaxed line-clamp-4">{q.questionText}</p>
        {options.length > 0 && (
          <div className="space-y-1.5">
            {options.map((opt, i) => {
              const letter = opt.charAt(0);
              let cls = "border border-border/40 hover:bg-accent cursor-pointer";
              if (isAnswered) {
                if (letter === q.correctAnswer) {
                  cls = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                } else if (letter === selectedAnswer) {
                  cls = "border-red-500 bg-red-500/10 text-red-400";
                } else {
                  cls = "border border-border/20 opacity-40";
                }
              }
              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(letter)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${cls}`}
                >
                  {isAnswered && letter === q.correctAnswer && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                  {isAnswered && letter === selectedAnswer && letter !== q.correctAnswer && <XCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}
        {showExplanation && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
            <Button size="sm" onClick={next} className="w-full mt-1">
              {currentIdx + 1 >= questions.length ? "See Score" : "Next â†’"}
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{q.topic}</p>
      </CardContent>
    </Card>
  );
}

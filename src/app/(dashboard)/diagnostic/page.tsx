"use client"

import { useState, useEffect } from "react"
import { useExamMode } from "@/hooks/use-exam-mode"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useCourse } from "@/hooks/use-course"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { COURSE_UNITS, AP_COURSES } from "@/lib/utils"
import { COURSE_REGISTRY, getCourseModule } from "@/lib/courses"
import { ApUnit } from "@prisma/client"
import Link from "next/link"
import { LockedInsightOverlay } from "@/components/diagnostic/locked-insight-overlay"
import { QuestionContent } from "@/components/question/question-content"
import { buildFocusedPracticeUrl } from "@/lib/diagnostic-helpers"
import {
  ClipboardList, CheckCircle, XCircle, ChevronRight, ArrowRight,
  Loader2, TrendingUp, TrendingDown, Target, Crown, Sparkles, BookOpen, Zap,
} from "lucide-react"

interface DiagQuestion {
  id: string
  unit: string
  topic: string
  difficulty: string
  questionText: string
  stimulus?: string
  options?: string | string[]
}

interface DiagResult {
  unitScores: Record<string, number>
  weakUnits: string[]
  strongUnits: string[]
  recommendation: string
}

type DiagMode = "intro" | "testing" | "results"

export default function DiagnosticPage() {
  const [course] = useCourse()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [mode, setMode] = useState<DiagMode>("intro")
  const { enterExamMode, exitExamMode } = useExamMode()
  useEffect(() => {
    // Full-screen mode while taking the diagnostic; back to the normal
    // layout on the intro and results screens so nav is available.
    if (mode === "testing") enterExamMode()
    else exitExamMode()
  }, [mode, enterExamMode, exitExamMode])
  useEffect(() => { return () => exitExamMode() }, [exitExamMode])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<DiagQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiagResult | null>(null)

  const courseUnits = COURSE_UNITS[course]

  async function startDiagnostic() {
    setLoading(true)
    try {
      const res = await fetch("/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to start diagnostic")
      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnswers({})
      setSelectedAnswer(null)
      setMode("testing")
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to start", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function handleAnswerSelect(answer: string) {
    setSelectedAnswer(answer)
  }

  function handleNext() {
    if (!selectedAnswer) return
    const question = questions[currentIndex]
    const newAnswers = { ...answers, [question.id]: selectedAnswer }
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      submitDiagnostic(newAnswers)
    }
  }

  async function submitDiagnostic(finalAnswers: Record<string, string>) {
    setLoading(true)
    try {
      const res = await fetch("/api/diagnostic/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers: finalAnswers, course }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to complete diagnostic")
      setResult(data)
      setMode("results")
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to submit", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const isCLEP = getCourseModule(course) === "clep"
  const accentColor = isCLEP ? "emerald" : "blue"
  const courseName = AP_COURSES[course] || COURSE_REGISTRY[course]?.name || course

  if (mode === "intro") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardList className={`h-8 w-8 text-${accentColor}-400`} />
            Quick Score Estimate
          </h1>
          <p className="text-muted-foreground mt-2">
            15-min MCQ check — we'll cover FRQs/essays in your next-step plan.
          </p>
        </div>

        {/* Selected course badge */}
        <div className={`flex items-center gap-3 p-4 rounded-xl border border-${accentColor}-500/20 bg-${accentColor}-500/5`}>
          <BookOpen className={`h-5 w-5 text-${accentColor}-400 flex-shrink-0`} />
          <div>
            <p className="text-sm font-semibold">{courseName}</p>
            <p className="text-xs text-muted-foreground">{Object.keys(courseUnits).length} units · {isCLEP ? "CLEP Exam" : "AP/SAT/ACT"}</p>
          </div>
        </div>

        <Card className={`card-glow border-${accentColor}-500/20`}>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>One question per unit — quick and targeted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              {[
                { icon: ClipboardList, title: "10-15 Questions", desc: "One per unit, MCQ format" },
                { icon: Target, title: "Unit Scores", desc: "Strength per unit revealed" },
                { icon: TrendingUp, title: "Study Plan", desc: "AI recommends what to focus on" },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/30">
                  <item.icon className="h-6 w-6 text-blue-500" />
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={startDiagnostic}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Start Diagnostic
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "testing") {
    const question = questions[currentIndex]
    const progress = ((currentIndex) / questions.length) * 100
    let options: string[] = []
    if (Array.isArray(question.options)) {
      options = question.options
    } else if (typeof question.options === "string") {
      try {
        options = JSON.parse(question.options)
      } catch {
        options = [] // malformed JSON — render empty-options recovery below
      }
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <Badge variant="outline" className="text-xs">
              {courseUnits[question.unit as ApUnit] || question.unit}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" aria-label={`Diagnostic progress: ${Math.round(progress)}% complete`} />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {question.stimulus && (
              <div className="p-4 bg-secondary/40 rounded-lg border border-border/40 text-sm italic text-muted-foreground">
                <QuestionContent content={question.stimulus} />
              </div>
            )}
            <div className="font-medium text-base">
              <QuestionContent content={question.questionText} />
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const isSelected = selectedAnswer === letter
                // Beta 9.6 — CB-style (A)(B)(C)(D) labeled prefix.
                const cleanText = opt.replace(/^\s*(?:\(?[A-E]\)?[.)]\s*)/, "")
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(letter)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors min-h-[48px] leading-relaxed flex items-start gap-3 ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "border-border/40 hover:bg-accent"
                    }`}
                  >
                    <span className="font-bold w-6 flex-shrink-0">({letter})</span>
                    <span className="flex-1">{cleanText}</span>
                  </button>
                )
              })}
            </div>
            <Button
              className="w-full"
              onClick={handleNext}
              disabled={!selectedAnswer || loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {currentIndex < questions.length - 1 ? (
                <>Next <ChevronRight className="h-4 w-4 ml-1" /></>
              ) : "Submit Diagnostic"}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (mode === "results" && result) {
    const sortedUnits = Object.entries(result.unitScores).sort((a, b) => a[1] - b[1])

    // Overall predicted score — crude mapping from mean unit score to 1-5
    // scale. Used as the FREE-tier reveal that creates curiosity for the
    // paywalled detail below. Intentionally does NOT show unit-level detail.
    const scores = Object.values(result.unitScores)
    const meanPct = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const predictedScore = meanPct >= 80 ? 5 : meanPct >= 65 ? 4 : meanPct >= 50 ? 3 : meanPct >= 35 ? 2 : 1
    const scoreLabel = predictedScore >= 3 ? "Passing" : "Needs Work"
    const scoreColor = predictedScore === 5 ? "emerald" : predictedScore === 4 ? "emerald" : predictedScore === 3 ? "blue" : predictedScore === 2 ? "amber" : "red"

    const tier = (session?.user as { subscriptionTier?: string })?.subscriptionTier ?? "FREE"
    const locked = !(tier === "PREMIUM" || tier === "AP_PREMIUM" || tier === "CLEP_PREMIUM")

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className={`h-8 w-8 text-${accentColor}-400`} />
            Diagnostic Results
          </h1>
          <p className="text-muted-foreground mt-1">{courseName} — personalized breakdown</p>
        </div>

        {/* FREE reveal — predicted score headline. Creates curiosity for the
            gated detail below. Shown to everyone (free + paid). */}
        <Card className={`border-${scoreColor}-500/30 bg-${scoreColor}-500/5`}>
          <CardContent className="p-6 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Your Predicted AP Score
            </p>
            <p className={`text-7xl font-bold text-${scoreColor}-500 leading-none`}>
              {predictedScore}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {scoreLabel} · MCQ-only estimate from {scores.length} unit{scores.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        {/* FRQ bridge — added 2026-04-27 per user direction:
            "After diagnostic: 'You're strong in MCQs. Next: FRQs (40% of
            your AP score). Try 1 FRQ.'" The MCQ diagnostic is intentionally
            the entry. The bridge converts the score reveal into a deeper
            practice commitment for users now warmed up. */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">FRQs are 40-60% of your real AP score</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Your diagnostic measured MCQs (~40-50% of the exam). The other half is short-answer + essay-style FRQs. Try one now while your prep is warm.
                </p>
              </div>
            </div>
            <Link href={`/frq-practice?course=${course}`}>
              <Button variant="outline" className="w-full rounded-full h-10 gap-2 border-amber-500/40 hover:bg-amber-500/10">
                Try 1 FRQ now (~2 min)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Focused-practice hook (PrepLion REQ-023 port). Single weakest unit
            is revealed outside the paywall as the hook — "you have a gap,
            fix it in 2 min." Converts post-diagnostic insight into an
            immediate practice session without asking for an upgrade first. */}
        {sortedUnits.length > 0 && sortedUnits[0][1] < 70 && (() => {
          const [weakestUnitKey, weakestScore] = sortedUnits[0]
          const weakestName = courseUnits[weakestUnitKey as ApUnit] || weakestUnitKey
          return (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">Fix your weakest unit in 2 min</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium text-foreground/80">{weakestName}</span>
                      {" · "}
                      you scored {weakestScore}% here — five focused questions will move the needle.
                    </p>
                    <Link href={buildFocusedPracticeUrl(weakestUnitKey, 5)} className="inline-block mt-3">
                      <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white">
                        <Zap className="h-3.5 w-3.5" />
                        Start 5 Questions
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {(() => {
          // Pass family + passing threshold to the overlay so the paywall
          // headline can read the student's specific gap ("Predicted 2 —
          // need 3 to pass"). AP passing = 3, SAT college-ready = 1200,
          // ACT college-ready = 24.
          const examFamily: "AP" | "SAT" | "ACT" = course.startsWith("SAT_")
            ? "SAT"
            : course.startsWith("ACT_")
            ? "ACT"
            : "AP";
          const passingScore =
            examFamily === "AP" ? 3 : examFamily === "SAT" ? 1200 : 24;
          return (
            <LockedInsightOverlay
              locked={locked}
              course={course}
              predictedScore={predictedScore}
              passingScore={passingScore}
              family={examFamily}
            >
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1 font-medium">AI Recommendation</p>
              <p className="text-sm leading-relaxed">{result.recommendation}</p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                  <TrendingDown className="h-4 w-4" />
                  Focus Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {result.weakUnits.map(u => (
                  <div key={u} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-3.5 w-3.5 text-red-700 dark:text-red-400 flex-shrink-0" />
                    <span className="truncate">{courseUnits[u as ApUnit] || u}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{result.unitScores[u]}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {result.strongUnits.map(u => (
                  <div key={u} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{courseUnits[u as ApUnit] || u}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{result.unitScores[u]}%</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">All Unit Scores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedUnits.map(([unit, score]) => (
                <div key={unit} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">
                      {courseUnits[unit as ApUnit] || unit}
                    </span>
                    <span className={score >= 70 ? "text-emerald-700 dark:text-emerald-400" : score >= 50 ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"}>
                      {score}%
                    </span>
                  </div>
                  <Progress
                    value={score}
                    className="h-1.5"
                    aria-label={`Unit score: ${score}%`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </LockedInsightOverlay>
          );
        })()}

        {/* Study Plan CTA — always visible after results */}
        {result.weakUnits.length > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <BookOpen className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Your weak areas have been identified</p>
              <p className="text-xs text-muted-foreground">Get a personalized study plan targeting {result.weakUnits.length} weak unit{result.weakUnits.length > 1 ? "s" : ""}.</p>
            </div>
            <Link href="/study-plan">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                View Study Plan
              </Button>
            </Link>
          </div>
        )}

        {/* Premium upgrade CTA — shown to free users after they see their weak units */}
        {session?.user?.subscriptionTier !== "PREMIUM" && session?.user?.subscriptionTier !== "AP_PREMIUM" && session?.user?.subscriptionTier !== "CLEP_PREMIUM" && result.weakUnits.length > 0 && (() => {
          const diagTrack = (session?.user as { track?: string })?.track ?? "ap";
          const isClep = diagTrack === "clep";
          return (
          <Card className={isClep ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" : "border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/5"}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isClep ? "bg-emerald-500/20" : "bg-blue-500/20"}`}>
                  <Sparkles className={`h-5 w-5 ${isClep ? "text-emerald-700 dark:text-emerald-400" : "text-blue-500"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    Target your weak units with a personalized study plan
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isClep ? "CLEP Premium" : "AP Premium"} gives you an AI-generated weekly plan focused on{" "}
                    <span className={isClep ? "text-emerald-300 font-medium" : "text-blue-700 dark:text-blue-400 font-medium"}>
                      {courseUnits[result.weakUnits[0] as ApUnit] || result.weakUnits[0]}
                    </span>{" "}
                    and {result.weakUnits.length > 1 ? `${result.weakUnits.length - 1} other weak unit${result.weakUnits.length > 2 ? "s" : ""}` : "your identified gap areas"}.
                    {isClep
                      ? " Unlock unlimited Sage Live Tutor + personalized CLEP study plan."
                      : " Unlock FRQ practice + unlimited Sage Live Tutor."}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href="/billing">
                      <Button size="sm" className={`gap-1.5 text-xs ${isClep ? "bg-emerald-700 hover:bg-emerald-800" : "bg-blue-600 hover:bg-blue-700"}`}>
                        <Crown className="h-3.5 w-3.5" />
                        Upgrade to {isClep ? "CLEP Premium" : "AP Premium"}
                      </Button>
                    </Link>
                    <Link href="/study-plan">
                      <Button size="sm" variant="outline" className="text-xs">
                        View Study Plan
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>);
        })()}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => { setMode("intro"); setResult(null) }}
        >
          Retake Diagnostic
        </Button>
      </div>
    )
  }

  return null
}

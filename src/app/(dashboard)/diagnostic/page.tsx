"use client"

import { useState } from "react"
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
import {
  ClipboardList, CheckCircle, XCircle, ChevronRight,
  Loader2, TrendingUp, TrendingDown, Target, Crown, Sparkles, BookOpen,
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
            Diagnostic Assessment
          </h1>
          <p className="text-muted-foreground mt-2">
            Find out exactly where you stand across all units.
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
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {question.stimulus && (
              <div className="p-4 bg-secondary/40 rounded-lg border border-border/40 text-sm italic text-muted-foreground">
                {question.stimulus}
              </div>
            )}
            <p className="font-medium text-base">{question.questionText}</p>
            <div className="space-y-2">
              {options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i)
                const isSelected = selectedAnswer === letter
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerSelect(letter)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors min-h-[48px] leading-relaxed ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-border/40 hover:bg-accent"
                    }`}
                  >
                    {opt}
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

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className={`h-8 w-8 text-${accentColor}-400`} />
            Diagnostic Results
          </h1>
          <p className="text-muted-foreground mt-1">{courseName} — personalized breakdown</p>
        </div>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1 font-medium">AI Recommendation</p>
            <p className="text-sm leading-relaxed">{result.recommendation}</p>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                <TrendingDown className="h-4 w-4" />
                Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {result.weakUnits.map(u => (
                <div key={u} className="flex items-center gap-2 text-sm">
                  <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                  <span className="truncate">{courseUnits[u as ApUnit] || u}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{result.unitScores[u]}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {result.strongUnits.map(u => (
                <div key={u} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{courseUnits[u as ApUnit] || u}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{result.unitScores[u]}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
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
                  <span className={score >= 70 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400"}>
                    {score}%
                  </span>
                </div>
                <Progress
                  value={score}
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>

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
                  <Sparkles className={`h-5 w-5 ${isClep ? "text-emerald-400" : "text-blue-500"}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    Target your weak units with a personalized study plan
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isClep ? "CLEP Premium" : "AP Premium"} gives you an AI-generated weekly plan focused on{" "}
                    <span className={isClep ? "text-emerald-300 font-medium" : "text-blue-400 font-medium"}>
                      {courseUnits[result.weakUnits[0] as ApUnit] || result.weakUnits[0]}
                    </span>{" "}
                    and {result.weakUnits.length > 1 ? `${result.weakUnits.length - 1} other weak unit${result.weakUnits.length > 2 ? "s" : ""}` : "your identified gap areas"}.
                    {isClep
                      ? " Unlock unlimited AI tutoring + personalized CLEP study plan."
                      : " Unlock FRQ practice + unlimited AI tutoring."}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href="/billing">
                      <Button size="sm" className={`gap-1.5 text-xs ${isClep ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>
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

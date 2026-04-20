"use client"

/**
 * Sage Coach — oral-response training.
 *
 * Full-screen experience: Haiku 4.5 asks a concept-based question from the
 * student's course, 60-second mic recording, SpeechRecognition transcript,
 * Haiku 4.5 evaluates across 5 dimensions, student sees specific feedback +
 * missing key points + retry button.
 *
 * Voice-only (per user spec 2026-04-20). If SpeechRecognition is absent,
 * shows an explanatory fallback asking the user to open in Chrome/Edge.
 *
 * Positioning: "Explain-to-pass" training — NOT flashcards-with-voice. See
 * memory project_sage_coach_prd.md for full spec.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2, RotateCcw, ArrowRight, Sparkles, AlertCircle } from "lucide-react"

interface Concept {
  id: string
  concept: string
  question: string
  difficulty: string
  unit: string
  course: string
}

interface Scores {
  accuracy: number
  coverage: number
  structure: number
  clarity: number
  confidence: number
}

interface EvalResult {
  scores: Scores
  missingKeyPoints: string[]
  summary: string
  specificFeedback: string
  improvementTip: string
  conceptId: string
  sessionId?: string
  tooShort?: boolean
}

type Phase = "checking" | "unavailable" | "intro" | "loading" | "prompt" | "recording" | "processing" | "feedback" | "error"

// Minimal SpeechRecognition typing — the spec types vary by browser.
type SRInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognition(): (new () => SRInstance) | null {
  if (typeof window === "undefined") return null
  const w = window as any
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

const RECORD_SECONDS = 60

export default function SageCoachPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("checking")
  const [concept, setConcept] = useState<Concept | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS)
  const [evaluation, setEvaluation] = useState<EvalResult | null>(null)
  const [previousScore, setPreviousScore] = useState<number | null>(null)

  const recognitionRef = useRef<SRInstance | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recordStartRef = useRef<number>(0)
  const transcriptRef = useRef<string>("")

  const hasSpeech = useMemo(() => typeof window !== "undefined" && !!getSpeechRecognition(), [])

  // ── Load a concept ─────────────────────────────────────────────────────
  const loadConcept = useCallback(async () => {
    setPhase("loading")
    setError(null)
    setTranscript("")
    setEvaluation(null)
    transcriptRef.current = ""
    try {
      const res = await fetch("/api/sage-coach/question?course=AP_WORLD_HISTORY", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load question")
      setConcept(data)
      setPhase("prompt")
    } catch (e) {
      setError((e as Error).message)
      setPhase("error")
    }
  }, [])

  // ── Start recording ────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!hasSpeech) {
      setError("This browser doesn't support voice input. Try Chrome or Edge on desktop.")
      setPhase("error")
      return
    }
    const SR = getSpeechRecognition()
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-US"
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      let finalText = ""
      let interim = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      if (finalText) transcriptRef.current += finalText + " "
      setTranscript(transcriptRef.current + interim)
    }
    rec.onerror = (e: any) => {
      const msg = e?.error === "not-allowed"
        ? "Mic permission denied. Enable microphone access in your browser settings."
        : `Voice error: ${e?.error || "unknown"}`
      setError(msg)
      setPhase("error")
    }
    rec.onend = () => { /* handled by stopRecording */ }
    try {
      rec.start()
      recognitionRef.current = rec
      recordStartRef.current = Date.now()
      setSecondsLeft(RECORD_SECONDS)
      setPhase("recording")
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            // Auto-stop at 0
            stopRecording(true)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch (e) {
      setError("Could not start recording. Check mic permissions.")
      setPhase("error")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSpeech])

  const stopRecording = useCallback(async (auto = false) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    const rec = recognitionRef.current
    if (rec) { try { rec.stop() } catch { /* no-op */ } recognitionRef.current = null }
    const durationMs = Date.now() - recordStartRef.current
    const text = transcriptRef.current.trim()
    setPhase("processing")

    if (!concept) return
    // 28s client timeout — Anthropic call is capped at 22s server-side, this
    // guards against CF-worker hangs or network stalls so the user never sits
    // on "Analyzing" forever.
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 28_000)
    try {
      const res = await fetch("/api/sage-coach/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: concept.id,
          transcript: text,
          audioDurationMs: durationMs,
        }),
        signal: controller.signal,
      })
      const data: EvalResult = await res.json()
      if (!res.ok && !data?.scores) throw new Error("Evaluation failed")
      setEvaluation(data)
      setPhase("feedback")
    } catch (e) {
      const msg = (e as Error).name === "AbortError"
        ? "Evaluation timed out — the model took too long. Tap retry to try again."
        : (e as Error).message || "Evaluation failed — try again"
      setError(msg)
      setPhase("error")
    } finally {
      clearTimeout(timer)
    }
  }, [concept])

  const retry = useCallback(() => {
    if (evaluation?.scores) setPreviousScore(evaluation.scores.accuracy)
    setTranscript("")
    transcriptRef.current = ""
    setEvaluation(null)
    setPhase("prompt")
  }, [evaluation])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch { /* no-op */ } }
  }, [])

  // ── Startup health check — skip the whole flow if all AI providers are dead
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/sage-coach/health", { cache: "no-store" })
        const data = await res.json()
        if (cancelled) return
        if (!data?.available) setPhase("unavailable")
        else setPhase("intro")
      } catch {
        if (!cancelled) setPhase("unavailable")
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────

  if (phase === "checking") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Checking availability…</span>
        </div>
      </div>
    )
  }

  if (phase === "unavailable") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center space-y-5">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-bold">Sage Coach is temporarily unavailable</h1>
          <p className="text-neutral-300 text-[15px]">
            We can't reach our evaluation models right now. Try again in a few minutes, or continue with regular practice.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="h-12 rounded-full border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:text-neutral-50"
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </Button>
            <Button
              className="h-12 rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400"
              onClick={() => router.push("/practice")}
            >
              Do a practice session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "intro") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col items-center justify-center px-6">
        <div className="max-w-xl text-center space-y-6">
          <Sparkles className="h-10 w-10 mx-auto text-amber-400" />
          <h1 className="text-3xl sm:text-4xl font-bold">Sage Coach</h1>
          <p className="text-neutral-300 text-lg">
            Can you <em>explain it</em>? One concept. One minute. Speak your answer and get specific feedback.
          </p>
          <p className="text-sm text-neutral-500">
            This trains you to <strong>explain under pressure</strong> — the skill MCQs miss.
          </p>
          {!hasSpeech && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm rounded-lg p-3 text-left">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your browser doesn't support voice input. Please use Chrome or Edge on desktop.</span>
            </div>
          )}
          <Button
            size="lg"
            disabled={!hasSpeech}
            onClick={loadConcept}
            className="w-full h-14 rounded-full text-lg font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 disabled:opacity-40"
          >
            Start — 60-second challenge
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <button onClick={() => router.push("/dashboard")} className="text-sm text-neutral-500 hover:text-neutral-300 transition">
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400"><Loader2 className="h-5 w-5 animate-spin" /><span>Picking a concept…</span></div>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <p className="text-neutral-200">{error || "Something went wrong."}</p>
          <Button onClick={loadConcept} variant="outline" className="border-neutral-700 text-neutral-100">Try again</Button>
        </div>
      </div>
    )
  }

  if (phase === "prompt" && concept) {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col px-6 py-10 sm:py-16">
        <div className="flex-1 flex flex-col justify-center max-w-2xl w-full mx-auto space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-widest text-amber-400">{concept.course.replace(/_/g, " ")} · {concept.unit.replace(/_/g, " ")}</p>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest">{concept.difficulty}</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-center text-neutral-50">
            {concept.question}
          </h1>
          <div className="flex flex-col items-center gap-3 pt-4">
            <Button
              size="lg"
              onClick={startRecording}
              className="h-20 w-20 rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg"
              aria-label="Start recording"
            >
              <Mic className="h-8 w-8" />
            </Button>
            <p className="text-xs text-neutral-500">Tap mic · you'll have 60 seconds · hard stop</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "recording" && concept) {
    const pct = ((RECORD_SECONDS - secondsLeft) / RECORD_SECONDS) * 100
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col px-6 py-10 sm:py-12">
        <div className="flex-1 flex flex-col justify-between max-w-2xl w-full mx-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-amber-400">{concept.unit.replace(/_/g, " ")}</p>
              <p className={`font-mono text-lg ${secondsLeft <= 10 ? "text-red-400" : "text-neutral-300"}`}>
                {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
              </p>
            </div>
            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold leading-snug pt-2">{concept.question}</h2>
          </div>

          <div className="my-6 flex-1 overflow-y-auto">
            <p className="text-[15px] leading-relaxed text-neutral-300 whitespace-pre-wrap">
              {transcript || <span className="text-neutral-600 italic">Listening…</span>}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <Button
                size="lg"
                onClick={() => stopRecording(false)}
                className="relative h-20 w-20 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg"
                aria-label="Stop recording"
              >
                <MicOff className="h-8 w-8" />
              </Button>
            </div>
            <p className="text-xs text-neutral-500">Tap to submit early · or wait for auto-stop</p>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "processing") {
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        <p className="text-neutral-300">Analyzing your answer…</p>
        <p className="text-xs text-neutral-600">usually 2-5 seconds</p>
      </div>
    )
  }

  if (phase === "feedback" && evaluation && concept) {
    const s = evaluation.scores
    const delta = previousScore != null ? s.accuracy - previousScore : null
    return (
      <div className="fixed inset-0 bg-neutral-950 text-neutral-50 z-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-widest text-amber-400">{concept.concept}</p>
            <h1 className="text-3xl font-bold">{s.accuracy}% accuracy</h1>
            {delta != null && (
              <p className={`text-sm ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {delta >= 0 ? `+${delta}` : delta} vs previous try
              </p>
            )}
            <p className="text-neutral-300 text-[15px] pt-2">{evaluation.summary}</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {(["accuracy", "coverage", "structure", "clarity", "confidence"] as const).map((dim) => (
              <div key={dim} className="bg-neutral-900 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-neutral-500">{dim}</p>
                <p className="text-lg font-semibold text-neutral-100">{s[dim]}</p>
              </div>
            ))}
          </div>

          <div className="bg-neutral-900 rounded-xl p-5 space-y-2">
            <p className="text-sm font-semibold text-amber-400">Feedback</p>
            <p className="text-[15px] text-neutral-100 leading-relaxed">{evaluation.specificFeedback}</p>
          </div>

          {evaluation.missingKeyPoints.length > 0 && (
            <div className="bg-neutral-900 rounded-xl p-5 space-y-2">
              <p className="text-sm font-semibold text-red-300">Key points you missed</p>
              <ul className="space-y-1.5">
                {evaluation.missingKeyPoints.map((k, i) => (
                  <li key={i} className="text-[14px] text-neutral-200 flex gap-2">
                    <span className="text-red-400 shrink-0">•</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {evaluation.improvementTip && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
              <p className="text-[14px] text-amber-200 leading-relaxed"><strong>Try next:</strong> {evaluation.improvementTip}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={retry}
              variant="outline"
              className="h-12 rounded-full border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:text-neutral-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button
              onClick={loadConcept}
              className="h-12 rounded-full bg-amber-500 text-neutral-950 hover:bg-amber-400"
            >
              Next concept
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <button onClick={() => router.push("/dashboard")} className="w-full text-sm text-neutral-500 hover:text-neutral-300 py-2">
            ← Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}

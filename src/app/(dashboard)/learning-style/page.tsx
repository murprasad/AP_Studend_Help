"use client";

/**
 * Learning-style / study-strategy quiz (ADHD Wave 2 #47).
 *
 * A ~5-minute self-assessment about HOW a student studies best. Maps answers
 * to concrete, actionable study strategies and points them at the matching
 * "Focus tools" (Focus Mode / Extended Time / Energy check-in).
 *
 * Framing: designed for students who learn differently. NOT a clinical or
 * diagnostic screener — no medical claims. Pure client-side; result persisted
 * to localStorage. Part of existing Premium (no new tier).
 */

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, ArrowLeft, RotateCcw, Sparkles, Settings, Play } from "lucide-react";

type Tool = "focusMode" | "extendedTime" | "energyCheckIn" | "shortSessions" | "breaks";

interface Choice {
  label: string;
  tools: Tool[];
}
interface Question {
  q: string;
  choices: Choice[];
}

const QUESTIONS: Question[] = [
  {
    q: "When you sit down to study, how long can you stay focused before your attention drifts?",
    choices: [
      { label: "Under 10 minutes", tools: ["shortSessions", "breaks", "focusMode"] },
      { label: "About 15–25 minutes", tools: ["shortSessions", "breaks"] },
      { label: "30–45 minutes", tools: [] },
      { label: "An hour or more", tools: [] },
    ],
  },
  {
    q: "How do nearby distractions (phone, noise, an open tab) affect you while studying?",
    choices: [
      { label: "They pull me away constantly", tools: ["focusMode", "breaks"] },
      { label: "They distract me sometimes", tools: ["focusMode"] },
      { label: "I can mostly tune them out", tools: [] },
    ],
  },
  {
    q: "On timed practice or mock exams, how does the clock affect you?",
    choices: [
      { label: "Time pressure makes me freeze or rush and make mistakes", tools: ["extendedTime"] },
      { label: "It's a little stressful but manageable", tools: ["extendedTime"] },
      { label: "The clock doesn't really bother me", tools: [] },
    ],
  },
  {
    q: "When does your focus tend to be best?",
    choices: [
      { label: "It swings a lot day to day", tools: ["energyCheckIn", "breaks"] },
      { label: "Mornings", tools: ["energyCheckIn"] },
      { label: "Evenings", tools: ["energyCheckIn"] },
      { label: "It's pretty steady", tools: [] },
    ],
  },
  {
    q: "After a wrong answer or a hard question, what usually happens?",
    choices: [
      { label: "I get frustrated and lose momentum", tools: ["shortSessions", "energyCheckIn"] },
      { label: "I shake it off after a moment", tools: [] },
      { label: "It motivates me to push harder", tools: [] },
    ],
  },
  {
    q: "Which study session sounds most doable for you right now?",
    choices: [
      { label: "5–10 focused questions, then a break", tools: ["shortSessions", "breaks"] },
      { label: "A steady 20-question set", tools: [] },
      { label: "A long, deep session", tools: [] },
    ],
  },
  {
    q: "How do you feel about long, uninterrupted mock exams?",
    choices: [
      { label: "I burn out partway through", tools: ["breaks", "extendedTime"] },
      { label: "I can finish but it's tiring", tools: ["breaks"] },
      { label: "I'm fine with them", tools: [] },
    ],
  },
  {
    q: "When you start studying, how aware are you of your own energy level?",
    choices: [
      { label: "I often push through even when I'm drained", tools: ["energyCheckIn"] },
      { label: "I sometimes notice", tools: ["energyCheckIn"] },
      { label: "I'm pretty tuned in already", tools: [] },
    ],
  },
];

const TOOL_COPY: Record<Tool, { title: string; advice: string; cta?: { href: string; label: string } }> = {
  focusMode: {
    title: "Turn on Focus Mode",
    advice: "Distractions clearly pull your attention, so study with a stripped-down, one-question-at-a-time view to keep your eyes on the task.",
    cta: { href: "/settings", label: "Enable in Settings" },
  },
  extendedTime: {
    title: "Use Extended Time on timed work",
    advice: "Time pressure costs you accuracy, so give yourself 1.5x or 2x time on practice and mock exams to think clearly instead of racing the clock.",
    cta: { href: "/settings", label: "Set your multiplier" },
  },
  energyCheckIn: {
    title: "Enable the Energy check-in",
    advice: "Your focus varies, so do a 5-second energy check before each session and pick a session length that matches how you feel that day.",
    cta: { href: "/settings", label: "Enable in Settings" },
  },
  shortSessions: {
    title: "Study in short, frequent sets",
    advice: "Your best focus comes in short bursts, so run 5–10 question sessions several times a day rather than one long sitting — consistency beats duration.",
    cta: { href: "/practice", label: "Start a short set" },
  },
  breaks: {
    title: "Build in regular breaks",
    advice: "Long stretches drain you, so take a short, deliberate break every 20–30 minutes (or use the auto-break in long mock exams) to come back sharper.",
  },
};

export default function LearningStylePage() {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length-1, then results
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  function choose(choiceIdx: number) {
    const next = [...answers, choiceIdx];
    setAnswers(next);
    if (step + 1 >= QUESTIONS.length) {
      setDone(true);
      try {
        localStorage.setItem("sn_learning_style_result", JSON.stringify({ answers: next, at: new Date().toISOString() }));
      } catch { /* ignore */ }
    } else {
      setStep(step + 1);
    }
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setDone(false);
  }

  // Tally recommended tools, ranked by how often they came up.
  const tally = new Map<Tool, number>();
  answers.forEach((choiceIdx, qIdx) => {
    QUESTIONS[qIdx].choices[choiceIdx]?.tools.forEach((t) => tally.set(t, (tally.get(t) ?? 0) + 1));
  });
  const ranked = Array.from(tally.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const topTools = ranked.slice(0, 4);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
          </Link>
          <Badge variant="secondary" className="gap-1"><Brain className="h-3.5 w-3.5" />Find your study style</Badge>
        </div>

        {!done ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardDescription>Question {step + 1} of {QUESTIONS.length}</CardDescription>
                <CardDescription>~5 min</CardDescription>
              </div>
              <Progress value={((step) / QUESTIONS.length) * 100} className="h-1.5" />
              <CardTitle className="text-xl pt-4">{QUESTIONS[step].q}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUESTIONS[step].choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/40 transition-colors px-4 py-3 text-sm"
                >
                  {c.label}
                </button>
              ))}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />Your study-style plan
                </CardTitle>
                <CardDescription>
                  Based on how you answered, here are the tools and habits most likely to help you study the way you learn best.
                </CardDescription>
              </CardHeader>
            </Card>

            {topTools.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  You seem to study comfortably with steady focus — keep doing what works. If a tough stretch comes up,
                  the Focus tools in Settings are there when you want them.
                </CardContent>
              </Card>
            ) : (
              topTools.map((t) => {
                const c = TOOL_COPY[t];
                return (
                  <Card key={t}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="font-semibold">{c.title}</div>
                      <p className="text-sm text-muted-foreground">{c.advice}</p>
                      {c.cta && (
                        <Link href={c.cta.href}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="h-4 w-4" />{c.cta.label}
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/practice">
                <Button className="gap-2"><Play className="h-4 w-4" />Start practicing</Button>
              </Link>
              <Button variant="ghost" onClick={restart} className="gap-2">
                <RotateCcw className="h-4 w-4" />Retake quiz
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground/70 pt-2">
              This quiz suggests study strategies based on your preferences. It is not a medical or diagnostic assessment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

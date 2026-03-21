"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCourse } from "@/hooks/use-course";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import {
  Sparkles, BookOpen, ClipboardList, BarChart3, ChevronRight, Check,
} from "lucide-react";
import Link from "next/link";

const ONBOARDING_KEY = "onboarding_completed";

type Step = 1 | 2 | 3;

const AP_COURSE_GROUPS = [
  {
    label: "AP Courses",
    keys: [
      "AP_WORLD_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES", "AP_PHYSICS_1",
      "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
      "AP_CHEMISTRY", "AP_BIOLOGY", "AP_US_HISTORY", "AP_PSYCHOLOGY",
    ] as ApCourse[],
  },
  {
    label: "SAT Prep",
    keys: ["SAT_MATH", "SAT_READING_WRITING"] as ApCourse[],
  },
  {
    label: "ACT Prep",
    keys: ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"] as ApCourse[],
  },
];

const CLEP_COURSE_GROUP = {
  label: "CLEP Prep",
  keys: [
    "CLEP_COLLEGE_ALGEBRA", "CLEP_COLLEGE_COMPOSITION", "CLEP_INTRO_PSYCHOLOGY",
    "CLEP_PRINCIPLES_OF_MARKETING", "CLEP_PRINCIPLES_OF_MANAGEMENT", "CLEP_INTRODUCTORY_SOCIOLOGY",
  ] as ApCourse[],
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [course, setCourse] = useCourse();
  const router = useRouter();
  const [track, setTrackState] = useState<"ap" | "clep">("ap");
  const [clepEnabled, setClepEnabled] = useState(false);

  // Fetch clepEnabled flag
  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data: { flags?: { clepEnabled?: boolean } }) => {
        if (data.flags?.clepEnabled) setClepEnabled(true);
      })
      .catch(() => {});
  }, []);

  // Read track from localStorage and set initial course
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ap_track");
      const t = stored === "clep" ? "clep" : "ap";
      setTrackState(t);
    } catch { /* ignore */ }
  }, []);

  // Auto-select first course when track changes
  useEffect(() => {
    const effectiveTrack = track === "clep" && clepEnabled ? "clep" : "ap";
    const firstCourse = effectiveTrack === "clep"
      ? CLEP_COURSE_GROUP.keys[0]
      : AP_COURSE_GROUPS[0].keys[0];
    setCourse(firstCourse);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track, clepEnabled]);

  const effectiveTrack = track === "clep" && clepEnabled ? "clep" : "ap";
  const COURSE_GROUPS = effectiveTrack === "clep" ? [CLEP_COURSE_GROUP] : AP_COURSE_GROUPS;

  // If already onboarded, skip to dashboard
  useEffect(() => {
    try {
      if (localStorage.getItem(ONBOARDING_KEY) === "true") {
        router.replace("/dashboard");
      }
    } catch {
      // ignore
    }
  }, [router]);

  function completeOnboarding() {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // ignore
    }
    router.push("/dashboard");
  }

  const steps = [
    { num: 1, label: "Choose Course" },
    { num: 2, label: "How It Works" },
    { num: 3, label: "Your Plan" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Welcome to StudentNest</h1>
        <p className="text-muted-foreground text-sm">Let&apos;s set you up for exam success in 3 quick steps.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${step >= s.num ? "text-indigo-400" : "text-muted-foreground"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                step > s.num
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : step === s.num
                    ? "border-indigo-500 text-indigo-400"
                    : "border-border text-muted-foreground"
              }`}>
                {step > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${step > s.num ? "bg-indigo-600" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Course */}
      {step === 1 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Which exam are you preparing for?
            </CardTitle>
            <CardDescription>You can change this anytime from the sidebar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {COURSE_GROUPS.map((group) => (
              <div key={group.label}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                  effectiveTrack === "clep" ? "text-emerald-400/70" : "text-muted-foreground"
                }`}>
                  {group.label}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.keys.map((key) => {
                    const cfg = COURSE_REGISTRY[key];
                    if (!cfg) return null;
                    const isSelected = course === key;
                    const isClep = effectiveTrack === "clep";
                    return (
                      <button
                        key={key}
                        onClick={() => setCourse(key)}
                        className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          isSelected
                            ? isClep
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-medium"
                              : "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-medium"
                            : "border-border/40 hover:bg-accent hover:border-border"
                        }`}
                      >
                        {cfg.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <Button
              className={`w-full mt-2 ${effectiveTrack === "clep" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              onClick={() => setStep(2)}
            >
              Continue with {COURSE_REGISTRY[course]?.shortName || course}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: How It Works */}
      {step === 2 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-400" />
              Here&apos;s how StudentNest works
            </CardTitle>
            <CardDescription>Master your exam in a proven 3-step loop.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                step: "1",
                title: "Diagnose your gaps",
                desc: "Take a quick diagnostic to find which units need the most attention.",
                action: "Go to Diagnostic",
                href: "/diagnostic",
                color: "bg-blue-500/20 text-blue-400",
              },
              {
                step: "2",
                title: "Practice & get feedback",
                desc: "Answer adaptive MCQ and FRQ questions — AI explains every answer.",
                action: "Start Practice",
                href: "/practice",
                color: "bg-emerald-500/20 text-emerald-400",
              },
              {
                step: "3",
                title: "Track your mastery",
                desc: "Watch your unit-by-unit mastery scores climb toward a 4 or 5.",
                action: "View Analytics",
                href: "/analytics",
                color: "bg-purple-500/20 text-purple-400",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${item.color}`}>
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Got it — next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Your recommended first action */}
      {step === 3 && (
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              You&apos;re all set!
            </CardTitle>
            <CardDescription>We recommend starting with the Diagnostic to build your personalized study plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/diagnostic" onClick={completeOnboarding} className="block">
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer">
                  <ClipboardList className="h-6 w-6 text-indigo-400 mb-2" />
                  <p className="font-semibold text-sm">Take Diagnostic</p>
                  <p className="text-xs text-muted-foreground mt-1">Find your weak units immediately</p>
                  <span className="text-xs text-indigo-400 font-medium mt-2 inline-block">Recommended →</span>
                </div>
              </Link>
              <Link href="/practice" onClick={completeOnboarding} className="block">
                <div className="p-4 rounded-xl border border-border/40 hover:bg-accent transition-colors cursor-pointer">
                  <Sparkles className="h-6 w-6 text-emerald-400 mb-2" />
                  <p className="font-semibold text-sm">Start Practicing</p>
                  <p className="text-xs text-muted-foreground mt-1">Jump straight into adaptive MCQs</p>
                  <span className="text-xs text-emerald-400 font-medium mt-2 inline-block">Start now →</span>
                </div>
              </Link>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
                Back
              </Button>
              <Button variant="ghost" size="sm" onClick={completeOnboarding} className="text-xs text-muted-foreground ml-auto">
                Skip to dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

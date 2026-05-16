import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, Clock, Award } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";
import { MockupPractice } from "@/components/landing/mockup-practice";
import { getVisibleCourses } from "@/lib/settings";

export const metadata: Metadata = {
  title: "PSAT Prep — National Merit Practice & Score Tracking | StudentNest Prep",
  description:
    "PSAT/NMSQT prep with adaptive practice for Math and Reading & Writing. Targeting weak areas, timed practice, and National Merit Selection Index tracking. Free to start.",
  openGraph: {
    title: "PSAT Prep | StudentNest Prep",
    description: "Adaptive PSAT/NMSQT prep. Math + Reading & Writing. National Merit aware. Free to start.",
    url: "https://studentnest.ai/psat-prep",
  },
};

const courses = [
  { enum: "PSAT_MATH", name: "PSAT Math", units: 4, desc: "Algebra, geometry, data analysis, advanced math" },
  { enum: "PSAT_READING_WRITING", name: "PSAT Reading & Writing", units: 4, desc: "Passages, evidence-based reasoning, grammar" },
];

function buildJsonLd(visible: typeof courses) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PSAT Prep Courses",
    description: visible.length > 0 ? "PSAT/NMSQT prep with adaptive practice" : "PSAT bank rebuilding",
    numberOfItems: visible.length,
    itemListElement: visible.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.name,
        description: `${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking.`,
        provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
        isAccessibleForFree: true,
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
          { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "PSAT Premium", billingIncrement: "P1M" },
        ],
      },
    })),
  };
}

export default async function PsatPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses = allowlist === "all"
    ? courses
    : courses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = buildJsonLd(visibleCourses);
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-sm font-medium">
            <Award className="h-4 w-4" /> PSAT / NMSQT
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Crush the PSAT — and qualify for National Merit.
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
            October PSAT/NMSQT is the same skills as the SAT — just easier. Sage drills your weak spots so the Selection Index works in your favor.
          </p>
          <div className="flex gap-3 justify-center lg:justify-start pt-2">
            <Link href="/register?module=psat">
              <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700">
                Start Free PSAT Diagnostic <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">See Pricing</Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block animate-float">
          <BrowserFrame title="StudentNest Prep · PSAT Analytics" className="shadow-2xl shadow-violet-500/10">
            <MockupAnalytics variant="sat" />
          </BrowserFrame>
        </div>
        <div className="lg:hidden max-w-md mx-auto w-full">
          <BrowserFrame title="StudentNest Prep · PSAT Analytics">
            <MockupAnalytics variant="sat" />
          </BrowserFrame>
        </div>
      </div>

      {/* Pain statement — why most PSAT prep wastes time */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 text-center max-w-3xl mx-auto">
        <p className="text-base font-medium text-foreground/90 leading-relaxed">
          Most juniors miss National Merit by 5-15 Selection Index points — points they could have caught with targeted weak-area practice instead of generic test books.
        </p>
      </div>

      {/* Features */}
      <div className="space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Target className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold">Sage targets your weakest PSAT areas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Quick diagnostic across Math and Reading &amp; Writing. Sage builds a study plan focused on the topics that drag your Selection Index down most.
            </p>
          </div>
          <BrowserFrame title="StudentNest Prep · PSAT Study Plan" className="shadow-xl">
            <MockupStudyPlan variant="sat" />
          </BrowserFrame>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="lg:order-2 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold">PSAT-format questions with instant explanations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Exam-aligned questions matching the real PSAT/NMSQT digital format. Every wrong answer comes with an explanation — and Sage will tutor deeper if you ask.
            </p>
          </div>
          <div className="lg:order-1">
            <BrowserFrame title="StudentNest Prep · PSAT Practice" className="shadow-xl">
              <MockupPractice variant="sat" />
            </BrowserFrame>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold">Watch your Selection Index climb</h2>
            <p className="text-muted-foreground leading-relaxed">
              Track section-by-section progress as your estimated PSAT range climbs. National Merit Semi-Finalist cutoffs vary 207-223 by state — Sage tells you how close you are.
            </p>
          </div>
          <BrowserFrame title="StudentNest Prep · PSAT Analytics" className="shadow-xl">
            <MockupAnalytics variant="sat" />
          </BrowserFrame>
        </div>
      </div>

      {/* Outcomes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Brain, title: "Understand Every Mistake", desc: "Sage explains why your answer was wrong and what the correct reasoning looks like." },
          { icon: Target, title: "Improve Faster", desc: "Practice adapts to your weakest areas. Every session targets where you lose the most points." },
          { icon: BarChart3, title: "Track Your Selection Index", desc: "See how close you are to National Merit Semi-Finalist (207-223 by state)." },
          { icon: Clock, title: "Build Test Stamina", desc: "Timed practice builds the pacing instincts you need on October test day." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample Schedule — 8 weeks before Oct PSAT */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Sample 8-Week PSAT Study Plan (Aug → Oct)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { week: "Weeks 1-2", task: "Diagnostic + identify weak topics" },
            { week: "Weeks 3-4", task: "Algebra, Data Analysis + daily practice" },
            { week: "Weeks 5-6", task: "Reading & Writing + timed sections" },
            { week: "Weeks 7-8", task: "Full-length mocks + Selection Index check" },
          ].map((w) => (
            <div key={w.week} className="p-4 rounded-xl border border-violet-500/15 bg-card/50 text-center">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1">{w.week}</p>
              <p className="text-xs text-muted-foreground">{w.task}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          {visibleCourses.length === 0
            ? "Rebuilding PSAT Question Bank"
            : visibleCourses.length === 1
              ? visibleCourses[0].name
              : "PSAT Math + Reading & Writing"}
        </h2>
        {visibleCourses.length === 0 ? (
          <div className="p-6 rounded-xl border border-violet-500/20 bg-violet-500/5 text-center">
            <p className="text-sm text-muted-foreground">
              PSAT bank is being prepared. SAT courses are live now and cover the same skills.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {visibleCourses.map((c) => (
              <div key={c.name} className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-violet-700 dark:text-violet-400" />
                  <p className="font-semibold">{c.name}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{c.units} units</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
          <p className="font-bold">Free</p>
          <p className="text-2xl font-bold text-muted-foreground">$0</p>
          {["Unlimited MCQ practice", "5 Sage Live Tutor chats/day", "Basic study plan", "Score tracking"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
              {f}
            </div>
          ))}
        </div>
        <div className="rounded-xl border-2 border-violet-500 bg-violet-500/5 p-6 space-y-3">
          <p className="font-bold text-violet-700 dark:text-violet-400">PSAT Premium</p>
          <p className="text-2xl font-bold">
            $9.99
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">
            or $79.99/yr — save 33%
          </p>
          {["Everything in Free", "Unlimited Sage Live Tutor chats", "Personalized PSAT study plan", "Advanced weak-area analytics", "Streaming Sage responses"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-violet-700 dark:text-violet-400" />
              {f}
            </div>
          ))}
          <form action="/api/checkout?plan=monthly&module=psat" method="POST" className="pt-2">
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              Start PSAT Premium
            </Button>
          </form>
        </div>
      </div>

      {/* Parent trust */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold">For parents</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
          A strong PSAT/NMSQT score in October of junior year can unlock National Merit scholarships and SAT-prep momentum. Your child gets adaptive practice tied to College Board content for less than one hour of in-person PSAT tutoring per month.
        </p>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">National Merit isn&apos;t luck — it&apos;s targeted practice.</h2>
        <Link href="/register?module=psat">
          <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700">
            Start Free PSAT Diagnostic <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        PSAT/NMSQT® and National Merit® are trademarks of the College Board and the National Merit Scholarship Corporation, neither of which is affiliated with StudentNest.
      </p>
    </div>
  );
}

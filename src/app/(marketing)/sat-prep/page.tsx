import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, Clock } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";
import { MockupPractice } from "@/components/landing/mockup-practice";
import { getVisibleCourses } from "@/lib/settings";

export const metadata: Metadata = {
  title: "SAT Prep — Practice & Score Tracking | StudentNest Prep",
  description: "Raise your SAT score with exam-aligned practice for Math and Reading & Writing. Weak area targeting, timed practice, and score tracking. Free to start.",
  openGraph: {
    title: "SAT Prep | StudentNest Prep",
    description: "Exam-aligned SAT prep. Math + Reading & Writing. Weak area targeting. Free to start.",
    url: "https://studentnest.ai/sat-prep",
  },
};

// Each entry tagged with its ApCourse enum so the server can filter by
// the visible_courses SiteSetting (added 2026-05-02 — same source-of-
// truth as sidebar / /api/practice / landing).
const courses = [
  { enum: "SAT_MATH",            name: "SAT Math",              units: 4, desc: "Algebra, geometry, data analysis, advanced math" },
  { enum: "SAT_READING_WRITING", name: "SAT Reading & Writing", units: 4, desc: "Passages, evidence-based reasoning, grammar" },
];

function buildJsonLd(visible: typeof courses) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SAT Prep Courses",
    description: visible.length > 0 ? "SAT prep with exam-aligned practice" : "Rebuilding SAT question banks",
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
          { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "SAT Premium", billingIncrement: "P1M" },
        ],
      },
    })),
  };
}

export default async function SatPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses = allowlist === "all"
    ? courses
    : courses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = buildJsonLd(visibleCourses);
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero — two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> SAT Prep
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Raise your SAT score 100–200 points — with practice that adapts to your weak areas.
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Sage identifies what you struggle with, drills you on those topics, and tracks your progress until you&apos;re ready.
          </p>
          <div className="flex gap-3 justify-center lg:justify-start pt-2">
            <Link href="/register?module=sat">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">Start Free SAT Diagnostic <ArrowRight className="h-5 w-5" /></Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">See Pricing</Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block animate-float">
          <BrowserFrame title="StudentNest Prep · SAT Analytics" className="shadow-2xl shadow-blue-500/10">
            <MockupAnalytics variant="sat" />
          </BrowserFrame>
        </div>
        <div className="lg:hidden max-w-md mx-auto w-full">
          <BrowserFrame title="StudentNest Prep · SAT Analytics">
            <MockupAnalytics variant="sat" />
          </BrowserFrame>
        </div>
      </div>

      {/* Pain statement — why most SAT prep plateaus */}
      <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 text-center max-w-3xl mx-auto">
        <p className="text-base font-medium text-foreground/90 leading-relaxed">
          Most students don&apos;t improve because they practice everything evenly — not where they actually lose points.
        </p>
      </div>

      {/* Features — alternating text + mockups */}
      <div className="space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Target className="h-5 w-5 text-blue-700 dark:text-blue-400" /></div>
            <h2 className="text-2xl font-bold">Sage targets your weakest SAT areas</h2>
            <p className="text-muted-foreground leading-relaxed">Quick diagnostic across Math and Reading &amp; Writing. Choose your timeline (2–6 weeks) and Sage builds a plan targeting your lowest-scoring topics first.</p>
          </div>
          <BrowserFrame title="StudentNest Prep · SAT Study Plan" className="shadow-xl"><MockupStudyPlan variant="sat" /></BrowserFrame>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="lg:order-2 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Brain className="h-5 w-5 text-blue-700 dark:text-blue-400" /></div>
            <h2 className="text-2xl font-bold">SAT-format questions with instant explanations</h2>
            <p className="text-muted-foreground leading-relaxed">Exam-aligned questions matching real SAT format. Instant feedback explaining why each answer is right or wrong — ask Sage for deeper explanations anytime.</p>
          </div>
          <div className="lg:order-1"><BrowserFrame title="StudentNest Prep · SAT Practice" className="shadow-xl"><MockupPractice variant="sat" /></BrowserFrame></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-700 dark:text-blue-400" /></div>
            <h2 className="text-2xl font-bold">See your readiness range improve</h2>
            <p className="text-muted-foreground leading-relaxed">Track session-by-session progress as your estimated SAT range climbs (typical pattern: 1050 ←’ 1150 ←’ 1250+). Real data, timed practice, and the pacing instincts you need on test day.</p>
          </div>
          <BrowserFrame title="StudentNest Prep · SAT Analytics" className="shadow-xl"><MockupAnalytics variant="sat" /></BrowserFrame>
        </div>
      </div>

      {/* Outcomes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Brain, title: "Understand Every Mistake", desc: "Sage explains why your answer was wrong and what the correct reasoning looks like." },
          { icon: Target, title: "Improve Faster", desc: "Practice adapts to your weakest areas. Every session targets where you lose the most points." },
          { icon: BarChart3, title: "Track Your Range", desc: "Watch your estimated SAT range improve session by session (typical pattern: 1050 ←’ 1150 ←’ 1250+). Real data, week by week." },
          { icon: Clock, title: "Build Test Stamina", desc: "Timed practice builds the pacing instincts you need on test day." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample Study Schedule */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Sample 6-Week SAT Study Plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { week: "Week 1", task: "Diagnostic test + identify weak areas" },
            { week: "Weeks 2–3", task: "Algebra, Data Analysis + daily practice" },
            { week: "Weeks 4–5", task: "Reading & Writing + timed sections" },
            { week: "Week 6", task: "Full-length mock exams + final review" },
          ].map((w) => (
            <div key={w.week} className="p-4 rounded-xl border border-blue-500/15 bg-card/50 text-center">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">{w.week}</p>
              <p className="text-xs text-muted-foreground">{w.task}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">
          {visibleCourses.length === 0
            ? "Rebuilding SAT Question Bank"
            : visibleCourses.length === 1
              ? visibleCourses[0].name
              : "SAT Math + Reading & Writing"}
        </h2>
        {visibleCourses.length === 0 ? (
          <div className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 text-center">
            <p className="text-sm text-muted-foreground">
              We&apos;re rebuilding our SAT question bank with stricter quality validators
              (math recompute, distractor leak detection, primary-source attribution).
              SAT courses will be back online individually as each passes our 7-gate audit.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-3">
              In the meantime, try our AP and ACT prep courses (some already audited and live).
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {visibleCourses.map((c) => (
              <div key={c.name} className="p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  <p className="font-semibold">{c.name}</p>
                  <span className="ml-auto text-xs text-muted-foreground">{c.units} units</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free vs Premium */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
          <p className="font-bold">Free</p>
          <p className="text-2xl font-bold text-muted-foreground">$0</p>
          {["Unlimited MCQ practice", "5 Sage Live Tutor chats/day", "Basic study plan", "Score tracking"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />{f}</div>
          ))}
        </div>
        <div className="rounded-xl border-2 border-blue-500 bg-blue-500/5 p-6 space-y-3">
          <p className="font-bold text-blue-700 dark:text-blue-400">SAT Premium</p>
          <p className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">or $79.99/yr — save 33%</p>
          {["Everything in Free", "Unlimited Sage Live Tutor chats", "Personalized SAT study plan", "Advanced weak-area analytics", "Streaming Sage responses"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />{f}</div>
          ))}
          <form action="/api/checkout?plan=monthly&module=sat" method="POST" className="pt-2">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Start SAT Premium</Button>
          </form>
        </div>
      </div>

      {/* Parent trust */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold">For parents</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
          SAT practice is aligned with College Board content. Your child gets adaptive practice targeting their actual weak areas, real-time score tracking you can review together, and structured study plans — for less than one hour of SAT tutoring per month.
        </p>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Your dream school is closer than you think.</h2>
        <Link href="/register?module=sat">
          <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">Start Free SAT Diagnostic <ArrowRight className="h-5 w-5" /></Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        SAT® is a trademark of the College Board, which is not affiliated with StudentNest.
      </p>
    </div>
  );
}

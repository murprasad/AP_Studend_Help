import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, Clock } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";
import { MockupPractice } from "@/components/landing/mockup-practice";

export const metadata: Metadata = {
  title: "AP Exam Prep — AI Practice & Tutoring | StudentNest Prep",
  description: "Score a 5 on your AP exam with AI-powered practice questions, instant feedback, and mastery tracking across 10 AP courses. Free to start.",
  openGraph: {
    title: "AP Exam Prep | StudentNest Prep",
    description: "AI-powered AP exam prep. 10 courses. Instant AI explanations. Mastery tracking. Free to start.",
    url: "https://studentnest.ai/ap-prep",
  },
};

const courses = [
  { name: "AP World History: Modern", units: 9 },
  { name: "AP Computer Science Principles", units: 5 },
  { name: "AP Physics 1: Algebra-Based", units: 10 },
  { name: "AP Calculus AB", units: 8 },
  { name: "AP Calculus BC", units: 10 },
  { name: "AP Statistics", units: 9 },
  { name: "AP Chemistry", units: 9 },
  { name: "AP Biology", units: 8 },
  { name: "AP US History", units: 9 },
  { name: "AP Psychology", units: 9 },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "AP Exam Prep Courses",
  description: "10 AP courses with AI-powered practice and tutoring",
  numberOfItems: 10,
  itemListElement: courses.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.name,
      description: `AI-powered ${c.name} prep with ${c.units} units of practice questions, mastery tracking, and instant explanations.`,
      provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "AP Premium", billingIncrement: "P1M" },
      ],
    },
  })),
};

export default function ApPrepPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero — two-column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> 10 AP Courses
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">
            Go from a 3 to a 5 on your AP Exam — with AI that actually teaches.
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
            Sage explains concepts, quizzes you back, and tracks mastery by unit. Every study session moves your score.
          </p>
          <div className="flex gap-3 justify-center lg:justify-start pt-2">
            <Link href="/register?module=ap">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">Start Free AP Diagnostic <ArrowRight className="h-5 w-5" /></Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">See Pricing</Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:block animate-float">
          <BrowserFrame title="StudentNest AI · AP Analytics" className="shadow-2xl shadow-indigo-500/10">
            <MockupAnalytics />
          </BrowserFrame>
        </div>
        <div className="lg:hidden max-w-md mx-auto w-full">
          <BrowserFrame title="StudentNest AI · AP Analytics">
            <MockupAnalytics />
          </BrowserFrame>
        </div>
      </div>

      {/* Features — alternating text + mockups */}
      <div className="space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Target className="h-5 w-5 text-indigo-400" /></div>
            <h3 className="text-2xl font-bold">AI builds your study plan by unit</h3>
            <p className="text-muted-foreground leading-relaxed">10–15 diagnostic questions identify your weak spots. Sage creates a weekly plan targeting your lowest-scoring units first — and adjusts as you improve.</p>
          </div>
          <BrowserFrame title="StudentNest AI · AP Study Plan" className="shadow-xl"><MockupStudyPlan /></BrowserFrame>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="lg:order-2 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Brain className="h-5 w-5 text-indigo-400" /></div>
            <h3 className="text-2xl font-bold">Practice MCQs &amp; FRQs with instant feedback</h3>
            <p className="text-muted-foreground leading-relaxed">Every question matches AP format. Get it wrong? Sage explains why — not just the answer, but the reasoning behind every option.</p>
          </div>
          <div className="lg:order-1"><BrowserFrame title="StudentNest AI · AP Practice" className="shadow-xl"><MockupPractice /></BrowserFrame></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-indigo-400" /></div>
            <h3 className="text-2xl font-bold">Track mastery and see your estimated AP score</h3>
            <p className="text-muted-foreground leading-relaxed">Per-unit mastery scores, accuracy trends, and a readiness heatmap — all in real time. Know exactly when you&apos;re ready for exam day.</p>
          </div>
          <BrowserFrame title="StudentNest AI · AP Analytics" className="shadow-xl"><MockupAnalytics /></BrowserFrame>
        </div>
      </div>

      {/* Outcomes — what students get */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Brain, title: "Understand, Don't Memorize", desc: "Sage explains why each answer is correct — and why wrong answers are common mistakes." },
          { icon: Target, title: "Focus Where It Matters", desc: "Practice adapts to your weakest units automatically. No wasted study time." },
          { icon: BarChart3, title: "See Your Progress", desc: "Per-unit mastery scores, accuracy trends, and an estimated AP score — all in real time." },
          { icon: Clock, title: "Know When You're Ready", desc: "Mock exams simulate real AP pacing. Walk in confident, not guessing." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-indigo-400" />
            </div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample Study Schedule */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Sample 8-Week AP Study Plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { week: "Week 1", task: "Diagnostic test + start Unit 1" },
            { week: "Weeks 2–5", task: "2 units per week with daily practice" },
            { week: "Week 6", task: "Review weak areas + ask Sage" },
            { week: "Weeks 7–8", task: "Full mock exams + final review" },
          ].map((w) => (
            <div key={w.week} className="p-4 rounded-xl border border-indigo-500/15 bg-card/50 text-center">
              <p className="text-xs font-semibold text-indigo-400 mb-1">{w.week}</p>
              <p className="text-xs text-muted-foreground">{w.task}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">10 AP Courses — Full Curriculum Coverage</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {courses.map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-3.5 rounded-lg bg-card/50 border border-border/40">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-medium">{c.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">({c.units} units)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Free vs Premium */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
          <p className="font-bold">Free</p>
          <p className="text-2xl font-bold text-muted-foreground">$0</p>
          {["Unlimited MCQ practice", "5 AI tutor chats/day", "Basic study plan", "Mastery analytics"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" />{f}</div>
          ))}
        </div>
        <div className="rounded-xl border-2 border-indigo-500 bg-indigo-500/5 p-6 space-y-3">
          <p className="font-bold text-indigo-400">AP Premium</p>
          <p className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-green-500 font-medium">or $79.99/yr — save 33%</p>
          {["Everything in Free", "Unlimited AI tutor chats", "FRQ with AI rubric scoring", "Personalized study plan", "Streaming AI"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-indigo-400" />{f}</div>
          ))}
          <form action="/api/checkout?plan=monthly&module=ap" method="POST" className="pt-2">
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Start AP Premium</Button>
          </form>
        </div>
      </div>

      {/* Parent trust */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold">For parents</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
          All practice questions align with College Board AP curriculum standards. Your child gets adaptive practice, real-time mastery tracking, and a clear study plan — for less than a single tutoring session per month.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Ready to aim for a 5?</h2>
        <Link href="/register?module=ap">
          <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">Start Free AP Diagnostic <ArrowRight className="h-5 w-5" /></Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground/60">
        AP® is a trademark of the College Board, which is not affiliated with StudentNest.
      </p>
    </div>
  );
}

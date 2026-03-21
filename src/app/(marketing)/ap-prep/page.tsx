import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "AP Exam Prep — AI Practice & Tutoring | StudentNest AI",
  description: "Score a 5 on your AP exam with AI-powered practice questions, instant feedback, and mastery tracking across 10 AP courses. Free to start.",
  openGraph: {
    title: "AP Exam Prep | StudentNest AI",
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
      provider: { "@type": "Organization", name: "StudentNest AI", url: "https://studentnest.ai" },
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
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
          <Sparkles className="h-4 w-4" /> 10 AP Courses
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold">
          Score a 5 on your AP Exam — with AI that actually teaches.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Sage explains concepts, quizzes you back, and tracks mastery by unit. Every study session moves your score.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/register?module=ap">
            <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">Start Free AP Diagnostic <ArrowRight className="h-5 w-5" /></Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">See Pricing</Button>
          </Link>
        </div>
      </div>

      {/* How It Works — Study Flow */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Your AP Prep Path</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Take the Diagnostic", desc: "10–15 questions across all units. Sage identifies your strengths and weak spots instantly." },
            { step: "2", title: "Get Your Study Plan", desc: "AI builds a weekly plan targeting your lowest-scoring units first. Adjusts as you improve." },
            { step: "3", title: "Practice & Ask Sage", desc: "Practice MCQs and FRQs with AI rubric scoring — the question types that actually determine your AP score. Stuck? Ask Sage for a step-by-step explanation." },
            { step: "4", title: "Mock Exam & Track", desc: "Timed AP-paced simulation. See your estimated score, mastery heatmap, and readiness by unit." },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 rounded-xl border border-border/40 bg-card/50">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 text-lg font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
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

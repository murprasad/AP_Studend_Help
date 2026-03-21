import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "CLEP Exam Prep — Earn College Credit with AI | StudentNest AI",
  description: "Skip intro courses and save $1,200+ per exam. AI-powered CLEP prep for College Algebra, Psychology, Marketing, and more. 6 exams. Free to start.",
  openGraph: {
    title: "CLEP Exam Prep | StudentNest AI",
    description: "Skip intro courses. Save $1,200+ per CLEP exam. AI-powered prep for 6 exams. Free to start.",
    url: "https://studentnest.ai/clep-prep",
  },
};

const courses = [
  { name: "CLEP College Algebra", units: 5, savings: "$1,200" },
  { name: "CLEP College Composition", units: 5, savings: "$2,400" },
  { name: "CLEP Introductory Psychology", units: 5, savings: "$1,200" },
  { name: "CLEP Principles of Marketing", units: 5, savings: "$1,200" },
  { name: "CLEP Principles of Management", units: 5, savings: "$1,200" },
  { name: "CLEP Introductory Sociology", units: 5, savings: "$1,200" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "CLEP Exam Prep Courses",
  description: "6 CLEP exams with AI-powered practice — earn college credit and save thousands",
  numberOfItems: 6,
  itemListElement: courses.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.name,
      description: `AI-powered ${c.name} prep. ${c.units} units. Pass and save ${c.savings} in tuition.`,
      provider: { "@type": "Organization", name: "StudentNest AI", url: "https://studentnest.ai" },
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "CLEP Premium", billingIncrement: "P1M" },
      ],
    },
  })),
};

export default function ClepPrepPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <GraduationCap className="h-4 w-4" /> 6 CLEP Exams · Earn College Credit
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold">
          Skip the class. Keep the credit. Save $1,200+ per exam.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          One CLEP exam ($93) can replace a 3-credit college course worth $1,200+. Sage prepares you with AI-powered practice tailored to CLEP content.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/register?module=clep">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">Start Free CLEP Diagnostic <ArrowRight className="h-5 w-5" /></Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">See Pricing</Button>
          </Link>
        </div>
      </div>

      {/* ROI Stats */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {[
          { stat: "99%", label: "Cost Savings", desc: "Pay $93 for the exam. Skip a $1,200 course." },
          { stat: "6", label: "CLEP Exams", desc: "College Algebra, Psychology, Marketing & more." },
          { stat: "$7,200+", label: "Max Savings", desc: "Pass all 6 and save over $7,200 in tuition." },
        ].map(({ stat, label, desc }) => (
          <div key={label} className="text-center p-5 rounded-xl border border-emerald-500/15 bg-card/50">
            <p className="text-3xl font-bold text-emerald-400">{stat}</p>
            <p className="font-semibold text-sm mt-1">{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>

      {/* What is CLEP? */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-left space-y-3">
        <h2 className="text-xl font-bold">What is CLEP?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          CLEP (College-Level Examination Program) lets you earn college credit by passing a standardized exam instead of taking the full course. Each exam costs $93 and takes 90–120 minutes. A passing score earns 3–6 college credits — accepted by 2,900+ colleges and universities. That&apos;s $1,200+ in tuition savings per exam, with no semester of lectures required.
        </p>
      </div>

      {/* How It Works — Study Flow */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Your CLEP Prep Path</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Take the Diagnostic", desc: "Quick assessment to see how much you already know. Many students have prior familiarity." },
            { step: "2", title: "Get Your Study Plan", desc: "AI builds a 4–8 week plan (faster if you have prior coursework). Starting fresh? The plan adapts to your pace." },
            { step: "3", title: "Practice & Ask Sage", desc: "CLEP-aligned questions with instant feedback. Sage explains concepts using free resources." },
            { step: "4", title: "Mock Exam & Schedule", desc: "When mastery hits 70%+, you're ready. Schedule your $93 exam and save $1,200+." },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 rounded-xl border border-border/40 bg-card/50">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 text-lg font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Brain, title: "Learn at Your Pace", desc: "Sage explains concepts 24/7 using OpenStax and Khan Academy resources. No classroom schedule." },
          { icon: Target, title: "CLEP-Aligned Questions", desc: "AI generates questions matching official CLEP exam format and content outlines." },
          { icon: BarChart3, title: "Know When You're Ready", desc: "Per-unit mastery scores tell you exactly when to schedule your exam. No guessing." },
          { icon: GraduationCap, title: "Real College Credit", desc: "One passing score = 3 college credits at 2,900+ institutions. Skip the intro course." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">6 CLEP Exams — Save Thousands</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.name} className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.units} units</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                Save {c.savings}
              </span>
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
        <div className="rounded-xl border-2 border-emerald-500 bg-emerald-500/5 p-6 space-y-3">
          <p className="font-bold text-emerald-400">CLEP Premium</p>
          <p className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-green-500 font-medium">or $79.99/yr — save 33%</p>
          {["Everything in Free", "All 6 CLEP courses with full prep", "Unlimited AI tutor chats", "Personalized CLEP study plan", "Save $1,200+ per exam"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" />{f}</div>
          ))}
          <form action="/api/checkout?plan=monthly&module=clep" method="POST" className="pt-2">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Start CLEP Premium</Button>
          </form>
        </div>
      </div>

      {/* Parent trust */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold">For parents &amp; adult learners</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
          CLEP exams are accepted by 2,900+ colleges and universities for real college credit. StudentNest prepares students with AI-powered practice aligned to official CLEP content outlines. Average prep time is 20–40 hours per exam — and passing saves $1,200+ in tuition per course.
        </p>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Skip intro courses. Graduate faster. Save thousands.</h2>
        <Link href="/register?module=clep">
          <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">Start Free CLEP Diagnostic <ArrowRight className="h-5 w-5" /></Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground/60">
        CLEP® is a registered trademark of College Board, which is not affiliated with StudentNest. All practice questions are original AI-generated content.
      </p>
    </div>
  );
}

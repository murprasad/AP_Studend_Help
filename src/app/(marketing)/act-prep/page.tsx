import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Sparkles, Brain, Target, BarChart3, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "ACT Prep — AI Practice for All 4 Sections | StudentNest AI",
  description: "Boost your ACT composite with AI-powered practice for Math, English, Science, and Reading. Section-specific tutoring and score tracking. Free to start.",
  openGraph: {
    title: "ACT Prep | StudentNest AI",
    description: "AI-powered ACT prep. All 4 sections. Section-specific AI tutoring. Free to start.",
    url: "https://studentnest.ai/act-prep",
  },
};

const courses = [
  { name: "ACT Math", units: 5, desc: "Pre-algebra through trigonometry — 5 choices per question" },
  { name: "ACT English", units: 3, desc: "Grammar, punctuation, sentence structure, rhetorical skills" },
  { name: "ACT Science", units: 3, desc: "Data interpretation, research summaries, conflicting viewpoints" },
  { name: "ACT Reading", units: 4, desc: "Literary, social science, humanities, natural science passages" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "ACT Prep Courses",
  description: "All 4 ACT sections with AI-powered practice and tutoring",
  numberOfItems: 4,
  itemListElement: courses.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.name,
      description: `AI-powered ${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking.`,
      provider: { "@type": "Organization", name: "StudentNest AI", url: "https://studentnest.ai" },
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "ACT Premium", billingIncrement: "P1M" },
      ],
    },
  })),
};

export default function ActPrepPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium">
          <Sparkles className="h-4 w-4" /> 4 ACT Sections
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold">
          Boost your ACT composite by 3–5 points — with AI that targets your weakest sections.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Math, English, Science, Reading — Sage adapts to each section and drills you where it matters most.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/register?module=act">
            <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700">Start Free ACT Diagnostic <ArrowRight className="h-5 w-5" /></Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">See Pricing</Button>
          </Link>
        </div>
      </div>

      {/* How It Works — Study Flow */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Your ACT Prep Path</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Take the Diagnostic", desc: "Quick assessment across all 4 sections. Sage identifies which sections need the most work." },
            { step: "2", title: "Get Your Study Plan", desc: "AI builds a section-by-section plan. Focus on your weakest areas first for maximum score gain." },
            { step: "3", title: "Practice & Ask Sage", desc: "Section-specific questions with real ACT format (5-choice Math). Instant AI explanations." },
            { step: "4", title: "Mock Exam & Track", desc: "Full timed simulation with ACT pacing. See your composite and per-section estimates." },
          ].map((s) => (
            <div key={s.step} className="text-center p-4 rounded-xl border border-border/40 bg-card/50">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 text-lg font-bold flex items-center justify-center mx-auto mb-3">{s.step}</div>
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Outcomes */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Brain, title: "Section-Specific Tutoring", desc: "Sage knows the difference between ACT Science reasoning and ACT Reading — and tutors accordingly." },
          { icon: Target, title: "Real ACT Format", desc: "5-choice Math (A–E), not 4. Every question matches the actual ACT format exactly." },
          { icon: BarChart3, title: "Composite Tracking", desc: "See per-section scores and overall composite improve as you practice." },
          { icon: Clock, title: "Build ACT Pacing", desc: "Practice at real ACT speed — 60s/question Math, 36s English. Build instincts for test day." },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <f.icon className="h-5 w-5 text-violet-400" />
            </div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Sample Study Schedule */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">Sample 6-Week ACT Study Plan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { week: "Week 1", task: "Diagnostic test + identify weakest section" },
            { week: "Weeks 2–3", task: "Math + English with pacing drills" },
            { week: "Weeks 4–5", task: "Science + Reading with timed practice" },
            { week: "Week 6", task: "Full mock exams + composite review" },
          ].map((w) => (
            <div key={w.week} className="p-4 rounded-xl border border-violet-500/15 bg-card/50 text-center">
              <p className="text-xs font-semibold text-violet-400 mb-1">{w.week}</p>
              <p className="text-xs text-muted-foreground">{w.task}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course List */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">All 4 ACT Sections Covered</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div key={c.name} className="p-5 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-violet-400" />
                <p className="font-semibold">{c.name}</p>
                <span className="ml-auto text-xs text-muted-foreground">{c.units} units</span>
              </div>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Free vs Premium */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
          <p className="font-bold">Free</p>
          <p className="text-2xl font-bold text-muted-foreground">$0</p>
          {["Unlimited MCQ practice", "5 AI tutor chats/day", "Basic study plan", "Score tracking"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-400" />{f}</div>
          ))}
        </div>
        <div className="rounded-xl border-2 border-violet-500 bg-violet-500/5 p-6 space-y-3">
          <p className="font-bold text-violet-400">ACT Premium</p>
          <p className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-xs text-green-500 font-medium">or $79.99/yr — save 33%</p>
          {["Everything in Free", "Unlimited AI tutor chats", "Personalized ACT study plan", "Advanced section analytics", "Streaming AI"].map((f) => (
            <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-violet-400" />{f}</div>
          ))}
          <form action="/api/checkout?plan=monthly&module=act" method="POST" className="pt-2">
            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">Start ACT Premium</Button>
          </form>
        </div>
      </div>

      {/* Parent trust */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6 text-center space-y-2">
        <p className="text-sm font-semibold">For parents</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Practice covers all 4 ACT sections with real exam formatting and pacing. Your child gets targeted practice on their weakest sections, composite score tracking, and a structured study plan — for a fraction of tutoring costs.
        </p>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Every point counts for college admission.</h2>
        <Link href="/register?module=act">
          <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700">Start Free ACT Diagnostic <ArrowRight className="h-5 w-5" /></Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground/60">
        ACT® is a registered trademark of ACT, Inc., which is not affiliated with StudentNest.
      </p>
    </div>
  );
}

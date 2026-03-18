import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Brain,
  BarChart3,
  Trophy,
  MessageSquare,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Crown,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Get Instant AI Explanations",
    description: "Stuck on a concept? Ask Sage — your 24/7 AI tutor — and get a clear, exam-focused answer in seconds. No waiting, no judgment.",
  },
  {
    icon: Target,
    title: "Practice What You Actually Need",
    description: "The practice engine tracks every unit you've attempted and targets your weakest areas automatically — so every session counts.",
  },
  {
    icon: BarChart3,
    title: "See Exactly Where to Study More",
    description: "Per-unit mastery scores and a visual heatmap show weak areas at a glance. Stop guessing what to review.",
  },
  {
    icon: MessageSquare,
    title: "Exam-Style Questions, On Demand",
    description: "Practice with AI-generated MCQ, FRQ, SAQ, DBQ, and LEQ questions aligned to real College Board standards — never run out.",
  },
  {
    icon: Clock,
    title: "Test Your Readiness with a Mock Exam",
    description: "Simulate the real AP exam under timed conditions. Get an estimated AP score from 1–5 so you know exactly where you stand.",
  },
  {
    icon: Trophy,
    title: "Stay Motivated Every Day",
    description: "Earn XP, maintain streaks, unlock achievements, and level up as you progress. Building a study habit has never been this rewarding.",
  },
];

const courses = [
  { name: "AP World History: Modern",       units: 9  },
  { name: "AP Computer Science Principles", units: 5  },
  { name: "AP Physics 1: Algebra-Based",    units: 10 },
  { name: "AP Calculus AB",                 units: 8  },
  { name: "AP Calculus BC",                 units: 10 },
  { name: "AP Statistics",                  units: 9  },
  { name: "AP Chemistry",                   units: 9  },
  { name: "AP Biology",                     units: 8  },
  { name: "AP US History",                  units: 9  },
  { name: "AP Psychology",                  units: 9  },
  { name: "SAT Math",                       units: 4  },
  { name: "SAT Reading & Writing",          units: 4  },
  { name: "ACT Math",                       units: 5  },
  { name: "ACT English",                    units: 3  },
  { name: "ACT Science",                    units: 3  },
  { name: "ACT Reading",                    units: 4  },
];

const FREE_FEATURES = [
  "All 16 courses (AP + SAT + ACT)",
  "Unlimited MCQ practice questions",
  "AI Tutor (5 conversations/day)",
  "Progress analytics & mastery tracking",
  "Mock exam simulator",
  "Achievements & XP system",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Unlimited AI Tutor conversations",
  "FRQ / SAQ / DBQ / LEQ with AI scoring",
  "AI-personalized study plan (weekly)",
  "Advanced analytics & weak-area insights",
  "Streaming AI responses (faster answers)",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-indigo-400" />
            <span className="text-xl font-bold">
              <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/#pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-violet-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-sm px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI-powered · Free to start
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground/90 mb-4">
            AI-powered AP, SAT & ACT prep
          </p>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
            Built for high school students — get instant AI explanations, practice with real exam-style questions, and improve faster with smart analytics.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Designed for AP exam formats · Covers 16 courses · Aligned with College Board standards
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8 h-12">
                Start Studying Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                Log In
              </Button>
            </Link>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
            <span>Takes less than 30 seconds to sign up</span>
            <span className="hidden sm:block">·</span>
            <span>No credit card required</span>
            <span className="hidden sm:block">·</span>
            <span>Free forever · Premium at $9.99/month</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 py-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Practice Questions" },
              { value: "16",      label: "AP · SAT · ACT Courses" },
              { value: "24/7",    label: "AI Tutor Available" },
              { value: "5",       label: "Target AP Score" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-indigo-400 mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Used by students preparing for AP exams · Free core features · No credit card required
          </p>
        </div>
      </section>

      {/* Meet Sage — AI differentiator */}
      <section className="py-24 bg-gradient-to-b from-indigo-950/20 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" /> Your AI Study Partner
          </div>
          <h2 className="text-4xl font-bold mb-4">Meet Sage 🌿</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Sage is your personal AI tutor — available 24/7, never judges, and always explains in a way that clicks.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Ask Sage Anything",
                desc: "Get step-by-step explanations for any AP, SAT, or ACT concept. Sage formats answers with key terms, visual breakdowns, and memory hooks.",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
              {
                icon: Zap,
                title: "Practice Agent",
                desc: "The practice engine auto-generates exam-aligned questions, tracks every answer, and targets your weakest units to maximize improvement.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              {
                icon: BarChart3,
                title: "Progress Agent",
                desc: "Mastery scores update after every question. See unit-by-unit heatmaps and get a personalized study plan targeting your weak areas.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
            ].map((a) => (
              <div key={a.title} className="p-6 rounded-xl border border-border/40 bg-card/50 card-glow text-left">
                <div className={`w-12 h-12 rounded-lg ${a.bg} flex items-center justify-center mb-4`}>
                  <a.icon className={`h-6 w-6 ${a.color}`} />
                </div>
                <h3 className="font-semibold mb-2 text-base">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground text-lg">Start in minutes. Improve every day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Choose Your Subject",
                desc: "Pick from 10 AP courses, SAT, or ACT. StudentNest tailors practice questions and Sage's explanations to your exact exam.",
              },
              {
                step: "2",
                title: "Practice or Ask Sage",
                desc: "Answer AI-generated exam questions with instant feedback, or chat with Sage for deep explanations. Both work together.",
              },
              {
                step: "3",
                title: "Track & Improve",
                desc: "See mastery scores by unit, spot weak areas at a glance, and watch your estimated AP score improve session by session.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-indigo-500/20 text-indigo-400 text-2xl font-bold flex items-center justify-center mx-auto mb-5">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — outcome focused */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Score Higher</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for AP students across 16 courses, with features designed around how the exams actually work.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-12">
            Free to start · Aligned with real exam formats · Built for high school students
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-border/40 bg-card/50 card-glow"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Coverage */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Complete Curriculum Coverage</h2>
              <p className="text-muted-foreground text-lg mb-4">
                Every unit across 10 AP courses, SAT, and ACT — hundreds of exam-aligned questions per unit.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Aligned with College Board AP standards · Updated for current exam formats · Free for every student
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Learning Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {courses.map((course) => (
                <div
                  key={course.name}
                  className="flex items-center gap-3 p-3.5 rounded-lg bg-card/50 border border-border/40"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{course.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({course.units} units)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Practice Modes */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Three Ways to Practice</h2>
            <p className="text-muted-foreground text-lg">Flexible for every student and every schedule.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Quick Practice",
                description: "10 questions in under 10 minutes. Perfect for daily maintenance — fits any schedule.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/20",
              },
              {
                icon: BookOpen,
                title: "Focused Study",
                description: "Deep dive into specific units where you need the most improvement. Targeted and efficient.",
                color: "text-blue-400",
                bg: "bg-blue-500/20",
              },
              {
                icon: Target,
                title: "Mock Exam",
                description: "Full timed AP exam simulation. Get an estimated AP score from 1–5 so you know exactly where you stand.",
                color: "text-purple-400",
                bg: "bg-purple-500/20",
              },
            ].map((mode) => (
              <div key={mode.title} className="p-8 rounded-xl border border-border/40 bg-card text-center">
                <div className={`w-16 h-16 rounded-full ${mode.bg} flex items-center justify-center mx-auto mb-6`}>
                  <mode.icon className={`h-8 w-8 ${mode.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{mode.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="py-24 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">Simple Pricing</h2>
            <p className="text-muted-foreground text-lg">
              Free to begin. Upgrade only when you want unlimited access.
            </p>
            <p className="text-sm text-muted-foreground mt-1">No credit card required to start.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-border/40 bg-card p-8 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-xl font-bold">Free</h3>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">Free forever · No credit card</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full h-11">Start Free</Button>
              </Link>
            </div>
            {/* Premium */}
            <div className="rounded-2xl border-2 border-indigo-500/50 bg-indigo-500/5 p-8 flex flex-col relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white border-0 px-4">
                Most Popular
              </Badge>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-xl font-bold">Premium</h3>
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-muted-foreground mb-1">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">or $79.99/year — save 33%</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {PREMIUM_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/pricing">
                <Button className="w-full h-11 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Crown className="h-4 w-4" /> View Full Pricing
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Start free anytime · Upgrade only when you need more · Cancel anytime · Flexible for every student
          </p>
        </div>
      </section>

      {/* Testimonial-style trust */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <blockquote className="text-xl font-medium text-foreground/90 italic">
            &ldquo;Finally an AP prep tool that actually explains <em>why</em> the answer is correct — not just what it is.&rdquo;
          </blockquote>
          <p className="text-sm text-muted-foreground">
            Used by students preparing for AP World History, AP CSP, AP Calculus, and more
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-indigo-950/30 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Score Higher?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join high school students using StudentNest to master AP, SAT & ACT exams — free to start, no credit card needed.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2 text-base px-10 h-12">
              Start Studying Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Takes less than 30 seconds · Start free anytime · Upgrade only if you need more
          </p>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 py-16 bg-secondary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">About StudentNest</h2>
          <p className="text-muted-foreground leading-relaxed">
            StudentNest is an AI-powered exam prep platform built for high school students tackling AP, SAT, and ACT exams.
            We combine adaptive practice, instant AI tutoring, and detailed progress analytics to help every student reach their target score.
            AP prep shouldn&apos;t cost hundreds of dollars — core features are free for every student.
          </p>
          <p className="text-muted-foreground text-sm">
            Questions? Reach us at{" "}
            <a href="mailto:contact@studentnest.ai" className="text-indigo-400 hover:underline">
              contact@studentnest.ai
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="font-semibold"><span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Sign Up Free</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 StudentNest. Your AI Study Partner.
          </p>
        </div>
      </footer>
    </div>
  );
}

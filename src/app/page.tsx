import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  BarChart3,
  MessageSquare,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Get Instant AI Explanations",
    description: "Ask Sage anything — get clear explanations and instant comprehension checks that prove you understood it.",
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
    icon: Clock,
    title: "Test Your Readiness with a Mock Exam",
    description: "Simulate the real AP exam under timed conditions. Get an estimated AP score from 1–5 so you know exactly where you stand.",
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

const testimonials = [
  {
    quote: "Finally an AP prep tool that actually explains why the answer is correct — not just what it is.",
    name: "Sofia R.",
    context: "Preparing for AP World History",
  },
  {
    quote: "Sage explained limits better in 5 minutes than my teacher did all semester.",
    name: "Marcus T.",
    context: "Preparing for AP Calculus AB",
  },
  {
    quote: "The comprehension check after each explanation is a game changer. I actually remember things now.",
    name: "Priya K.",
    context: "Preparing for AP Biology",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            <div>
              <span className="text-lg font-bold">
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
              </span>
              <p className="text-xs text-muted-foreground leading-none hidden sm:block">Your AI Study Partner</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
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
      <section className="relative pt-20 pb-16 overflow-hidden">
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
            Score Higher on AP, SAT &amp; ACT —<br className="hidden sm:block" /> with AI That Actually Teaches
          </p>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
            Get instant AI explanations, practice with real exam-style questions, and improve faster with smart analytics — free.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Covers 16 courses · Aligned with College Board standards · Free forever · Premium at $9.99/month
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
          <p className="mt-4 text-sm text-muted-foreground">
            Takes less than 30 seconds to sign up · No credit card required
          </p>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y border-border/40 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: "🎯", stat: "16 courses covered", sub: "AP, SAT & ACT" },
              { icon: "📚", stat: "Exam-aligned questions", sub: "Never running out" },
              { icon: "🤖", stat: "Powered by Groq", sub: "Available 24/7" },
            ].map(({ icon, stat, sub }) => (
              <div key={stat} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{icon}</span>
                <p className="font-semibold text-foreground">{stat}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            ))}
          </div>
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
                desc: "Get step-by-step explanations of any concept — then Sage quizzes you back with 3 targeted questions to lock in what you just learned.",
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

      {/* Product Demo — Sage conversation snippet */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wide">
            This is Sage — your 24/7 AP tutor
          </p>
          <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/40">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-muted-foreground">StudentNest · AI Tutor</span>
            </div>
            {/* Chat */}
            <div className="p-5 space-y-4 text-sm">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-indigo-600/20 border border-indigo-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-foreground/90">Why did the French Revolution happen?</p>
                </div>
              </div>
              {/* Sage response */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="bg-secondary/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] space-y-1.5">
                  <p className="font-semibold text-xs text-indigo-400 mb-1">Sage</p>
                  <p className="text-foreground/80 leading-relaxed">
                    The French Revolution (1789) had three main causes: <strong>financial crisis</strong> from war debt, <strong>social inequality</strong> under the Estates system where the Third Estate bore heavy taxes, and <strong>Enlightenment ideas</strong> about liberty and popular sovereignty.
                  </p>
                  <p className="text-foreground/80">The immediate trigger was a bread shortage — food prices spiked after crop failures, pushing the already-desperate commoners to revolt.</p>
                </div>
              </div>
              {/* Follow-up chips */}
              <div className="pl-11 flex flex-wrap gap-2">
                {["What was the Estates system?", "How did Enlightenment ideas spread?"].map((q) => (
                  <span key={q} className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 cursor-default">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Check callout */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> What makes us different
          </div>
          <h2 className="text-2xl font-bold">Most AI tutors explain. Sage tests you back.</h2>
          <p className="text-muted-foreground">
            After every answer, Sage offers a quick 3-question comprehension check — optional, instant, and built around exactly what it just taught you.
            Your score builds your Comprehension % on the Analytics page. Active recall at zero extra effort.
          </p>
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

      {/* Features — outcome focused (trimmed to 4) */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Score Higher</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built around how AP, SAT, and ACT exams actually work — not generic quiz apps.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* Competitor Context */}
      <section className="py-12 bg-secondary/20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            Unlike generic AI tools, StudentNest is purpose-built for AP, SAT &amp; ACT
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {[
              "Explains concepts, then quizzes you back",
              "Tracks mastery by unit and topic",
              "Generates exam-aligned questions on demand",
              "Free to start — no credit card",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm text-foreground/80">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                {point}
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
              <p className="text-muted-foreground text-lg mb-8">
                Every unit across 10 AP courses, SAT, and ACT — hundreds of exam-aligned questions per unit, free for every student.
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

      {/* Testimonials — 3 cards */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Student Feedback</h2>
            <p className="text-muted-foreground text-sm">Representative feedback from students using StudentNest</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-xl border border-border/40 bg-card/50 card-glow space-y-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-indigo-950/30 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Score Higher?</h2>
          <p className="text-muted-foreground text-lg mb-6">
            Join high school students using StudentNest to master AP, SAT &amp; ACT exams.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2 text-base px-10 h-12">
              Start Studying Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Free forever · Premium at $9.99/month ·{" "}
            <Link href="/pricing" className="text-indigo-400 hover:underline">See full pricing</Link>
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
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Sign Up Free</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 StudentNest. Your AI Study Partner.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 border-t border-border/20 pt-4">
          <p className="text-xs text-muted-foreground text-center max-w-3xl mx-auto">
            AP® and SAT® are trademarks of the College Board. ACT® is a trademark of ACT, Inc.
            Neither organization is affiliated with or endorses StudentNest.
          </p>
        </div>
      </footer>

    </div>
  );
}

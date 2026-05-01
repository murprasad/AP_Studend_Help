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
  GraduationCap,
  BookOpen,
  Shield,
  ChevronDown,
} from "lucide-react";
import { InteractiveDemo } from "@/components/landing/interactive-demo";
import { APSeasonBanner } from "@/components/marketing/ap-season-banner";
import { HeroReadinessPicker } from "@/components/landing/hero-readiness-picker";
import { MobileStickyCta } from "@/components/landing/mobile-sticky-cta";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";
import { MockupPractice } from "@/components/landing/mockup-practice";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { FadeIn } from "@/components/landing/fade-in";
import { LandingFaq } from "@/components/landing/faq";
import { SageChat } from "@/components/layout/sage-chat";
import { isClepEnabled, isDsstEnabled, getExamLabel, getCourseCount } from "@/lib/settings";
import { SocialProofBadge } from "@/components/social-proof-badge";

// 2026-05-01 — feature ordering reshuffled per Reddit-feedback plan.
// Lead with AP-prep substance (official questions, real exam pressure),
// AI as the differentiator second. Previous order led with "Get Instant
// AI Explanations" which read as "AI product that happens to have AP."
const features = [
  {
    icon: Target,
    title: "Practice with official AP exam questions",
    description: "500+ released College Board FRQs from past exams, plus rigorous MCQs targeted to your weakest units — so every session moves the needle.",
  },
  {
    icon: Clock,
    title: "Test Your Readiness with a Mock Exam",
    description: "Simulate exam conditions under timed pressure. Get readiness scores per unit and see exactly where you stand before exam day.",
  },
  {
    icon: BarChart3,
    title: "See Exactly Where to Study More",
    description: "Per-unit mastery scores and a visual heatmap show weak areas at a glance. Stop guessing what to review.",
  },
  {
    icon: Brain,
    title: "Sage AI tutor — clear explanations, instant comprehension checks",
    description: "Ask anything. Get clear explanations grounded in the College Board curriculum, plus knowledge-check follow-ups that prove you understood it.",
  },
];

const courses = [
  { name: "AP World History: Modern",       units: 9,  topics: "Civilizations, empires, revolutions, globalization" },
  { name: "AP Computer Science Principles", units: 5,  topics: "Algorithms, data, internet, impact of computing" },
  { name: "AP Physics 1: Algebra-Based",    units: 8,  topics: "Kinematics, forces, energy, momentum, rotation, oscillations, fluids" },
  { name: "AP Calculus AB",                 units: 8,  topics: "Limits, derivatives, integrals, differential equations" },
  { name: "AP Calculus BC",                 units: 10, topics: "All AB topics plus series, parametric, polar" },
  { name: "AP Statistics",                  units: 9,  topics: "Data analysis, probability, inference, regression" },
  { name: "AP Chemistry",                   units: 9,  topics: "Atomic structure, bonding, reactions, thermodynamics" },
  { name: "AP Biology",                     units: 8,  topics: "Cells, genetics, evolution, ecology, physiology" },
  { name: "AP US History",                  units: 9,  topics: "Colonial era through modern America" },
  { name: "AP Psychology",                  units: 5,  topics: "Biological bases, cognition, development & learning, social psychology, mental & physical health" },
  { name: "SAT Math",                       units: 4,  topics: "Algebra, geometry, data analysis, advanced math" },
  { name: "SAT Reading & Writing",          units: 4,  topics: "Passages, evidence-based reasoning, grammar" },
  { name: "ACT Math",                       units: 5,  topics: "Pre-algebra through trigonometry, 5-choice format" },
  { name: "ACT English",                    units: 3,  topics: "Grammar, sentence structure, rhetorical skills" },
  { name: "ACT Science",                    units: 3,  topics: "Data interpretation, research summaries" },
  { name: "ACT Reading",                    units: 4,  topics: "Literary, social science, humanities passages" },
];

const clepCourses = [
  { name: "CLEP Introductory Sociology",          units: 5, savings: "$1,200", topics: "Social structures, culture, institutions — easiest CLEP" },
  { name: "CLEP Introductory Psychology",          units: 5, savings: "$1,200", topics: "Behavior, cognition, development, disorders" },
  { name: "CLEP Analyzing & Interpreting Lit",     units: 5, savings: "$2,400", topics: "No reading list — pure passage analysis skills" },
  { name: "CLEP Principles of Marketing",          units: 5, savings: "$1,200", topics: "Real-world business intuition helps a lot" },
  { name: "CLEP College Mathematics",              units: 5, savings: "$2,400", topics: "Broader but shallower than College Algebra" },
  { name: "CLEP American Government",              units: 5, savings: "$1,200", topics: "High school civics goes far on this exam" },
  { name: "CLEP Principles of Management",         units: 5, savings: "$1,200", topics: "Common sense management + key theorists" },
  { name: "CLEP College Algebra",                  units: 5, savings: "$1,200", topics: "Equations, inequalities, functions, graphing" },
];

const testimonials = [
  {
    quote: "I finally understood the causes of the French Revolution instead of just memorizing them. Walked into the AP World exam feeling actually prepared.",
    name: "Sofia R.",
    initials: "SR",
    avatarColor: "bg-blue-500/20 text-blue-500",
    location: "Grade 11, California",
    context: "AP World History",
    metric: "62% ←’ 89% unit mastery",
    timeline: "30 min/day for 4 weeks",
    stars: 5,
  },
  {
    quote: "Sage explained limits better in 5 minutes than my teacher did all semester. My calc grade went from a D to a B in one month.",
    name: "Marcus T.",
    initials: "MT",
    avatarColor: "bg-blue-500/20 text-blue-500",
    location: "Grade 12, Texas",
    context: "AP Calculus AB",
    metric: "D ←’ B in one marking period",
    timeline: "3 weeks with Sage",
    stars: 5,
  },
  {
    quote: "I passed CLEP College Algebra on my first try. Sage drilled me on every weak unit and I walked in knowing exactly where I stood. Saved me $1,200 and a full semester.",
    name: "Jordan M.",
    initials: "JM",
    avatarColor: "bg-emerald-500/20 text-emerald-800 dark:text-emerald-400",
    location: "Sophomore, Florida",
    context: "CLEP College Algebra",
    metric: "Passed first attempt (scored 62, need 50)",
    timeline: "~25 hours over 6 weeks",
    stars: 4,
  },
];

// Cold-start defense (Beta 8.0 hotfix #3): see pricing/page.tsx — same fix.
async function safeFlag(p: () => Promise<boolean>, fallback: boolean): Promise<boolean> {
  try { return await p(); } catch { return fallback; }
}

export default async function LandingPage() {
  const [clepOn, dsstOn] = await Promise.all([
    safeFlag(isClepEnabled, false),
    safeFlag(isDsstEnabled, false),
  ]);
  const examLabel = getExamLabel(clepOn, dsstOn);
  const courseCount = getCourseCount(clepOn, dsstOn);

  const visibleTestimonials = testimonials.filter((t) => {
    if (!clepOn && t.context.startsWith("CLEP")) return false;
    return true;
  });

  const moduleCards = [
    { href: "/ap-prep", color: "indigo", icon: BookOpen, label: "AP Courses", count: "10 courses", desc: "Score a 5. Get into your dream school.", cta: "Explore AP Prep" },
    { href: "/sat-prep", color: "blue", icon: BookOpen, label: "SAT Prep", count: "2 sections", desc: "Raise your SAT score with targeted practice.", cta: "Explore SAT Prep" },
    { href: "/act-prep", color: "violet", icon: BookOpen, label: "ACT Prep", count: "4 sections", desc: "Boost your composite with section-specific AI.", cta: "Explore ACT Prep" },
    ...(clepOn ? [{ href: "/clep-prep", color: "emerald", icon: GraduationCap, label: "CLEP Prep", count: "34 exams", desc: "Pass in 7 days. Save $1,200+ per exam.", cta: "Build My 7-Day Plan", badge: "Most Popular" }] : []),
    ...(dsstOn ? [{ href: "/dsst-prep", color: "orange", icon: GraduationCap, label: "DSST Prep", count: "22 exams", desc: "Skip intro courses. Save $1,000+ per exam.", cta: "Explore DSST Prep" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* AP Season urgency banner — auto-hides after 2026-05-17. Conversion
          lever for the May 5-16 exam window. */}
      <APSeasonBanner />

      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <div>
              <span className="text-lg font-bold">
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span>
              </span>
              <p className="text-xs text-muted-foreground leading-none hidden sm:block">Study Smarter. Score Higher.</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#courses" className="lg:hidden text-sm text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </a>
            <a href="#how-it-works" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <Link href="/ap-prep" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              AP
            </Link>
            <Link href="/sat-prep" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              SAT
            </Link>
            <Link href="/act-prep" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              ACT
            </Link>
            {clepOn && (
              <Link href="/clep-prep" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                CLEP
              </Link>
            )}
            {dsstOn && (
              <Link href="/dsst-prep" className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
                DSST
              </Link>
            )}
            <Link href="/pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register?track=ap">
              <Button>Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — two-column: text left, product mockup right */}
      <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-blue-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left — text */}
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-white/10 dark:bg-white/10 text-white dark:text-white border-white/20 text-sm px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Free forever · {courseCount} courses · No credit card
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-bold tracking-tight mb-4">
                <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span>
              </h1>
              <p className="text-xl sm:text-2xl font-semibold text-foreground/90 mb-2">
                Improve your {examLabel} scores — with AI that adapts to your weak areas.
              </p>
              <p className="text-lg text-muted-foreground mb-2 max-w-xl mx-auto lg:mx-0">
                Stop guessing what to study. See real score improvement in weeks, not months.
              </p>
              <p className="text-base text-muted-foreground/80 mb-4 max-w-xl mx-auto lg:mx-0">
                Take a free diagnostic. Get a personalized study plan. Practice with AI that explains every mistake.
              </p>
              {/* PRIMARY CTA: Am I Ready picker — 3-min no-signup readiness check */}
              <HeroReadinessPicker />

              {/* Secondary CTA row — direct signup for users who want the full product */}
              <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center">
                <span className="text-sm text-muted-foreground">Ready for the full experience?</span>
                <div className="flex gap-2">
                  <Link href="/register?track=ap" className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 text-sm">AP</Link>
                  <span className="text-muted-foreground">·</span>
                  <Link href="/register?track=sat" className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 text-sm">SAT</Link>
                  <span className="text-muted-foreground">·</span>
                  <Link href="/register?track=act" className="text-primary hover:text-primary/80 font-medium underline underline-offset-4 text-sm">ACT</Link>
                </div>
                {clepOn && (
                  <>
                    <span className="hidden sm:inline text-muted-foreground">|</span>
                    <Link href="/register?track=clep" className="text-emerald-600 dark:text-emerald-700 dark:text-emerald-400 hover:underline font-medium text-sm">Pass CLEP in 7 days ←’</Link>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> No credit card required</span>
                <span className="hidden sm:inline text-border">|</span>
                <span className="hidden sm:flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> 7-day refund policy</span>
              </div>
              <div className="mt-3">
                <SocialProofBadge variant="compact" metric="students" />
              </div>
            </div>

            {/* Right — product mockup */}
            <div className="hidden lg:block animate-float">
              <BrowserFrame title="StudentNest Prep · Analytics" className="shadow-2xl shadow-blue-500/10">
                <MockupAnalytics />
              </BrowserFrame>
            </div>
            {/* Mobile mockup — no float, compact */}
            <div className="lg:hidden max-w-md mx-auto w-full">
              <BrowserFrame title="StudentNest Prep · Analytics">
                <MockupAnalytics />
              </BrowserFrame>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Module Cards */}
      <section id="courses" className="py-8 px-4 scroll-mt-20">
        <FadeIn>
        <div className={`max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 ${moduleCards.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
          {moduleCards.map((m: { href: string; color: string; icon: typeof BookOpen; label: string; count: string; desc: string; cta: string; badge?: string }) => (
            <Link key={m.href} href={m.href} className={`relative p-5 rounded-2xl border border-${m.color}-500/30 bg-${m.color}-500/5 hover:bg-${m.color}-500/10 transition-colors block`}>
              {m.badge && (
                <span className={`absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-${m.color}-600 text-white text-[10px] font-semibold`}>{m.badge}</span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 text-${m.color}-400`} />
                <span className={`text-xs font-semibold text-${m.color}-400 uppercase tracking-wide`}>{m.label}</span>
              </div>
              <p className="text-sm font-bold mb-1">{m.desc}</p>
              <p className={`text-xs text-${m.color}-400 font-medium mb-3`}>{m.count}</p>
              <span className={`text-xs font-medium text-${m.color}-400 flex items-center gap-1`}>
                {m.cta} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
        </FadeIn>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y border-border/40 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: "🎯", stat: `${courseCount} courses covered`, sub: examLabel },
              ...(clepOn ? [{ icon: "💰", stat: "$1,200+ saved per CLEP exam", sub: "Skip courses, keep the credit" }] : [{ icon: "📚", stat: "Exam-aligned AI", sub: "Questions match real exam formats" }]),
              { icon: "🔥", stat: "8 engagement features", sub: "Stay motivated daily" },
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
      <section className="py-24 bg-gradient-to-b from-blue-950/20 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" /> Study Smarter. Score Higher.
          </div>
          <h2 className="text-4xl font-bold mb-4">Meet Sage 🌿</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Sage is your personal Sage Live Tutor — available 24/7, never judges, and always explains in a way that clicks.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Ask Sage Anything",
                desc: "Get step-by-step explanations of any concept — then Sage quizzes you back with 3 targeted questions to lock in what you just learned.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: Zap,
                title: "Practice Agent",
                desc: "The practice engine auto-generates exam-aligned questions, tracks every answer, and targets your weakest units to maximize improvement.",
                color: "text-yellow-600 dark:text-yellow-700 dark:text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              // NEW 2026-04-25: Sage Coach was missing from landing surface — only
              // mentioned on /about. Real differentiator (voice oral practice) was
              // invisible to 92% of new users (last-48-users.mjs funnel).
              {
                icon: Sparkles,
                title: "Sage Coach (Voice)",
                desc: "Talk through what you know in plain English. Sage Coach listens, scores your understanding, and tells you exactly what to study next — like a private tutor on call.",
                color: "text-violet-600 dark:text-violet-700 dark:text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                icon: BarChart3,
                title: "Progress Agent",
                desc: "Mastery scores update after every question. See unit-by-unit heatmaps and get a personalized study plan targeting your weak areas.",
                color: "text-emerald-700 dark:text-emerald-700 dark:text-emerald-400",
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

      {/* Interactive MCQ Demo */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
            Try it yourself — no sign-up needed
          </p>
          <p className="text-center text-xs text-muted-foreground mb-6">
            Answer a real AP World History question and see how Sage explains it
          </p>
          <InteractiveDemo />
        </div>
      </section>

      {/* Product Demo — Sage conversation snippet */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wide">
            This is Sage — your 24/7 AI study tutor
          </p>
          <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden shadow-xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/40">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 text-xs text-muted-foreground">StudentNest Prep · Tutor</span>
            </div>
            {/* Chat */}
            <div className="p-5 space-y-4 text-sm">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-foreground/90">Why did the French Revolution happen?</p>
                </div>
              </div>
              {/* Sage response */}
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div className="bg-secondary/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] space-y-1.5">
                  <p className="font-semibold text-xs text-blue-500 mb-1">Sage</p>
                  <p className="text-foreground/80 leading-relaxed">
                    The French Revolution (1789) had three main causes: <strong>financial crisis</strong> from war debt, <strong>social inequality</strong> under the Estates system where the Third Estate bore heavy taxes, and <strong>Enlightenment ideas</strong> about liberty and popular sovereignty.
                  </p>
                  <p className="text-foreground/80">The immediate trigger was a bread shortage — food prices spiked after crop failures, pushing the already-desperate commoners to revolt.</p>
                </div>
              </div>
              {/* Follow-up chips */}
              <div className="pl-11 flex flex-wrap gap-2">
                {["What was the Estates system?", "How did Enlightenment ideas spread?"].map((q) => (
                  <span key={q} className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 cursor-default">
                    {q}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo — Sage CLEP conversation snippet */}
      {clepOn && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wide">
              See how Sage helps CLEP students too
            </p>
            <div className="rounded-2xl border border-emerald-500/30 bg-card/60 overflow-hidden shadow-xl">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-secondary/40">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs text-muted-foreground">StudentNest Prep · Tutor — CLEP College Algebra</span>
              </div>
              {/* Chat */}
              <div className="p-5 space-y-4 text-sm">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-emerald-600/20 border border-emerald-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    <p className="text-foreground/90">I don&apos;t understand how to factor trinomials like xÂ² + 5x + 6</p>
                  </div>
                </div>
                {/* Sage response */}
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div className="bg-secondary/60 border border-border/40 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] space-y-1.5">
                    <p className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 mb-1">Sage</p>
                    <p className="text-foreground/80 leading-relaxed">
                      To factor <strong>xÂ² + 5x + 6</strong>, find two numbers that <strong>multiply to 6</strong> and <strong>add to 5</strong>. Those numbers are 2 and 3.
                    </p>
                    <p className="text-foreground/80">So xÂ² + 5x + 6 = <strong>(x + 2)(x + 3)</strong> âœ“</p>
                    <p className="text-foreground/80 text-xs mt-1 text-muted-foreground">This is a common CLEP College Algebra topic — Unit 2: Algebraic Expressions.</p>
                  </div>
                </div>
                {/* Follow-up chips */}
                <div className="pl-11 flex flex-wrap gap-2">
                  {["What about negative terms?", "Show me a harder example"].map((q) => (
                    <span key={q} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 cursor-default">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Knowledge Check callout */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto text-center space-y-3 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 font-medium">
            <Sparkles className="h-3.5 w-3.5" /> What makes us different
          </div>
          <h2 className="text-2xl font-bold">Most Sage Live Tutors explain. Sage tests you back.</h2>
          <p className="text-muted-foreground">
            After every answer, Sage offers a quick 3-question comprehension check — optional, instant, and built around exactly what it just taught you.
            Your score builds your Comprehension % on the Analytics page. Active recall at zero extra effort.
          </p>
        </div>
      </section>

      {/* Features — alternating text + product mockups */}
      <section id="how-it-works" className="py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-3">Everything You Need to Score Higher</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built around how {examLabel} exams actually work — not generic quiz apps.</p>
          </div>

          <div className="space-y-24">
            {/* Row 1: text left, study plan right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">Your AI builds a study plan around your weak areas</h3>
                <p className="text-muted-foreground leading-relaxed">
                  After your first few practice sessions, Sage identifies which units need work and creates a prioritized weekly plan. It updates as you improve &mdash; so you never waste time on what you already know.
                </p>
              </div>
              <div>
                <BrowserFrame title="StudentNest Prep · Study Plan" className="shadow-xl">
                  <MockupStudyPlan />
                </BrowserFrame>
              </div>
            </div>

            {/* Row 2: practice left, text right (flipped) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="lg:order-2 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold">Practice questions that target what you don&apos;t know</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every question is exam-aligned and adapts to your performance. Get it wrong? Sage explains the concept and why each distractor is a common mistake &mdash; not just &ldquo;the answer is B.&rdquo;
                </p>
              </div>
              <div className="lg:order-1">
                <BrowserFrame title="StudentNest Prep · Practice" className="shadow-xl">
                  <MockupPractice />
                </BrowserFrame>
              </div>
            </div>

            {/* Row 3: text left, analytics right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">Watch your mastery grow, unit by unit</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track accuracy trends, streaks, and per-unit mastery scores in real time. Color-coded progress bars make it obvious where you&apos;re strong and where to focus next.
                </p>
              </div>
              <div>
                <BrowserFrame title="StudentNest Prep · Analytics" className="shadow-xl">
                  <MockupAnalytics />
                </BrowserFrame>
              </div>
            </div>
          </div>

          {/* Engagement row — compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-16">
            {[
              { emoji: "🔥", label: "Daily Streaks" },
              { emoji: "📅", label: "Exam Countdown" },
              { emoji: "🎯", label: "Daily Goals" },
              { emoji: "🃏", label: "Spaced Repetition" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 p-3 rounded-lg border border-border/40 bg-card/50">
                <span className="text-lg">{f.emoji}</span>
                <span className="text-xs font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase — full workflow */}
      <ProductShowcase />

      {/* Why StudentNest — Comparison Table */}
      <section className="py-16 bg-secondary/20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8 space-y-3">
            <h2 className="text-2xl font-bold mb-2">Why StudentNest Prep?</h2>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ChatGPT gives random answers. StudentNest Prep gives structured, exam-aligned practice with mastery tracking — that&apos;s the difference between studying and actually improving. Premium prep courses charge $200–500. Private tutors cost $50–150/hr. StudentNest starts at $0 and does what both do: explains mistakes, tracks progress, and builds a plan around your weak areas.
            </p>
          </div>
          <div className="rounded-xl border border-border/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Feature</th>
                  <th className="text-center p-3 font-medium text-blue-500">StudentNest Prep</th>
                  <th className="text-center p-3 font-medium">ChatGPT / AI</th>
                  <th className="text-center p-3 font-medium">Private Tutor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["AI study plan by unit", true, false, false],
                  ["Exam-aligned questions", true, false, "varies"],
                  ["Instant feedback + explanations", true, true, "slow"],
                  ["Mastery tracking by topic", true, false, false],
                  ...(clepOn ? [["CLEP college credit prep", true, false, "rare"]] : []),
                  ["Available 24/7", true, true, false],
                  ["Cost", "$9.99/mo", "Free–$20/mo", "$50–150/hr"],
                ].map(([feature, sn, ai, tutor], i) => (
                  <tr key={i} className="hover:bg-secondary/30">
                    <td className="p-3 text-foreground/90">{feature as string}</td>
                    <td className="p-3 text-center">
                      {sn === true ? <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 mx-auto" /> : <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{sn as string}</span>}
                    </td>
                    <td className="p-3 text-center">
                      {ai === true ? <CheckCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" /> : ai === false ? <span className="text-muted-foreground/40">—</span> : <span className="text-xs text-muted-foreground">{ai as string}</span>}
                    </td>
                    <td className="p-3 text-center">
                      {tutor === true ? <CheckCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" /> : tutor === false ? <span className="text-muted-foreground/40">—</span> : <span className="text-xs text-muted-foreground">{tutor as string}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Curriculum Coverage — AP / SAT / ACT */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Complete Curriculum Coverage</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Every unit across 10 AP courses, SAT, and ACT — hundreds of exam-aligned questions per unit, free for every student.
              </p>
              <Link href="/register?track=ap">
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
                  <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{course.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({course.units} units)</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{course.topics}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLEP Section — College Credit */}
      {clepOn && <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
              <GraduationCap className="h-4 w-4" /> College Credit
            </div>
            <h2 className="text-4xl font-bold mb-3">Earn College Credit Faster — Save Thousands</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pass CLEP exams and skip introductory college courses. One exam. One passing score. Up to $2,400 in tuition savings.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-2 max-w-xl mx-auto">
              CLEP® exams cost $93 each. StudentNest Prep prepares you with the same AI-powered practice and tutoring used for AP — optimized for CLEP content.
            </p>
          </div>

          {/* CLEP Exam Details */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto text-center">
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-card/50">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Passing Score</p>
              <p className="text-xs text-muted-foreground mt-1">Scaled score of 50 (roughly 50–60% correct answers)</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-card/50">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Average Prep Time</p>
              <p className="text-xs text-muted-foreground mt-1">20–40 hours per exam, depending on prior familiarity</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-500/15 bg-card/50">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Exam Format</p>
              <p className="text-xs text-muted-foreground mt-1">90–120 minutes, all multiple choice for most exams</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {clepCourses.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.units} units</p>
                    <p className="text-[11px] text-muted-foreground">{c.topics}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap">
                  Save {c.savings}
                </span>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10 max-w-3xl mx-auto">
            {[
              { icon: "💰", title: "99% Savings", desc: "Pay $93 for an exam. Skip a $1,200 college course." },
              { icon: "â±ï¸", title: "Faster Graduation", desc: "Earn up to 30 credits before your first class." },
              { icon: "🤖", title: "Same Sage Live Tutor", desc: "Sage explains CLEP topics with the same depth as AP." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center p-5 rounded-xl border border-emerald-500/15 bg-card/50">
                <span className="text-3xl mb-3 block">{icon}</span>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?track=clep">
              <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
                Start CLEP Prep Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                Learn More About CLEP
              </Button>
            </Link>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
            CLEP® is a registered trademark of College Board, which is not affiliated with, and does not endorse, this product.
            All practice questions are original AI-generated content — not reproduced from any official exam.
          </p>
        </div>
      </section>}

      {/* DSST Section — College Credit */}
      {dsstOn && <section className="py-20 bg-gradient-to-b from-transparent via-orange-500/[0.03] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-sm font-medium mb-4">
              <GraduationCap className="h-4 w-4" /> DSST Exams
            </div>
            <h2 className="text-4xl font-bold mb-3">Skip Intro Courses with DSST</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              22 DSST exams across 6 domains — Business, Social Sciences, Humanities, STEM, English, and History. $85 per exam. Accepted at 1,900+ colleges.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
            {[
              { name: "Principles of Supervision", tip: "Easiest DSST — highest pass rate" },
              { name: "Introduction to Business", tip: "Broad but shallow — intuitive content" },
              { name: "Organizational Behavior", tip: "Leadership theories + motivation" },
              { name: "Personal Finance", tip: "Real-world knowledge helps a lot" },
              { name: "Ethics in America", tip: "Moral reasoning — less memorization" },
              { name: "Environmental Science", tip: "Ecosystems + policy — practical" },
              { name: "Technical Writing", tip: "Most practical DSST exam" },
              { name: "Lifespan Developmental Psychology", tip: "Overlaps with AP/CLEP Psych" },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                <CheckCircle className="h-5 w-5 text-orange-700 dark:text-orange-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.tip}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?module=dsst">
              <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
                Start DSST Prep Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dsst-prep">
              <Button size="lg" variant="outline" className="gap-2 border-orange-500/30 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10">
                View All 22 DSST Exams
              </Button>
            </Link>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
            DSST® is a registered trademark of Prometric, which is not affiliated with, and does not endorse, this product.
            All practice questions are original AI-generated content.
          </p>
        </div>
      </section>}

      {/* Free vs AP Premium vs CLEP Premium */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">What Do You Actually Get?</h2>
            <p className="text-muted-foreground text-sm">Free is genuinely useful. Premium unlocks the full engine — pick your track.</p>
          </div>
          <div className={`grid ${clepOn ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
            {/* Free column */}
            <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base font-bold">Free</span>
                <span className="text-xl font-bold text-muted-foreground">$0</span>
                <span className="text-xs text-muted-foreground">/ forever</span>
              </div>
              {[
                `All ${courseCount} courses — ${examLabel}`,
                // Beta 9.1.2 (2026-04-29) — aligned to FREE_LIMITS source
                // of truth in src/lib/tier-limits.ts. Was incorrectly
                // saying "3 practice sessions/day" + "5 Sage chats/day"
                // — actual caps are 30 Qs/day + 3 Sage chats/day + 1 free
                // FRQ per type per course.
                "30 practice questions per day",
                "3 Sage Live Tutor chats per day",
                "1 free FRQ attempt per type, per course (DBQ, LEQ, SAQ)",
                "Basic study plan",
                "Per-unit mastery analytics",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <div className="pt-3">
                <Link href="/register?track=ap">
                  <Button variant="outline" className="w-full">Start Free</Button>
                </Link>
              </div>
            </div>
            {/* AP Premium column */}
            <div className="rounded-xl border border-blue-500/40 bg-blue-500/5 p-6 space-y-3 relative">
              <div className="absolute -top-3 right-4">
                <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-400 font-medium">AP / SAT / ACT</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold">AP Premium</span>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-400">$9.99</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">or $79.99/yr — save 33%</p>
              <p className="text-xs text-muted-foreground mb-3">Less than a single hour of tutoring</p>
              {[
                "Everything in Free, plus:",
                "Unlimited Sage Live Tutor chats",
                "FRQ with AI rubric scoring",
                "Personalized AP study plan",
                "Streaming AI responses",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <div className="pt-3">
                <Link href="/register?track=ap">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Upgrade AP Premium</Button>
                </Link>
              </div>
            </div>
            {/* CLEP Premium column */}
            {clepOn && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-6 space-y-3 relative">
              <div className="absolute -top-3 right-4">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">CLEP</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold">CLEP Premium</span>
                <span className="text-xl font-bold text-emerald-300">$9.99</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">or $79.99/yr — save 33%</p>
              <p className="text-xs text-muted-foreground mb-3">Less than a single hour of tutoring</p>
              {[
                "Everything in Free, plus:",
                "All 34 CLEP courses (earn college credit)",
                "Unlimited Sage Live Tutor chats",
                "Personalized CLEP study plan",
                "Streaming AI responses",
                "Save $1,200+ per exam passed",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <div className="pt-3">
                <Link href="/register?track=clep">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">Upgrade CLEP Premium</Button>
                </Link>
              </div>
            </div>}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">
            <Link href="/pricing" className="text-blue-500 hover:underline">See full pricing details ←’</Link>
          </p>
        </div>
      </section>

      {/* Testimonials — 3 cards */}
      <section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Student Feedback</h2>
            <p className="text-muted-foreground text-sm">Real results from students using StudentNest Prep</p>
          </div>
          <div className={`grid ${visibleTestimonials.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
            {visibleTestimonials.map((t) => (
              <FadeIn key={t.name}>
                <div className="p-6 rounded-xl border border-border/40 bg-card/50 card-glow space-y-4 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[...Array(t.stars)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-700 dark:text-yellow-400 fill-yellow-400" />
                      ))}
                      {[...Array(5 - t.stars)].map((_, i) => (
                        <Star key={`e${i}`} className="h-4 w-4 text-muted-foreground/30" />
                      ))}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <blockquote className="text-sm text-foreground/90 italic leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{t.metric}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground">{t.timeline}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${t.avatarColor} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location} · {t.context}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* For Parents */}
      <section id="parents" className="py-16 bg-secondary/20 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-2">For Parents</p>
            <h2 className="text-3xl font-bold mb-3">You want to see your child succeed. So do we.</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A typical AP student needs 8–12 weeks of focused practice before exam day. With a private tutor at $50/hr twice a week, that&apos;s $800–$1,200. StudentNest Prep Premium covers the same period for about $20 total. Your child gets adaptive practice and AI explanations, and you get visibility into their actual progress: which units they&apos;ve mastered, where they&apos;re struggling, how many days they&apos;ve studied this week, and whether their accuracy is trending up.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, title: "Track Progress", desc: "See mastery scores by unit, accuracy trends, and study streaks — all in real time." },
              { icon: Target, title: "Identify Weak Areas", desc: "Know exactly which topics need work, so study time is never wasted." },
              { icon: GraduationCap, title: "Curriculum-Aligned", desc: clepOn ? "Every question aligns with College Board AP standards and official CLEP exam outlines." : "Every question aligns with College Board AP standards and official exam outlines." },
              { icon: Clock, title: "Affordable Prep", desc: "$9.99/mo — less than one hour of private tutoring. Free tier available for every student." },
            ].map((item) => (
              <div key={item.title} className="p-5 rounded-xl border border-border/40 bg-card/50 text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto">
                  <item.icon className="h-5 w-5 text-blue-500" />
                </div>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <LandingFaq clepEnabled={clepOn} dsstEnabled={dsstOn} />

      {/* Final CTA */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-blue-950/30 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to prepare for the exam that changes everything?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            {clepOn || dsstOn
              ? <>Whether you&apos;re a high schooler aiming for a 5, or a college student saving thousands{clepOn && <> with CLEP</>}{dsstOn && <>{clepOn ? " and" : " with"} DSST</>} — StudentNest is free to start, and Sage is ready to teach.</>
              : <>Whether you&apos;re aiming for a 5 on AP exams, a top SAT score, or a strong ACT composite — StudentNest is free to start, and Sage is ready to teach.</>
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?track=ap">
              <Button size="lg" className="gap-2 text-base px-10 h-12 bg-blue-600 hover:bg-blue-700 text-white">
                Start AP/SAT/ACT Prep Free
              </Button>
            </Link>
            {clepOn && (
              <Link href="/register?track=clep">
                <Button size="lg" variant="outline" className="text-base px-10 h-12 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                  Start CLEP Prep Free
                </Button>
              </Link>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Free forever · Premium from $6.67/mo (annual) or $9.99/mo ·{" "}
            <Link href="/pricing" className="text-blue-500 hover:underline">See full pricing</Link>
          </p>
        </div>
      </section>

      {/* Footer — 4-column */}
      <footer className="border-t border-border/40 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Col 1: Brand */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <span className="font-semibold"><span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-600 dark:text-blue-700 dark:text-blue-400 font-normal text-[0.6em] ml-1">Prep</span></span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-powered exam prep for {examLabel}. Free to start.
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <Shield className="h-3.5 w-3.5" /> No credit card required
              </div>
            </div>
            {/* Col 2: Exam Prep */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Exam Prep</p>
              <div className="space-y-2 text-sm">
                <Link href="/ap-prep" className="block text-muted-foreground hover:text-foreground transition-colors">AP Courses</Link>
                <Link href="/sat-prep" className="block text-muted-foreground hover:text-foreground transition-colors">SAT Prep</Link>
                <Link href="/act-prep" className="block text-muted-foreground hover:text-foreground transition-colors">ACT Prep</Link>
                {clepOn && <Link href="/clep-prep" className="block text-muted-foreground hover:text-foreground transition-colors">CLEP Prep</Link>}
                {dsstOn && <Link href="/dsst-prep" className="block text-muted-foreground hover:text-foreground transition-colors">DSST Prep</Link>}
              </div>
            </div>
            {/* Col 3: Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</p>
              <div className="space-y-2 text-sm">
                <Link href="/register" className="block text-muted-foreground hover:text-foreground transition-colors">Sign Up Free</Link>
                <Link href="/login" className="block text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                <Link href="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>
            {/* Col 4: Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company</p>
              <div className="space-y-2 text-sm">
                <Link href="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
                <Link href="/blog" className="block text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
                <Link href="/faq" className="block text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                <Link href="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
                <Link href="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} StudentNest Prep. Study Smarter. Score Higher..
            </p>
            <p className="text-[11px] text-muted-foreground text-center sm:text-right max-w-lg">
              AP&reg; and SAT&reg; are trademarks of the College Board. ACT&reg; is a trademark of ACT, Inc.
              Neither organization is affiliated with or endorses StudentNest.
            </p>
          </div>
        </div>
      </footer>

      <SageChat />
      <MobileStickyCta />
    </div>
  );
}

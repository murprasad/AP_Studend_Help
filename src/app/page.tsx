import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  BarChart3,
  MessageSquare,
  Zap,
  CheckCircle,
  XCircle,
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
import { getExamLabel, getCourseCount, getVisibleCourses } from "@/lib/settings";
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
    title: "Sage tutor — clear explanations, instant comprehension checks",
    description: "Ask anything. Get clear explanations grounded in the College Board curriculum, plus knowledge-check follow-ups that prove you understood it.",
  },
];

// Each entry tagged with its ApCourse enum so the server can filter by
// the bank-quality visibility allowlist (visible_courses SiteSetting).
// Added 2026-05-02: AP Environmental Science, Human Geography, US Gov,
// Precalculus — all of which were already in the platform but never on
// the marketing surface. Those four PLUS Chemistry, CSP, Psychology,
// ACT English are the courses with vetted question banks today.
const courses = [
  { enum: "AP_WORLD_HISTORY",                 name: "AP World History: Modern",       units: 9,  topics: "Civilizations, empires, revolutions, globalization" },
  { enum: "AP_COMPUTER_SCIENCE_PRINCIPLES",   name: "AP Computer Science Principles", units: 5,  topics: "Algorithms, data, internet, impact of computing" },
  { enum: "AP_PHYSICS_1",                     name: "AP Physics 1: Algebra-Based",    units: 8,  topics: "Kinematics, forces, energy, momentum, rotation, oscillations, fluids" },
  { enum: "AP_CALCULUS_AB",                   name: "AP Calculus AB",                 units: 8,  topics: "Limits, derivatives, integrals, differential equations" },
  { enum: "AP_CALCULUS_BC",                   name: "AP Calculus BC",                 units: 10, topics: "All AB topics plus series, parametric, polar" },
  { enum: "AP_STATISTICS",                    name: "AP Statistics",                  units: 9,  topics: "Data analysis, probability, inference, regression" },
  { enum: "AP_CHEMISTRY",                     name: "AP Chemistry",                   units: 9,  topics: "Atomic structure, bonding, reactions, thermodynamics" },
  { enum: "AP_BIOLOGY",                       name: "AP Biology",                     units: 8,  topics: "Cells, genetics, evolution, ecology, physiology" },
  { enum: "AP_US_HISTORY",                    name: "AP US History",                  units: 9,  topics: "Colonial era through modern America" },
  { enum: "AP_PSYCHOLOGY",                    name: "AP Psychology",                  units: 5,  topics: "Biological bases, cognition, development & learning, social psychology, mental & physical health" },
  { enum: "AP_ENVIRONMENTAL_SCIENCE",         name: "AP Environmental Science",       units: 9,  topics: "Ecosystems, biodiversity, populations, pollution, sustainability" },
  { enum: "AP_HUMAN_GEOGRAPHY",               name: "AP Human Geography",             units: 7,  topics: "Population, migration, culture, agriculture, cities, development" },
  { enum: "AP_US_GOVERNMENT",                 name: "AP US Government & Politics",    units: 5,  topics: "Constitutional foundations, branches, civil liberties, ideology, participation" },
  { enum: "AP_PRECALCULUS",                   name: "AP Precalculus",                 units: 4,  topics: "Polynomial & rational, exp & log, trig & polar, functions" },
  { enum: "SAT_MATH",                         name: "SAT Math",                       units: 4,  topics: "Algebra, geometry, data analysis, advanced math" },
  { enum: "SAT_READING_WRITING",              name: "SAT Reading & Writing",          units: 4,  topics: "Passages, evidence-based reasoning, grammar" },
  { enum: "ACT_MATH",                         name: "ACT Math",                       units: 5,  topics: "Pre-algebra through trigonometry, 5-choice format" },
  { enum: "ACT_ENGLISH",                      name: "ACT English",                    units: 3,  topics: "Grammar, sentence structure, rhetorical skills" },
  { enum: "ACT_SCIENCE",                      name: "ACT Science",                    units: 3,  topics: "Data interpretation, research summaries" },
  { enum: "ACT_READING",                      name: "ACT Reading",                    units: 4,  topics: "Literary, social science, humanities passages" },
];

// Empty stub — CLEP/DSST removed from StudentNest 2026-05-03 (live on PrepLion).
// Kept as `[]` so the dead `{clepOn && <section>...{clepCourses.map(...)}` JSX
// type-checks; bundler strips the whole block since clepOn=false at compile.
const clepCourses: { name: string; units: number; savings: string; topics: string }[] = [];

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
];

// Cold-start defense (Beta 8.0 hotfix #3): see pricing/page.tsx — same fix.
async function safeFlag(p: () => Promise<boolean>, fallback: boolean): Promise<boolean> {
  try { return await p(); } catch { return fallback; }
}

export default async function LandingPage() {
  // CLEP/DSST removed from StudentNest 2026-05-03 — those products live on PrepLion.
  // Flags are constants now; existing {clepOn && ...} JSX dead-code-elims at build.
  const clepOn = false;
  const dsstOn = false;
  const visibleCoursesAllowlist = await getVisibleCourses().catch(() => "all" as const);
  const examLabel = getExamLabel(clepOn, dsstOn);
  const courseCount = getCourseCount(clepOn, dsstOn);

  // Apply bank-quality visibility filter (added 2026-05-02). When the
  // visible_courses SiteSetting allowlist is populated, hide any course
  // not in it from the marketing surface — same source-of-truth as the
  // sidebar/practice API. This is the "don't lie to prospects" gate:
  // we only advertise courses we can actually serve at CB quality.
  const visibleCourses = visibleCoursesAllowlist === "all"
    ? courses
    : courses.filter((c) => visibleCoursesAllowlist.includes(c.enum));

  const visibleTestimonials = testimonials;

  // Compute live counts per family from the visibility allowlist so the
  // module cards never advertise a course we can't actually serve. When
  // a family hits zero visible courses, drop the module card entirely.
  const apVisibleCount = visibleCourses.filter((c) => c.enum.startsWith("AP_")).length;
  const satVisibleCount = visibleCourses.filter((c) => c.enum.startsWith("SAT_")).length;
  const actVisibleCount = visibleCourses.filter((c) => c.enum.startsWith("ACT_")).length;

  // 2026-05-03 hotfix — replace dynamic Tailwind class concat (`border-${m.color}-500/30`)
  // with static class strings. The runtime template can't be JIT-purged statically,
  // so the dynamic version produced UNSTYLED cards in production. (FMEA F03, RPN 125.)
  const moduleCards = [
    ...(apVisibleCount > 0 ? [{
      href: "/ap-prep", icon: BookOpen, label: "AP Courses",
      count: `${apVisibleCount} courses`,
      desc: "Score a 5. Get into your dream school.",
      cta: "Explore AP Prep",
      classes: {
        card: "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
        badge: "bg-indigo-600",
        icon: "text-indigo-400",
        label: "text-indigo-400",
        count: "text-indigo-400",
      },
    }] : []),
    ...(satVisibleCount > 0 ? [{
      href: "/sat-prep", icon: BookOpen, label: "SAT Prep",
      count: `${satVisibleCount} section${satVisibleCount === 1 ? "" : "s"}`,
      desc: "Raise your SAT score with targeted practice.",
      cta: "Explore SAT Prep",
      classes: {
        card: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
        badge: "bg-blue-600",
        icon: "text-blue-400",
        label: "text-blue-400",
        count: "text-blue-400",
      },
    }] : []),
    ...(actVisibleCount > 0 ? [{
      href: "/act-prep", icon: BookOpen, label: "ACT Prep",
      count: `${actVisibleCount} section${actVisibleCount === 1 ? "" : "s"}`,
      desc: "Boost your composite with section-specific practice.",
      cta: "Explore ACT Prep",
      classes: {
        card: "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10",
        badge: "bg-violet-600",
        icon: "text-violet-400",
        label: "text-violet-400",
        count: "text-violet-400",
      },
    }] : []),
    // CLEP and DSST never appear on StudentNest — they live on PrepLion.
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
            <Link href="/ap-prep" prefetch={false} className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              AP
            </Link>
            <Link href="/sat-prep" prefetch={false} className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              SAT
            </Link>
            <Link href="/act-prep" prefetch={false} className="hidden lg:block text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <Link href="/pricing" prefetch={false} className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/login" prefetch={false}>
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register?track=ap" prefetch={false}>
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
              {/* PAIN-FIRST hero — replaces generic SaaS copy 2026-05-02 LATE.
                  Pain → specific 5-min resolution → anti-chatbot line. */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight mb-3 leading-[1.05]">
                Find out exactly what's missing<span className="text-foreground/60"> —</span><br />
                <span className="text-blue-600 dark:text-blue-400">before exam day.</span>
              </h1>
              <p className="text-lg sm:text-xl text-foreground/80 mb-3 max-w-xl mx-auto lg:mx-0 leading-snug">
                5-minute diagnostic shows you the units you'd fail.
                <span className="block mt-0.5 text-foreground/60">Then we drill them — until you don't.</span>
              </p>
              <p className="text-sm text-muted-foreground/80 mb-5 max-w-xl mx-auto lg:mx-0 italic">
                Not another chatbot. We make you actually remember it.
              </p>
              {/* PRIMARY CTA: Am I Ready picker — 3-min no-signup readiness check */}
              <HeroReadinessPicker visibleCourses={visibleCoursesAllowlist === "all" ? null : visibleCoursesAllowlist} />

              <div className="mt-4 flex items-center gap-4 justify-center lg:justify-start text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> No signup needed</span>
                <span className="hidden sm:inline text-border">|</span>
                <span className="hidden sm:flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" /> Free forever — 7-day refund on Premium</span>
              </div>
              <div className="mt-3">
                <SocialProofBadge variant="compact" metric="students" />
              </div>
            </div>

            {/* Right — LIVE interactive product demo (replaced static
                MockupAnalytics 2026-05-02 LATE per ChatGPT design plan: hero
                must show the actual product wrong-answer flow, not a stock
                analytics screenshot). InteractiveDemo handles its own window
                chrome + animations + tension state. */}
            <div className="hidden lg:block">
              <InteractiveDemo />
            </div>
            <div className="lg:hidden max-w-md mx-auto w-full">
              <InteractiveDemo />
            </div>
          </div>
        </div>
      </section>

      {/* "Real student state" strip — Beta 11.0 (2026-05-03). Concrete dashboard
          preview directly under hero. Bridges promise → proof so the visitor
          doesn't have to imagine what the product will tell them. */}
      <section className="py-5 sm:py-6 bg-secondary/40 border-y border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
            Mid-session check
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-500/40 bg-red-500/10 text-xs">
              <span className="font-mono font-semibold text-red-700 dark:text-red-400">Unit 4</span>
              <span className="text-foreground/60">·</span>
              <span className="font-bold text-red-700 dark:text-red-400">41%</span>
              <span className="text-red-600">❌</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-xs">
              <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">Unit 5</span>
              <span className="text-foreground/60">·</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">63%</span>
              <span className="text-amber-600">⚠️</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs">
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">Unit 6</span>
              <span className="text-foreground/60">·</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">88%</span>
              <span className="text-emerald-600">✓</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground italic sm:ml-auto">
            This is what you&apos;ll see in 5 minutes.
          </span>
        </div>
      </section>

      {/* 3-min diagnostic CTA — added 2026-05-02 LATE per ChatGPT design plan.
          Above-fold action: progress bar + 5 question pips + outcome CTA. */}
      <section className="py-12 sm:py-14 border-y border-border/40 bg-secondary/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3">3-Minute Diagnostic</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight leading-[1.1]">
            We&apos;ll show you exactly{" "}
            <span className="text-foreground/60">what you know</span>,{" "}
            <span className="text-foreground/60">what you don&apos;t</span>, and{" "}
            <span className="text-blue-600 dark:text-blue-400">what to fix next.</span>
          </h2>
          <p className="text-muted-foreground text-base mb-7 max-w-xl mx-auto">
            No fluff. No signup. 3 minutes from &ldquo;I don&apos;t know what to study&rdquo; to a personalized plan.
          </p>
          <div className="max-w-md mx-auto mb-7">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span className="font-mono">Q 2 / 5</span>
              <span className="font-mono">2:14 left</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden mb-3">
              <div className="h-full bg-blue-500 w-[42%] transition-all" />
            </div>
            <div className="flex gap-1.5">
              {[true, true, false, false, false].map((on, i) => (
                <div
                  key={i}
                  className={`flex-1 h-9 rounded-md flex items-center justify-center text-xs font-mono transition-colors ${
                    on
                      ? "bg-blue-500/20 border border-blue-500/40 text-blue-700 dark:text-blue-300"
                      : "bg-secondary/30 border border-border/30 text-muted-foreground/60"
                  }`}
                >
                  Q{i + 1}
                </div>
              ))}
            </div>
          </div>
          <Link href="/journey">
            <Button size="lg" className="gap-2 text-base h-12 px-8">
              Start the diagnostic <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 4 Module Cards */}
      <section id="courses" className="py-8 px-4 scroll-mt-20">
        <FadeIn>
        <div className={`max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 ${moduleCards.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`}>
          {moduleCards.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              data-testid={`module-card-${m.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`relative p-5 rounded-2xl border ${m.classes.card} transition-colors block`}
            >
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 ${m.classes.icon}`} />
                <span className={`text-xs font-semibold ${m.classes.label} uppercase tracking-wide`}>{m.label}</span>
              </div>
              <p className="text-sm font-bold mb-1">{m.desc}</p>
              <p className={`text-xs ${m.classes.count} font-medium mb-3`}>{m.count}</p>
              <span className={`text-xs font-medium ${m.classes.count} flex items-center gap-1`}>
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
              { icon: "📚", stat: "Exam-aligned questions", sub: "Match real exam formats" },
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

      {/* Sage — single sentence, no character bio. */}
      <section className="py-10 sm:py-14 bg-secondary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            <span className="font-semibold text-foreground">Sage</span> explains your wrong answers, drills your weak units, and quizzes you back to make sure you actually got it.
          </p>
        </div>
      </section>

      {/* Product Demo — Sage conversation snippet */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wide">
            This is Sage — your 24/7 study tutor
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Most Sage Live Tutors explain. Sage tests you back.</h2>
          <p className="text-muted-foreground">
            After every answer, Sage offers a quick 3-question comprehension check — optional, instant, and built around exactly what it just taught you.
            Your score builds your Comprehension % on the Analytics page. Active recall at zero extra effort.
          </p>
        </div>
      </section>

      {/* Day 1 → Day 7 timeline — added 2026-05-02 LATE per ChatGPT plan.
          Replaces feature-icon framing with a concrete time-to-readiness flow. */}
      <section className="py-20 sm:py-24 bg-secondary/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] mb-3">
              7 days from{" "}
              <span className="text-foreground/60">&ldquo;I don&apos;t know what to study&rdquo;</span>
              <br className="hidden sm:block" /> to{" "}
              <span className="text-blue-600 dark:text-blue-400">&ldquo;I&apos;m ready.&rdquo;</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              No magic. Just the steps in order.
            </p>
          </div>
          <ol className="relative border-l-2 border-blue-500/30 ml-3 sm:ml-6 space-y-10">
            {[
              { day: "Day 1", title: "You take the diagnostic", desc: "5 minutes. We see the units you can't actually do.", color: "blue" },
              { day: "Day 2", title: "Your weak units surface", desc: "Specific topics. Not \"study harder.\"", color: "blue" },
              { day: "Day 3", title: "You practice — only what matters", desc: "No re-doing what you've already mastered.", color: "blue" },
              { day: "Day 5", title: "Timed exam simulation", desc: "Real exam pressure. Real readiness number.", color: "amber" },
              { day: "Day 7", title: "You're ready", desc: "Or we tell you exactly what's still off.", color: "emerald" },
            ].map((step) => {
              const dotColor =
                step.color === "emerald"
                  ? "bg-emerald-500 border-emerald-500/40"
                  : step.color === "amber"
                  ? "bg-amber-500 border-amber-500/40"
                  : "bg-blue-500 border-blue-500/40";
              const labelColor =
                step.color === "emerald"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : step.color === "amber"
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-blue-600 dark:text-blue-400";
              return (
                <li key={step.day} className="ml-6 sm:ml-10 relative">
                  <span className={`absolute -left-[31px] sm:-left-[45px] top-1.5 w-4 h-4 rounded-full ring-4 ring-background ${dotColor}`} />
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${labelColor}`}>{step.day}</p>
                  <h3 className="text-lg sm:text-xl font-bold mb-1.5 tracking-tight">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Features — alternating text + product mockups */}
      <section id="how-it-works" className="py-20 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-3 tracking-tight leading-[1.05]">Everything You Need to Score Higher</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Built around how {examLabel} exams actually work — not generic quiz apps.</p>
          </div>

          <div className="space-y-24">
            {/* Row 1: text left, study plan right (5/7 split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">Sage builds a study plan around your weak areas</h3>
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

            {/* Row 2: practice left, text right (flipped, 7/5 split) */}
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

            {/* Row 3: text left, analytics right (5/7 split, slight reverse offset) */}
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
        </div>
      </section>

      {/* Product Showcase — full workflow */}
      <ProductShowcase />

      {/* Differentiation — single honest line, no table */}
      <section className="py-10 sm:py-14 lg:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <p className="text-lg sm:text-xl text-foreground/80 leading-relaxed">
            ChatGPT will give you the answer.{" "}
            <span className="text-foreground font-semibold">We make you work for it.</span>
          </p>
          <p className="text-sm text-muted-foreground italic">Different tools.</p>
        </div>
      </section>

      {/* Multi-Q tension — "You're not ready" — added 2026-05-02 LATE.
          5 question pips, 3 wrong, confidence drops to 40%. Slightly
          uncomfortable on purpose: catch overconfidence early. */}
      <section className="py-16 sm:py-20 bg-red-500/5 border-y border-red-500/15">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
            Most students think they&apos;re ready
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Until this happens.
          </h2>
          <p className="text-muted-foreground mb-9 max-w-xl mx-auto">
            5 quick questions. Confidence drops fast.
          </p>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-2xl mx-auto mb-8">
            {[
              { num: 1, status: "right" as const },
              { num: 2, status: "wrong" as const },
              { num: 3, status: "right" as const },
              { num: 4, status: "wrong" as const },
              { num: 5, status: "wrong" as const },
            ].map((q) => (
              <div
                key={q.num}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 ${
                  q.status === "right"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-red-500/50 bg-red-500/10"
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">Q{q.num}</span>
                {q.status === "right" ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            ))}
          </div>
          <div className="max-w-sm mx-auto">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Confidence</span>
              <span className="text-red-600 dark:text-red-400 font-semibold">40%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 w-2/5" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-9 italic max-w-md mx-auto">
            We catch this early — so you don&apos;t walk into the exam thinking you knew it.
          </p>
        </div>
      </section>

      {/* Curriculum Coverage — AP / SAT / ACT */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight leading-[1.05]">Curriculum Coverage</h2>
              <p className="text-muted-foreground text-lg mb-8">
                {visibleCourses.length === courses.length
                  ? "Every unit across 10 AP courses, SAT, and ACT — hundreds of exam-aligned questions per unit, free for every student."
                  : `${visibleCourses.length} courses available today — hundreds of vetted, College-Board-grade questions per course. We're rebuilding the rest with stricter quality validators; they'll come back online individually as each passes our 7-gate audit.`}
              </p>
              <Link href="/register?track=ap" prefetch={false}>
                <Button size="lg" className="gap-2">
                  Start Learning Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {visibleCourses.map((course) => (
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
              CLEP® exams cost $93 each. StudentNest Prep prepares you with the same exam-aligned practice and Sage tutoring used for AP — optimized for CLEP content.
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
            <Link href="/register?track=clep" prefetch={false}>
              <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white">
                Start CLEP Prep Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about" prefetch={false}>
              <Button size="lg" variant="outline" className="gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                Learn More About CLEP
              </Button>
            </Link>
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
            CLEP® is a registered trademark of College Board, which is not affiliated with, and does not endorse, this product.
            All practice questions are original StudentNest Prep content — not reproduced from any official exam.
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
            <Link href="/register?module=dsst" prefetch={false}>
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
            All practice questions are original StudentNest Prep content.
          </p>
        </div>
      </section>}

      {/* Free vs AP Premium vs CLEP Premium */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">What Do You Actually Get?</h2>
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
                <Link href="/register?track=ap" prefetch={false}>
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
                "FRQ scored against the official College Board rubric",
                "Personalized AP study plan",
                "Streaming Sage responses",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <div className="pt-3">
                <Link href="/register?track=ap" prefetch={false}>
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
                "Streaming Sage responses",
                "Save $1,200+ per exam passed",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground/80">
                  <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
              <div className="pt-3">
                <Link href="/register?track=clep" prefetch={false}>
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">Upgrade CLEP Premium</Button>
                </Link>
              </div>
            </div>}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-5">
            <Link href="/pricing" prefetch={false} className="text-blue-500 hover:underline">See full pricing details ←’</Link>
          </p>
        </div>
      </section>

      {/* Honesty section — replaces fake testimonials 2026-05-02.
          Per ChatGPT's brutal feedback: manufactured testimonials read as
          marketing copy. Replaced with what we can actually defend: a
          transparent statement of what's been built + audited. */}
      <section className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/40 bg-card/40 p-8 lg:p-10 space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">What we've actually built — not what we promise</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">Honest about quality, because we got it wrong before.</h2>
            <p className="text-foreground/80 leading-relaxed">
              Earlier this year we shipped questions with arithmetic errors and answer-key bugs.
              Students were marked wrong on questions where they reasoned correctly. We pulled them.
            </p>
            <p className="text-foreground/80 leading-relaxed">
              The bank you see today went through 7 deterministic checks (math, structure, distractor
              integrity, primary-source attribution, figure presence) plus two cross-family LLM judges.
              Anything that fails any check stays unapproved.
              <span className="block mt-1 text-muted-foreground italic">
                That&apos;s why some courses aren&apos;t live yet.
              </span>
            </p>
            <p className="text-foreground/80 leading-relaxed">
              When we ship a course, you can practice it. When we can&apos;t stand behind a course&apos;s
              quality, we hide it instead of pretending. That&apos;s the deal.
            </p>
            <div className="pt-2">
              <Link href="/about" prefetch={false} className="text-blue-500 hover:underline text-sm font-medium">
                See the full quality methodology →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Parents — one sentence, no marketing grid */}
      <section id="parents" className="py-12 sm:py-16 bg-secondary/20 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3">For Parents</p>
          <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
            A private tutor at $50/hr × 24 hours runs $1,200. Our $20 covers the same period.
            <span className="block mt-2 text-muted-foreground italic">Same calculation. Less marketing.</span>
          </p>
        </div>
      </section>

      {/* Product loop diagram — added 2026-05-02 LATE per ChatGPT plan.
          Visual loop: Answer → Wrong → Learn why → Retry → Improve. */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.05] mb-3">
              The loop that fixes weak areas
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Every wrong answer triggers this. Every time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 items-center">
            {[
              { label: "Answer", classes: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
              { label: "Wrong", classes: "bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-400" },
              { label: "Learn why", classes: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400" },
              { label: "Retry", classes: "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400" },
              { label: "Improve", classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                <div className={`w-full p-4 sm:p-5 rounded-xl border-2 text-center font-bold text-sm sm:text-base ${step.classes}`}>
                  {step.label}
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/60 rotate-90 sm:rotate-0 flex-shrink-0" />
                )}
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
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight leading-[1.05]">Stop guessing what to study.<br /><span className="text-blue-600 dark:text-blue-400">Start fixing what you don't know.</span></h2>
          <p className="text-muted-foreground text-lg mb-8">
            {clepOn || dsstOn
              ? <>Whether you&apos;re a high schooler aiming for a 5, or a college student saving thousands{clepOn && <> with CLEP</>}{dsstOn && <>{clepOn ? " and" : " with"} DSST</>} — StudentNest is free to start, and Sage is ready to teach.</>
              : <>Whether you&apos;re aiming for a 5 on AP exams, a top SAT score, or a strong ACT composite — StudentNest is free to start, and Sage is ready to teach.</>
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?track=ap" prefetch={false}>
              <Button size="lg" className="gap-2 text-base px-10 h-12 bg-blue-600 hover:bg-blue-700 text-white">
                Find my weak areas
              </Button>
            </Link>
            {clepOn && (
              <Link href="/register?track=clep" prefetch={false}>
                <Button size="lg" variant="outline" className="text-base px-10 h-12 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                  Start CLEP Prep Free
                </Button>
              </Link>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Free forever · Premium from $6.67/mo (annual) or $9.99/mo ·{" "}
            <Link href="/pricing" prefetch={false} className="text-blue-500 hover:underline">See full pricing</Link>
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
                StudentNest Prep — exam-aligned practice for {examLabel}. Free to start.
              </p>
              <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                <Shield className="h-3.5 w-3.5" /> No credit card required
              </div>
            </div>
            {/* Col 2: Exam Prep */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Exam Prep</p>
              <div className="space-y-2 text-sm">
                <Link href="/ap-prep" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">AP Courses</Link>
                <Link href="/sat-prep" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">SAT Prep</Link>
                <Link href="/act-prep" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">ACT Prep</Link>
                <a data-preplion-intentional="footer-handoff" href="https://preplion.ai" target="_blank" rel="noopener noreferrer" className="block text-muted-foreground hover:text-foreground transition-colors text-xs pt-1.5 border-t border-border/20 mt-1.5">
                  CLEP &amp; DSST? <span data-preplion-intentional>→ PrepLion ↗</span>
                </a>
              </div>
            </div>
            {/* Col 3: Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</p>
              <div className="space-y-2 text-sm">
                <Link href="/register" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">Sign Up Free</Link>
                <Link href="/login" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">Log In</Link>
                <Link href="/pricing" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
              </div>
            </div>
            {/* Col 4: Company */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company</p>
              <div className="space-y-2 text-sm">
                <Link href="/about" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
                <Link href="/contact" prefetch={false} className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
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

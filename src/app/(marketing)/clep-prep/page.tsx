import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { isClepEnabled } from "@/lib/settings";

// Force dynamic so permanentRedirect executes at request time, not build time.
// Static prerender caches the redirect as a 404 response.
export const dynamic = "force-dynamic";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, GraduationCap, Clock, TrendingUp, DollarSign, ChevronDown, CalendarCheck, BookOpen, Users, Shield } from "lucide-react";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";
import { MockupPractice } from "@/components/landing/mockup-practice";
import { CLEPTimeline } from "@/components/landing/clep-timeline";
import { CLEPTestimonials } from "@/components/landing/clep-testimonials";
import { CLEPFaq } from "@/components/landing/clep-faq";
import { ExamReadinessMockup } from "@/components/landing/exam-readiness";
import { FadeIn } from "@/components/landing/fade-in";

export const metadata: Metadata = {
  title: "CLEP Exam Prep — Pass in 7 Days, Save $1,200+ | StudentNest Prep",
  description: "Pass your CLEP exam in 7 days with AI-powered prep. 34 exams, all 5 domains. $93 exam replaces a $1,200 college course. Free to start.",
  openGraph: {
    title: "Pass Your CLEP Exam in 7 Days | StudentNest Prep",
    description: "One $93 exam replaces a full semester. AI builds your custom 7-day plan. 34 CLEP exams. Free to start.",
    url: "https://studentnest.ai/clep-prep",
  },
};

// Top 8 "easiest" CLEP exams by approachability (based on pass rates + student feedback)
const easiestExams = [
  { name: "Introductory Sociology", hours: "15–25", difficulty: "High", savings: "$1,200", tip: "Mostly common sense + vocabulary" },
  { name: "Introductory Psychology", hours: "15–25", difficulty: "High", savings: "$1,200", tip: "If you took AP Psych, you're halfway there" },
  { name: "Analyzing & Interpreting Lit", hours: "10–20", difficulty: "High", savings: "$2,400", tip: "No reading list — pure passage analysis" },
  { name: "Principles of Marketing", hours: "20–30", difficulty: "High", savings: "$1,200", tip: "Real-world business intuition helps a lot" },
  { name: "College Mathematics", hours: "20–30", difficulty: "Medium", savings: "$2,400", tip: "Easier than College Algebra — broader but shallower" },
  { name: "American Government", hours: "20–30", difficulty: "Medium", savings: "$1,200", tip: "Civics knowledge from high school goes far" },
  { name: "Principles of Management", hours: "20–30", difficulty: "High", savings: "$1,200", tip: "Common sense management + key theorists" },
  { name: "Introductory Sociology", hours: "15–25", difficulty: "High", savings: "$1,200", tip: "Consistently one of the highest pass rates" },
];
// Deduplicate (Sociology listed twice intentionally as #1, remove duplicate)
const topExams = easiestExams.filter((e, i, a) => a.findIndex(x => x.name === e.name) === i).slice(0, 8);

// All 34 CLEP courses grouped by domain
const domains = [
  {
    name: "Composition & Literature",
    emoji: "📚",
    totalSavings: "$12,000",
    courses: [
      { name: "American Literature", savings: "$1,200" },
      { name: "Analyzing & Interpreting Literature", savings: "$2,400" },
      { name: "College Composition", savings: "$2,400" },
      { name: "College Composition Modular", savings: "$1,200" },
      { name: "English Literature", savings: "$2,400" },
      { name: "Humanities", savings: "$2,400" },
    ],
  },
  {
    name: "History & Social Sciences",
    emoji: "🌍",
    totalSavings: "$15,600",
    courses: [
      { name: "American Government", savings: "$1,200" },
      { name: "History of the U.S. I", savings: "$1,200" },
      { name: "History of the U.S. II", savings: "$1,200" },
      { name: "Human Growth & Development", savings: "$1,200" },
      { name: "Intro to Educational Psychology", savings: "$1,200" },
      { name: "Introductory Psychology", savings: "$1,200" },
      { name: "Introductory Sociology", savings: "$1,200" },
      { name: "Principles of Macroeconomics", savings: "$1,200" },
      { name: "Principles of Microeconomics", savings: "$1,200" },
      { name: "Social Sciences & History", savings: "$2,400" },
      { name: "Western Civilization I", savings: "$1,200" },
      { name: "Western Civilization II", savings: "$1,200" },
    ],
  },
  {
    name: "Science & Mathematics",
    emoji: "🔬",
    totalSavings: "$12,000",
    courses: [
      { name: "Biology", savings: "$2,400" },
      { name: "Calculus", savings: "$1,200" },
      { name: "Chemistry", savings: "$2,400" },
      { name: "College Algebra", savings: "$1,200" },
      { name: "College Mathematics", savings: "$2,400" },
      { name: "Natural Sciences", savings: "$2,400" },
      { name: "Precalculus", savings: "$1,200" },
    ],
  },
  {
    name: "Business",
    emoji: "💼",
    totalSavings: "$6,000",
    courses: [
      { name: "Financial Accounting", savings: "$1,200" },
      { name: "Information Systems", savings: "$1,200" },
      { name: "Introductory Business Law", savings: "$1,200" },
      { name: "Principles of Management", savings: "$1,200" },
      { name: "Principles of Marketing", savings: "$1,200" },
    ],
  },
  {
    name: "World Languages",
    emoji: "🌍",
    totalSavings: "$9,600",
    courses: [
      { name: "French (Levels 1 & 2)", savings: "$2,400" },
      { name: "German (Levels 1 & 2)", savings: "$2,400" },
      { name: "Spanish (Levels 1 & 2)", savings: "$2,400" },
      { name: "Spanish with Writing", savings: "$2,400" },
    ],
  },
];

const allCourses = domains.flatMap(d => d.courses.map(c => ({ ...c, domain: d.name })));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "CLEP Exam Prep Courses",
  description: "34 CLEP exams with AI-powered practice — earn college credit and save thousands",
  numberOfItems: 34,
  itemListElement: allCourses.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.name,
      description: `AI-powered ${c.name} prep. 5 units. Pass and save ${c.savings} in tuition.`,
      provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
      isAccessibleForFree: true,
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
        { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "CLEP Premium", billingIncrement: "P1M" },
      ],
    },
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What's the easiest CLEP exam to pass?", acceptedAnswer: { "@type": "Answer", text: "Introductory Sociology, Introductory Psychology, and Analyzing & Interpreting Literature are consistently rated the easiest CLEP exams based on pass rates and student feedback." } },
    { "@type": "Question", name: "Can I really pass a CLEP exam in 7 days?", acceptedAnswer: { "@type": "Answer", text: "Yes, if you have some background in the subject. Students with prior coursework or life experience often pass in under a week with focused AI-powered prep." } },
    { "@type": "Question", name: "Do all colleges accept CLEP credit?", acceptedAnswer: { "@type": "Answer", text: "Over 2,900 colleges accept CLEP, but policies vary. Check your school's CLEP policy before testing." } },
    { "@type": "Question", name: "How much does a CLEP exam cost?", acceptedAnswer: { "@type": "Answer", text: "Each CLEP exam costs $93. Active military can take CLEPs for free through DANTES." } },
  ],
};

export default async function ClepPrepPage() {
  if (!(await isClepEnabled())) permanentRedirect("https://preplion.ai/clep-prep");
  return (
    <div className="space-y-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* â•â•â• HERO — asymmetric, human feel â•â•â• */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <FadeIn>
            <div className="text-center lg:text-left space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <GraduationCap className="h-4 w-4" /> 34 CLEP Exams · All 5 Domains
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] tracking-tight">
                Pass Your CLEP Exam in 7 Days.<br />
                <span className="text-emerald-700 dark:text-emerald-400">Save $1,200.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0">
                One $93 exam replaces a full college course. Sage builds your custom 7-day plan — study only what&apos;s on the test.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-1">
                <Link href="/register?module=clep">
                  <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800 w-full sm:w-auto">
                    Build My 7-Day Plan <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <a href="#easiest">
                  <Button size="lg" variant="ghost" className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-300 w-full sm:w-auto">
                    Which exam is easiest? <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-muted-foreground">Free to start. No credit card required.</p>
            </div>
          </FadeIn>
          <FadeIn className="hidden lg:block">
            <div className="animate-float">
              <BrowserFrame title="StudentNest Prep · CLEP Study Plan" className="shadow-2xl shadow-emerald-500/10">
                <MockupStudyPlan />
              </BrowserFrame>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* â•â•â• 4-STEP TIMELINE — how it works â•â•â• */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-2">How It Works</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">From zero to passing in 4 steps</p>
          </FadeIn>
          <CLEPTimeline />
        </div>
      </section>

      {/* â•â•â• EASIEST CLEP EXAMS — #1 SEO target â•â•â• */}
      <section id="easiest" className="max-w-5xl mx-auto px-4 py-16 scroll-mt-20">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Easiest CLEP Exams to Pass</h2>
            <p className="text-sm text-muted-foreground mt-2">Ranked by pass rate and student feedback. Start with these for quick wins.</p>
          </div>
        </FadeIn>
        <div className="grid sm:grid-cols-2 gap-4">
          {topExams.map((exam, i) => (
            <FadeIn key={exam.name}>
              <div className="relative p-5 rounded-xl border border-border/40 bg-card/50 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">#{i + 1}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${exam.difficulty === "High" ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
                        {exam.difficulty} pass rate
                      </span>
                    </div>
                    <p className="font-semibold text-sm mt-2">{exam.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{exam.tip}&rdquo;</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />{exam.hours} hrs</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">Save {exam.savings}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/register?module=clep">
            <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800">Start with the Easiest Exam <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      </section>

      {/* â•â•â• PERSONA CARDS — who is this for â•â•â• */}
      <section className="bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent py-14">
        <div className="max-w-5xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-2">Built for How You Learn</h2>
            <p className="text-sm text-muted-foreground text-center mb-8">Whether you&apos;re stacking credits or finishing a degree</p>
          </FadeIn>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: TrendingUp, color: "emerald", label: "Credit Hackers",
                title: "Skip a full semester",
                desc: "Stack 4-5 CLEPs in one summer. Enter college as a sophomore — or graduate a year early.",
                cta: "I want to skip ahead",
              },
              {
                icon: Users, color: "teal", label: "Working Adults",
                title: "Study on your schedule",
                desc: "Study after the kids are in bed. Schedule your exam any week — no waiting for test dates.",
                cta: "I'm finishing my degree",
              },
              {
                icon: Shield, color: "blue", label: "Military & Veterans",
                title: "Free exams via DANTES",
                desc: "Active duty? DANTES pays your exam fee. Free exam + free prep = free college credits.",
                cta: "I qualify for DANTES",
              },
            ].map((p) => (
              <FadeIn key={p.label}>
                <div className="p-6 rounded-2xl border border-border/40 bg-card/60 space-y-3 h-full flex flex-col">
                  <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-${p.color}-400`}>
                    <p.icon className="h-4 w-4" /> {p.label}
                  </div>
                  <p className="text-lg font-bold">{p.title}</p>
                  <p className="text-sm text-muted-foreground flex-1">{p.desc}</p>
                  <Link href="/register?module=clep">
                    <Button variant="ghost" size="sm" className={`text-${p.color}-400 hover:text-${p.color}-300 p-0 h-auto`}>
                      {p.cta} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* â•â•â• EXAM READINESS — feature preview with mockup â•â•â• */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <FadeIn>
            <div className="space-y-4 text-center lg:text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto lg:mx-0">
                <CalendarCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold">Know exactly when you&apos;re ready</h2>
              <p className="text-muted-foreground leading-relaxed">
                No guessing. Your CLEP Readiness Score tracks mastery across every unit. Hit 70% and it&apos;s time to book your $93 exam. Most students reach it in 7-14 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center lg:items-start pt-2">
                <Link href="/register?module=clep">
                  <Button className="gap-2 bg-emerald-700 hover:bg-emerald-800">See My Readiness Score <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </div>
            </div>
          </FadeIn>
          <FadeIn className="flex justify-center">
            <ExamReadinessMockup />
          </FadeIn>
        </div>
      </section>

      {/* â•â•â• FEATURES — alternating text + mockups â•â•â• */}
      <section className="bg-secondary/20 py-16">
        <div className="max-w-5xl mx-auto px-4 space-y-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <FadeIn>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">CLEP-aligned practice, not random quizzes</h3>
                <p className="text-muted-foreground leading-relaxed">AI generates questions matching official CLEP format. Sage explains every answer using free resources — OpenStax, Khan Academy, LibreTexts.</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Practice only what&apos;s actually on the exam.</p>
              </div>
            </FadeIn>
            <FadeIn>
              <BrowserFrame title="StudentNest Prep · CLEP Practice" className="shadow-xl"><MockupPractice /></BrowserFrame>
            </FadeIn>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <FadeIn className="lg:order-2">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">Your 7-day plan adapts as you learn</h3>
                <p className="text-muted-foreground leading-relaxed">Sage builds a custom day-by-day plan based on your diagnostic. Struggling with Unit 3? It shifts more practice there. Already strong on Unit 1? Skip ahead.</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Most students are exam-ready by Day 5.</p>
              </div>
            </FadeIn>
            <FadeIn className="lg:order-1">
              <BrowserFrame title="StudentNest Prep · 7-Day Plan" className="shadow-xl"><MockupStudyPlan /></BrowserFrame>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* â•â•â• QUESTION QUALITY VISUAL â•â•â• */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <FadeIn>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-4">
              <Shield className="h-4 w-4" />
              Question Quality Guarantee
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">College Board-Level Questions</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Every practice question goes through a rigorous quality pipeline — not random AI output</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-6 text-center">
              <div className="text-4xl font-bold text-emerald-500 mb-1">9</div>
              <div className="text-sm font-semibold mb-2">Validation Steps</div>
              <p className="text-xs text-muted-foreground">Topic alignment, Bloom&apos;s taxonomy, scenario check, distractor analysis, cross-model review, difficulty calibration, factual grounding, explanation quality, deduplication</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.06] to-transparent p-6 text-center">
              <div className="text-4xl font-bold text-blue-500 mb-1">80%+</div>
              <div className="text-sm font-semibold mb-2">Application-Level</div>
              <p className="text-xs text-muted-foreground">Real CLEP exams test understanding, not memorization. Our questions require you to apply concepts to scenarios — just like the real exam</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-6 text-center">
              <div className="text-4xl font-bold text-violet-500 mb-1">34</div>
              <div className="text-sm font-semibold mb-2">Exam Topic Maps</div>
              <p className="text-xs text-muted-foreground">Questions follow College Board&apos;s official topic distribution — the same percentages tested on your actual CLEP exam</p>
            </div>
          </FadeIn>
        </div>

        <FadeIn>
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-foreground">2 AI Models</div>
                <div className="text-xs text-muted-foreground">Generate + independently validate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">8 Criteria</div>
                <div className="text-xs text-muted-foreground">Accuracy, distractors, cognitive level...</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">OpenStax</div>
                <div className="text-xs text-muted-foreground">Verified against peer-reviewed textbooks</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">Auto-Calibrated</div>
                <div className="text-xs text-muted-foreground">Difficulty tracked by real student data</div>
              </div>
            </div>
          </div>
        </FadeIn>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-4">StudentNest is not affiliated with or endorsed by the College Board. CLEP® is a registered trademark of the College Board.</p>
      </section>

      {/* â•â•â• TESTIMONIALS â•â•â• */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-2xl font-bold text-center mb-2">Real Students. Real Credits.</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">People just like you are passing CLEPs and saving thousands</p>
        </FadeIn>
        <CLEPTestimonials />
      </section>

      {/* â•â•â• SCHEDULE ANYTIME — year-round advantage â•â•â• */}
      <section className="bg-emerald-500/[0.04] border-y border-emerald-500/10 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
          <FadeIn>
            <CalendarCheck className="h-8 w-8 text-emerald-700 dark:text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold">No Waiting. Schedule Anytime.</h2>
            <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Unlike SAT or AP, CLEP exams are offered <span className="text-foreground font-medium">year-round</span> at test centers nationwide. Most centers have openings within 1-2 weeks. Some offer remote proctoring from home.
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Your next exam could be this week.</p>
          </FadeIn>
        </div>
      </section>

      {/* â•â•â• ALL 34 EXAMS — domain-grouped accordion â•â•â• */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <FadeIn>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">All 34 CLEP Exams</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">5 domains. $55,200+ in potential savings.</p>
        </FadeIn>
        <div className="space-y-3">
          {domains.map((domain) => (
            <FadeIn key={domain.name}>
              <details className="group rounded-xl border border-border/40 bg-card/50 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{domain.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{domain.name}</p>
                      <p className="text-xs text-muted-foreground">{domain.courses.length} exams · Save up to {domain.totalSavings}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 grid sm:grid-cols-2 gap-2">
                  {domain.courses.map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                        <span className="text-sm">{c.name}</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{c.savings}</span>
                    </div>
                  ))}
                </div>
              </details>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* â•â•â• WHAT IS CLEP? — for confused beginners â•â•â• */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-3xl mx-auto px-4">
          <FadeIn>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8 space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-xl font-bold">New to CLEP? Here&apos;s What You Need to Know</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="space-y-3">
                  <p><span className="text-foreground font-medium">What:</span> A standardized exam that earns you college credit — without taking the class.</p>
                  <p><span className="text-foreground font-medium">Cost:</span> $93 per exam (vs. $1,200+ for the course).</p>
                  <p><span className="text-foreground font-medium">Time:</span> 90-120 minutes per exam. Prep takes 7-30 days depending on prior knowledge.</p>
                </div>
                <div className="space-y-3">
                  <p><span className="text-foreground font-medium">Credits:</span> 3-6 college credits per passing exam.</p>
                  <p><span className="text-foreground font-medium">Accepted by:</span> 2,900+ colleges and universities.</p>
                  <p><span className="text-foreground font-medium">Who can take it:</span> Anyone — high school students, college students, adults, military.</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* â•â•â• FAQ â•â•â• */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <CLEPFaq />
      </section>

      {/* â•â•â• PRICING — Free vs Premium â•â•â• */}
      <section className="bg-secondary/20 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-8">Start Free. Upgrade When You&apos;re Ready.</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <FadeIn>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3 h-full">
                <p className="font-bold">Free</p>
                <p className="text-3xl font-bold text-muted-foreground">$0 <span className="text-sm font-normal">forever</span></p>
                {["Unlimited MCQ practice", "5 Sage Live Tutor chats/day", "Basic study plan", "Mastery analytics", "All 34 CLEP courses"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />{f}</div>
                ))}
                <Link href="/register?module=clep" className="block pt-2">
                  <Button variant="outline" className="w-full">Start Free</Button>
                </Link>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="rounded-xl border-2 border-emerald-500 bg-emerald-500/5 p-6 space-y-3 h-full relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-xs font-semibold">Most Popular</div>
                <p className="font-bold text-emerald-700 dark:text-emerald-400">CLEP Premium</p>
                <p className="text-3xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">or $79.99/yr — save 33%</p>
                {["Everything in Free", "7-Day Pass Plan (AI-personalized)", "Unlimited Sage Live Tutor chats", "Exam Readiness Score", "Save $1,200+ per exam"].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />{f}</div>
                ))}
                <form action="/api/checkout?plan=monthly&module=clep" method="POST" className="pt-2">
                  <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800">Start CLEP Premium</Button>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* â•â•â• PARENT TRUST â•â•â• */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <FadeIn>
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold">For parents &amp; adult learners</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              CLEP exams are administered by the College Board and accepted by 2,900+ institutions for real college credit. StudentNest prepares students with AI-powered practice aligned to official CLEP content outlines. All practice questions are original — never copied from official materials.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* â•â•â• FINAL CTA â•â•â• */}
      <section className="bg-gradient-to-t from-emerald-500/[0.06] to-transparent py-16">
        <div className="max-w-3xl mx-auto px-4 text-center space-y-5">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Your next exam could be<br /><span className="text-emerald-700 dark:text-emerald-400">7 days from now.</span>
            </h2>
            <p className="text-muted-foreground">Pick an exam. Follow the plan. Walk in and pass.</p>
            <Link href="/register?module=clep">
              <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                Build My 7-Day Plan <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">Free to start · No credit card · Cancel anytime</p>
          </FadeIn>
        </div>
      </section>

      {/* â•â•â• TRADEMARK â•â•â• */}
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <p className="text-xs text-center text-muted-foreground">
          CLEP® is a registered trademark of College Board, which is not affiliated with StudentNest. All practice questions are original AI-generated content.
        </p>
      </div>
    </div>
  );
}

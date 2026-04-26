import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About StudentNest Prep — Mission, Science & Course Coverage",
  description: "Learn how StudentNest Prep uses active recall, spaced repetition, and Sage Live Tutor to help students score higher on AP, SAT & ACT exams.",
  openGraph: {
    title: "About | StudentNest Prep",
    description: "AI-powered exam prep built on learning science. 16+ courses, free to start.",
  },
};
import { Globe, Mail, Target, Heart, Sparkles, Lightbulb, LayoutDashboard, GraduationCap, ShieldCheck, Brain, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { BrowserFrame } from "@/components/landing/browser-frame";
import { MockupPractice } from "@/components/landing/mockup-practice";
import { MockupAnalytics } from "@/components/landing/mockup-analytics";
import { MockupStudyPlan } from "@/components/landing/mockup-study-plan";

const COURSES = [
  // AP
  { name: "AP World History: Modern",       category: "AP Courses",   color: "bg-blue-500/10 text-blue-300 border-blue-500/20 dark:text-blue-300 dark:border-blue-500/20 light:text-blue-700 light:border-blue-400/40", desc: "Civilizations, empires, revolutions, globalization" },
  { name: "AP Computer Science Principles", category: "AP Courses",   color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Algorithms, data, internet, impact of computing" },
  { name: "AP Physics 1: Algebra-Based",    category: "AP Courses",   color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/20", desc: "Kinematics, forces, energy, waves, circuits" },
  { name: "AP Calculus AB",                 category: "AP Courses",   color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", desc: "Limits, derivatives, integrals, differential equations" },
  { name: "AP Calculus BC",                 category: "AP Courses",   color: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20", desc: "All AB topics plus series, parametric, polar" },
  { name: "AP Statistics",                  category: "AP Courses",   color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20", desc: "Data analysis, probability, inference, regression" },
  { name: "AP Chemistry",                   category: "AP Courses",   color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Atomic structure, bonding, reactions, thermodynamics" },
  { name: "AP Biology",                     category: "AP Courses",   color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Cells, genetics, evolution, ecology, physiology" },
  { name: "AP US History (APUSH)",          category: "AP Courses",   color: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20", desc: "Colonial era through modern America" },
  { name: "AP Psychology",                  category: "AP Courses",   color: "bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20", desc: "Cognition, behavior, development, disorders" },
  // SAT
  { name: "SAT Math",                       category: "SAT Prep",     color: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20", desc: "Algebra, geometry, data analysis, advanced math" },
  { name: "SAT Reading & Writing",          category: "SAT Prep",     color: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20", desc: "Passages, evidence-based reasoning, grammar" },
  // ACT
  { name: "ACT Math",                       category: "ACT Prep",     color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Pre-algebra through trigonometry, 5-choice format" },
  { name: "ACT English",                    category: "ACT Prep",     color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20", desc: "Grammar, sentence structure, rhetorical skills" },
  { name: "ACT Science",                    category: "ACT Prep",     color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Data interpretation, research summaries" },
  { name: "ACT Reading",                    category: "ACT Prep",     color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Literary, social science, humanities passages" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "AP Courses":           "text-blue-500 dark:text-blue-500",
  "SAT Prep":             "text-blue-500 dark:text-blue-400",
  "ACT Prep":             "text-amber-500 dark:text-amber-400",
};


export default function AboutPage() {
  const examLabel = "AP, SAT & ACT";
  const courseCount = 16;
  const visibleCourses = COURSES;
  const visibleCategories = Array.from(new Set(visibleCourses.map((c) => c.category)));

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-16 text-center">

      {/* Section 1: Opening */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold gradient-text">About StudentNest Prep</h1>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-semibold">Beta 8.1.1</Badge>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          AP exams shape college admissions. But the best prep tools cost hundreds of dollars — or require hiring a tutor.
          {" "}StudentNest exists to change that: world-class AI-powered {examLabel} prep, free for every student.
        </p>
      </div>

      {/* Section 2: Our Story */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-8 text-left space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold">Why We Built This</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          For high schoolers, AP prep hasn&apos;t changed in 20 years — thick review books, expensive tutors, or generic flashcard apps.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We built StudentNest to solve both problems. A platform that does what a great tutor does: explain <em>why</em>, not just <em>what</em> — then test whether it clicked.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Sage, our Sage Live Tutor, is the result of that idea: a study partner that&apos;s available 24/7, never gets impatient,
          and adapts to exactly where you&apos;re struggling — whether you&apos;re aiming for a 5 on AP World, a higher SAT score, or a better ACT composite.
        </p>
      </div>

      {/* Section 3: Mission */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Our Mission</p>
        <p className="text-xl font-semibold text-foreground/90 leading-relaxed max-w-2xl mx-auto">
          &ldquo;Make world-class {examLabel} prep accessible to every student — not just those who can afford a tutor.&rdquo;
        </p>
      </div>

      {/* Section 3b: The Science Behind Sage */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-8 text-left space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold">The Science Behind Sage</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Active recall.</strong> Research consistently shows that actively retrieving information — not passively rereading notes — is the most effective way to move knowledge into long-term memory. Every StudentNest practice question and every Sage comprehension check is an act of retrieval.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Spaced repetition.</strong> When you answer a question wrong, StudentNest schedules it to reappear at increasing intervals. This technique has been shown in cognitive science studies to dramatically improve retention over weeks and months compared to massed practice.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Mastery-based progression.</strong> Rather than assigning the same material to every student, Sage tracks your mastery by unit and generates questions targeting your weakest areas first. This approach — rooted in Bloom&apos;s mastery learning framework — ensures that practice time goes where it has the most impact.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Comprehension verification.</strong> After Sage explains a concept, it offers an optional 3-question check to verify you understood the explanation — not just read it. This closes the loop between passive learning and active demonstration of understanding.
        </p>
      </div>

      {/* Section 3b2: College Board-Aligned Question Quality */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-8 text-left space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold">College Board-Aligned Question Quality</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Every practice question goes through a rigorous 9-step quality pipeline
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { step: 1, title: "Topic Distribution",                desc: "Questions match College Board\u2019s official exam topic weights" },
            { step: 2, title: "Bloom\u2019s Taxonomy",             desc: "50%+ questions test application and analysis, not just recall" },
            { step: 3, title: "Scenario-Based",                    desc: "80%+ of questions present real-world scenarios, matching official exam formats" },
            { step: 4, title: "Misconception-First Distractors",   desc: "Wrong answers target actual student misconceptions" },
            { step: 5, title: "AI Generation",                     desc: "Gemini 2.5 Pro generates questions calibrated to exam level" },
            { step: 6, title: "Cross-Model Validation",            desc: "A second AI model independently validates every question" },
            { step: 7, title: "8-Criterion Review",                desc: "Factual accuracy, single correct answer, distractor quality, cognitive level, exam alignment, scenario check, distractor distinctness, explanation quality" },
            { step: 8, title: "Difficulty Calibration",            desc: "Empirical tracking ensures questions match real exam difficulty" },
            { step: 9, title: "OpenStax Grounding",                desc: "Factual accuracy verified against free, peer-reviewed college textbooks" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-border/40 bg-card p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </span>
                <p className="text-sm font-semibold">{title}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/70">120+</span> original calibration question stems validated against College Board exam rubrics
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground/60 leading-relaxed pt-1">
          StudentNest is not affiliated with or endorsed by the College Board.
        </p>
      </div>

      {/* Section 3c: What Students Experience */}
      <div className="space-y-4 text-left">
        <h2 className="text-xl font-bold text-center">What Students Experience</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Sparkles,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              title: "Instant Feedback on Every Answer",
              desc: "Every MCQ and FRQ gets an immediate explanation of why the correct answer is right and why each wrong answer is a common misconception. No waiting, no answer keys.",
            },
            {
              icon: Target,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              title: "Mastery Tracking Across All Units",
              desc: "Your dashboard shows per-unit mastery percentages, accuracy trends over time, and a visual heatmap — so you always know exactly where to focus your next study session.",
            },
            {
              icon: LayoutDashboard,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              title: "Adaptive Study Plans",
              desc: "Each week, Sage generates a study plan that targets your weakest units first and adjusts recommendations as your scores improve. Set your exam date and the plan counts down with you.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3d: See It in Action */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-center">See StudentNest in Action</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xl mx-auto">
          Here&apos;s what the experience looks like — from your personalized study plan to practice questions with instant AI feedback.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <BrowserFrame title="Study Plan" className="shadow-lg"><MockupStudyPlan /></BrowserFrame>
            <p className="text-xs text-muted-foreground text-center mt-2">Prioritized weekly plan by unit</p>
          </div>
          <div>
            <BrowserFrame title="Practice" className="shadow-lg"><MockupPractice /></BrowserFrame>
            <p className="text-xs text-muted-foreground text-center mt-2">Instant Sage explanations</p>
          </div>
          <div>
            <BrowserFrame title="Analytics" className="shadow-lg"><MockupAnalytics /></BrowserFrame>
            <p className="text-xs text-muted-foreground text-center mt-2">Per-unit mastery tracking</p>
          </div>
        </div>
      </div>

      {/* Section 4: Values */}
      <div className="space-y-4 text-left">
        <h2 className="text-xl font-bold text-center">What We Stand For</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              title: "Outcome-Obsessed",
              desc: "We measure success in score improvements, not time-on-site.",
            },
            {
              icon: Heart,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              title: "Accessible First",
              desc: "Core features are free. Always. Premium is for students who want more — not a paywall for the basics.",
            },
            {
              icon: Sparkles,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              title: "AI as a Teacher",
              desc: "Sage doesn\u2019t just answer questions. It explains, checks your understanding, and adapts to your weak points.",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="rounded-xl border border-border/40 bg-card p-5 space-y-2">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: What We Cover */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">
          What We Cover{" "}
          <span className="text-muted-foreground font-normal text-base">({visibleCourses.length} courses · {examLabel})</span>
        </h2>
        {visibleCategories.map((category) => (
          <div key={category} className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wide ${CATEGORY_COLORS[category] ?? "text-muted-foreground"}`}>
              {category}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {visibleCourses.filter((c) => c.category === category).map((c) => (
                <span
                  key={c.name}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${c.color}`}
                  title={c.desc}
                >
                  {c.name} <span className="text-[10px] opacity-60">— {c.desc}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 6: Impact Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">In Beta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { value: String(courseCount),   label: "Courses covered" },
            { value: "24/7", label: "Sage Live Tutor availability" },
            { value: "Free", label: "To start, forever" },
            { value: "$9.99", label: "Premium per module/mo ($79.99/yr)" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
              <p className="text-2xl font-bold gradient-text">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: What's New in Beta 8.1 — Phase A: AP Score Predictor with action recommendations */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-semibold mb-2">Latest Release</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 8.1</h2>
          <p className="text-sm text-muted-foreground">Your projected AP score now tells you what to do next. Three ranked weak-unit recommendations appear right under your 1–5 prediction — each with a one-tap path to focused practice and a rough estimate of how many questions to bump into the next score tier. No more guessing what to study.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Score-to-Action Recommendations", desc: "Below your projected 1–5 score, the dashboard now shows your top 3 weakest units, each labeled with current mastery and a rough Qs-to-next-tier estimate. One tap lands you in focused practice for that exact unit." },
            { icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10", title: "Untouched Units Surface Too", desc: "Units you haven&apos;t practiced yet appear as &ldquo;Untouched · start here&rdquo; cards alongside weak-mastery units. We rank by boost potential — not just lowest mastery — so you build a complete prep, not a lopsided one." },
            { icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", title: "Calibrated Question Estimates", desc: "&ldquo;~12 Qs to next tier&rdquo; isn&apos;t a guess — it&apos;s based on a conservative ~10 questions per 8 percentage points of mastery gain, calibrated against historical data. Floor at 5, cap at 50." },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Same Score, Smarter Pathway", desc: "The 1–5 scaled prediction itself didn&apos;t change. What changed is the &ldquo;OK, what now?&rdquo; gap between &ldquo;you&apos;re a 3.7&rdquo; and actually doing the thing. Three concrete actions appear automatically — no extra clicks, no extra page." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev: What's New in Beta 7.5 — A11y progressbars + FRQ ingestion foundation + P1 batch */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 7.5</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 7.5</h2>
          <p className="text-sm text-muted-foreground">Screen-reader fixes for every progress bar across the app, plus the foundation of the College Board FRQ ingestion pipeline (47 official PDFs downloaded across 8 AP courses). Plus a P1 batch from the bug-hunt sprint: cache self-heal, email compliance, mobile touch targets, flashcard explanation cleanup, and an escape-hatch from the &ldquo;No FRQs available&rdquo; dead-end for Premium users.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Progress Bars Now Screen-Reader Friendly", desc: "Every <Progress> across analytics, practice, diagnostic, flashcards, am-i-ready, and the daily-goal card now carries a contextual aria-label. Caught by axe in the post-deploy a11y scan (rule: aria-progressbar-name, severity: serious)." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "FRQ Library Foundation", desc: "Built the College Board FRQ ingestion pipeline: 47 official past-exam PDFs across 8 AP courses (Bio, Chem, Calc AB/BC, Stats, Physics 1, US History, World History) downloaded with rate-limiting and idempotent caching. Extraction stage uses Gemini 1.5 Pro PDF-native input. Currently waiting on a refreshed API key; once unblocked, ~200 official FRQs land in the library." },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "FRQ Empty-State Escape Hatch", desc: "Premium users picking an AP course with no seeded FRQs no longer dead-end with &ldquo;No FRQs available.&rdquo; Now offers a &ldquo;Generate FRQ with Sage&rdquo; CTA into the AI-FRQ flow already wired in /practice — same rubric scoring, same difficulty calibration." },
            { icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10", title: "Flashcard Explanation Sanitizer", desc: "Flashcards no longer leak the source MCQ&apos;s &ldquo;Why A is correct / Why B is wrong&rdquo; scaffolding. The helper existed; just wasn&apos;t connected to the render path. Now it is." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Cache Self-Heal", desc: "AI-tutor response cache no longer crashes on a single corrupt entry. JSON.parse failures self-heal — bad entry deleted, request falls through to fresh AI call. Previous behavior: every request hitting the same cacheKey would 500." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Email Compliance + Deliverability", desc: "Every commercial email now includes List-Unsubscribe (RFC 8058 one-click) + reply-to. CAN-SPAM 5(a)(5) compliant + improved Gmail/Outlook inbox placement. Verification + password-reset opt out via { transactional: true }." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 7.3 — P0 closeout (webhook + AI streaming + content honesty) */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 7.3</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 7.3</h2>
          <p className="text-sm text-muted-foreground">Three reliability fixes you won&apos;t notice until they would have bitten you — Stripe webhook no longer 500s on transient errors (silent revenue loss vector closed), failed card renewals now properly downgrade after Stripe&apos;s smart-retry exhausts, and Sage chat&apos;s streaming endpoint can&apos;t hang anymore. Plus two honest-copy fixes: landing page now matches /pricing on free-tier limits, and AP-prep&apos;s FRQ feature now correctly badges as Premium.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Webhook Reliability", desc: "Stripe webhook now returns 200 with structured error info on transient failures instead of 500. Reason: a 500 triggers Stripe&apos;s 3-day retry loop, but if the same transient error recurs, Stripe eventually marks the event permanently failed — meaning a paid user never gets their tier flipped. The hourly stripe-reconcile cron is the safety net." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Failed Renewal Handling", desc: "When Stripe fires `invoice.payment_failed` after exhausting smart-retry (4th failed attempt), the matching ModuleSubscription now flips to `past_due` so gating can prompt for a card update. No more &ldquo;paid for Premium 60 days ago, card died, still has access&rdquo; situations." },
            { icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10", title: "Sage Chat Can&apos;t Freeze", desc: "AI streaming endpoint now caps the initial Groq response at 30 seconds via AbortSignal.timeout. Previously, a hung Groq endpoint would leave Sage chat&apos;s typing indicator running forever — fix avoids the worst-case UX." },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Honest Free-Tier Copy", desc: "Landing-page free-tier card no longer says &ldquo;Unlimited MCQ practice&rdquo; (which directly contradicted /pricing&apos;s &ldquo;3 sessions/day&rdquo; cap). Now reads &ldquo;3 practice sessions per day&rdquo; — same number across landing + pricing + product. Cuts the &ldquo;I felt deceived&rdquo; support thread." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "FRQ Premium Badge", desc: "AP-prep page now badges the &ldquo;FRQs with AI rubric scoring&rdquo; feature as Premium and clarifies free-tier gets one full FRQ to try. Reduces refund risk from users assuming unlimited FRQ on free plan." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Iteration 1 P0 Closeout", desc: "Comprehensive bug-hunt sprint Phase 1 (10 parallel agent scans) found 660 candidates; after deduping + verifying false positives, 6 real P0s identified. All 6 now shipped — Beta 7.2 caught 3 cold-start bugs, Beta 7.3 caught the remaining 3. Next iteration targets the P1 backlog (~17 items)." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 7.2 — Reliability hardening + conversion stack */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 7.2</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 7.2</h2>
          <p className="text-sm text-muted-foreground">Reliability hardening across the dashboard, billing, and study-plan endpoints — fewer 5xx errors during fresh-isolate cold-starts. Plus the cross-module &ldquo;you unlocked SAT/ACT too&rdquo; nudge and edge-persistent rate limiting that actually works against anonymous flood traffic.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Cold-Start 500 Hardening", desc: "Three more endpoints (study-plan, mastery-tier-ups, billing-status) now wrap each Prisma call in a per-query safe-fallback wrapper. Same pattern that fixed the dashboard cold-start in Beta 7.0 — a single fresh-isolate hiccup no longer takes down the whole page." },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Cross-Module Discovery Nudge", desc: "Premium users (any module) now see a post-session card suggesting they try a different exam they unlocked — 3 quick questions, 2 minutes. Drives discovery of the all-access entitlement that Beta 7.1 made real." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Anonymous Flood Protection", desc: "Migrated 3 IP-keyed rate-limit gates (check-verified, am-i-ready, anon Sage) from in-process Map (broken on Cloudflare Workers) to native Cloudflare Rate Limiting bindings. Persists across isolate recycles — actually rate-limits anonymous traffic now." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "Stuck-Onboarding Recovery (24h + 72h)", desc: "Two-touch email sequence catches users who signed up but never finished setup. Email 1 at 24h is friendly (&lsquo;we saved your spot&rsquo;); Email 2 at 72h is AP-season urgency-aware. Hard cap of 1+1 emails per user, lifetime." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Pricing Copy Cleanup", desc: "All remaining &ldquo;per module&rdquo; references replaced with all-access language across FAQ, JSON-LD schema, and Sage&rsquo;s system prompt. CLEP dropped from StudentNest user-facing copy (lives on preplion.ai)." },
            { icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10", title: "Early-Stage Predicted Score", desc: "/analytics now shows a tentative predicted-score panel for users with 1+ answer (instead of staying blank until first mock exam). The first-answer reward modal&rsquo;s &lsquo;see my predicted score&rsquo; CTA actually delivers something visible from day one." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 7.1 — All-access entitlement + landing audit fixes */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 7.1</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 7.1</h2>
          <p className="text-sm text-muted-foreground">One Premium subscription now unlocks every exam. Plus a full landing-page conversion pass — sharper headlines, exam-specific demo content, honest claims, and a tighter pricing page.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Premium Is Now All-Access", desc: "One $9.99/mo subscription unlocks every exam on StudentNest — AP, SAT, ACT — including practice on every course. Sign up via whichever exam you start with; you get the whole platform. (Existing subscribers automatically gained access to everything else, no action needed.)" },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Landing Pages Rewritten for Clarity", desc: "ACT, AP, SAT, and pricing pages all got a conversion-audit pass: sharper outcome-driven headlines, exam-specific demo content (no more AP World units showing on the SAT page), pain statements, and a tighter pricing comparison table." },
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Honest Score-Gain Language", desc: "Replaced absolute score-jump claims (e.g., &lsquo;1050→1350&rsquo;) with typical-pattern framing (&lsquo;1050 → 1150 → 1250+&rsquo;). More credible for parents, safer legally, more inclusive of students starting at any level." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Pricing Page De-cluttered", desc: "Removed the &ldquo;subscribe to multiple modules independently&rdquo; framing that was creating cognitive load. Free tier no longer says both &ldquo;unlimited practice&rdquo; AND &ldquo;3 sessions/day&rdquo;. Refund + cancel reassurances consolidated to one trust line." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "FRQ Differentiator Surfaced", desc: "AP page now leads its second feature with &ldquo;Practice FRQs with AI scoring on real AP rubrics&rdquo; — the actual differentiator vs Khan/Quizlet/ChatGPT. Was previously buried behind generic MCQ copy." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Pain Statements Added", desc: "AP and SAT pages now lead with the user-pain insight: students plateau because they re-read what they already know, not because they don&apos;t study enough. Sage drills only the points you&apos;re actually losing." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 7.0 — AP-season conversion stack */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 7.0</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 7.0</h2>
          <p className="text-sm text-muted-foreground">AP exam season is here — this release is built around getting you from sign-up to your first practice answer faster, and giving you a moment of celebration when you do. Plus reliability fixes for the dashboard, accessibility upgrades across the marketing site, and an honest rewrite of the ACT page.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "First-Answer Celebration", desc: "Submit your very first practice question and we&apos;ll quietly celebrate — with a one-time modal that tells you exactly how much progress your predicted score will make as you keep going. Designed to land at the highest-engagement moment in the entire product." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "AP Season Countdown", desc: "Live calendar-aware urgency banner across every marketing page — counts down the days until the AP exam window so you know exactly how much time is left. Auto-dismissable, never repeats once closed." },
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Honest ACT Page", desc: "Rewrote the ACT prep page hero to remove unsupported claims (no more &lsquo;3-5 point lift&rsquo; without data). Sage Coach voice practice now appears as a fourth pillar on the landing page — previously it was completely undiscoverable." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Dashboard Reliability", desc: "Fixed cold-start 500 errors that occasionally made the dashboard predicted-score card vanish for the first 2-5 seconds after sign-in. Per-query fallback wrappers mean a single slow Prisma query no longer takes down the whole panel." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "Flashcards Get Rich Rendering", desc: "Markdown tables and LaTeX formulas now render properly on flashcard front, back, and explanation surfaces. Catches up flashcards to where practice and mock-exam already were." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Accessibility Across Marketing", desc: "Logo &lsquo;Prep&rsquo; suffix, AP/CLEP toggle chips, and pricing refund line all now meet WCAG AA contrast (4.5:1+) in both light and dark mode. Screen-reader users and low-contrast viewers get a measurably more readable experience." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 6.2 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 6.2</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 6.2</h2>
          <p className="text-sm text-muted-foreground">Reliability + accessibility pass — a flurry of small fixes you&apos;ll feel without noticing. Better error pages, clearer login feedback, smoother first paint, and security headers that score A on every external scanner.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Branded Error & 404 Pages", desc: "Stale links and unexpected errors now land on a friendly StudentNest page with three escape hatches (Dashboard / Home / Pricing) and a quotable reference code for support — no more dead-end Next.js fallbacks." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Faster-Feeling Dashboard", desc: "The predicted-score card now shows a skeleton in the right shape instead of a bare spinner, and reassures you when the worker takes longer than usual. No more layout shift when content arrives." },
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Login & Sign-Up Recovery", desc: "Wrong password? You now get a clear, persistent banner with a one-click reset link. Email already registered? Direct link to log in instead. Toasts disappear; banners stay until you act." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Sage Coach Voice Restored", desc: "A regression in our security headers was blocking microphone permission for Sage Coach voice practice. Fixed and verified." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "Onboarding → Premium Path", desc: "Picking Premium during onboarding now reliably routes to /billing instead of bouncing to /dashboard — a race condition in the JWT refresh sequence is fully closed." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Accessibility Polish", desc: "Tighter color contrast across muted text (WCAG AA-compliant), proper heading order on prep pages, password show/hide gets a screen-reader label, and inline links carry an underline at rest — not just on hover." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev1: What's New in Beta 6.1 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 6.1</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 6.1</h2>
          <p className="text-sm text-muted-foreground">Question rendering + sign-up polish — markdown tables and LaTeX now render correctly in practice, mock exam, and diagnostic. Sign-up copy reflects your chosen prep track.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Rich Question Rendering", desc: "Physics, chemistry, and statistics questions with data tables now display as proper tables, not raw pipes. Math formulas render with LaTeX. Applied to practice, mock exam, diagnostic, and FRQ." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Track-Aware Sign-Up", desc: "Starting from the SAT, ACT, or CLEP landing pages now surfaces SAT / ACT / CLEP-specific framing on the sign-up screen instead of defaulting to 'AP exam journey.'" },
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Wall of Fame Public View", desc: "The public leaderboard preview on /wall-of-fame no longer throws 401s in the browser console — anonymous visitors see the real top-10. Personal rank + XP stay gated behind auth." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Cleaner Pass-Rate Links", desc: "The /pass-rates reference table no longer links to difficulty-guide pages we haven't built yet. Data rows stay for honesty; links appear only when the destination exists." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7-prev2: What's New in Beta 6.0 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 6.0</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 6.0</h2>
          <p className="text-sm text-muted-foreground">Conversion funnel overhaul, 5 new AP courses in preparation, and question-quality guardrails responding to community feedback.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Diagnostic → Focused Practice Bridge", desc: "After your diagnostic, see your predicted AP score + a 2-minute focused session on your weakest unit in one click. Insight lands on action, not a dead end." },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "Question Quality Guardrail", desc: "New anti-ambiguity rule rejects exam questions where multiple answers could be defensible — the 'primary / main / most important' trap that Reddit users flagged. Applied to both the generator prompt and the second-pass validator." },
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "5 New AP Courses (In Preparation)", desc: "AP Human Geography, AP U.S. Government, AP Environmental Science, AP Precalculus, and AP English Language scaffolded end-to-end. AP HuGeo and AP Environmental Science already at 500+ College Board-grounded questions; the rest visible to admins while Phase C completes." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Mobile Bottom Nav + Haptics", desc: "Four-tab bar for Home / Practice / Mock / Progress on mobile, hidden during exams. Haptic feedback on every answer — short success pattern on correct, error pattern on wrong. Works on Android; graceful no-op on desktop + iOS pre-18." },
            { icon: Target, color: "text-blue-500", bg: "bg-blue-500/10", title: "Trial Days-Remaining Banner", desc: "A 3-day countdown banner appears at the top of the app once your free trial is within its final 72 hours. Severity escalates on the last day with a direct path to upgrade, so you never miss the renewal window by accident." },
            { icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10", title: "Funnel Instrumentation + Paywall Repair", desc: "Fixed a silent race condition that was blocking 100% of our coach-funnel metrics. Locked-insight overlay now surfaces your full predicted breakdown only after you start a trial, turning the diagnostic into the cleanest path into the paid tier." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7a: Beta 5 history (moved from Latest) */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 5</Badge>
          <h2 className="text-xl font-bold">Beta 5 — College Board-Grounded Catalog</h2>
          <p className="text-sm text-muted-foreground">16 courses at 500+ CB-validated questions. Sage Coach oral training. Parent Invite + retention engine. Auto-quarantine on student reports.</p>
        </div>
      </div>

      {/* Section 7b: What's New in Beta 2.1 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 2.1</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 2.1</h2>
          <p className="text-sm text-muted-foreground">Per-module subscriptions, SEO overhaul, content optimization, and strict course filtering.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-500/10", title: "Per-Module Stripe Subscriptions", desc: `Independent $9.99/mo subscriptions for ${examLabel}. Subscribe to exactly the module you need. Cancel or reactivate each independently.` },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Module-Locked Sidebar", desc: `Sign up from /ap-prep → see only AP courses. SAT → only SAT. No more seeing all ${courseCount} courses — focused experience from day one.` },
            { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", title: "SEO & Content Overhaul", desc: "JSON-LD structured data, OG images, XML sitemap, 4 dedicated prep landing pages with study flows, outcome messaging, and parent trust sections." },
            { icon: Target, color: "text-teal-400", bg: "bg-teal-500/10", title: "Outcome-Driven Copy", desc: "Every page now leads with results: score improvements, prep timelines, cost savings. Comparison tables vs tutors and ChatGPT on pricing page." },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Previous Releases Summary */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Previous releases (Beta 1.0 &ndash; 2.0) introduced the core Sage Live Tutor Sage, daily streaks, spaced repetition, voice input, automated question bank seeding, admin dashboard redesign, annual billing, and a 7-day money-back guarantee.
        </p>
      </div>

      {/* Section 10: Contact */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Get in Touch</h2>
        <p className="text-muted-foreground text-sm">
          Have a question, found a bug, or want to suggest a course? We read everything — reply within 24 hours.
        </p>
        <a
          href="mailto:contact@studentnest.ai"
          className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors"
        >
          <Mail className="h-4 w-4" />
          contact@studentnest.ai
        </a>
        <p className="text-sm text-muted-foreground pt-2">
          For pricing details, see the{" "}
          <Link href="/pricing" className="text-blue-500 hover:text-blue-400 underline">
            Pricing page
          </Link>
          .
        </p>
      </div>

      {/* Section 8: Legal */}
      <div className="border-t border-border/40 pt-8 space-y-2">
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product or site.
          SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product or site.
          ACT® is a registered trademark of ACT, Inc., which is not affiliated with, and does not endorse, this product or site.
        </p>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          StudentNest is an independent educational technology platform. All practice questions and study materials are original works
          created by StudentNest and AI models — not reproduced from any official exam publisher.
        </p>
      </div>

    </div>
  );
}

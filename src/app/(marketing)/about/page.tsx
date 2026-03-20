import { Badge } from "@/components/ui/badge";
import { Globe, Mail, Target, Heart, Sparkles, Flame, Calendar, Trophy, Layers, Mic, Lightbulb, Scale, Crown, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const COURSES = [
  // AP
  { name: "AP World History: Modern",       category: "AP Courses", color: "bg-blue-500/10 text-blue-300 border-blue-500/20 dark:text-blue-300 dark:border-blue-500/20 light:text-blue-700 light:border-blue-400/40" },
  { name: "AP Computer Science Principles", category: "AP Courses", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20" },
  { name: "AP Physics 1: Algebra-Based",    category: "AP Courses", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 border-yellow-500/20" },
  { name: "AP Calculus AB",                 category: "AP Courses", color: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20" },
  { name: "AP Calculus BC",                 category: "AP Courses", color: "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20" },
  { name: "AP Statistics",                  category: "AP Courses", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20" },
  { name: "AP Chemistry",                   category: "AP Courses", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20" },
  { name: "AP Biology",                     category: "AP Courses", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20" },
  { name: "AP US History (APUSH)",          category: "AP Courses", color: "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20" },
  { name: "AP Psychology",                  category: "AP Courses", color: "bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20" },
  // SAT
  { name: "SAT Math",                       category: "SAT Prep",   color: "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20" },
  { name: "SAT Reading & Writing",          category: "SAT Prep",   color: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20" },
  // ACT
  { name: "ACT Math",                       category: "ACT Prep",   color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20" },
  { name: "ACT English",                    category: "ACT Prep",   color: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20" },
  { name: "ACT Science",                    category: "ACT Prep",   color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20" },
  { name: "ACT Reading",                    category: "ACT Prep",   color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20" },
];

const COURSE_CATEGORIES = Array.from(new Set(COURSES.map((c) => c.category)));

const CATEGORY_COLORS: Record<string, string> = {
  "AP Courses": "text-indigo-500 dark:text-indigo-400",
  "SAT Prep":   "text-blue-500 dark:text-blue-400",
  "ACT Prep":   "text-amber-500 dark:text-amber-400",
};


export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-16 text-center">

      {/* Section 1: Opening */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold gradient-text">About StudentNest</h1>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold">Beta 1.11</Badge>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          AP exams shape college admissions. But the best prep tools cost hundreds of dollars — or require hiring a tutor.
          StudentNest exists to change that: world-class AI-powered AP, SAT &amp; ACT prep, free for every student.
        </p>
      </div>

      {/* Section 2: Our Story */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-8 text-left space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold">Why We Built This</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          AP prep hasn&apos;t changed much in 20 years — thick review books, expensive tutors, or generic flashcard apps.
          We built StudentNest to do what a great tutor does: explain <em>why</em>, not just <em>what</em> — then test whether it clicked.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Sage, our AI tutor, is the result of that idea: a study partner that&apos;s available 24/7, never gets impatient,
          and remembers exactly where you&apos;re struggling.
        </p>
      </div>

      {/* Section 3: Mission */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Our Mission</p>
        <p className="text-xl font-semibold text-foreground/90 leading-relaxed max-w-2xl mx-auto">
          &ldquo;Make world-class AP, SAT &amp; ACT prep accessible to every high school student — not just those who can afford a tutor.&rdquo;
        </p>
      </div>

      {/* Section 4: Values */}
      <div className="space-y-4 text-left">
        <h2 className="text-xl font-bold text-center">What We Stand For</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: Target,
              color: "text-indigo-400",
              bg: "bg-indigo-500/10",
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
              color: "text-violet-400",
              bg: "bg-violet-500/10",
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
          <span className="text-muted-foreground font-normal text-base">({COURSES.length} courses)</span>
        </h2>
        {COURSE_CATEGORIES.map((category) => (
          <div key={category} className="space-y-2">
            <p className={`text-xs font-semibold uppercase tracking-wide ${CATEGORY_COLORS[category] ?? "text-muted-foreground"}`}>
              {category}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {COURSES.filter((c) => c.category === category).map((c) => (
                <span
                  key={c.name}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${c.color}`}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 6: Impact Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">In Beta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "16",   label: "Courses covered" },
            { value: "10+",  label: "AP exams supported" },
            { value: "24/7", label: "AI tutor availability" },
            { value: "Free", label: "To start, forever" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border border-border/40 bg-card p-4 space-y-1">
              <p className="text-2xl font-bold gradient-text">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 7: What's New in Beta 1.11 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold mb-2">Latest Release</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 1.11</h2>
          <p className="text-sm text-muted-foreground">Admin dashboard redesigned into two focused pages — monitor platform health and manage content without scrolling past the fold.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: LayoutDashboard, color: "text-indigo-400", bg: "bg-indigo-500/10", title: "Monitor Page",  desc: "Dedicated Overview tab (stats + live infra metrics) and Users tab (recent sign-ups + session feedback). All read-only at a glance." },
            { icon: Sparkles,        color: "text-violet-400", bg: "bg-violet-500/10", title: "Manage Page",  desc: "Question Bank, Coverage, and Config tabs — all write actions consolidated in one place with URL-based bookmarkable tab state." },
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

      {/* Section 7b: Beta 1.10 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 1.10</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 1.10</h2>
          <p className="text-sm text-muted-foreground">Annual billing option and a clearer refund guarantee — making Premium a no-brainer commitment.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Crown, color: "text-indigo-400", bg: "bg-indigo-500/10", title: "Annual Plan Available",        desc: "Save 33% with yearly billing at $79.99/yr (≈$6.67/mo). Toggle monthly vs annual directly on the Pricing page." },
            { icon: Scale, color: "text-green-400",  bg: "bg-green-500/10",  title: "7-Day Money-Back Guarantee",  desc: "Not satisfied within 7 days of your first Premium payment? Email us for a full refund — no questions asked." },
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

      {/* Section 7c: Beta 1.9 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 1.9</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 1.9</h2>
          <p className="text-sm text-muted-foreground">8 engagement features shipped — keeping students consistent matters as much as content quality.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: Flame,     color: "text-orange-400", bg: "bg-orange-500/10", title: "Daily Streaks + Freeze Tokens",  desc: "Build a study habit. Miss a day? Streak freeze tokens protect your progress." },
            { icon: Calendar,  color: "text-blue-400",   bg: "bg-blue-500/10",   title: "Exam Countdown Timer",          desc: "Set your exam date and see a live countdown on every dashboard visit." },
            { icon: Trophy,    color: "text-yellow-400", bg: "bg-yellow-500/10", title: "Weekly Leaderboard",            desc: "See how you rank against other students by XP earned this week." },
            { icon: Layers,    color: "text-teal-400",   bg: "bg-teal-500/10",   title: "Spaced Repetition Review",     desc: "Wrong answers resurface at the exact right moment via SRS scheduling." },
            { icon: Target,    color: "text-indigo-400", bg: "bg-indigo-500/10", title: "Study Goals",                  desc: "Set daily question targets and track completion with a progress ring." },
            { icon: Mic,       color: "text-emerald-400",bg: "bg-emerald-500/10",title: "Voice Input for Sage",         desc: "Ask Sage questions by speaking — hands-free studying while you commute." },
            { icon: Lightbulb, color: "text-violet-400", bg: "bg-violet-500/10", title: "Socratic AI Hints",            desc: "Stuck on a practice question? Sage gives a hint without giving away the answer." },
            { icon: Sparkles,  color: "text-pink-400",   bg: "bg-pink-500/10",   title: "Dashboard UX Overhaul",       desc: "All 8 features surface on the dashboard with zero extra clicks required." },
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

      {/* Section 10: Contact */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Get in Touch</h2>
        <p className="text-muted-foreground text-sm">
          Have a question, found a bug, or want to suggest a course? We read everything — reply within 24 hours.
        </p>
        <a
          href="mailto:contact@studentnest.ai"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          <Mail className="h-4 w-4" />
          contact@studentnest.ai
        </a>
        <p className="text-sm text-muted-foreground pt-2">
          For pricing details, see the{" "}
          <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 underline">
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

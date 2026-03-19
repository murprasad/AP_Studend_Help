import { Badge } from "@/components/ui/badge";
import { Globe, Mail, BookOpen, Brain, BarChart3, Zap } from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-14 text-center">

      {/* Hero */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold gradient-text">About StudentNest</h1>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold">Beta 1.6</Badge>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          StudentNest is an AI-powered exam prep platform built for high school students tackling AP®, SAT®, and ACT® exams.
          We combine adaptive practice, instant AI tutoring, and detailed progress analytics to help every student reach their target score.
          Core features are free — Premium unlocks better AI models for those who want more.
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
        {[
          { icon: Zap,       label: "Practice",       desc: "Adaptive MCQ & FRQ by unit and difficulty" },
          { icon: Brain,     label: "AI Tutor",       desc: "Get instant explanations, then prove you understood it — Sage quizzes you back with 3 targeted questions after every answer" },
          { icon: BarChart3, label: "Analytics",      desc: "Mastery heatmap, streak, XP, and comprehension score" },
          { icon: BookOpen,  label: "Study Plan",     desc: "Personalized weekly plan based on your weak units" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="rounded-xl border border-border/40 bg-card p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-indigo-400" />
            </div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* AI Knowledge Check differentiator */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-left space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">What makes Sage different</span>
        </div>
        <p className="text-base font-semibold">Most AI tutors explain. Sage tests you back.</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          After every explanation, Sage offers 3 multiple-choice questions drawn directly from what it just taught you.
          Answer them, get instant feedback, and see your comprehension score build over time on your Analytics page.
          Active recall — the most effective study technique — built into every conversation.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {["Active recall", "Instant feedback", "Comprehension tracking", "No extra steps"].map(tag => (
            <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* What We Cover */}
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

      {/* What's New */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">What&apos;s New</h2>
        <div className="space-y-2 text-left max-w-xl mx-auto">
          {[
            "AI Knowledge Check — test your understanding after each tutor session",
            "Tutor Comprehension score now tracked on your Analytics page",
            "Cleaner navigation and accessibility improvements throughout",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-indigo-400 flex-shrink-0 mt-0.5">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Contact</h2>
        <p className="text-muted-foreground text-sm">
          Found a bug or want to suggest a new course? We read everything.
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

      {/* Legal & Trademarks — subtle footer, not a warning card */}
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

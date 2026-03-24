import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "About StudentNest Prep — Mission, Science & Course Coverage",
  description: "Learn how StudentNest Prep uses active recall, spaced repetition, and AI tutoring to help students score higher on AP, SAT, ACT, CLEP & DSST exams.",
  openGraph: {
    title: "About | StudentNest Prep",
    description: "AI-powered exam prep built on learning science. 50 courses, free to start.",
  },
};
import { Globe, Mail, Target, Heart, Sparkles, Lightbulb, LayoutDashboard, GraduationCap, ShieldCheck } from "lucide-react";
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
  // CLEP — Composition & Literature
  { name: "CLEP American Literature",                category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Colonial to contemporary American literary works" },
  { name: "CLEP Analyzing & Interpreting Lit",       category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Close reading of prose, poetry, drama" },
  { name: "CLEP College Composition",                category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Thesis, argument, rhetoric, research writing" },
  { name: "CLEP College Composition Modular",        category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Rhetorical analysis, synthesis, argumentation" },
  { name: "CLEP English Literature",                 category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "British literature from Beowulf to modern" },
  { name: "CLEP Humanities",                         category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Literature, art, music, philosophy" },
  // CLEP — History & Social Sciences
  { name: "CLEP American Government",                category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "US government structure, civil rights" },
  { name: "CLEP US History I",                       category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Colonial era through Reconstruction" },
  { name: "CLEP US History II",                      category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Reconstruction to present" },
  { name: "CLEP Human Growth & Development",         category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Lifespan development from birth to death" },
  { name: "CLEP Educational Psychology",             category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Learning theories, motivation, assessment" },
  { name: "CLEP Introductory Psychology",            category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Behavior, cognition, development, disorders" },
  { name: "CLEP Introductory Sociology",             category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Social structures, culture, institutions" },
  { name: "CLEP Macroeconomics",                     category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "GDP, fiscal/monetary policy, international trade" },
  { name: "CLEP Microeconomics",                     category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Supply/demand, market structures, elasticity" },
  { name: "CLEP Social Sciences & History",          category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Cross-disciplinary history, econ, geography" },
  { name: "CLEP Western Civilization I",             category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Ancient Near East through early modern Europe" },
  { name: "CLEP Western Civilization II",            category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Enlightenment to present" },
  // CLEP — Science & Mathematics
  { name: "CLEP Biology",                            category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Cell biology, genetics, evolution, ecology" },
  { name: "CLEP Calculus",                           category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Limits, derivatives, integrals, applications" },
  { name: "CLEP Chemistry",                          category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Atomic structure, bonding, reactions, thermo" },
  { name: "CLEP College Algebra",                    category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Equations, inequalities, functions, graphing" },
  { name: "CLEP College Mathematics",                category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Sets, logic, probability, geometry" },
  { name: "CLEP Natural Sciences",                   category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Biology, physics, earth science, chemistry" },
  { name: "CLEP Precalculus",                        category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Algebra, trigonometry, analytic geometry" },
  // CLEP — Business
  { name: "CLEP Financial Accounting",               category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Journal entries, financial statements, GAAP" },
  { name: "CLEP Information Systems",                category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "IS fundamentals, databases, networks, SDLC" },
  { name: "CLEP Introductory Business Law",          category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Contracts, torts, business organizations" },
  { name: "CLEP Principles of Management",           category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Leadership, planning, organization, control" },
  { name: "CLEP Principles of Marketing",            category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Market strategy, consumer behavior, pricing" },
  // CLEP — World Languages
  { name: "CLEP French (Levels 1 & 2)",              category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20", desc: "Reading, grammar, vocabulary, culture" },
  { name: "CLEP German (Levels 1 & 2)",              category: "CLEP (College Credit)", color: "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20", desc: "Reading, grammar, vocabulary, culture" },
  { name: "CLEP Spanish (Levels 1 & 2)",             category: "CLEP (College Credit)", color: "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20", desc: "Reading, grammar, vocabulary, culture" },
  { name: "CLEP Spanish with Writing",               category: "CLEP (College Credit)", color: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20", desc: "Advanced grammar, error identification, essays" },
  // DSST
  { name: "Principles of Supervision",              category: "DSST (College Credit)", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Leadership, delegation, employee development" },
  { name: "Human Resource Management",              category: "DSST (College Credit)", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Recruitment, compensation, labor relations" },
  { name: "Organizational Behavior",                category: "DSST (College Credit)", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Motivation, group dynamics, organizational culture" },
  { name: "Personal Finance",                       category: "DSST (College Credit)", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Budgeting, investing, insurance, credit management" },
  { name: "Lifespan Developmental Psychology",       category: "DSST (College Credit)", color: "bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20", desc: "Physical, cognitive, social development across the lifespan" },
];

const COURSE_CATEGORIES = Array.from(new Set(COURSES.map((c) => c.category)));

const CATEGORY_COLORS: Record<string, string> = {
  "AP Courses":           "text-blue-500 dark:text-blue-500",
  "SAT Prep":             "text-blue-500 dark:text-blue-400",
  "ACT Prep":             "text-amber-500 dark:text-amber-400",
  "CLEP (College Credit)":"text-emerald-500 dark:text-emerald-400",
  "DSST (College Credit)":"text-orange-500 dark:text-orange-400",
};


export default function AboutPage() {
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
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-semibold">Beta 2.5</Badge>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          AP exams shape college admissions. CLEP exams save thousands in tuition. But the best prep tools cost hundreds of dollars — or require hiring a tutor.
          StudentNest exists to change that: world-class AI-powered AP, SAT, ACT, CLEP &amp; DSST prep, free for every student.
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
          For college students, CLEP exams offer a way to skip intro courses and save thousands — but there&apos;s almost no quality prep out there beyond outdated practice books.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          We built StudentNest to solve both problems. A platform that does what a great tutor does: explain <em>why</em>, not just <em>what</em> — then test whether it clicked.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Sage, our AI tutor, is the result of that idea: a study partner that&apos;s available 24/7, never gets impatient,
          and adapts to exactly where you&apos;re struggling — whether you&apos;re aiming for a 5 on AP World or a passing score on CLEP College Algebra.
        </p>
      </div>

      {/* Section 3: Mission */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Our Mission</p>
        <p className="text-xl font-semibold text-foreground/90 leading-relaxed max-w-2xl mx-auto">
          &ldquo;Make world-class AP, SAT, ACT, CLEP &amp; DSST prep accessible to every student — not just those who can afford a tutor.&rdquo;
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
          Every CLEP practice question goes through a rigorous 9-step quality pipeline
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { step: 1, title: "Topic Distribution",                desc: "Questions match College Board\u2019s official exam topic weights" },
            { step: 2, title: "Bloom\u2019s Taxonomy",             desc: "50%+ questions test application and analysis, not just recall" },
            { step: 3, title: "Scenario-Based",                    desc: "80%+ of questions present real-world scenarios, matching CLEP\u2019s format" },
            { step: 4, title: "Misconception-First Distractors",   desc: "Wrong answers target actual student misconceptions" },
            { step: 5, title: "AI Generation",                     desc: "Gemini 2.5 Pro generates questions calibrated to intro-college level" },
            { step: 6, title: "Cross-Model Validation",            desc: "A second AI model independently validates every question" },
            { step: 7, title: "8-Criterion Review",                desc: "Factual accuracy, single correct answer, distractor quality, cognitive level, exam alignment, scenario check, distractor distinctness, explanation quality" },
            { step: 8, title: "Difficulty Calibration",            desc: "Empirical tracking ensures questions match real CLEP pass rates" },
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
            <span className="font-semibold text-foreground/70">34</span> College Board CLEP exam topic distributions aligned
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/70">120+</span> original calibration question stems validated against
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground/60 leading-relaxed pt-1">
          StudentNest is not affiliated with or endorsed by the College Board. CLEP® is a registered trademark of the College Board.
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
          <span className="text-muted-foreground font-normal text-base">({COURSES.length} courses · AP, SAT, ACT, CLEP &amp; DSST)</span>
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
            { value: "50",   label: "Courses covered" },
            { value: "34",   label: "CLEP exams (college credit)" },
            { value: "24/7", label: "AI tutor availability" },
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

      {/* Section 7: What's New in Beta 2.5 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-semibold mb-2">Latest Release</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 2.5</h2>
          <p className="text-sm text-muted-foreground">DSST exam support, admin user management, expanded payment system, and SEO updates.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: GraduationCap, color: "text-orange-400", bg: "bg-orange-500/10", title: "5 DSST Exams — New Module", desc: "Principles of Supervision, HR Management, Organizational Behavior, Personal Finance, and Lifespan Developmental Psychology. Full course configs, AI question generation, and dedicated landing pages." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Admin Users & Revenue Dashboard", desc: "New admin tab showing all users (free + premium) with date range filtering, search, tier breakdown, and revenue metrics (MRR/ARR)." },
            { icon: Sparkles, color: "text-orange-400", bg: "bg-orange-500/10", title: "DSST Stripe Integration", desc: "Independent $9.99/mo or $79.99/yr DSST Premium subscriptions with dedicated Stripe products, payment links, and webhook handling." },
            { icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "SEO — 55 Courses", desc: "All metadata, FAQ, JSON-LD, sitemap, and PWA manifest updated to include DSST alongside AP, SAT, ACT & CLEP. 55 total courses." },
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

      {/* Section 7b: What's New in Beta 2.1 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 2.1</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 2.1</h2>
          <p className="text-sm text-muted-foreground">Per-module subscriptions, SEO overhaul, content optimization, and strict course filtering.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Per-Module Stripe Subscriptions", desc: "Independent $9.99/mo subscriptions for AP, SAT, ACT, and CLEP. Subscribe to exactly the modules you need. Cancel or reactivate each independently." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Module-Locked Sidebar", desc: "Sign up from /ap-prep → see only AP courses. SAT → only SAT. No more seeing all 50 courses — focused experience from day one." },
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

      {/* Section 7b: What's New in Beta 2.0 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 2.0</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 2.0</h2>
          <p className="text-sm text-muted-foreground">Track-based segmentation — high school and college students now get fully separate, focused experiences from the first click.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "CLEP vs AP/SAT/ACT Tracks",      desc: "Students now choose their path — 'Start AP/SAT/ACT Prep' or 'Start CLEP Prep' — from the landing page. The chosen track is remembered across sessions via localStorage." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Track-Filtered Onboarding",      desc: "Onboarding Step 1 now shows only CLEP courses (emerald accent) or the 16 AP/SAT/ACT courses based on the student's chosen track. No more AP-world for college students." },
            { icon: Sparkles,      color: "text-teal-400",    bg: "bg-teal-500/10",    title: "Track-Filtered Sidebar",         desc: "The sidebar course switcher shows only CLEP groups (for CLEP-track users) or only AP/SAT/ACT groups. A 'Switch to...' link is always visible as an escape hatch." },
            { icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-500/10", title: "Smart Course Defaults",          desc: "First-time CLEP-track users default to CLEP College Algebra instead of AP World History. Existing users see zero change — their stored course is preserved." },
            { icon: Sparkles,      color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Track-Aware Register Page",      desc: "The registration page subtitle dynamically reflects the student's chosen track — 'Start earning college credit' for CLEP, 'Start your AP exam journey' for AP/SAT/ACT." },
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

      {/* Section 7: What's New in Beta 1.15 */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <Badge className="bg-border/60 text-muted-foreground border-border/40 text-xs font-semibold mb-2">Beta 1.15</Badge>
          <h2 className="text-xl font-bold">What&apos;s New in Beta 1.15</h2>
          <p className="text-sm text-muted-foreground">CLEP college-credit prep arrives — 34 CLEP exams with full AI tutoring, practice, and mastery tracking. Save up to $2,400 in tuition per exam.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {[
            { icon: GraduationCap, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "34 CLEP Exams — Full Catalog",   desc: "All 34 official CLEP exams across 5 domains: Composition & Literature, History & Social Sciences, Science & Mathematics, Business, and World Languages — each with 5 units and full AI support." },
            { icon: Sparkles,      color: "text-blue-500",  bg: "bg-blue-500/10",  title: "Sage Tutors CLEP Content",       desc: "The same AI that explains AP topics now handles CLEP subject matter — with resources from OpenStax, Khan Academy, and Wikipedia." },
            { icon: LayoutDashboard, color: "text-teal-400",  bg: "bg-teal-500/10",    title: "Separate Sidebar Section",      desc: "CLEP courses appear as a dedicated 'CLEP Prep' tab in the course switcher, fully isolated from AP/SAT/ACT content." },
            { icon: Sparkles,      color: "text-blue-500",  bg: "bg-blue-500/10",  title: "Legal & Copyright-Safe",        desc: "All CLEP practice questions are original AI-generated content. Resources are from openly licensed sources (OpenStax CC BY, Khan Academy, Wikipedia). CLEP® is a trademark of College Board, which does not endorse this platform." },
            { icon: LayoutDashboard, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "Audience-Split Landing Page",  desc: "The home page now speaks directly to both high school students (AP/SAT/ACT) and college students (CLEP) — with dedicated audience cards, dual CTAs, and above-the-fold ROI messaging for each track." },
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
          Previous releases (Beta 1.9 &ndash; 1.14) introduced daily streaks, spaced repetition, voice input, automated question bank seeding, admin dashboard redesign, annual billing, and a 7-day money-back guarantee.
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
          CLEP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product or site.
          ACT® is a registered trademark of ACT, Inc., which is not affiliated with, and does not endorse, this product or site.
        </p>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          StudentNest is an independent educational technology platform. All practice questions and study materials are original works
          created by StudentNest and AI models — not reproduced from any official exam publisher.
          CLEP curriculum references use publicly available subject descriptions and freely licensed resources (OpenStax CC BY 4.0, Khan Academy, Wikipedia CC BY-SA).
        </p>
      </div>

    </div>
  );
}

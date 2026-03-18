import Link from "next/link";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Questions",
    description: "Practice with thousands of AP-style MCQ, SAQ, DBQ, and LEQ questions generated and validated by AI across multiple AP courses.",
  },
  {
    icon: Target,
    title: "Adaptive Learning",
    description: "Our engine tracks mastery across every unit in your chosen AP course and adjusts difficulty to maximize your growth.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize your mastery by unit, track accuracy over time, and identify weak areas with our heatmap.",
  },
  {
    icon: MessageSquare,
    title: "AI Tutor",
    description: "Ask any AP exam question and get clear, exam-focused explanations with key facts tailored to your course.",
  },
  {
    icon: Clock,
    title: "Mock Exam Mode",
    description: "Simulate the real AP exam with timed sections and get an estimated AP score from 1-5.",
  },
  {
    icon: Trophy,
    title: "Gamified Learning",
    description: "Earn XP, level up, maintain streaks, and unlock achievements as you master your AP courses.",
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
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-violet-950/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
          </h1>
          <p className="text-2xl sm:text-3xl font-semibold text-foreground/90 mb-6">
            Study Smarter. Score Higher.
          </p>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            AI-powered exam preparation for AP, SAT, and ACT with personalized practice, adaptive quizzes, and performance insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8">
                Start Practicing Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Log In
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required. Free tier available.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/40 py-12 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Practice Questions" },
              { value: "16", label: "AP + SAT + ACT Courses" },
              { value: "5", label: "Free Content Sources" },
              { value: "5", label: "Target AP Score" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold text-indigo-400 mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for AP students across multiple courses, with features designed around how the exams actually work.
            </p>
          </div>
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

      {/* Units Coverage */}
      <section className="py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Complete Curriculum Coverage</h2>
              <p className="text-muted-foreground text-lg mb-8">
                We cover every unit across 10 AP courses, SAT, and ACT with hundreds of exam-aligned questions per unit.
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Learning <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {courses.map((course) => (
                <div
                  key={course.name}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/40"
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
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Quick Practice",
                description: "10 questions in 10 minutes. Perfect for daily maintenance and staying sharp.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/20",
              },
              {
                icon: BookOpen,
                title: "Focused Study",
                description: "Deep dive into specific units or topics where you need improvement.",
                color: "text-blue-400",
                bg: "bg-blue-500/20",
              },
              {
                icon: Target,
                title: "Mock Exam",
                description: "Full timed AP exam simulation with estimated score from 1-5.",
                color: "text-purple-400",
                bg: "bg-purple-500/20",
              },
            ].map((mode) => (
              <div key={mode.title} className="p-8 rounded-xl border border-border/40 bg-card text-center">
                <div className={`w-16 h-16 rounded-full ${mode.bg} flex items-center justify-center mx-auto mb-6`}>
                  <mode.icon className={`h-8 w-8 ${mode.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{mode.title}</h3>
                <p className="text-muted-foreground">{mode.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-indigo-950/30 to-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Score a 5?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join students who are using StudentNest to master their AP courses and crush the exam.
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2 text-base px-10">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t border-border/40 py-16 bg-secondary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold">About StudentNest</h2>
          <p className="text-muted-foreground leading-relaxed">
            StudentNest is an AI-powered exam prep platform built for high school students tackling AP, SAT, and ACT exams.
            We combine adaptive practice, instant AI tutoring, and detailed progress analytics to help every student reach their target score.
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
          <p className="text-sm text-muted-foreground">
            © 2025 StudentNest. Your AI Study Partner.
          </p>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Zap,
  BookOpen,
  Globe,
  GraduationCap,
  Database,
  Brain,
  Library,
  Mail,
  Shield,
  BarChart3,
  Layers,
  Play,
  ExternalLink,
  FileText,
  Star,
  Crown,
  CheckCircle,
  XCircle,
  FlaskConical,
  Calculator,
  Microscope,
  TrendingUp,
  Users,
} from "lucide-react";

const COURSES = [
  {
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    name: "AP World History: Modern",
    units: "9 units · 1200 CE – Present",
    desc: "Trade networks, empires, revolutions, industrialization, and globalization.",
    category: "Social Studies",
  },
  {
    icon: Layers,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    name: "AP Computer Science Principles",
    units: "5 units · Creative Development to Impact",
    desc: "Data, algorithms, networks, and the societal impact of computing.",
    category: "Computer Science",
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    name: "AP Physics 1: Algebra-Based",
    units: "10 units · Kinematics to Waves",
    desc: "Forces, energy, momentum, circuits, and mechanical waves.",
    category: "Science",
  },
  {
    icon: Calculator,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    name: "AP Calculus AB",
    units: "8 units · Limits to Integration",
    desc: "Limits, derivatives, integrals, and applications of calculus.",
    category: "Mathematics",
  },
  {
    icon: Calculator,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    name: "AP Calculus BC",
    units: "10 units · Limits to Series",
    desc: "All Calc AB topics plus parametric equations, polar coordinates, and infinite series.",
    category: "Mathematics",
  },
  {
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    name: "AP Statistics",
    units: "9 units · Exploring Data to Inference",
    desc: "Data collection, probability, distributions, and statistical inference.",
    category: "Mathematics",
  },
  {
    icon: FlaskConical,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    name: "AP Chemistry",
    units: "9 units · Atomic Structure to Electrochemistry",
    desc: "Atomic structure, bonding, reactions, thermodynamics, and equilibrium.",
    category: "Science",
  },
  {
    icon: Microscope,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    name: "AP Biology",
    units: "8 units · Chemistry of Life to Ecology",
    desc: "Cell biology, heredity, gene expression, natural selection, and ecosystems.",
    category: "Science",
  },
  {
    icon: Library,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    name: "AP US History (APUSH)",
    units: "9 units · 1491 to Present",
    desc: "Colonial America through modern US history — politics, society, economy, and culture.",
    category: "Social Studies",
  },
  {
    icon: Users,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    name: "AP Psychology",
    units: "9 units · Scientific Foundations to Social Psychology",
    desc: "Biological bases of behavior, learning, cognition, development, and mental health.",
    category: "Social Studies",
  },
];

const AI_SOURCES = [
  {
    icon: Brain,
    color: "text-purple-400",
    name: "Groq (Llama 3.3 70B)",
    desc: "Primary AI engine — ultra-fast inference. Used for Nova chatbot and question generation.",
    badge: "Primary",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    icon: Star,
    color: "text-blue-400",
    name: "Google Gemini 1.5 Flash",
    desc: "High-quality question generation and tutoring. First in the cascade when key is configured.",
    badge: "Fast",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    icon: Brain,
    color: "text-indigo-400",
    name: "Anthropic Claude",
    desc: "Advanced reasoning for complex AP questions and study plans.",
    badge: "Powerful",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    icon: Globe,
    color: "text-green-400",
    name: "Pollinations.ai",
    desc: "Free fallback provider — no API key required. Always available as a last resort.",
    badge: "Free",
    badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
  },
];

const EDU_SOURCES = [
  {
    icon: BookOpen,
    color: "text-emerald-400",
    name: "Fiveable",
    desc: "Study guides and key concept summaries for every AP unit.",
    url: "https://library.fiveable.me",
  },
  {
    icon: Globe,
    color: "text-slate-300",
    name: "Wikipedia / Wikimedia",
    desc: "Live article summaries injected into AI tutor context for factual accuracy.",
    url: "https://en.wikipedia.org",
  },
  {
    icon: Library,
    color: "text-indigo-400",
    name: "Library of Congress",
    desc: "Primary source documents and photographs for History courses.",
    url: "https://www.loc.gov",
  },
  {
    icon: GraduationCap,
    color: "text-blue-400",
    name: "MIT OpenCourseWare",
    desc: "Free MIT course content for Physics and Calculus enrichment.",
    url: "https://ocw.mit.edu",
  },
  {
    icon: FileText,
    color: "text-violet-400",
    name: "Digital Inquiry Group (Stanford)",
    desc: "\"Reading Like a Historian\" lessons for World History and APUSH.",
    url: "https://www.inquirygroup.org",
  },
  {
    icon: Play,
    color: "text-orange-400",
    name: "Code.org",
    desc: "AP CSP curriculum modules and coding activities.",
    url: "https://code.org/educate/csp",
  },
  {
    icon: BookOpen,
    color: "text-amber-400",
    name: "OpenStax",
    desc: "Peer-reviewed free textbooks: Calculus, Physics, Biology, Chemistry, Statistics, and more.",
    url: "https://openstax.org",
  },
  {
    icon: Database,
    color: "text-teal-400",
    name: "Stack Exchange (CC BY-SA)",
    desc: "Physics, Chemistry, CS, and Statistics community Q&A for question enrichment.",
    url: "https://physics.stackexchange.com",
  },
  {
    icon: FlaskConical,
    color: "text-red-400",
    name: "PhET Simulations (Colorado)",
    desc: "Interactive simulations for Physics, Chemistry, and Biology concept visualization.",
    url: "https://phet.colorado.edu",
  },
  {
    icon: TrendingUp,
    color: "text-cyan-400",
    name: "Khan Academy",
    desc: "Free video lessons and exercises for all 10 AP courses.",
    url: "https://www.khanacademy.org",
  },
];

const FEATURES = [
  { icon: Zap, color: "text-yellow-400", label: "AI-Powered Practice", desc: "Unlimited MCQ, FRQ, SAQ, DBQ, and LEQ questions generated on-demand — never run out." },
  { icon: BarChart3, color: "text-blue-400", label: "Mastery Tracking", desc: "Per-unit accuracy and mastery scores updated after every answer." },
  { icon: GraduationCap, color: "text-purple-400", label: "Personalized Study Plans", desc: "AI-generated weekly plans based on your weakest units and exam date." },
  { icon: Brain, color: "text-pink-400", label: "AI Tutor (Deep Dive)", desc: "Ask any AP question and get a detailed, curriculum-aligned explanation with follow-ups." },
  { icon: Shield, color: "text-emerald-400", label: "Mock Exam Mode", desc: "Timed, full-length exam simulations matching real AP timing and format." },
  { icon: Library, color: "text-indigo-400", label: "Resource Library", desc: "Curated textbooks, videos, and simulations per course and unit." },
];

const COURSE_CATEGORIES = Array.from(new Set(COURSES.map((c) => c.category)));

export default function AboutPage() {
  return (
    <div className="space-y-10 max-w-4xl">
      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Globe className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">About NovAP</h1>
            <p className="text-muted-foreground text-sm">Free · AI-powered · Built for students</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          NovAP is an AI-powered AP exam prep platform designed to give every student unlimited,
          personalized practice — at zero cost. We combine free educational APIs, open textbooks,
          and cutting-edge language models so you never run out of quality questions or resources.
          Now supporting <strong className="text-foreground">10 AP courses</strong> across Mathematics, Science, and Social Studies.
        </p>
      </div>

      {/* Mission */}
      <Card className="card-glow border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 text-indigo-400" />
            Our Goal
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            AP prep resources shouldn&apos;t cost hundreds of dollars. NovAP exists to level the
            playing field — giving every student access to high-quality, personalized AP practice
            powered by the same AI technology used in professional educational tools, completely
            free. We believe a student&apos;s ZIP code or budget should never determine their AP score.
          </p>
        </CardContent>
      </Card>

      {/* Courses by category */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Supported AP Courses ({COURSES.length} courses)</h2>
        {COURSE_CATEGORIES.map((category) => (
          <div key={category}>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{category}</p>
            <div className="grid md:grid-cols-3 gap-3">
              {COURSES.filter((c) => c.category === category).map((c) => (
                <Card key={c.name} className={`card-glow ${c.border}`}>
                  <CardContent className="p-4">
                    <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2.5`}>
                      <c.icon className={`h-4 w-4 ${c.color}`} />
                    </div>
                    <p className="font-semibold text-sm leading-tight mb-1">{c.name}</p>
                    <p className={`text-xs font-medium mb-1.5 ${c.color}`}>{c.units}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Platform Features</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.label} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
              <f.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${f.color}`} />
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Transparency */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">How Questions Are Generated</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Full transparency — here&apos;s every AI model and data source NovAP uses.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {AI_SOURCES.map((s) => (
            <div key={s.name} className="flex gap-3 p-4 rounded-xl border border-border/40 bg-card/50">
              <s.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${s.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="text-sm font-medium">{s.name}</p>
                  <Badge className={`text-xs ${s.badgeColor}`}>{s.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          NovAP uses a <strong className="text-foreground">cascade system</strong>: the first available API key is used, automatically falling back to the next provider if one fails. Pollinations.ai requires no key and is always available.
        </p>
      </div>

      {/* Educational data sources */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Free Educational Data Sources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These open resources ground AI answers in accurate curriculum content.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {EDU_SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3.5 rounded-xl border border-border/40 bg-card/50 hover:bg-accent transition-colors group"
            >
              <s.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${s.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Free vs Premium comparison */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Free vs Premium</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you need to ace your AP exam is free. Premium unlocks unlimited AI access, advanced analytics, and full question type support.
          </p>
        </div>

        <div className="rounded-xl border border-border/40 overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-3 bg-secondary/60">
            <div className="p-4 text-sm font-semibold text-muted-foreground">Feature</div>
            <div className="p-4 text-sm font-semibold text-center border-l border-border/40 flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" /> Free
            </div>
            <div className="p-4 text-sm font-semibold text-center border-l border-border/40 flex items-center justify-center gap-2 bg-indigo-500/10">
              <Crown className="h-4 w-4 text-indigo-400" />
              <span className="text-indigo-300">Premium</span>
            </div>
          </div>

          {/* Feature rows */}
          {[
            { feature: "AP Courses Available", free: "All 10 courses", premium: "All 10 courses", highlight: false },
            { feature: "MCQ Practice Questions", free: "Unlimited", premium: "Unlimited", highlight: false },
            { feature: "FRQ / SAQ Practice", free: false, premium: true, highlight: true },
            { feature: "DBQ / LEQ (History)", free: false, premium: true, highlight: true },
            { feature: "Practice Sessions / Day", free: "3 sessions", premium: "Unlimited", highlight: false },
            { feature: "Mock Exam Simulator", free: true, premium: true, highlight: false },
            { feature: "AI Tutor Conversations", free: "10 / day", premium: "Unlimited", highlight: true },
            { feature: "AI Streaming Responses", free: false, premium: true, highlight: true },
            { feature: "Study Plan", free: "Static template", premium: "AI-personalized, updates weekly", highlight: true },
            { feature: "Progress Analytics", free: "Basic", premium: "Advanced + weak-area insights", highlight: false },
            { feature: "Priority AI Model", free: false, premium: true, highlight: false },
            { feature: "Achievements & XP", free: true, premium: true, highlight: false },
            { feature: "Early Access to New Courses", free: false, premium: true, highlight: false },
            { feature: "Email Support", free: false, premium: true, highlight: false },
            { feature: "Price", free: "$0/month", premium: "$9.99/month", highlight: false },
          ].map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 border-t border-border/40 ${i % 2 === 0 ? "" : "bg-secondary/20"} ${row.highlight ? "bg-indigo-500/5" : ""}`}
            >
              <div className="p-3.5 text-sm flex items-center gap-2">
                {row.highlight && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />}
                {row.feature}
              </div>
              <div className="p-3.5 text-sm text-center border-l border-border/40 flex items-center justify-center">
                {typeof row.free === "boolean" ? (
                  row.free
                    ? <CheckCircle className="h-4 w-4 text-emerald-400" />
                    : <XCircle className="h-4 w-4 text-muted-foreground/40" />
                ) : (
                  <span className="text-muted-foreground text-xs">{row.free}</span>
                )}
              </div>
              <div className="p-3.5 text-sm text-center border-l border-border/40 flex items-center justify-center bg-indigo-500/5">
                {typeof row.premium === "boolean" ? (
                  row.premium
                    ? <CheckCircle className="h-4 w-4 text-indigo-400" />
                    : <XCircle className="h-4 w-4 text-muted-foreground/40" />
                ) : (
                  <span className="text-indigo-300 text-xs font-medium">{row.premium}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <Crown className="h-4 w-4" />
          Upgrade to Premium — $9.99/month
        </Link>
      </div>

      {/* Contact */}
      <Card className="card-glow border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5 text-emerald-400" />
            Questions, Feedback & Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Have a question about NovAP, found a bug, or want to suggest a new AP course? We&apos;d love to hear from you!
          </p>
          <a
            href="mailto:murprasad@gmail.com"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            <Mail className="h-4 w-4" />
            murprasad@gmail.com
          </a>
          <p className="text-xs text-muted-foreground">
            Response time: usually within 24–48 hours. All feedback is read and appreciated!
          </p>
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        NovAP is an independent educational project. Not affiliated with College Board, AP®, or any textbook publisher.
        AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
      </p>
    </div>
  );
}

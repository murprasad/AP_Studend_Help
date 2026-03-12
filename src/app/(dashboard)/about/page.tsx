"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  },
  {
    icon: Layers,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    name: "AP Computer Science Principles",
    units: "5 units · Creative Development to Impact",
    desc: "Data, algorithms, networks, and the societal impact of computing.",
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    name: "AP Physics 1: Algebra-Based",
    units: "10 units · Kinematics to Waves",
    desc: "Forces, energy, momentum, circuits, and mechanical waves.",
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
    desc: "Primary source documents and photographs used to enrich World History answers.",
    url: "https://www.loc.gov",
  },
  {
    icon: GraduationCap,
    color: "text-blue-400",
    name: "MIT OpenCourseWare",
    desc: "Free MIT 8.01SC Classical Mechanics content for AP Physics 1 question enrichment.",
    url: "https://ocw.mit.edu",
  },
  {
    icon: FileText,
    color: "text-violet-400",
    name: "Digital Inquiry Group (Stanford)",
    desc: "\"Reading Like a Historian\" lessons and primary-source assessments for World History.",
    url: "https://www.inquirygroup.org",
  },
  {
    icon: Play,
    color: "text-orange-400",
    name: "Code.org",
    desc: "AP CSP curriculum modules and coding activities referenced in question context.",
    url: "https://code.org/educate/csp",
  },
  {
    icon: BookOpen,
    color: "text-amber-400",
    name: "OpenStax",
    desc: "Peer-reviewed free textbooks for World History and College Physics 2e.",
    url: "https://openstax.org",
  },
  {
    icon: Database,
    color: "text-teal-400",
    name: "Stack Exchange (CC BY-SA)",
    desc: "Physics and CS community Q&A used to enrich STEM question context.",
    url: "https://physics.stackexchange.com",
  },
];

const FEATURES = [
  { icon: Zap, color: "text-yellow-400", label: "AI-Powered Practice", desc: "Unlimited MCQ questions generated on-demand by LLMs — never run out." },
  { icon: BarChart3, color: "text-blue-400", label: "Mastery Tracking", desc: "Per-unit accuracy and mastery scores updated after every answer." },
  { icon: GraduationCap, color: "text-purple-400", label: "Personalized Study Plans", desc: "AI-generated weekly plans based on your weakest units." },
  { icon: Brain, color: "text-pink-400", label: "AI Tutor (Deep Dive)", desc: "Ask any AP question and get a detailed, curriculum-aligned explanation." },
  { icon: Shield, color: "text-emerald-400", label: "Mock Exam Mode", desc: "Timed, full-length exam simulations matching real AP timing." },
  { icon: Library, color: "text-indigo-400", label: "Resource Library", desc: "Curated textbooks, videos, and free tools per course and unit." },
];

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
            <h1 className="text-3xl font-bold gradient-text">About PrepNova</h1>
            <p className="text-muted-foreground text-sm">Free · AI-powered · Built for students</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          PrepNova is an AI-powered AP exam prep platform designed to give every student unlimited,
          personalized practice — at zero cost. We combine free educational APIs, open textbooks,
          and cutting-edge language models so you never run out of quality questions or resources.
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
            AP prep resources shouldn&apos;t cost hundreds of dollars. PrepNova exists to level the
            playing field — giving every student access to high-quality, personalized AP practice
            powered by the same AI technology used in professional educational tools, completely
            free. We believe a student&apos;s ZIP code or budget should never determine their AP score.
          </p>
        </CardContent>
      </Card>

      {/* Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Supported AP Courses</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {COURSES.map((c) => (
            <Card key={c.name} className={`card-glow ${c.border}`}>
              <CardContent className="p-5">
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <p className="font-semibold text-sm leading-tight mb-1">{c.name}</p>
                <p className={`text-xs font-medium mb-2 ${c.color}`}>{c.units}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
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
            Full transparency — here&apos;s every AI model and data source PrepNova uses to create questions.
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
          PrepNova uses a <strong className="text-foreground">cascade system</strong>: the first available API key is used, automatically falling back to the next provider if one fails. Pollinations.ai requires no key and is always available.
        </p>
      </div>

      {/* Educational data sources */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold">Free Educational Data Sources</h2>
          <p className="text-sm text-muted-foreground mt-1">
            These open resources are fetched in real-time to ground AI answers in accurate curriculum content.
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
            Have a question about PrepNova, found a bug, or want to suggest a new AP course? We&apos;d love to hear from you!
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
        PrepNova is an independent educational project. Not affiliated with College Board, AP®, or any textbook publisher.
        AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this site.
      </p>
    </div>
  );
}

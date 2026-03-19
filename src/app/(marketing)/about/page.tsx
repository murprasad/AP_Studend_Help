import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Mail, Shield } from "lucide-react";
import Link from "next/link";

const COURSES = [
  // AP
  { name: "AP World History: Modern",       category: "AP Courses", color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { name: "AP Computer Science Principles", category: "AP Courses", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { name: "AP Physics 1: Algebra-Based",    category: "AP Courses", color: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" },
  { name: "AP Calculus AB",                 category: "AP Courses", color: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { name: "AP Calculus BC",                 category: "AP Courses", color: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  { name: "AP Statistics",                  category: "AP Courses", color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  { name: "AP Chemistry",                   category: "AP Courses", color: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  { name: "AP Biology",                     category: "AP Courses", color: "bg-green-500/10 text-green-300 border-green-500/20" },
  { name: "AP US History (APUSH)",          category: "AP Courses", color: "bg-red-500/10 text-red-300 border-red-500/20" },
  { name: "AP Psychology",                  category: "AP Courses", color: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
  // SAT
  { name: "SAT Math",                       category: "SAT Prep",   color: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { name: "SAT Reading & Writing",          category: "SAT Prep",   color: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
  // ACT
  { name: "ACT Math",                       category: "ACT Prep",   color: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  { name: "ACT English",                    category: "ACT Prep",   color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { name: "ACT Science",                    category: "ACT Prep",   color: "bg-green-500/10 text-green-300 border-green-500/20" },
  { name: "ACT Reading",                    category: "ACT Prep",   color: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
];

const COURSE_CATEGORIES = Array.from(new Set(COURSES.map((c) => c.category)));

const CATEGORY_COLORS: Record<string, string> = {
  "AP Courses": "text-indigo-400",
  "SAT Prep":   "text-blue-400",
  "ACT Prep":   "text-amber-400",
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
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs font-semibold">Beta 1.41</Badge>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          StudentNest is an AI-powered exam prep platform built for high school students tackling AP®, SAT®, and ACT® exams.
          We combine adaptive practice, instant AI tutoring, and detailed progress analytics to help every student reach their target score.
          Core features are free — Premium unlocks better AI models for those who want more.
        </p>
      </div>

      {/* What We Cover */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">What We Cover <span className="text-muted-foreground font-normal text-base">({COURSES.length} courses)</span></h2>
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

      {/* Legal & Trademarks */}
      <Card className="card-glow border-amber-500/20 bg-amber-500/5 text-left">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-400" />
            Legal &amp; Trademark Disclaimers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product or site.
          </p>
          <p>
            SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product or site.
          </p>
          <p>
            ACT® is a registered trademark of ACT, Inc. ACT, Inc. is not affiliated with, and does not endorse, this product or site.
          </p>
          <p>
            StudentNest is an independent educational technology platform. All course content, practice questions, and study materials
            are original works created by StudentNest and AI models, not reproduced from College Board, ACT, Inc., or any official exam
            publisher. StudentNest does not claim to represent official exam content.
          </p>
        </CardContent>
      </Card>

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

    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse, ApUnit } from "@prisma/client";
import { CheckCircle, ArrowRight, Clock, GraduationCap, BookOpen, Sparkles, FileText, Calculator } from "lucide-react";
import { FadeIn } from "@/components/landing/fade-in";

// ── Slug → ApCourse mapping ───────────────────────────────────────────────
const SLUG_MAP: Record<string, ApCourse> = {
  "ap-world-history-modern": "AP_WORLD_HISTORY",
  "ap-computer-science-principles": "AP_COMPUTER_SCIENCE_PRINCIPLES",
  "ap-physics-1": "AP_PHYSICS_1",
};

// ── Per-course exam structure copy (sourced from College Board CED) ───────
type ExamSection = {
  name: string;
  timing: string;
  weight: string;
  description: string;
};

type ApExamMeta = {
  examDate: string;
  duration: string;
  scoring: string;
  about: string;
  equivalent: string;
  sections: ExamSection[];
  skills: { label: string; description: string }[];
  unitWeightLabel: string;
  notes?: string;
};

const EXAM_META: Partial<Record<ApCourse, ApExamMeta>> = {
  AP_WORLD_HISTORY: {
    examDate: "May 7, 2026 · 8:00 AM Local",
    duration: "3 hours 15 minutes",
    scoring: "1–5 scale",
    about:
      "AP World History: Modern explores the rise and fall of empires, the evolution of technology, and the cultural and social changes that have shaped the modern world from c. 1200 CE to the present. The course is not about memorizing dates and battles — it is about analyzing primary sources, comparing civilizations, and constructing arguments grounded in evidence.",
    equivalent: "Equivalent to a one-semester introductory college course in modern world history.",
    sections: [
      {
        name: "Section I, Part A — Multiple Choice",
        timing: "55 questions · 55 minutes",
        weight: "40% of exam score",
        description:
          "Sets of 3–4 questions tied to a primary or secondary source stimulus (text, map, image, chart). Tests Historical Thinking Skills and Reasoning Processes.",
      },
      {
        name: "Section I, Part B — Short Answer",
        timing: "3 questions · 40 minutes",
        weight: "20% of exam score",
        description:
          "Each SAQ has 3 parts (A, B, C) requiring 2–4 sentence responses. Two questions are mandatory; the third is a choice between two options.",
      },
      {
        name: "Section II — Document-Based Question (DBQ)",
        timing: "1 question · 60 minutes (15-minute reading period)",
        weight: "25% of exam score",
        description:
          "Argumentative essay analyzing 7 documents to evaluate a historical development. Scored on thesis, contextualization, evidence, analysis/reasoning, and complexity (7 points total).",
      },
      {
        name: "Section II — Long Essay Question (LEQ)",
        timing: "1 question · 40 minutes",
        weight: "15% of exam score",
        description:
          "Choice of 1 of 3 essay prompts on causation, comparison, or continuity & change over time. Scored on thesis, contextualization, evidence, argument, and complexity (6 points total).",
      },
    ],
    skills: [
      { label: "Developments and Processes", description: "Identify and explain historical concepts, developments, and processes." },
      { label: "Sourcing and Situation", description: "Analyze sourcing and situation of primary and secondary sources." },
      { label: "Claims and Evidence in Sources", description: "Analyze arguments in primary and secondary sources." },
      { label: "Contextualization", description: "Analyze the context of historical events, developments, or processes." },
      { label: "Making Connections", description: "Use historical reasoning processes (Comparison, Causation, CCOT) to analyze patterns and connections." },
      { label: "Argumentation", description: "Develop an argument supported by historical evidence." },
    ],
    unitWeightLabel: "Approximate exam weighting per unit (College Board midpoints)",
  },
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    examDate: "May 14, 2026 · 12:00 PM Local",
    duration: "End-of-Course Exam: 2 hours · Performance Task submitted by April 30",
    scoring: "1–5 scale",
    about:
      "AP Computer Science Principles introduces students to the breadth of computing — from how computers represent data and execute algorithms to the ethical and social impact of computing innovations. The course emphasizes computational thinking, collaboration, and creative development through programming.",
    equivalent: "Equivalent to a one-semester introductory college course in computing fundamentals.",
    sections: [
      {
        name: "End-of-Course Exam — Multiple Choice",
        timing: "70 questions · 120 minutes (single-select only)",
        weight: "70% of AP score",
        description:
          "Tests the 5 Big Ideas using AP pseudocode traces, algorithm analysis, data representation, network and cybersecurity scenarios, and questions on the impact of computing.",
      },
      {
        name: "Create Performance Task",
        timing: "Submitted to AP Digital Portfolio by April 30",
        weight: "30% of AP score",
        description:
          "Students develop a working program using collaboration and an iterative process, then submit code, written responses, and a video demonstration. Scored on program purpose, function, and reflection.",
      },
    ],
    skills: [
      { label: "Computational Solution Design", description: "Design and evaluate computational solutions for a purpose." },
      { label: "Algorithms and Program Development", description: "Develop and implement algorithms." },
      { label: "Abstraction in Program Development", description: "Develop programs using abstractions." },
      { label: "Code Analysis", description: "Analyze computational work — your own and that of others." },
      { label: "Computing Innovations", description: "Investigate computing innovations." },
      { label: "Responsible Computing", description: "Contribute to an inclusive, safe, collaborative, and ethical computing culture." },
    ],
    unitWeightLabel: "Big Idea exam weighting (College Board midpoints)",
    notes:
      "Single-select multiple choice only — multi-select questions were removed in the 2024 redesign. The AP CSP Reference Sheet (pseudocode, list operations, robot commands) is provided during the exam.",
  },
  AP_PHYSICS_1: {
    examDate: "May 6, 2026 · 12:00 PM Local",
    duration: "3 hours 10 minutes",
    scoring: "1–5 scale · Equation sheet & calculator provided",
    about:
      "AP Physics 1: Algebra-Based explores the foundations of mechanics — kinematics, dynamics, energy, momentum, rotational motion, oscillations, and fluids. Students design experiments, analyze data, and apply algebra-based reasoning to predict and explain physical phenomena.",
    equivalent: "Equivalent to a first-semester introductory college course in algebra-based physics.",
    sections: [
      {
        name: "Section I — Multiple Choice",
        timing: "50 questions · 90 minutes (single-select only)",
        weight: "50% of exam score",
        description:
          "Conceptual, calculation, graph-interpretation, and experimental questions across all units. Multi-select questions were removed in the 2024 redesign.",
      },
      {
        name: "Section II — Free Response",
        timing: "4 questions · 100 minutes",
        weight: "50% of exam score",
        description:
          "Question types: Mathematical Routines, Translation Between Representations, Experimental Design and Analysis, and Qualitative/Quantitative Translation. Each tests Science Practices in depth.",
      },
    ],
    skills: [
      { label: "Modeling Nature", description: "Describe phenomena and models with figures, equations, and graphs." },
      { label: "Mathematical Routines", description: "Apply mathematics to solve problems and analyze data." },
      { label: "Scientific Questioning and Argumentation", description: "Refine scientific questions and construct evidence-based arguments." },
      { label: "Experimental Method", description: "Design and analyze experiments to test hypotheses." },
      { label: "Data Analysis", description: "Analyze, evaluate, and interpret experimental and theoretical data." },
      { label: "Theoretical Relationships", description: "Develop theoretical relationships between physical quantities." },
      { label: "Argumentation", description: "Construct and defend scientific arguments grounded in physical principles." },
    ],
    unitWeightLabel: "Approximate exam content distribution (College Board ranges, current redesign)",
    notes:
      "Calculator allowed throughout. Equation sheet provided. Algebra-based only — no calculus required.",
  },
};

const SUBJECT_LABEL: Partial<Record<ApCourse, string>> = {
  AP_WORLD_HISTORY: "AP World History",
  AP_COMPUTER_SCIENCE_PRINCIPLES: "AP Computer Science Principles",
  AP_PHYSICS_1: "AP Physics 1",
};

export function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const courseKey = SLUG_MAP[params.slug];
  if (!courseKey) return { title: "Not Found" };
  const config = COURSE_REGISTRY[courseKey];
  const meta = EXAM_META[courseKey];
  if (!meta) return { title: "Not Found" };
  return {
    title: `${config.name} — Exam Format, Units, Practice | StudentNest Prep`,
    description: `${config.name}: ${meta.duration} exam, ${meta.scoring}. Practice every unit free with AI-generated questions matched to College Board format.`,
    openGraph: {
      title: `${config.name} | StudentNest Prep`,
      description: `Free AI-powered ${config.name} prep. Real exam format. Per-unit mastery tracking.`,
      url: `https://studentnest.ai/ap-prep/${params.slug}`,
    },
  };
}

export default function ApSubjectPage({ params }: { params: { slug: string } }) {
  const courseKey = SLUG_MAP[params.slug];
  if (!courseKey) notFound();
  const config = COURSE_REGISTRY[courseKey];
  const meta = EXAM_META[courseKey];
  if (!meta) notFound();
  const units = Object.entries(config.units) as [ApUnit, NonNullable<typeof config.units[ApUnit]>][];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: config.name,
    description: meta.about,
    provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
    isAccessibleForFree: true,
    educationalLevel: "High School / AP",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
      { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "AP Premium" },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <FadeIn>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/ap-prep" className="hover:text-foreground transition-colors">AP Prep</Link>
          <span>/</span>
          <span className="text-foreground">{config.name}</span>
        </div>
      </FadeIn>

      {/* Hero */}
      <FadeIn>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <GraduationCap className="h-3.5 w-3.5" /> Advanced Placement Exam
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{config.name}</h1>
          <p className="text-lg text-muted-foreground">
            Practice every unit with AI-generated questions matched to the official College Board exam format. Free to start.
          </p>
        </div>
      </FadeIn>

      {/* Quick facts */}
      <FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Exam Date", value: meta.examDate.split(" ·")[0], icon: <Clock className="h-4 w-4" /> },
            { label: "Duration", value: meta.duration.split(" · ")[0], icon: <FileText className="h-4 w-4" /> },
            { label: "Scoring", value: meta.scoring.split(" ·")[0], icon: <Calculator className="h-4 w-4" /> },
            { label: "Credit", value: "Most colleges", icon: <GraduationCap className="h-4 w-4" /> },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl border border-border/40 bg-card/50 text-center">
              <div className="flex justify-center text-blue-400">{f.icon}</div>
              <p className="text-sm font-bold mt-1">{f.value}</p>
              <p className="text-xs text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* About the Exam */}
      <FadeIn>
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" /> About the Exam
          </h2>
          <div className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>{meta.about}</p>
            <p className="text-xs italic">{meta.equivalent}</p>
            {meta.notes && <p className="text-xs text-amber-400/80 pt-2 border-t border-border/40">{meta.notes}</p>}
          </div>
        </div>
      </FadeIn>

      {/* Exam Format */}
      <FadeIn>
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" /> Exam Format
          </h2>
          <div className="space-y-2">
            {meta.sections.map((s) => (
              <div key={s.name} className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-1">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="font-semibold text-sm">{s.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                    {s.weight}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/80">{s.timing}</p>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Units & Weights */}
      <FadeIn>
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-400" /> Units &amp; Exam Weights
          </h2>
          <p className="text-xs text-muted-foreground">{meta.unitWeightLabel}</p>
          <div className="space-y-2">
            {units.map(([unitKey, unit]) => {
              const weight = config.topicWeights?.[unitKey];
              const weightPct = weight !== undefined ? `${Math.round(weight * 100)}%` : null;
              return (
                <div key={unitKey} className="p-4 rounded-xl border border-border/40 bg-card/50">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <p className="font-medium text-sm">{unit.name}</p>
                    {weightPct && (
                      <span className="text-xs font-semibold text-blue-400 whitespace-nowrap">{weightPct} of exam</span>
                    )}
                  </div>
                  {unit.timePeriod && (
                    <p className="text-xs text-muted-foreground/80 mt-1">{unit.timePeriod}</p>
                  )}
                  {unit.keyThemes && unit.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {unit.keyThemes.map((theme) => (
                        <span key={theme} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </FadeIn>

      {/* Skills / Practices */}
      <FadeIn>
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" /> Skills &amp; Practices Tested
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {meta.skills.map((s) => (
              <div key={s.label} className="p-3 rounded-xl border border-border/40 bg-card/50">
                <p className="font-medium text-sm text-blue-400">{s.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Resources */}
      {config.collegeBoardLinks && config.collegeBoardLinks.length > 0 && (
        <FadeIn>
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Official College Board Resources</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {config.collegeBoardLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl border border-border/40 bg-card/50 text-sm hover:border-blue-500/40 transition-colors flex items-center justify-between gap-2"
                >
                  <span className="text-muted-foreground">{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-blue-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* CTA */}
      <FadeIn>
        <div className="text-center space-y-4 pt-4">
          <h2 className="text-2xl font-bold">Ready to start practicing {SUBJECT_LABEL[courseKey]}?</h2>
          <p className="text-muted-foreground text-sm">
            Free unlimited practice. AI explanations on every wrong answer. Per-unit mastery tracking.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register?module=ap">
              <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                Start Free Practice <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/ap-prep">
              <Button size="lg" variant="outline">All AP Courses</Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* What we generate */}
      <FadeIn>
        <div className="rounded-xl border border-border/40 bg-card/50 p-5 space-y-2">
          <p className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" /> 100% original questions, calibrated to College Board format
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every practice question is AI-generated and validated against the College Board {config.name} exam style — stem patterns, stimulus depth, distractor types, and difficulty. Cross-model validation catches errors before questions reach students. We never reproduce copyrighted exam content.
          </p>
        </div>
      </FadeIn>

      {/* Trademark */}
      <p className="text-xs text-center text-muted-foreground/60 pt-4">
        AP&reg; is a registered trademark of the College Board, which is not affiliated with StudentNest. All practice questions are original AI-generated content.
      </p>
    </div>
  );
}

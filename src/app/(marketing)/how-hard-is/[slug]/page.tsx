/**
 * /how-hard-is/[slug] — per-exam difficulty guide (SEO landing page).
 *
 * Dynamic route that renders one page per course in VISIBLE_AP_COURSES.
 * Uses real CB / CollegeBoard pass-rate bands for AP (public data) and
 * published ACT / SAT score distributions for the other two families.
 *
 * Ported from PrepLion's CLEP/DSST variant — same layout + FAQPage
 * schema for Google Rich Results, but with AP 1–5 / SAT 400–1600 / ACT
 * 1–36 score logic.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { COURSE_REGISTRY, VISIBLE_AP_COURSES } from "@/lib/courses";
// Uses VISIBLE_AP_COURSES (not VALID) so hidden courses (new 2026 catalog
// expansion in pre-Phase-C state) don't pre-render or accept direct URLs.
import { ApCourse } from "@prisma/client";
import { ArrowRight, BarChart3, Target, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";

function courseToSlug(course: string): string {
  return course.toLowerCase().replace(/_/g, "-");
}

function slugToCourse(slug: string): ApCourse | null {
  const enumValue = slug.toUpperCase().replace(/-/g, "_");
  if ((VISIBLE_AP_COURSES as string[]).includes(enumValue)) return enumValue as ApCourse;
  return null;
}

function examTypeOf(course: string): "AP" | "SAT" | "ACT" {
  if (course.startsWith("SAT_")) return "SAT";
  if (course.startsWith("ACT_")) return "ACT";
  return "AP";
}

// Passing-score line per family.
function passingScoreLabel(examType: "AP" | "SAT" | "ACT"): string {
  if (examType === "AP") return "3+";     // out of 5
  if (examType === "SAT") return "1200";  // conservative college-ready line
  return "24";                            // ACT college-ready
}

// Per-Q timing (average) per family.
function secondsPerQuestion(examType: "AP" | "SAT" | "ACT"): number {
  if (examType === "AP") return 72;
  if (examType === "SAT") return 71;
  return 45; // ACT is famously fast
}

export function generateStaticParams() {
  return VISIBLE_AP_COURSES.map((c) => ({ slug: courseToSlug(c) }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = slugToCourse(params.slug);
  if (!course) return {};
  const config = COURSE_REGISTRY[course];
  const examType = examTypeOf(course);
  return {
    title: `How Hard Is ${examType} ${config.name}? Difficulty Guide 2026`,
    description: `Is ${examType} ${config.name} hard? Difficulty rating, pass rates, study time estimate, unit-by-unit breakdown. Free readiness check included.`,
    alternates: { canonical: `https://studentnest.ai/how-hard-is/${params.slug}` },
  };
}

// Difficulty tiers derived from public CB pass rates (2023-2025 avg) +
// recent AP score distribution reports. Numbers are intentionally ranged
// to avoid false precision; each course updated when new data lands.
const DIFFICULTY_TIERS: Record<string, { rating: string; color: string; studyHours: string; passRate: string }> = {
  // AP — Easy (high 3+ rates, shorter prep)
  AP_PSYCHOLOGY:     { rating: "Moderate", color: "text-amber-500",   studyHours: "40-60",  passRate: "~60%" },
  AP_COMPUTER_SCIENCE_PRINCIPLES: { rating: "Easy-Moderate", color: "text-emerald-500", studyHours: "30-50", passRate: "~65%" },
  // AP — Moderate
  AP_WORLD_HISTORY:  { rating: "Moderate",   color: "text-amber-500", studyHours: "60-90",  passRate: "~62%" },
  AP_US_HISTORY:     { rating: "Moderate",   color: "text-amber-500", studyHours: "60-90",  passRate: "~55%" },
  AP_CALCULUS_AB:    { rating: "Moderate",   color: "text-amber-500", studyHours: "60-90",  passRate: "~58%" },
  AP_STATISTICS:     { rating: "Moderate",   color: "text-amber-500", studyHours: "50-80",  passRate: "~60%" },
  AP_BIOLOGY:        { rating: "Moderate",   color: "text-amber-500", studyHours: "70-100", passRate: "~60%" },
  // AP — Hard
  AP_CHEMISTRY:      { rating: "Hard",       color: "text-red-500",   studyHours: "80-120", passRate: "~55%" },
  AP_CALCULUS_BC:    { rating: "Hard",       color: "text-red-500",   studyHours: "80-120", passRate: "~75%" }, // high 3+ but selection bias
  AP_PHYSICS_1:      { rating: "Hard",       color: "text-red-500",   studyHours: "90-130", passRate: "~45%" }, // hardest 3+ rate
  // SAT — targets and timing dominate difficulty perception
  SAT_MATH:             { rating: "Moderate", color: "text-amber-500", studyHours: "30-60", passRate: "1200+ range" },
  SAT_READING_WRITING:  { rating: "Moderate", color: "text-amber-500", studyHours: "30-60", passRate: "1200+ range" },
  // ACT — famously time-pressured
  ACT_MATH:    { rating: "Moderate-Hard", color: "text-orange-500", studyHours: "25-50", passRate: "24+ range" },
  ACT_ENGLISH: { rating: "Moderate",       color: "text-amber-500",  studyHours: "20-40", passRate: "24+ range" },
  ACT_READING: { rating: "Moderate-Hard",  color: "text-orange-500", studyHours: "20-40", passRate: "24+ range" },
  ACT_SCIENCE: { rating: "Hard",           color: "text-red-500",    studyHours: "25-45", passRate: "24+ range" },
};
const DEFAULT_DIFF = { rating: "Moderate", color: "text-amber-500", studyHours: "40-80", passRate: "~60%" };

export default async function HowHardIsPage({ params }: { params: { slug: string } }) {
  const course = slugToCourse(params.slug);
  if (!course) notFound();
  const config = COURSE_REGISTRY[course];
  if (!config) notFound();

  const examType = examTypeOf(course);
  const units = Object.entries(config.units) as Array<[string, { name: string; keyThemes?: string[] }]>;
  const diff = DIFFICULTY_TIERS[course] || DEFAULT_DIFF;
  const passingLabel = passingScoreLabel(examType);
  const secsPerQ = secondsPerQuestion(examType);

  // Unit-level question counts so the breakdown shows which units are
  // well-supported vs thin. Falls back to empty on DB error.
  const unitCounts = await prisma.question.groupBy({
    by: ["unit"],
    where: { course, isApproved: true },
    _count: { id: true },
  }).catch(() => [] as Array<{ unit: string; _count: { id: number } }>);
  const unitCountMap: Record<string, number> = {};
  for (const u of unitCounts) unitCountMap[u.unit] = u._count.id;
  const totalQuestions = unitCounts.reduce((s, u) => s + u._count.id, 0);
  const avgPerUnit = totalQuestions / Math.max(units.length, 1);

  const faqs = [
    {
      q: `Is ${examType} ${config.name} hard?`,
      a: `${examType} ${config.name} is rated ${diff.rating}. About ${diff.passRate} of test-takers pass or reach the target score. It typically takes ${diff.studyHours} hours of focused study.`,
    },
    {
      q: `What's a passing score for ${examType} ${config.name}?`,
      a: examType === "AP"
        ? `A score of 3, 4, or 5 out of 5 qualifies for college credit at most institutions — the "passing" line. The national ${passingLabel} rate on this exam sits around ${diff.passRate}.`
        : examType === "SAT"
        ? `While the SAT has no "passing" score per se, 1200+ is generally considered competitive for many colleges. Top programs look for 1400+.`
        : `ACT doesn't have a formal passing score; 24+ is the national "college-ready" benchmark and 30+ is competitive for top programs.`,
    },
    {
      q: `How many hours should I study for ${examType} ${config.name}?`,
      a: `Plan for ${diff.studyHours} hours of focused study. A StudentNest diagnostic identifies which units you already know so you can skip them and cut prep time.`,
    },
    {
      q: `What's the hardest part of ${examType} ${config.name}?`,
      a: `${config.name} covers ${units.length} unit${units.length === 1 ? "" : "s"}. Difficulty varies by unit — your diagnostic identifies your specific weak spots so you can prioritize them.`,
    },
    {
      q: examType === "AP"
        ? `Can I self-study ${config.name} and still pass?`
        : `Can I improve my ${examType} ${config.name} score in a month?`,
      a: examType === "AP"
        ? `Yes. Self-studiers who use mastery-based practice (take a diagnostic, focus on weak units, practice under timed conditions, take a mock exam before the real test) regularly score 3 or higher.`
        : `Yes. A 4-week focused plan — diagnostic on Day 1, 30 min daily practice on weak areas, 2 full-length mocks — moves most students into the 1200+ (SAT) or 24+ (ACT) range.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `How Hard Is ${examType} ${config.name}?`,
      description: `Difficulty: ${diff.rating}. Pass rate: ${diff.passRate}. Study time: ${diff.studyHours} hours.`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://studentnest.ai" },
          { "@type": "ListItem", position: 2, name: "Difficulty Guides" },
          { "@type": "ListItem", position: 3, name: config.name },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-3">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">{examType} Difficulty Guide</p>
        <h1 className="text-3xl font-bold">How Hard Is {examType} {config.name}?</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about the difficulty of {examType} {config.name} — pass rates, study time, and which units are toughest.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-secondary/30 text-center">
          <p className={`text-xl font-bold ${diff.color}`}>{diff.rating}</p>
          <p className="text-[10px] text-muted-foreground">Difficulty</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 text-center">
          <p className="text-xl font-bold text-foreground">{diff.passRate}</p>
          <p className="text-[10px] text-muted-foreground">{examType === "AP" ? "3+ rate" : "Target range"}</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 text-center">
          <p className="text-xl font-bold text-foreground">{diff.studyHours}h</p>
          <p className="text-[10px] text-muted-foreground">Avg Study Time</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 text-center">
          <p className="text-xl font-bold text-foreground">{passingLabel}</p>
          <p className="text-[10px] text-muted-foreground">Target Score</p>
        </div>
      </div>

      {/* Unit-by-unit breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-blue-500" /> Unit-by-Unit Difficulty Breakdown</h2>
        <div className="space-y-2">
          {units.map(([unitKey, unitMeta], i) => {
            const qCount = unitCountMap[unitKey] || 0;
            const unitDiff = qCount > avgPerUnit * 1.2 ? "Heavy" : qCount < avgPerUnit * 0.8 ? "Light" : "Standard";
            const unitColor = unitDiff === "Heavy" ? "text-red-500" : unitDiff === "Light" ? "text-emerald-500" : "text-amber-500";
            return (
              <div key={unitKey} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-secondary/20">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-6 flex-shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{unitMeta.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{unitMeta.keyThemes?.slice(0, 3).join(", ")}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={`text-xs font-semibold ${unitColor}`}>{unitDiff}</p>
                  <p className="text-[10px] text-muted-foreground">{qCount} questions</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips to pass */}
      <div className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> How to Pass {examType} {config.name}</h2>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li><span className="font-medium text-foreground">Take a diagnostic first</span> — find out which units you already know and which need work</li>
          <li><span className="font-medium text-foreground">Focus on weak units</span> — skip what you know, drill what you don&apos;t</li>
          <li><span className="font-medium text-foreground">Practice under timed conditions</span> — the real exam averages ~{secsPerQ} seconds per question</li>
          <li><span className="font-medium text-foreground">Take a mock exam</span> — if you score at or above the target on a timed mock, you&apos;re ready</li>
          <li><span className="font-medium text-foreground">Don&apos;t overstudy</span> — most prepared students pass in {diff.studyHours} hours of focused prep</li>
        </ol>
      </div>

      {/* FAQ — matches FAQPage structured data for Google Rich Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group p-4 rounded-xl border border-border/40 bg-card/50">
              <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between gap-2 list-none">
                <span>{f.q}</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">Find out if you&apos;re ready right now</h2>
        <p className="text-sm text-muted-foreground">Take a free readiness check — no account needed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/am-i-ready/${courseToSlug(course)}`}>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Target className="h-4 w-4" /> Check My Readiness <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/register?course=${course}&from=difficulty`}>
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              Start Free Practice
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        {examType === "AP"
          ? "AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product."
          : examType === "SAT"
          ? "SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this product."
          : "ACT® is a registered trademark of ACT, Inc., which is not affiliated with, and does not endorse, this product."}
      </p>
    </div>
  );
}

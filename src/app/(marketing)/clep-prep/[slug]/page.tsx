import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { isClepEnabled } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { CheckCircle, ArrowRight, Clock, GraduationCap, BookOpen } from "lucide-react";
import { FadeIn } from "@/components/landing/fade-in";

// Slug → ApCourse mapping
const SLUG_MAP: Record<string, ApCourse> = {
  "college-algebra": "CLEP_COLLEGE_ALGEBRA",
  "college-composition": "CLEP_COLLEGE_COMPOSITION",
  "introductory-psychology": "CLEP_INTRO_PSYCHOLOGY",
  "principles-of-marketing": "CLEP_PRINCIPLES_OF_MARKETING",
  "principles-of-management": "CLEP_PRINCIPLES_OF_MANAGEMENT",
  "introductory-sociology": "CLEP_INTRODUCTORY_SOCIOLOGY",
  "american-government": "CLEP_AMERICAN_GOVERNMENT",
  "macroeconomics": "CLEP_MACROECONOMICS",
  "microeconomics": "CLEP_MICROECONOMICS",
  "biology": "CLEP_BIOLOGY",
  "us-history-1": "CLEP_US_HISTORY_1",
  "us-history-2": "CLEP_US_HISTORY_2",
  "human-growth-development": "CLEP_HUMAN_GROWTH_DEV",
  "calculus": "CLEP_CALCULUS",
  "chemistry": "CLEP_CHEMISTRY",
  "financial-accounting": "CLEP_FINANCIAL_ACCOUNTING",
  "american-literature": "CLEP_AMERICAN_LITERATURE",
  "analyzing-interpreting-literature": "CLEP_ANALYZING_INTERPRETING_LIT",
  "college-composition-modular": "CLEP_COLLEGE_COMP_MODULAR",
  "english-literature": "CLEP_ENGLISH_LITERATURE",
  "humanities": "CLEP_HUMANITIES",
  "educational-psychology": "CLEP_EDUCATIONAL_PSYCHOLOGY",
  "social-sciences-history": "CLEP_SOCIAL_SCIENCES_HISTORY",
  "western-civilization-1": "CLEP_WESTERN_CIV_1",
  "western-civilization-2": "CLEP_WESTERN_CIV_2",
  "college-mathematics": "CLEP_COLLEGE_MATH",
  "natural-sciences": "CLEP_NATURAL_SCIENCES",
  "precalculus": "CLEP_PRECALCULUS",
  "information-systems": "CLEP_INFORMATION_SYSTEMS",
  "business-law": "CLEP_BUSINESS_LAW",
  "french": "CLEP_FRENCH",
  "german": "CLEP_GERMAN",
  "spanish": "CLEP_SPANISH",
  "spanish-writing": "CLEP_SPANISH_WRITING",
};

export function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const courseKey = SLUG_MAP[params.slug];
  if (!courseKey) return { title: "Not Found" };
  const config = COURSE_REGISTRY[courseKey];
  return {
    title: `${config.name} Prep — Pass in 7 Days | StudentNest Prep`,
    description: `Pass the ${config.name} exam in 7 days with AI-powered practice. 5 units, free resources. Save $1,200+ in tuition. Free to start.`,
    openGraph: {
      title: `${config.name} Prep | StudentNest`,
      description: `AI-powered ${config.name} prep. Pass in 7 days and earn college credit.`,
      url: `https://studentnest.ai/clep-prep/${params.slug}`,
    },
  };
}

export default async function CLEPSubjectPage({ params }: { params: { slug: string } }) {
  if (!(await isClepEnabled())) permanentRedirect(`https://preplion.ai/clep-prep/${params.slug}`);
  const courseKey = SLUG_MAP[params.slug];
  if (!courseKey) notFound();
  const config = COURSE_REGISTRY[courseKey];
  const units = Object.entries(config.units);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: config.name,
    description: config.curriculumContext?.split(".")[0] || `AI-powered ${config.name} prep`,
    provider: { "@type": "Organization", name: "StudentNest Prep", url: "https://studentnest.ai" },
    isAccessibleForFree: true,
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
      { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "CLEP Premium" },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <FadeIn>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/clep-prep" className="hover:text-foreground transition-colors">CLEP Prep</Link>
          <span>/</span>
          <span className="text-foreground">{config.name}</span>
        </div>
      </FadeIn>

      {/* Hero */}
      <FadeIn>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
            <GraduationCap className="h-3.5 w-3.5" /> CLEP Exam
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{config.name} Prep</h1>
          <p className="text-lg text-muted-foreground">Pass in 7 days with AI-powered practice. Save $1,200+ in tuition.</p>
        </div>
      </FadeIn>

      {/* Quick facts */}
      <FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Exam Cost", value: "$93", icon: "💰" },
            { label: "Time", value: `${config.examSecsPerQuestion ? Math.round((config.examSecsPerQuestion * 100) / 60) : 90} min`, icon: "⏱️" },
            { label: "Credits", value: "3-6", icon: "🎓" },
            { label: "Passing", value: "~50/80", icon: "✅" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl border border-border/40 bg-card/50 text-center">
              <span className="text-lg">{f.icon}</span>
              <p className="text-sm font-bold mt-1">{f.value}</p>
              <p className="text-xs text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Units breakdown */}
      <FadeIn>
        <div className="space-y-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-700 dark:text-emerald-400" /> What You'll Study
          </h2>
          <div className="space-y-2">
            {units.map(([key, unit]) => (
              <div key={key} className="p-4 rounded-xl border border-border/40 bg-card/50">
                <p className="font-medium text-sm">{unit.name}</p>
                {unit.keyThemes && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unit.keyThemes.map((theme) => (
                      <span key={theme} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Free resources */}
      {config.tutorResources && (
        <FadeIn>
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Free Study Resources</h2>
            <div className="p-4 rounded-xl border border-border/40 bg-card/50 text-sm text-muted-foreground whitespace-pre-line">
              {config.tutorResources.replace(/\\n/g, "\n")}
            </div>
          </div>
        </FadeIn>
      )}

      {/* CTA */}
      <FadeIn>
        <div className="text-center space-y-4 pt-4">
          <h2 className="text-2xl font-bold">Ready to pass {config.shortName || config.name}?</h2>
          <p className="text-muted-foreground">Build your 7-day plan and start practicing today.</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/register?module=clep`}>
              <Button size="lg" className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                Build My 7-Day Plan <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/clep-prep">
              <Button size="lg" variant="outline">All 34 CLEP Exams</Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Trademark */}
      <p className="text-xs text-center text-muted-foreground pt-4">
        CLEP® is a registered trademark of College Board, which is not affiliated with StudentNest. All practice questions are original AI-generated content.
      </p>
    </div>
  );
}

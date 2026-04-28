import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { isDsstEnabled } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { ArrowRight, GraduationCap, BookOpen } from "lucide-react";
import { FadeIn } from "@/components/landing/fade-in";

const SLUG_MAP: Record<string, ApCourse> = {
  "principles-of-supervision": "DSST_PRINCIPLES_OF_SUPERVISION",
  "human-resource-management": "DSST_HUMAN_RESOURCE_MANAGEMENT",
  "organizational-behavior": "DSST_ORGANIZATIONAL_BEHAVIOR",
  "personal-finance": "DSST_PERSONAL_FINANCE",
  "lifespan-developmental-psychology": "DSST_LIFESPAN_DEV_PSYCHOLOGY",
  "intro-to-business": "DSST_INTRO_TO_BUSINESS",
  "human-development": "DSST_HUMAN_DEVELOPMENT",
  "ethics-in-america": "DSST_ETHICS_IN_AMERICA",
  "environmental-science": "DSST_ENVIRONMENTAL_SCIENCE",
  "technical-writing": "DSST_TECHNICAL_WRITING",
  "principles-of-finance": "DSST_PRINCIPLES_OF_FINANCE",
  "management-information-systems": "DSST_MANAGEMENT_INFO_SYSTEMS",
  "money-and-banking": "DSST_MONEY_AND_BANKING",
  "substance-abuse": "DSST_SUBSTANCE_ABUSE",
  "criminal-justice": "DSST_CRIMINAL_JUSTICE",
  "fundamentals-of-counseling": "DSST_FUNDAMENTALS_OF_COUNSELING",
  "general-anthropology": "DSST_GENERAL_ANTHROPOLOGY",
  "world-religions": "DSST_WORLD_RELIGIONS",
  "art-of-the-western-world": "DSST_ART_WESTERN_WORLD",
  "astronomy": "DSST_ASTRONOMY",
  "computing-and-it": "DSST_COMPUTING_AND_IT",
  "civil-war-and-reconstruction": "DSST_CIVIL_WAR",
};

export function generateStaticParams() {
  return Object.keys(SLUG_MAP).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const courseKey = SLUG_MAP[params.slug];
  if (!courseKey) return { title: "Not Found" };
  const config = COURSE_REGISTRY[courseKey];
  return {
    title: `${config.name} Prep — Pass and Save $1,000+ | StudentNest Prep`,
    description: `Pass the ${config.name} exam with AI-powered practice. 5 units, free resources. Save $1,000+ in tuition. Free to start.`,
    openGraph: {
      title: `${config.name} Prep | StudentNest`,
      description: `AI-powered ${config.name} DSST prep. Pass and earn college credit.`,
      url: `https://studentnest.ai/dsst-prep/${params.slug}`,
    },
  };
}

export default async function DSSTSubjectPage({ params }: { params: { slug: string } }) {
  if (!(await isDsstEnabled())) permanentRedirect(`https://preplion.ai/dsst-prep/${params.slug}`);
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
      { "@type": "Offer", price: "9.99", priceCurrency: "USD", name: "DSST Premium" },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <FadeIn>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dsst-prep" className="hover:text-foreground transition-colors">DSST Prep</Link>
          <span>/</span>
          <span className="text-foreground">{config.name}</span>
        </div>
      </FadeIn>

      {/* Hero */}
      <FadeIn>
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-medium">
            <GraduationCap className="h-3.5 w-3.5" /> DSST Exam
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{config.name} Prep</h1>
          <p className="text-lg text-muted-foreground">Pass with AI-powered practice. Save $1,000+ in tuition.</p>
        </div>
      </FadeIn>

      {/* Quick facts */}
      <FadeIn>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Exam Cost", value: "$85", icon: "💰" },
            { label: "Time", value: "120 min", icon: "⏱️" },
            { label: "Credits", value: "3", icon: "🎓" },
            { label: "Passing", value: "~400/500", icon: "✅" },
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
            <BookOpen className="h-5 w-5 text-orange-700 dark:text-orange-400" /> What You&apos;ll Study
          </h2>
          <div className="space-y-2">
            {units.map(([key, unit]) => (
              <div key={key} className="p-4 rounded-xl border border-border/40 bg-card/50">
                <p className="font-medium text-sm">{unit.name}</p>
                {unit.keyThemes && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {unit.keyThemes.map((theme) => (
                      <span key={theme} className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
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
          <p className="text-muted-foreground">Build your study plan and start practicing today.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/register?module=dsst">
              <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                Build My Study Plan <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dsst-prep">
              <Button size="lg" variant="outline">All 22 DSST Exams</Button>
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Trademark */}
      <p className="text-xs text-center text-muted-foreground pt-4">
        DSST is a registered trademark of Prometric, which is not affiliated with StudentNest. All practice questions are original AI-generated content.
      </p>
    </div>
  );
}

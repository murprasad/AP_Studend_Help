import type { Metadata } from "next";
import { CbProductPage } from "@/components/marketing/cb-product-page";
import { getVisibleCourses } from "@/lib/settings";

// 2026-05-31 — Rebuilt against shared CB product-page template so the
// landing → /act-prep navigation lands on a CB-consistent destination
// (#102).

export const metadata: Metadata = {
  title: "ACT Prep — Practice for All 4 Sections | StudentNest Prep",
  description:
    "Boost your ACT score with exam-aligned practice across Math, English, Science, and Reading. Section-specific tutoring and score tracking. Free to start.",
  openGraph: {
    title: "ACT Prep | StudentNest Prep",
    description:
      "Exam-aligned ACT prep. All 4 sections. Section-specific Sage Live Tutor. Free to start.",
    url: "https://studentnest.ai/act-prep",
  },
};

const allCourses = [
  {
    enum: "ACT_MATH",
    name: "ACT Math",
    units: 5,
    desc: "Pre-algebra through trigonometry — 5 choices per question (only common exam with the 5-choice format).",
  },
  {
    enum: "ACT_ENGLISH",
    name: "ACT English",
    units: 3,
    desc: "Grammar, punctuation, sentence structure, and rhetorical skills.",
  },
  {
    enum: "ACT_SCIENCE",
    name: "ACT Science",
    units: 3,
    desc: "Data representation, research summaries, conflicting viewpoints.",
  },
  {
    enum: "ACT_READING",
    name: "ACT Reading",
    units: 4,
    desc: "Literary, social science, humanities, and natural science passages.",
  },
];

export default async function ActPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses =
    allowlist === "all"
      ? allCourses
      : allCourses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ACT Prep Courses",
    description:
      visibleCourses.length > 0
        ? `${visibleCourses.length} ACT sections with exam-aligned practice`
        : "Rebuilding ACT question banks",
    numberOfItems: visibleCourses.length,
    itemListElement: visibleCourses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.name,
        description: `${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking.`,
        provider: {
          "@type": "Organization",
          name: "StudentNest Prep",
          url: "https://studentnest.ai",
        },
        isAccessibleForFree: true,
        offers: [
          { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
          {
            "@type": "Offer",
            price: "9.99",
            priceCurrency: "USD",
            name: "ACT Premium",
            billingIncrement: "P1M",
          },
        ],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CbProductPage
        family="ACT"
        headline="Boost your ACT score 3+ points — focus on what matters."
        subhead="Math, English, Science, Reading. Each section drills its content domains independently. We adapt to your weak areas first."
        diagnosticHref="/register?module=act"
        ctaLabel="Start free ACT diagnostic"
        courses={visibleCourses}
        bottomCtaText="Pick your section. Take 10 questions. See your projected ACT composite."
      />
    </>
  );
}

import type { Metadata } from "next";
import { CbProductPage } from "@/components/marketing/cb-product-page";
import { getVisibleCourses } from "@/lib/settings";

// 2026-05-31 — Rebuilt against shared CB product-page template so the
// landing → /psat-prep navigation lands on a CB-consistent destination
// (#102). The previous violet-hero + BrowserFrame mockup layout broke
// the brand handoff from the cobalt landing tiles.

export const metadata: Metadata = {
  title: "PSAT Prep — National Merit Practice & Score Tracking | StudentNest Prep",
  description:
    "PSAT/NMSQT prep with adaptive practice for Math and Reading & Writing. Targeting weak areas, timed practice, and National Merit Selection Index tracking. Free to start.",
  openGraph: {
    title: "PSAT Prep | StudentNest Prep",
    description:
      "Adaptive PSAT/NMSQT prep. Math + Reading & Writing. National Merit aware. Free to start.",
    url: "https://studentnest.ai/psat-prep",
  },
};

const allCourses = [
  {
    enum: "PSAT_MATH",
    name: "PSAT Math",
    units: 4,
    desc: "Algebra, advanced math, problem-solving & data analysis, geometry & trigonometry. PSAT difficulty cap.",
  },
  {
    enum: "PSAT_READING_WRITING",
    name: "PSAT Reading & Writing",
    units: 4,
    desc: "Short passages with evidence-based reasoning + grammar. Same skills as the SAT, easier ceiling.",
  },
];

export default async function PsatPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses =
    allowlist === "all"
      ? allCourses
      : allCourses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "PSAT Prep Courses",
    description:
      visibleCourses.length > 0
        ? "PSAT/NMSQT prep with adaptive practice"
        : "PSAT bank rebuilding",
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
            name: "PSAT Premium",
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
        family="PSAT"
        headline="Crush the PSAT — and qualify for National Merit."
        subhead="October PSAT/NMSQT tests the same skills as the SAT — capped at SAT MEDIUM difficulty. Drill the weak units and the Selection Index works in your favor."
        diagnosticHref="/register?module=psat"
        ctaLabel="Start free PSAT diagnostic"
        courses={visibleCourses}
        bottomCtaText="Pick your section. Take 10 questions. See your projected PSAT score."
      />
    </>
  );
}

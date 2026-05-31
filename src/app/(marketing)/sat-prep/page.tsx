import type { Metadata } from "next";
import { CbProductPage } from "@/components/marketing/cb-product-page";
import { getVisibleCourses } from "@/lib/settings";

// 2026-05-31 — Rebuilt against shared CB product-page template so the
// landing → /sat-prep navigation lands on a CB-consistent destination
// (#102). Plays with the SAT=CB parity initiative (#100): copy now
// reflects the digital SAT 2-module adaptive structure + Desmos.

export const metadata: Metadata = {
  title: "SAT Prep — Practice & Score Tracking | StudentNest Prep",
  description:
    "Digital SAT prep with 2-module adaptive practice, built-in Desmos calculator, and 200-800 scaled scoring per section. Free to start, no credit card.",
  openGraph: {
    title: "SAT Prep | StudentNest Prep",
    description:
      "Digital SAT prep that matches Bluebook: 2-module adaptive sections, Desmos, scaled scoring. Free to start.",
    url: "https://studentnest.ai/sat-prep",
  },
};

const allCourses = [
  {
    enum: "SAT_MATH",
    name: "SAT Math",
    units: 4,
    desc: "Algebra, advanced math, problem-solving & data analysis, geometry & trigonometry. 44 Qs / 70 min, ~25% SPR, calculator throughout.",
  },
  {
    enum: "SAT_READING_WRITING",
    name: "SAT Reading & Writing",
    units: 4,
    desc: "Craft & structure, information & ideas, standard English conventions, expression of ideas. 54 Qs / 64 min, 1-2 paragraph passage per question.",
  },
];

export default async function SatPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses =
    allowlist === "all"
      ? allCourses
      : allCourses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "SAT Prep Courses",
    description:
      visibleCourses.length > 0
        ? "Digital SAT prep with 2-module adaptive practice"
        : "SAT bank rebuilding",
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
            name: "SAT Premium",
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
        family="SAT"
        headline="Raise your SAT score 100-200 points."
        subhead="Digital SAT prep that matches Bluebook: 2-module adaptive sections, built-in Desmos calculator, and a real 200-800 scaled score after each practice mock."
        diagnosticHref="/register?module=sat"
        ctaLabel="Start free SAT diagnostic"
        courses={visibleCourses}
        bottomCtaText="Pick your section. Take 10 questions. See your projected SAT score."
      />
    </>
  );
}

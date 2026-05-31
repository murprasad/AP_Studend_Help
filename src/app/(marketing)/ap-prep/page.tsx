import type { Metadata } from "next";
import { CbProductPage } from "@/components/marketing/cb-product-page";
import { getVisibleCourses } from "@/lib/settings";

// 2026-05-31 — Rebuilt against shared CB product-page template so the
// landing → /ap-prep navigation lands on a CB-consistent destination
// (#102). The dynamic per-course flashcards/practice subpages under
// /ap-prep/[slug] remain unchanged and continue to use their own
// detail layout.

export const metadata: Metadata = {
  title: "AP Exam Prep — Practice & Tutoring | StudentNest Prep",
  description:
    "Score a 5 on your AP exam with exam-aligned practice questions, instant feedback, and mastery tracking across 14 AP courses. Free to start.",
  openGraph: {
    title: "AP Exam Prep | StudentNest Prep",
    description:
      "Exam-aligned AP prep. 14 courses. Instant explanations. Mastery tracking. Free to start.",
    url: "https://studentnest.ai/ap-prep",
  },
};

// Short descriptors per AP course — kept terse so the grid stays scannable.
const allCourses = [
  { enum: "AP_WORLD_HISTORY",               name: "AP World History: Modern",       units: 9,  desc: "Civilizations, empires, revolutions, globalization, MCQ + SAQ + DBQ + LEQ." },
  { enum: "AP_COMPUTER_SCIENCE_PRINCIPLES", name: "AP CS Principles",               units: 5,  desc: "Algorithms, data, internet, impact of computing. MCQ + 2 written responses." },
  { enum: "AP_PHYSICS_1",                   name: "AP Physics 1",                   units: 10, desc: "Kinematics, forces, energy, momentum, rotation, oscillations, fluids." },
  { enum: "AP_CALCULUS_AB",                 name: "AP Calculus AB",                 units: 8,  desc: "Limits, derivatives, integrals, differential equations." },
  { enum: "AP_CALCULUS_BC",                 name: "AP Calculus BC",                 units: 10, desc: "All AB topics plus series, parametric, polar." },
  { enum: "AP_STATISTICS",                  name: "AP Statistics",                  units: 9,  desc: "Data analysis, probability, inference, regression." },
  { enum: "AP_CHEMISTRY",                   name: "AP Chemistry",                   units: 9,  desc: "Atomic structure, bonding, reactions, thermodynamics, kinetics." },
  { enum: "AP_BIOLOGY",                     name: "AP Biology",                     units: 8,  desc: "Cells, genetics, evolution, ecology, physiology." },
  { enum: "AP_US_HISTORY",                  name: "AP US History",                  units: 9,  desc: "Colonial era through modern America. MCQ + SAQ + DBQ + LEQ." },
  { enum: "AP_PSYCHOLOGY",                  name: "AP Psychology",                  units: 5,  desc: "Biological bases, cognition, development, social psychology, mental health." },
  { enum: "AP_ENVIRONMENTAL_SCIENCE",       name: "AP Environmental Science",       units: 9,  desc: "Ecosystems, biodiversity, populations, pollution, sustainability." },
  { enum: "AP_HUMAN_GEOGRAPHY",             name: "AP Human Geography",             units: 7,  desc: "Population, migration, culture, agriculture, cities, development." },
  { enum: "AP_US_GOVERNMENT",               name: "AP US Government & Politics",    units: 5,  desc: "Constitutional foundations, branches, civil liberties, ideology, participation." },
  { enum: "AP_PRECALCULUS",                 name: "AP Precalculus",                 units: 4,  desc: "Polynomial & rational, exponential & log, trig & polar, functions." },
];

export default async function ApPrepPage() {
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleCourses =
    allowlist === "all"
      ? allCourses
      : allCourses.filter((c) => allowlist.includes(c.enum));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AP Exam Prep Courses",
    description: `${visibleCourses.length} AP courses with exam-aligned practice and Sage tutoring`,
    numberOfItems: visibleCourses.length,
    itemListElement: visibleCourses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.name,
        description: `${c.name} prep with ${c.units} units of practice, mastery tracking, and instant explanations.`,
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
            name: "AP Premium",
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
        family="AP"
        headline="Score a 5 on your AP exams."
        subhead="14 AP courses with exam-aligned practice, instant explanations, and mastery tracking per unit. Walk into May ready, not panicking."
        diagnosticHref="/register?module=ap"
        ctaLabel="Start free AP diagnostic"
        courses={visibleCourses}
        bottomCtaText="Pick your AP exam. Take 10 questions. See your projected 1-5 score."
      />
    </>
  );
}

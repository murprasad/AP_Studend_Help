import type { Metadata } from "next";
import { LandingFaq } from "@/components/landing/faq";
import { isClepEnabled, isDsstEnabled, getExamLabel, getCourseCount } from "@/lib/settings";

export const metadata: Metadata = {
  title: "FAQ — StudentNest Prep",
  description: "Frequently asked questions about StudentNest Prep — pricing, features, Sage Live Tutor, refunds, and more.",
  openGraph: {
    title: "FAQ | StudentNest Prep",
    description: "Answers to common questions about StudentNest Prep for AP, SAT & ACT.",
  },
};

// Cold-start defense (Beta 8.0 hotfix #3): see pricing/page.tsx — same fix.
async function safeFlag(p: () => Promise<boolean>, fallback: boolean): Promise<boolean> {
  try { return await p(); } catch { return fallback; }
}

export default async function FaqPage() {
  const [clepOn, dsstOn] = await Promise.all([
    safeFlag(isClepEnabled, false),
    safeFlag(isDsstEnabled, false),
  ]);
  const examLabel = getExamLabel(clepOn, dsstOn);
  const courseCount = getCourseCount(clepOn, dsstOn);

  const coverageParts = ["10 AP courses", "SAT Math & Reading/Writing", "4 ACT sections"];
  if (clepOn) coverageParts.push("34 CLEP exams");
  if (dsstOn) coverageParts.push("22 DSST exams");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Is StudentNest really free?", acceptedAnswer: { "@type": "Answer", text: `Yes. Free accounts get unlimited MCQ practice across all ${courseCount} courses, 5 Sage Live Tutor chats per day, a basic study plan, and mastery analytics. No credit card required.` } },
      { "@type": "Question", name: "How much does Premium cost?", acceptedAnswer: { "@type": "Answer", text: `Premium is $9.99/month or $79.99/year (save 33%) per module. Modules: ${examLabel}.` } },
      { "@type": "Question", name: "Is there a refund policy?", acceptedAnswer: { "@type": "Answer", text: "Yes. 7-day refund policy on all Premium subscriptions." } },
      { "@type": "Question", name: "How is StudentNest different from ChatGPT?", acceptedAnswer: { "@type": "Answer", text: "ChatGPT gives random answers. StudentNest gives structured, exam-aligned practice with mastery tracking, personalized study plans, and comprehension verification." } },
      { "@type": "Question", name: "What exams do you cover?", acceptedAnswer: { "@type": "Answer", text: `${coverageParts.join(", ")} — ${courseCount} courses total.` } },
    ],
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Visually-hidden h1 for SEO + screen-reader landmark (K1 fix 2026-04-24).
          LandingFaq's top heading is h2 because it's used as a section on other
          pages; the /faq page needs its own h1. */}
      <h1 className="sr-only">Frequently Asked Questions</h1>
      <LandingFaq clepEnabled={clepOn} dsstEnabled={dsstOn} />
    </div>
  );
}

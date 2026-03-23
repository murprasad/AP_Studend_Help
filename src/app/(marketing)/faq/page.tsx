import type { Metadata } from "next";
import { LandingFaq } from "@/components/landing/faq";

export const metadata: Metadata = {
  title: "FAQ — StudentNest Prep",
  description: "Frequently asked questions about StudentNest Prep — pricing, features, AI tutoring, refunds, and more.",
  openGraph: {
    title: "FAQ | StudentNest Prep",
    description: "Answers to common questions about StudentNest Prep for AP, SAT, ACT & CLEP.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is StudentNest really free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Free accounts get unlimited MCQ practice across all 22 courses, 5 AI tutor chats per day, a basic study plan, and mastery analytics. No credit card required." } },
    { "@type": "Question", name: "How much does Premium cost?", acceptedAnswer: { "@type": "Answer", text: "Premium is $9.99/month or $79.99/year (save 33%) per module. Modules: AP, SAT, ACT, CLEP." } },
    { "@type": "Question", name: "Is there a refund policy?", acceptedAnswer: { "@type": "Answer", text: "Yes. 7-day refund policy on all Premium subscriptions." } },
    { "@type": "Question", name: "How is StudentNest different from ChatGPT?", acceptedAnswer: { "@type": "Answer", text: "ChatGPT gives random answers. StudentNest gives structured, exam-aligned practice with mastery tracking, personalized study plans, and comprehension verification." } },
    { "@type": "Question", name: "What exams do you cover?", acceptedAnswer: { "@type": "Answer", text: "10 AP courses, SAT Math & Reading/Writing, 4 ACT sections, and 6 CLEP exams — 22 courses total." } },
  ],
};

export default function FaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingFaq />
    </div>
  );
}

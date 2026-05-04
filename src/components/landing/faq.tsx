"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getExamLabel, getCourseCount } from "@/lib/exam-label";

interface LandingFaqProps {
  clepEnabled?: boolean;
  dsstEnabled?: boolean;
}

function buildFaqs(clepOn: boolean, dsstOn: boolean) {
  const courseCount = getCourseCount(clepOn, dsstOn);
  const examLabel = getExamLabel(clepOn, dsstOn);

  // 2026-05-03 — CLEP/DSST removed from StudentNest. Coverage now reflects only
  // the courses that pass the bank-quality bar (≥200 approved questions). Listing
  // specific course names was a regression: users would see "AP US History" in
  // the FAQ but the course is hidden in-app because its bank is too thin.
  // Phrased generically so the answer remains true as banks expand.
  // preplion-intentional: cross-product handoff for CLEP/DSST seekers
  const coverageAnswer = "AP, SAT, and ACT — only the courses that pass our quality bar (≥200 vetted questions per course) show up in the app. We add courses as their banks reach the bar. Looking for CLEP or DSST? Those live on PrepLion.ai.";

  return [
    {
      q: "Is it really free?",
      a: `Yes. Free accounts get unlimited MCQ practice across all ${courseCount} courses, 5 Sage Live Tutor chats per day, a basic study plan, and per-unit mastery analytics. No credit card required, no time limit.`,
    },
    {
      q: "How is this different from ChatGPT?",
      a: "ChatGPT gives random answers with no structure. StudentNest gives exam-aligned practice questions, tracks mastery by unit, builds a personalized study plan, and Sage quizzes you back to verify comprehension. It's structured prep, not a chatbot.",
    },
    {
      q: "What exams do you cover?",
      a: coverageAnswer,
    },
    {
      q: "Can parents track their child's progress?",
      a: "Yes. The analytics dashboard shows per-unit mastery scores, accuracy trends, study streaks, and estimated exam scores — all visible in real time. Parents can review progress together with their child.",
    },
    {
      q: "Is there a refund policy?",
      a: "Yes. Premium subscriptions come with a 7-day refund policy. If you're not satisfied, contact us within 7 days of your purchase for a full refund.",
    },
    {
      q: "How does the AI work?",
      a: "Sage uses large language models to generate exam-aligned questions, provide instant explanations, and build personalized study plans. Every question passes a 5-criterion validation check for accuracy, answer clarity, distractor quality, cognitive level, and exam alignment.",
    },
  ];
}

export function LandingFaq({ clepEnabled = false, dsstEnabled = false }: LandingFaqProps) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = buildFaqs(clepEnabled, dsstEnabled);

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm">Quick answers to common questions about StudentNest Prep.</p>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

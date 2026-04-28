"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "What's the easiest CLEP exam to pass?",
    answer:
      "Based on pass rates and student feedback, Introductory Sociology, Introductory Psychology, and Analyzing & Interpreting Literature are consistently rated the easiest. Most students with basic familiarity pass these with 1-2 weeks of focused prep.",
  },
  {
    question: "Can I really pass a CLEP exam in 7 days?",
    answer:
      "Yes — if you have some background in the subject. Our 7-day plan focuses only on what's tested, not everything in the textbook. Students with prior coursework or life experience often pass in under a week. If you're starting from scratch, plan for 2-3 weeks.",
  },
  {
    question: "Do all colleges accept CLEP credit?",
    answer:
      "Over 2,900 colleges accept CLEP, but policies vary by school and exam. Before testing, check your school's CLEP policy — most post it online or you can call the registrar. Military-friendly schools almost always accept CLEP.",
  },
  {
    question: "How is CLEP different from AP exams?",
    answer:
      "AP exams require a year-long course and are offered once per year in May. CLEP exams can be taken any time, require no course, and you can prepare at your own pace. CLEP is ideal for self-studiers, working adults, and anyone who wants credits faster.",
  },
  {
    question: "What happens if I fail a CLEP exam?",
    answer:
      "You must wait 3 months before retaking the same exam. Your score is only sent to colleges you choose, so a failed attempt stays private. Use the 3-month gap to practice with Sage and hit 70%+ mastery before rebooking.",
  },
  {
    question: "Is StudentNest enough or do I need a textbook?",
    answer:
      "For most exams, StudentNest's AI-generated practice questions and Sage tutoring are sufficient. We also link free resources (OpenStax textbooks, Khan Academy) for deeper review. You don't need to buy anything.",
  },
  {
    question: "How much does a CLEP exam cost?",
    answer:
      "Each CLEP exam costs $93 (set by College Board). Some test centers charge an additional sitting fee of $15-35. Active military members can take CLEP exams for free through DANTES. StudentNest prep is free to start.",
  },
  {
    question: "When can I take a CLEP exam?",
    answer:
      "Any time — CLEP exams are offered year-round at test centers nationwide. There are no fixed national test dates like SAT or AP. Most centers have openings within 1-2 weeks. You can also take some CLEPs via remote proctoring from home.",
  },
];

export function CLEPFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CLEP Questions? We&apos;ve Got Answers.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know before your first CLEP exam.
          </p>
        </div>

        <div className="divide-y divide-border">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`transition-colors duration-200 ${
                  isOpen ? "border-l-2 border-l-emerald-500 pl-4" : "border-l-2 border-l-transparent pl-4"
                }`}
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between py-5 text-left gap-4"
                >
                  <span
                    className={`text-base font-medium transition-colors duration-200 ${
                      isOpen ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                    }`}
                  >
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

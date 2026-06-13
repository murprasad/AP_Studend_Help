import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Metadata } from "next";
import { InteractiveTry } from "./interactive-try";

export const metadata: Metadata = {
  title: "Free SAT Practice Questions — No Login Required",
  description: "Answer real-level digital SAT practice questions right now — pick an answer and see why it's right, instantly. No signup, no email.",
  alternates: { canonical: "https://studentnest.ai/free-sat-practice" },
};

// Digital SAT is 4-option (A-D). Exam-level practice (not leaked content).
const SAMPLE_QS = [
  {
    subject: "Math — Heart of Algebra",
    stem: "If 3x − 7 = 2x + 5, what is the value of x?",
    options: ["A) −2", "B) 6", "C) 12", "D) −12"],
    correct: "C",
    explanation: "Subtract 2x from both sides: x − 7 = 5. Add 7: x = 12. A common trap is B, which comes from subtracting 7 instead of adding it.",
  },
  {
    subject: "Reading & Writing — Standard English",
    stem: "Choose the option that best completes the sentence:\n\"The committee, after reviewing the proposals, ___ to fund the research.\"",
    options: ["A) have decided", "B) has decided", "C) deciding", "D) have been deciding"],
    correct: "B",
    explanation: "\"Committee\" is a singular collective noun taking a singular verb: \"has decided.\" A and D use the plural \"have,\" and C is not a finite verb.",
  },
  {
    subject: "Math — Problem Solving & Data",
    stem: "A shirt is on sale for 20% off its original price of $40. What is the sale price?",
    options: ["A) $20", "B) $32", "C) $8", "D) $48"],
    correct: "B",
    explanation: "20% of $40 is $8 off, so $40 − $8 = $32. C is the discount amount, not the sale price; D adds the discount instead of subtracting.",
  },
  {
    subject: "Reading & Writing — Words in Context",
    stem: "\"The scientist's claims were met with ___ skepticism; nearly every reviewer doubted the results.\" Which word best fits?",
    options: ["A) mild", "B) reluctant", "C) widespread", "D) occasional"],
    correct: "C",
    explanation: "\"Nearly every reviewer doubted\" signals broad doubt, so \"widespread\" fits. \"Mild\" and \"occasional\" understate it; \"reluctant\" describes a manner, not the extent.",
  },
  {
    subject: "Math — Advanced Math",
    stem: "What are the solutions to x² − 5x + 6 = 0?",
    options: ["A) x = 1 and x = 6", "B) x = −2 and x = −3", "C) x = 2 and x = 3", "D) x = 5 and x = 6"],
    correct: "C",
    explanation: "Factor: (x − 2)(x − 3) = 0, so x = 2 or x = 3. B has the right factors but wrong signs; the roots of (x−2)(x−3) are positive.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are these real SAT questions?",
      acceptedAnswer: { "@type": "Answer", text: "These are exam-level practice questions written to the digital SAT's content and difficulty — not leaked exam content. A student who can answer these is tracking at a competitive level." },
    },
    {
      "@type": "Question",
      name: "Is the SAT digital now?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — the SAT is fully digital and adaptive, with 4-option multiple-choice questions across Reading & Writing and Math. These samples match that format." },
    },
  ],
};

export default function FreeSatPracticePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />

      <header className="text-center space-y-3">
        <p className="text-sm font-medium text-primary uppercase tracking-wide">Free · No Login</p>
        <h1 className="text-4xl font-bold">Free SAT Practice Questions</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Answer five real-level digital SAT questions right now — pick an answer and see why it&apos;s right, instantly. No signup, no email.
        </p>
      </header>

      {/* Item 0 — interactive no-signup taste (answer → instant explanation → win → convert). */}
      <InteractiveTry questions={SAMPLE_QS} />

      {/* Static list (SEO-crawlable + for skimmers). */}
      <details className="rounded-2xl border border-border/40 bg-card p-6 group">
        <summary className="cursor-pointer font-semibold">Prefer to just read all five with explanations?</summary>
        <div className="mt-4 space-y-6">
          {SAMPLE_QS.map((q, i) => (
            <div key={i} className="border-t border-border/30 pt-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">{q.subject}</p>
              <p className="font-semibold whitespace-pre-line">Question {i + 1}: {q.stem}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {q.options.map((o) => (<li key={o} className="text-muted-foreground">{o}</li>))}
              </ul>
              <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" /> Answer: {q.correct}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">{q.explanation}</p>
            </div>
          ))}
        </div>
      </details>

      <p className="text-center text-sm text-muted-foreground">
        Already studying? <Link href="/am-i-ready" className="text-primary underline">See your readiness with a free diagnostic →</Link>
      </p>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Why practice with explanations matters</h2>
        <p className="text-muted-foreground">
          The best SAT prep isn&apos;t a score — it&apos;s learning from every question. Each one above shows you exactly why the right answer is right, so a miss becomes a point you won&apos;t lose on test day. Practice this way and the real test feels like another practice session.
        </p>
        <p className="text-muted-foreground">
          Explore full prep on the <Link href="/sat-prep" className="text-primary underline">SAT prep hub</Link>, or try the{" "}
          <Link href="/act-prep" className="text-primary underline">ACT</Link> and{" "}
          <Link href="/psat-prep" className="text-primary underline">PSAT</Link>.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Focus, Clock, BatteryMedium, Volume2, Coffee, HeartHandshake, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Focus-Friendly Test Prep — Built for Students Who Learn Differently | StudentNest",
  description:
    "AP, SAT & ACT prep designed for students who learn differently. Focus Mode, extended time, energy check-ins, read-aloud, built-in breaks, and streak forgiveness — all in the standard plan. Short sessions that actually stick.",
  keywords: [
    "ADHD test prep",
    "focus friendly study",
    "SAT prep for ADHD",
    "ACT prep extended time",
    "study tools for students who learn differently",
    "test anxiety practice",
    "executive function study app",
  ],
  openGraph: {
    title: "Focus-Friendly Test Prep — Built for Students Who Learn Differently",
    description:
      "Focus Mode, extended time, energy check-ins, read-aloud, built-in breaks, and streak forgiveness — short study sessions designed to actually stick.",
    type: "website",
  },
  alternates: { canonical: "/focus-friendly" },
};

const features = [
  {
    icon: Focus,
    title: "Focus Mode",
    body: "A distraction-reduced view that shows one question at a time. Less on the screen, less to pull your attention away.",
  },
  {
    icon: Clock,
    title: "Extended time",
    body: "Practice and full mock exams at 1×, 1.5×, or 2× — the same accommodation many students use on the real exam. Show what you know without racing the clock.",
  },
  {
    icon: BatteryMedium,
    title: "Energy check-in",
    body: "A five-second “how’s my energy?” at the start sizes the session to your day. Low energy? A 5-question set still counts.",
  },
  {
    icon: Volume2,
    title: "Read-aloud",
    body: "Have questions and explanations read to you. Helpful when reading long passages is the hard part, not the thinking.",
  },
  {
    icon: Coffee,
    title: "Built-in breaks",
    body: "Long mock exams pace in short blocks with breaks built in — no two-hour marathons. Several small wins a day beat one exhausting grind.",
  },
  {
    icon: HeartHandshake,
    title: "Streak forgiveness",
    body: "One rough day doesn’t break your streak. The students who improve aren’t the ones who never miss — they’re the ones who come back tomorrow.",
  },
];

export default function FocusFriendlyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is StudentNest designed for students with ADHD?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "StudentNest includes focus-friendly study tools designed for students who learn differently — Focus Mode, extended time, energy check-ins, read-aloud, built-in breaks, and streak forgiveness. These are general study aids, not a medical or diagnostic feature, and they help any student who finds long sessions, distractions, or timed tests hard.",
        },
      },
      {
        "@type": "Question",
        name: "Do the focus tools cost extra?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Every focus-friendly tool is part of the standard StudentNest plan — there is no separate ADHD tier or add-on. You can start free with a 10-question diagnostic, no credit card required.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use extended time on practice tests?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can set practice and full mock exams to 1.5× or 2× time, the same accommodation many students use on the real exam, so you can show what you know without racing the clock.",
        },
      },
    ],
  };

  return (
    <main className="bg-white text-cb-indigo">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white/15 mb-5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Focus-friendly by design
          </span>
          <h1 className="font-roboto-slab font-bold tracking-tight text-4xl sm:text-5xl leading-[1.05] max-w-3xl">
            Test prep built for students who learn differently.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
            If long sessions drain you, distractions pull you off task, or the clock makes your mind go
            blank &mdash; that&apos;s not a limit on what you can score. It means you need tools built for how
            you actually work. StudentNest has them, in the standard plan.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-start">
            <Link
              href="/register?track=focus"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              Start free <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <span className="text-sm text-white/70">No credit card. Free forever, Premium optional.</span>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl mb-3">Six tools that make focus the easy path</h2>
          <p className="text-cb-muted text-base max-w-2xl mb-10">
            None of these are extras or a separate plan. They&apos;re part of how StudentNest works for everyone.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-cb-cardBorder p-6">
                <f.icon className="h-6 w-6 text-cb-cobalt mb-3" aria-hidden />
                <h3 className="font-medium text-lg mb-1.5">{f.title}</h3>
                <p className="text-cb-muted text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For parents */}
      <section className="bg-cb-bandGray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl mb-4">For parents</h2>
          <p className="text-cb-muted text-base max-w-2xl leading-relaxed mb-4">
            The most useful question isn&apos;t &ldquo;what did you get?&rdquo; &mdash; it&apos;s &ldquo;did you
            practice today?&rdquo; The Parent view focuses on the habit, not the score: study days, streaks, and
            time on task. A student who needs a different approach isn&apos;t behind &mdash; they just need tools
            that fit.
          </p>
          <Link href="/register?track=focus" className="inline-flex items-center gap-2 text-sm font-medium text-cb-cobalt hover:gap-3 transition-all">
            See how it works <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* CTA + disclaimer */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl mb-4">Try a focus-friendly session free</h2>
          <p className="text-white/85 max-w-xl mx-auto mb-8">
            Start with a 10-question diagnostic. Turn on Focus Mode, pick your pace, and see how it feels.
          </p>
          <Link
            href="/register?track=focus"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
          >
            Start free <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-10 text-[12px] text-white/55 max-w-2xl mx-auto leading-relaxed">
            StudentNest&apos;s focus tools are general, accommodations-style study aids designed for students who
            learn differently. They are not a medical device and make no diagnostic or treatment claims. For
            accommodations on official exams, consult College Board, ACT, or your school.
          </p>
        </div>
      </section>
    </main>
  );
}

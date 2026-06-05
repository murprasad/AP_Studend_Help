import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Study Strategies for Students Who Learn Differently — StudentNest Prep",
  description:
    "Focus-friendly, evidence-based study strategies for students who find long study sessions, distractions, or timed tests hard. Short sessions, extended time, energy check-ins, and more.",
  openGraph: {
    title: "Study Strategies for Students Who Learn Differently",
    description:
      "Short sessions, distraction control, extended time, and energy-aware studying — practical strategies for students who learn differently.",
  },
  alternates: { canonical: "/blog/study-strategies-learn-differently" },
};

export default function Article() {
  return (
    <article className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      <div className="space-y-3">
        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
          Study Tips
        </span>
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          Study Strategies for Students Who Learn Differently
        </h1>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> 6 min read · For students, parents &amp; coaches
        </p>
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Not everyone studies the same way. If long sessions drain you, distractions pull you off task,
          or the clock on a practice test makes your mind go blank, that doesn&apos;t mean you can&apos;t do
          well — it means the standard advice (&ldquo;just sit down and grind for two hours&rdquo;) was
          never built for how you work. Here are practical, evidence-based strategies that fit students who
          learn differently, and how to set them up so they actually stick.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">1. Trade long sessions for short, frequent ones</h2>
        <p>
          Attention is a budget, not a switch. If your best focus lasts 10–20 minutes, plan around that:
          a 10-question set, a short break, then another. Several small wins a day beat one exhausting
          marathon — and spacing practice across days is one of the most reliable ways to remember more.
          Consistency is the real score-mover, not session length.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">2. Make the clock work for you, not against you</h2>
        <p>
          Time pressure can turn a question you know into a blank. If that&apos;s you, build untimed reps
          first to lock in the method, then add time gradually. On full practice tests, giving yourself
          extended time (say 1.5x) lets you show what you actually know instead of racing — the same
          accommodation many students use on the real exam.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">3. Control the environment before you start</h2>
        <p>
          Willpower is a weak defense against a buzzing phone. Remove the distraction instead of resisting
          it: phone in another room, one browser tab, a distraction-reduced study view that shows one
          question at a time. The goal is to make focus the path of least resistance.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">4. Check your energy and pick a pace</h2>
        <p>
          A five-second question — &ldquo;how&apos;s my energy right now?&rdquo; — saves a lot of wasted
          time. Low-energy day? A short 5–10 question set still counts and keeps your streak alive.
          High-energy day? Go longer. Matching the session to the day beats forcing the same plan every time.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">5. Treat a bad session as information, not failure</h2>
        <p>
          One rough set is normal — everyone has off days. The students who improve aren&apos;t the ones who
          never miss; they&apos;re the ones who come back the next day. Forgive the streak, look at what the
          misses have in common, and move on.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">For parents and coaches</h2>
        <p>
          The most useful question you can ask isn&apos;t &ldquo;what did you get?&rdquo; — it&apos;s
          &ldquo;did you practice today?&rdquo; Celebrate the habit. Help protect a distraction-free 15
          minutes. And remember that a student who needs a different approach isn&apos;t behind — they just
          need tools that fit.
        </p>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-foreground">
          <p className="font-semibold mb-1">Built-in Focus tools</p>
          <p className="text-sm text-muted-foreground">
            StudentNest includes focus-friendly study aids designed for students who learn differently —
            Focus Mode, extended time on practice and mock exams, energy check-ins, and a 5-minute
            study-style quiz — all part of the standard plan. They&apos;re general study tools, not a
            medical or diagnostic feature.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border/40">
        <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:underline">
          Try a focus-friendly study session free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

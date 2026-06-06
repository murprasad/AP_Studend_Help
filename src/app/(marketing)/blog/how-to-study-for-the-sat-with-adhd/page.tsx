import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "How to Study for the SAT or ACT with ADHD — StudentNest Prep",
  description:
    "Focus-friendly, evidence-based ways to prep for the SAT or ACT when long sessions and timed tests are hard. Short spaced reps, distraction control, extended time, body-doubling, and energy-aware pacing.",
  openGraph: {
    title: "How to Study for the SAT or ACT with ADHD",
    description:
      "Short spaced sessions, distraction control, untimed-then-timed reps, accountability, and energy-aware pacing — practical SAT/ACT prep for students who learn differently.",
  },
  alternates: { canonical: "/blog/how-to-study-for-the-sat-with-adhd" },
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
          How to Study for the SAT or ACT with ADHD
        </h1>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> 7 min read · For students, parents &amp; coaches
        </p>
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          The SAT and ACT reward two things that can feel stacked against students who learn differently:
          long, sustained focus and steady performance under a ticking clock. If you find that marathon
          study sessions drain you, that the smallest notification derails an hour, or that the timer makes
          a question you know go blank, you are not behind &mdash; the usual advice (&ldquo;just sit down and
          grind&rdquo;) was never designed for how your attention actually works. Below are practical,
          evidence-based study strategies built around that reality.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">1. Short spaced sessions beat marathons</h2>
        <p>
          Attention is a budget, not a switch. If your best focus runs 10&ndash;20 minutes, plan around it:
          a 10-question set, a real break, then another. Spacing your practice across several days &mdash;
          rather than cramming it into one long block &mdash; is one of the most reliable ways to remember
          more on test day. Three short sessions on three different days will almost always out-score one
          two-hour grind. Consistency, not session length, is the real score-mover.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">2. Control the environment before you start</h2>
        <p>
          Willpower is a weak defense against a buzzing phone. Instead of resisting distraction, remove it:
          phone in another room, one browser tab open, notifications off, and a study view that shows one
          question at a time. If background noise helps you settle, brown noise or instrumental music can
          give your attention something steady to anchor to. The goal is to make focus the path of least
          resistance rather than a constant act of self-control.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">3. Build untimed reps first, then add the clock</h2>
        <p>
          Time pressure can turn a question you understand into a freeze. If that&apos;s you, separate the
          two skills. First, practice untimed to lock in the method and build genuine confidence. Once the
          approach is automatic, reintroduce the clock gradually &mdash; generous limits first, then closer
          to real pacing. When you take full practice tests, giving yourself extended time (for example,
          1.5x) lets you show what you actually know instead of racing. Many students qualify for that same
          accommodation on the official exam, so practicing with it is realistic, not cheating.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">4. Use body-doubling and accountability</h2>
        <p>
          Working alongside someone &mdash; in person or on a video call &mdash; can make starting and
          staying on task dramatically easier. This &ldquo;body-doubling&rdquo; trick works because a quiet,
          present companion makes drifting away feel more obvious. If no one is around, a standing text to a
          friend (&ldquo;starting my 15-minute set now&rdquo;) or a parent who checks in on the habit gives
          you the same gentle external structure.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">5. Check your energy and pick a pace</h2>
        <p>
          A five-second question &mdash; &ldquo;how&apos;s my energy right now?&rdquo; &mdash; saves a lot of
          wasted effort. Low-energy day? A short 5&ndash;10 question set still counts and keeps your streak
          alive. High-energy day? Go longer while the focus is there. Matching the session to the day beats
          forcing the identical plan every time and burning out by Wednesday.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">6. Move between blocks</h2>
        <p>
          Movement is one of the cheapest focus resets available. A two-minute walk, a quick stretch, or a
          lap around the room between question sets helps shake off restlessness so the next block starts
          fresh. Build the break in on purpose rather than waiting until your attention has already
          collapsed &mdash; a planned break is recovery, while an unplanned one is usually a sign you pushed
          too long.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">7. Treat a bad day as data, not failure</h2>
        <p>
          One rough session is normal &mdash; everyone has off days. The students who improve aren&apos;t the
          ones who never miss; they&apos;re the ones who come back the next day. When a set goes badly, look
          at what the misses have in common, note one thing to try next time, and let the rest go. A bad day
          is information about pacing or conditions, not a verdict on whether you can do this.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">For parents and coaches</h2>
        <p>
          The most useful question you can ask isn&apos;t &ldquo;what did you score?&rdquo; &mdash; it&apos;s
          &ldquo;did you practice today?&rdquo; Celebrate the habit, because the habit is what compounds.
          Help protect a distraction-free 15 minutes, offer to body-double during a tough set, and look into
          whether your student qualifies for extended time on the official SAT or ACT &mdash; applications
          often need to go in well before test day. A student who needs a different approach isn&apos;t
          behind; they just need tools that fit how they work.
        </p>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-foreground">
          <p className="font-semibold mb-1">Built-in Focus tools</p>
          <p className="text-sm text-muted-foreground">
            StudentNest includes focus-friendly study aids designed for students who learn differently &mdash;
            Focus Mode, extended time on practice and mock exams, and energy check-ins &mdash; all part of the
            standard plan. They&apos;re general study tools, not a medical or diagnostic feature, and they
            don&apos;t treat or diagnose any condition.
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

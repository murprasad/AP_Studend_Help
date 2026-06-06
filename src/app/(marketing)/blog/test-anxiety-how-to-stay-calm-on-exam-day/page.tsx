import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Test Anxiety: How to Stay Calm and Score Your Best on Exam Day — StudentNest Prep",
  description:
    "Evidence-based study and wellness strategies for test anxiety: realistic timed practice, box breathing, a pre-exam routine, the first-minute brain dump, and what to do when you hit a hard question.",
  openGraph: {
    title: "Test Anxiety: How to Stay Calm and Score Your Best on Exam Day",
    description:
      "Why nerves blank your mind, the #1 fix (familiar timed practice), box breathing, a pre-exam routine, and a calm plan for hard questions and exam morning.",
  },
  alternates: { canonical: "/blog/test-anxiety-how-to-stay-calm-on-exam-day" },
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
          Test Anxiety: How to Stay Calm and Score Your Best on Exam Day
        </h1>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> 7 min read · For students, parents &amp; coaches
        </p>
      </div>

      <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Almost everyone feels some nerves before a big exam &mdash; a faster heartbeat, a few jittery
          thoughts, the urge to check your notes one more time. That&apos;s normal, and a little adrenaline
          can actually sharpen your focus. The problem starts when nerves tip over into a blank mind, where
          material you studied for weeks suddenly feels out of reach. The good news: the way you prepare and
          the small routines you build can make exam day feel far more manageable. Here are practical,
          evidence-based strategies for staying calm and showing what you actually know.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Why anxiety makes your mind go blank</h2>
        <p>
          Working memory &mdash; the mental scratchpad you use to hold a question, recall a formula, and
          work toward an answer &mdash; has limited room. When you&apos;re anxious, a chunk of that room
          gets taken up by worry: &ldquo;What if I fail?&rdquo; &ldquo;Everyone else is faster.&rdquo; With
          less space left for the actual problem, recall stalls and the page seems to go blank. Understanding
          this matters, because it points to the real fix: spend less of exam day fighting unfamiliarity, and
          you free up working memory for the questions themselves.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">The #1 fix: make the format familiar</h2>
        <p>
          The single most effective thing you can do is take realistic, timed practice tests before the real
          one. A lot of exam-day anxiety isn&apos;t about the content &mdash; it&apos;s about the
          <em> unknown</em>: the pacing, the on-screen tools, the feeling of a countdown, the length of the
          sitting. When you&apos;ve rehearsed all of that several times, the real exam stops being a surprise
          and starts feeling like just another rep. Familiarity is calming, and it&apos;s something you can
          build on purpose.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Box breathing: a quick physiological reset</h2>
        <p>
          When your heart is racing, you can steady it with your breath. A simple method is box breathing:
          breathe in for a count of four, hold for four, breathe out for four, hold for four, and repeat for
          four or five cycles. Slow, even breathing helps your body shift out of high-alert mode. Practice it
          a few times during study sessions so it feels automatic &mdash; then you can use it in the first
          minute of the exam, or any time a wave of nerves hits.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Build a pre-exam routine</h2>
        <p>
          Decisions cost energy, and exam morning is the worst time to be making a hundred of them. Build a
          simple, repeatable routine the night before and the day of: lay out what you&apos;ll bring, eat
          something you normally eat, arrive with time to spare, and do one short, easy warm-up problem so
          your brain is already &ldquo;on.&rdquo; A predictable routine removes friction and gives your nerves
          fewer things to latch onto.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Reframe nerves as readiness</h2>
        <p>
          That pounding heart and rush of energy? Your body responds to a tough test almost the same way it
          responds to something exciting. Instead of telling yourself &ldquo;I&apos;m so anxious,&rdquo; try
          &ldquo;I&apos;m fired up and ready.&rdquo; It sounds small, but treating the physical signals as a
          sign your body is gearing up to perform &mdash; rather than a sign something is wrong &mdash; can
          change how those signals affect you. You don&apos;t have to make the nerves disappear; you just have
          to reinterpret them.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">The first-minute brain dump</h2>
        <p>
          As soon as the exam starts, before you read question one, spend thirty seconds writing down the
          things you&apos;re afraid you&apos;ll forget: a formula, a date, a key definition, a mnemonic. Get
          them onto scratch paper and out of your head. This &ldquo;brain dump&rdquo; does two things: it
          protects the facts you need from anxiety-driven blanking, and it gives you a quick early win that
          settles your nerves before you tackle the real questions.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">When you hit a hard question</h2>
        <p>
          One brutal question early on can spiral into panic if you let it. Don&apos;t. Mark it, make your
          best guess if there&apos;s no penalty, and move on &mdash; the easy points later are worth just as
          much, and you can come back with a calmer head. Getting stuck and staring is what burns time and
          fuels worry. Keep moving, bank the questions you know, and treat the hard ones as a second lap, not
          a roadblock.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-2">Sleep and the morning of</h2>
        <p>
          A cram-fueled all-nighter trades a few extra facts for a foggy, jittery brain &mdash; a bad deal on
          test day. Sleep is when memory consolidates, so a normal night&apos;s rest usually beats the last
          two hours of cramming. The morning of, eat a steady breakfast, go easy on caffeine if it makes you
          jittery, and avoid frantic last-minute quizzing that just spikes nerves. You&apos;ve done the work;
          the morning is for staying calm, not for learning something new.
        </p>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-foreground">
          <p className="font-semibold mb-1">Rehearse the real format</p>
          <p className="text-sm text-muted-foreground">
            StudentNest&apos;s full mock exams mirror the real test &mdash; with extended time options and
            built-in breaks &mdash; so students can rehearse the pacing, tools, and feel of exam day until it
            seems familiar. Familiarity is one of the most reliable ways to take the edge off nerves.
            These are general study tools, not a medical feature.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-foreground pt-2">For parents</h2>
        <p>
          The most helpful thing you can do is lower the temperature. Ask &ldquo;did you get a good
          night&apos;s sleep?&rdquo; rather than &ldquo;are you ready?&rdquo;, keep exam morning calm and
          unhurried, and make it clear that one score doesn&apos;t define them. Encouraging a few realistic
          timed practice runs ahead of time &mdash; so the format feels familiar &mdash; often does more for
          calm than any pep talk on the day itself.
        </p>
      </div>

      <div className="pt-4 border-t border-border/40">
        <Link href="/register" className="inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:underline">
          Rehearse a full mock exam free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

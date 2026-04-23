import Link from "next/link";
import { Metadata } from "next";
import { TrendingUp, Target, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "How StudentNest Projects Your Predicted Score — Methodology",
  description: "The honest math behind our predicted-score estimates, improvement projections, and \"Pass Confident Guarantee.\" No smoke. No inflated promises.",
  alternates: { canonical: "https://studentnest.ai/methodology" },
};

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold">How We Calculate Your Predicted Score</h1>
        <p className="text-lg text-muted-foreground">Honest, auditable math. Here&apos;s exactly what goes into the number on your dashboard.</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Predicted score — the inputs</h2>
        </div>
        <p className="text-muted-foreground">Every number comes from your own activity on StudentNest. Specifically:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
          <li><strong className="text-foreground">Per-unit mastery scores</strong> from your practice sessions</li>
          <li><strong className="text-foreground">Diagnostic scores</strong> as a baseline when no practice data exists yet for a unit</li>
          <li><strong className="text-foreground">Best mock exam score</strong> (any full-length mock you&apos;ve taken)</li>
          <li><strong className="text-foreground">Recent 14-day accuracy</strong> across all completed sessions</li>
          <li><strong className="text-foreground">Total sessions + total questions attempted</strong> — these drive our <em>confidence</em> tag (low / medium / high)</li>
        </ul>
        <p className="text-muted-foreground">
          We weight mastery most heavily (~50%), recent accuracy next (~30%), and mock performance last (~20%).
          The final number is capped at 95% — no prediction is perfect, and we&apos;d rather underpromise.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Improvement projections — the model</h2>
        </div>
        <p className="text-muted-foreground">
          When we tell you &quot;in 7 days your predicted AP score will move from 2 to 3,&quot; here&apos;s how we got that number:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
          <li>Baseline daily gain: ~3 readiness-points per day for a motivated student practicing 30+ questions.</li>
          <li>Diminishing returns: every 10 points of readiness cuts the next day&apos;s rate by ~25% (easier to go from 30 to 40 than from 70 to 80).</li>
          <li>Readiness caps at 95%, then translates to your exam&apos;s native scale — AP 1&ndash;5, SAT 400&ndash;1600, ACT 1&ndash;36.</li>
        </ul>
        <p className="text-muted-foreground">
          This projection is intentionally conservative. Students who practice more aggressively — 50+ questions a day, daily review, weak-unit drilling — beat the curve. Students who practice sporadically underperform it.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Pass Confident Guarantee — the fine print</h2>
        </div>
        <p className="text-muted-foreground">
          If StudentNest shows you a predicted score in the passing range (AP 3+ / SAT 1200+ / ACT 24+) with <strong className="text-foreground">high confidence</strong> and you don&apos;t pass the real exam, we extend your subscription by <strong className="text-foreground">60 days free</strong> and refund your most recent plan payment.
        </p>
        <p className="text-muted-foreground">
          Conditions: the high-confidence passing prediction must have been shown to you within the 14 days preceding your exam date, confirmed by at least one full mock exam. Email your exam score report to <a href="mailto:contact@studentnest.ai" className="text-primary underline">contact@studentnest.ai</a> within 30 days of the exam.
        </p>
        <p className="text-sm text-muted-foreground">
          Plus 7-day money-back guarantee on every plan — email support within 7 days of purchase, no questions asked.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Why we&apos;re transparent about this</h2>
        <p className="text-muted-foreground">
          Most prep sites make promises they can&apos;t measure and can&apos;t back. We tell you the inputs because they&apos;re your data, they&apos;re on your dashboard, and they&apos;re auditable. If a projection misses, you&apos;ll see it immediately — we don&apos;t hide bad numbers.
        </p>
        <p className="text-muted-foreground">
          Questions? Email <a href="mailto:contact@studentnest.ai" className="text-primary underline">contact@studentnest.ai</a>.
        </p>
      </section>

      <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-3">
        <h2 className="text-xl font-bold">See your number</h2>
        <p className="text-muted-foreground">Free 10-minute diagnostic. Real predicted-score, your data, no card.</p>
        <Link href="/register" className="inline-block text-primary font-semibold underline">Start free diagnostic →</Link>
      </div>
    </div>
  );
}

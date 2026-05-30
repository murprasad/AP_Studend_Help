import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, TrendingUp } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free vs Paid SAT Prep — Honest Comparison | StudentNest",
  description: "Khan Academy SAT prep is free. Princeton Review is $1500. Where does StudentNest fit? Honest breakdown of what each gives you, when free is enough, and when paid actually moves your score.",
  alternates: { canonical: "https://studentnest.ai/sat-prep/free-vs-paid" },
};

const COMPARISON = [
  { feature: "Practice questions", free: "8 full tests", studentNest: "Unlimited + adaptive", premium: "Unlimited" },
  { feature: "Predicted score", free: "❌", studentNest: "✅ Calibrated, updates per session", premium: "Sometimes (Kaplan: yes; Princeton: no)" },
  { feature: "Targeted weak-skill drill", free: "Limited", studentNest: "✅ Auto-routed daily", premium: "✅" },
  { feature: "Mock exams (adaptive Digital SAT)", free: "8 official + Bluebook", studentNest: "✅ Unlimited", premium: "✅ Unlimited" },
  { feature: "1-on-1 tutoring", free: "❌", studentNest: "❌ (use savings for one)", premium: "✅" },
  { feature: "Cost", free: "$0", studentNest: "$19/mo", premium: "$500-1500" },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is Khan Academy SAT prep enough?", acceptedAnswer: { "@type": "Answer", text: "For students starting at a 1100+ baseline aiming for 1300-1400, Khan Academy plus the 8 official practice tests is enough. Below 1100, or aiming for 1500+, you need targeted drill on weak skills — which Khan Academy doesn't route well. That's where adaptive paid prep (StudentNest, College Panda, etc.) earns its keep." } },
    { "@type": "Question", name: "When does paid SAT prep matter?", acceptedAnswer: { "@type": "Answer", text: "When you need: (1) a calibrated predicted score so you stop wasting time on the wrong sections, (2) adaptive question routing so each session targets your gaps, (3) unlimited mocks beyond the 8 official ones, or (4) accountability/structure when self-study isn't working." } },
    { "@type": "Question", name: "Why not just hire a tutor?", acceptedAnswer: { "@type": "Answer", text: "Tutors at $80-150/hr cost $2000+ for full prep. They help most for the last 100 points of score lift (1450 → 1550). Apps + practice tests cover the 1100 → 1450 path more efficiently. The honest move is apps first, tutor for the final polish if budget allows." } },
  ],
};

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />

      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Free vs Paid SAT Prep</h1>
        <p className="text-lg text-muted-foreground">
          Khan Academy is free. Princeton Review is $1500. Here&apos;s an honest breakdown of where each fits.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Side-by-side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 pr-3 font-semibold">Feature</th>
                <th className="text-left py-3 px-3 font-semibold">Khan Academy</th>
                <th className="text-left py-3 px-3 font-semibold text-primary">StudentNest</th>
                <th className="text-left py-3 px-3 font-semibold">Premium ($500+)</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-border/20">
                  <td className="py-3 pr-3 font-medium">{row.feature}</td>
                  <td className="py-3 px-3 text-muted-foreground">{row.free}</td>
                  <td className="py-3 px-3 text-primary">{row.studentNest}</td>
                  <td className="py-3 px-3 text-muted-foreground">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">When free is enough</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li><span className="font-semibold">Baseline 1200+, target 1400.</span> Khan Academy + 8 official tests give plenty of reps.</li>
          <li><span className="font-semibold">You self-direct well.</span> If your friend gets a 1500 from free resources, you can too — IF you actually do the practice consistently.</li>
          <li><span className="font-semibold">Budget = $0.</span> Free beats nothing every time.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">When paid is worth it</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li><span className="font-semibold">You want a predicted score.</span> Khan doesn&apos;t tell you &ldquo;you&apos;ll get a 1340 ±40 if you take the test today.&rdquo; StudentNest does.</li>
          <li><span className="font-semibold">Baseline below 1100.</span> You need adaptive routing to your weakest skills — free tools assume you already know where to drill.</li>
          <li><span className="font-semibold">Target 1500+.</span> The last 100 points need targeted mock-and-review — more iterations than 8 official tests give you.</li>
          <li><span className="font-semibold">You hate studying alone.</span> Pay for accountability (an app that nudges you daily beats a $1500 tutor most of the time).</li>
        </ul>
      </section>

      <section className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6 text-center space-y-3">
        <h2 className="text-2xl font-bold">See your predicted SAT score — free</h2>
        <p className="text-muted-foreground">Take a 9-question diagnostic. Get your calibrated number in 3 minutes.</p>
        <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Related</h2>
        <ul className="space-y-1 list-disc pl-5">
          <li><Link href="/act-vs-sat-which-should-i-take" className="text-primary hover:underline">ACT vs SAT — which one should I take?</Link></li>
          <li><Link href="/digital-sat-2024-changes" className="text-primary hover:underline">Digital SAT 2024 changes</Link></li>
          <li><Link href="/sat-prep" className="text-primary hover:underline">SAT prep hub</Link></li>
        </ul>
      </section>
    </div>
  );
}

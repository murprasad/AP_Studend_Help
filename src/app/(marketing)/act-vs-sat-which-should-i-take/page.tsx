import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ACT vs SAT — Which Should I Take? (Honest Answer)",
  description: "Most students score noticeably better on one. Here's the 5-minute decision framework: section structure, time pressure, content focus, college acceptance — plus a free 9-Q diagnostic to find your fit.",
  alternates: { canonical: "https://studentnest.ai/act-vs-sat-which-should-i-take" },
};

const COMPARISON = [
  { dim: "Sections", sat: "Reading & Writing + Math (digital, adaptive)", act: "English, Math, Reading, Science (paper or digital)" },
  { dim: "Time per question", sat: "More time per Q — fewer Qs, longer", act: "Tighter time pressure" },
  { dim: "Math content", sat: "Algebra-heavy, some advanced", act: "More geometry + trig coverage" },
  { dim: "Science section", sat: "❌ None", act: "✅ Data + experimental passages" },
  { dim: "Calculator", sat: "Built-in (Desmos in Bluebook)", act: "Allowed (separate device)" },
  { dim: "Score range", sat: "400-1600", act: "1-36" },
  { dim: "College acceptance", sat: "Universal", act: "Universal" },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Do colleges prefer SAT or ACT?", acceptedAnswer: { "@type": "Answer", text: "No. Every US college accepts both equally. There's no school where one is preferred. The choice is about which test plays to your strengths." } },
    { "@type": "Question", name: "Which is easier?", acceptedAnswer: { "@type": "Answer", text: "Neither. They favor different students. The SAT favors students who do well with more time per question + heavier algebra. The ACT favors students who handle fast pacing + broader content (including science)." } },
    { "@type": "Question", name: "Can I take both?", acceptedAnswer: { "@type": "Answer", text: "Yes, and many top scorers do. But studying for two is double the work for diminishing returns. Take a free diagnostic of each, pick the higher-percentile result, prep that one." } },
  ],
};

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />

      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold">ACT vs SAT — Which Should I Take?</h1>
        <p className="text-lg text-muted-foreground">
          Most students score noticeably better on one. Here&apos;s how to figure out which.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Short answer</h2>
        <p>
          Take a short diagnostic of both. The one you score higher on (percentile-wise) is the one to prep for.
          Colleges treat them as equivalent — there&apos;s no &ldquo;harder&rdquo; or &ldquo;more respected&rdquo; option.
          The decision is purely about which test format matches your test-taking style.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Side-by-side</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 pr-3 font-semibold">Dimension</th>
                <th className="text-left py-3 px-3 font-semibold">SAT</th>
                <th className="text-left py-3 px-3 font-semibold">ACT</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.dim} className="border-b border-border/20">
                  <td className="py-3 pr-3 font-medium">{row.dim}</td>
                  <td className="py-3 px-3">{row.sat}</td>
                  <td className="py-3 px-3">{row.act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Take the SAT if you…</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>Prefer more time per question and don&apos;t mind digital tools (Desmos calculator built-in)</li>
          <li>Are stronger in algebra than geometry/trig</li>
          <li>Dislike science/data-interpretation passages</li>
          <li>Like adaptive testing (the second module adjusts to your first-module accuracy)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Take the ACT if you…</h2>
        <ul className="space-y-2 list-disc pl-5">
          <li>Are quick at moving through questions; pacing doesn&apos;t rattle you</li>
          <li>Like geometry and trig</li>
          <li>Are strong in science / data interpretation</li>
          <li>Prefer paper or want the option to take either format</li>
        </ul>
      </section>

      <section className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6 text-center space-y-3">
        <h2 className="text-2xl font-bold">Find your better fit — free</h2>
        <p className="text-muted-foreground">Take a 9-Q SAT diagnostic + a 9-Q ACT diagnostic. See which percentile you score higher in.</p>
        <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Related</h2>
        <ul className="space-y-1 list-disc pl-5">
          <li><Link href="/sat-prep/free-vs-paid" className="text-primary hover:underline">Free vs paid SAT prep</Link></li>
          <li><Link href="/digital-sat-2024-changes" className="text-primary hover:underline">Digital SAT 2024 changes</Link></li>
        </ul>
      </section>
    </div>
  );
}

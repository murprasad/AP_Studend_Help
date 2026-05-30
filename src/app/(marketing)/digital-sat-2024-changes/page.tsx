import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital SAT Changes — What's New in 2024+ | StudentNest",
  description: "The SAT went fully digital in 2024. Here's what actually changed for test-takers: adaptive testing, shorter format, Bluebook app, scoring impact, and how to prep differently.",
  alternates: { canonical: "https://studentnest.ai/digital-sat-2024-changes" },
};

const CHANGES = [
  { what: "Format", before: "Paper, 3 hr 0 min", after: "Digital (Bluebook app), 2 hr 14 min" },
  { what: "Adaptive", before: "❌ Linear, all students same Qs", after: "✅ Module 2 adjusts to Module 1 accuracy" },
  { what: "Math calculator", before: "Allowed in 1 of 2 math sections", after: "Allowed in BOTH math sections (Desmos built into Bluebook)" },
  { what: "Reading passages", before: "Long passages, multiple Qs each", after: "Short passages, 1 Q each" },
  { what: "Math content", before: "More than now", after: "Slightly trimmed — heart-of-algebra heavy" },
  { what: "Score range", before: "400-1600", after: "400-1600 (unchanged)" },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "Is the digital SAT easier than the paper SAT?", acceptedAnswer: { "@type": "Answer", text: "Not easier in difficulty — but the format is more forgiving for some students. Shorter passages reduce reading fatigue. Adaptive testing means high scorers see harder Module 2 (real opportunity), but struggling students see easier Module 2 (safety net)." } },
    { "@type": "Question", name: "Do I need to bring my own laptop?", acceptedAnswer: { "@type": "Answer", text: "You can use your own laptop, tablet, or use a school-provided device. The Bluebook app runs on Windows, Mac, iPad, and Chromebook. You must install + sign in BEFORE test day." } },
    { "@type": "Question", name: "How should I prep differently for the digital SAT?", acceptedAnswer: { "@type": "Answer", text: "Practice on Bluebook (the official app). Get used to digital calculator (Desmos) for math. Stop practicing paper SAT — the question style has shifted toward shorter reading passages and adaptive difficulty." } },
  ],
};

export default function Page() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />

      <header className="text-center space-y-3">
        <h1 className="text-4xl font-bold">Digital SAT — What Actually Changed</h1>
        <p className="text-lg text-muted-foreground">
          The SAT went fully digital in March 2024. Here&apos;s what matters for your prep.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">The 30-second summary</h2>
        <p>
          Shorter, faster, adaptive. Same score range (400-1600). Same college acceptance. Same Khan Academy
          prep is now <em>less</em> useful (it teaches paper format, not adaptive). Practice on Bluebook,
          use the Desmos calculator everywhere, and stop drilling 60-minute reading passages — they don&apos;t exist anymore.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Before vs after</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-3 pr-3 font-semibold">Dimension</th>
                <th className="text-left py-3 px-3 font-semibold">Paper SAT (≤2023)</th>
                <th className="text-left py-3 px-3 font-semibold text-primary">Digital SAT (2024+)</th>
              </tr>
            </thead>
            <tbody>
              {CHANGES.map((row) => (
                <tr key={row.what} className="border-b border-border/20">
                  <td className="py-3 pr-3 font-medium">{row.what}</td>
                  <td className="py-3 px-3 text-muted-foreground">{row.before}</td>
                  <td className="py-3 px-3 text-primary">{row.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">How to prep differently</h2>
        <ol className="space-y-2 list-decimal pl-5">
          <li><span className="font-semibold">Install Bluebook now.</span> It&apos;s College Board&apos;s official app. Run a practice test in it to feel the format.</li>
          <li><span className="font-semibold">Use Desmos calculator on every math problem.</span> It&apos;s built in. Don&apos;t fake-prep with a TI-84 — that&apos;s not what test day looks like.</li>
          <li><span className="font-semibold">Drill short-passage reading.</span> 1 question per passage means each one has higher stakes. Practice on the new format only.</li>
          <li><span className="font-semibold">Practice with adaptive logic in mind.</span> Module 1 accuracy determines Module 2 difficulty. Strong Module 1 = harder Module 2 (more upside). Weak Module 1 = easier Module 2 (capped ceiling).</li>
          <li><span className="font-semibold">Time pacing.</span> 2 hr 14 min is tight. Practice in real time, not untimed.</li>
        </ol>
      </section>

      <section className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-6 text-center space-y-3">
        <h2 className="text-2xl font-bold">Get your predicted Digital SAT score</h2>
        <p className="text-muted-foreground">9-question diagnostic. Calibrated to the new format. Free.</p>
        <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900">
          <Link href="/register">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Related</h2>
        <ul className="space-y-1 list-disc pl-5">
          <li><Link href="/sat-prep/free-vs-paid" className="text-primary hover:underline">Free vs paid SAT prep</Link></li>
          <li><Link href="/act-vs-sat-which-should-i-take" className="text-primary hover:underline">ACT vs SAT — which one should I take?</Link></li>
          <li><Link href="/sat-prep" className="text-primary hover:underline">SAT prep hub</Link></li>
        </ul>
      </section>
    </div>
  );
}

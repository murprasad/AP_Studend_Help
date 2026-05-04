/**
 * /pass-rates — National AP / SAT / ACT pass-rate reference.
 *
 * Static SEO landing page. Aggregates public College Board (AP score
 * distribution reports) and ACT / CollegeBoard SAT published bands.
 * Numbers are 2023–2025 three-year averages to smooth year-over-year
 * drift. Links to per-exam difficulty guides (`/how-hard-is/[slug]`).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Info, ArrowRight } from "lucide-react";
import { VISIBLE_AP_COURSES } from "@/lib/courses";
import { getVisibleCourses } from "@/lib/settings";

// The /how-hard-is/[slug] route only pre-renders courses that exist in
// VISIBLE_AP_COURSES. AP_ROWS below includes national CB reference rows
// (e.g. AP Chinese, AP Spanish, AP English Language) that we DON'T yet
// have per-course pages for — we still show the row for data honesty,
// but only link when the page exists.
//
// 2026-05-02 — additionally filtered by visible_courses SiteSetting:
// rows for courses that aren't in our active allowlist still display
// (national pass-rate data is public + useful), but their CTA link is
// suppressed so we don't send users to a "rebuilding" page. This is
// computed at request time inside the page component, not here.
const HOW_HARD_IS_PAGES = new Set(
  VISIBLE_AP_COURSES.map((c) => c.toLowerCase().replace(/_/g, "-")),
);

export const metadata: Metadata = {
  title: "AP, SAT, ACT Pass Rates 2026 — Score Distributions & Benchmarks",
  description:
    "National pass rates for every AP, SAT, and ACT exam — 3+ rates, score percentiles, and what 'passing' means. Updated 2026 from College Board + ACT data.",
  alternates: { canonical: "https://studentnest.ai/pass-rates" },
};

// AP 3+ rates — 2023–2025 three-year averages from CB score distribution
// reports. The "3+ rate" means students who scored 3, 4, or 5 (qualified
// for college credit at most institutions).
const AP_ROWS: Array<{ slug: string; name: string; threePlus: string; fiveRate: string }> = [
  { slug: "ap-chinese",                      name: "AP Chinese",                     threePlus: "~90%", fiveRate: "~71%" },
  { slug: "ap-calculus-bc",                  name: "AP Calculus BC",                 threePlus: "~75%", fiveRate: "~42%" },
  { slug: "ap-spanish",                      name: "AP Spanish",                     threePlus: "~72%", fiveRate: "~26%" },
  { slug: "ap-computer-science-principles",  name: "AP Computer Science Principles", threePlus: "~65%", fiveRate: "~13%" },
  { slug: "ap-psychology",                   name: "AP Psychology",                  threePlus: "~60%", fiveRate: "~17%" },
  { slug: "ap-biology",                      name: "AP Biology",                     threePlus: "~60%", fiveRate: "~9%" },
  { slug: "ap-statistics",                   name: "AP Statistics",                  threePlus: "~60%", fiveRate: "~15%" },
  { slug: "ap-calculus-ab",                  name: "AP Calculus AB",                 threePlus: "~58%", fiveRate: "~20%" },
  { slug: "ap-world-history",                name: "AP World History: Modern",       threePlus: "~62%", fiveRate: "~13%" },
  { slug: "ap-us-history",                   name: "AP U.S. History",                threePlus: "~55%", fiveRate: "~12%" },
  { slug: "ap-chemistry",                    name: "AP Chemistry",                   threePlus: "~55%", fiveRate: "~16%" },
  { slug: "ap-environmental-science",        name: "AP Environmental Science",       threePlus: "~53%", fiveRate: "~9%" },
  { slug: "ap-english-language",             name: "AP English Language",            threePlus: "~57%", fiveRate: "~10%" },
  { slug: "ap-human-geography",              name: "AP Human Geography",             threePlus: "~55%", fiveRate: "~15%" },
  { slug: "ap-us-government",                name: "AP U.S. Government",             threePlus: "~50%", fiveRate: "~14%" },
  { slug: "ap-physics-1",                    name: "AP Physics 1",                   threePlus: "~45%", fiveRate: "~8%" },
];

// SAT national percentile anchors — 2024 CollegeBoard published bands.
const SAT_ROWS: Array<{ score: string; percentile: string; note: string }> = [
  { score: "1600", percentile: "99th", note: "Perfect score" },
  { score: "1500+", percentile: "98th", note: "Top college competitive" },
  { score: "1400+", percentile: "94th", note: "Most selective range" },
  { score: "1200+", percentile: "~75th", note: "College-ready benchmark" },
  { score: "1060 (avg)", percentile: "~50th", note: "National median" },
  { score: "400", percentile: "1st", note: "Minimum possible" },
];

// ACT — published score distribution.
const ACT_ROWS: Array<{ score: string; percentile: string; note: string }> = [
  { score: "36", percentile: "99th+", note: "Perfect composite" },
  { score: "33+", percentile: "98th", note: "Top college competitive" },
  { score: "30+", percentile: "93rd", note: "Most selective range" },
  { score: "24+", percentile: "~74th", note: "College-ready benchmark" },
  { score: "19 (avg)", percentile: "~50th", note: "National median" },
  { score: "1", percentile: "1st", note: "Minimum possible" },
];

const faqs = [
  {
    q: "What counts as 'passing' an AP exam?",
    a: "A score of 3, 4, or 5 out of 5. Most colleges grant credit for a 3; the most selective programs require a 4 or 5 in the specific subject. Only about 60% of test-takers score 3+ on an average AP exam.",
  },
  {
    q: "What's a good SAT score?",
    a: "1200+ is the widely cited 'college-ready' benchmark (75th percentile nationally). 1400+ puts you in the top 6% of all test-takers and opens doors to selective colleges. National average is 1060.",
  },
  {
    q: "What's a good ACT score?",
    a: "24+ is ACT's 'college-ready' benchmark — about the 74th percentile. 30+ is the top 7% and targets most selective colleges. National average composite is 19.",
  },
  {
    q: "How are AP pass rates calculated?",
    a: "College Board publishes score distributions each year. The 3+ rate is the share of test-takers who scored 3, 4, or 5 — the threshold for college credit at most institutions.",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "AP, SAT, ACT Pass Rates & Score Distributions — 2026",
    description: "National pass rates for every AP exam, plus SAT and ACT percentile benchmarks.",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default async function PassRatesPage() {
  // Bank-quality visibility filter (added 2026-05-02). Suppress the
  // "Try this course" CTA for rows whose course isn't in the active
  // allowlist — keeps the page useful as SEO/national-data reference
  // without misdirecting students into hidden courses.
  const allowlist = await getVisibleCourses().catch(() => "all" as const);
  const visibleSlugSet = allowlist === "all"
    ? HOW_HARD_IS_PAGES
    : new Set(
        Array.from(HOW_HARD_IS_PAGES).filter((slug) => {
          const enumKey = slug.toUpperCase().replace(/-/g, "_");
          return allowlist.includes(enumKey);
        }),
      );
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="space-y-3">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Score Distribution Reference</p>
        <h1 className="text-3xl font-bold">AP, SAT &amp; ACT Pass Rates 2026</h1>
        <p className="text-lg text-muted-foreground">
          National pass rates and score distributions for every AP, SAT, and ACT exam — built from the 2023–2025 College Board and ACT published reports.
        </p>
      </div>

      {/* AP table */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" /> AP Exam 3+ Rates (College Credit)
        </h2>
        <p className="text-sm text-muted-foreground">
          A score of <strong>3, 4, or 5</strong> qualifies for college credit at most institutions. The 3+ rate is the share of test-takers who cleared that bar.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Exam</th>
                <th className="text-right px-4 py-2.5 font-semibold">3+ Rate</th>
                <th className="text-right px-4 py-2.5 font-semibold">5 Rate</th>
                <th className="text-right px-4 py-2.5 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {AP_ROWS.map((r) => (
                <tr key={r.slug} className="border-t border-border/30 hover:bg-secondary/20">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.threePlus}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.fiveRate}</td>
                  <td className="px-4 py-2.5 text-right">
                    {visibleSlugSet.has(r.slug) ? (
                      <Link href={`/how-hard-is/${r.slug}`} className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1">
                        How hard? <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          <Info className="h-3 w-3 inline mr-1" />
          Source: College Board AP score distribution reports, 2023–2025 three-year average. Rates rounded to nearest percent.
        </p>
      </section>

      {/* SAT */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" /> SAT Score Percentiles
        </h2>
        <p className="text-sm text-muted-foreground">
          The SAT is scored 400–1600 (two sections × 200–800 each). There&apos;s no formal &quot;passing&quot; score — colleges set their own thresholds.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Score</th>
                <th className="text-right px-4 py-2.5 font-semibold">Percentile</th>
                <th className="text-left px-4 py-2.5 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {SAT_ROWS.map((r, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="px-4 py-2.5 font-semibold tabular-nums">{r.score}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.percentile}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ACT */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-violet-500" /> ACT Score Percentiles
        </h2>
        <p className="text-sm text-muted-foreground">
          The ACT composite is scored 1–36 (average of 4 sections). No formal &quot;passing&quot; score — 24+ is the ACT College Readiness Benchmark.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border/40">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Score</th>
                <th className="text-right px-4 py-2.5 font-semibold">Percentile</th>
                <th className="text-left px-4 py-2.5 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {ACT_ROWS.map((r, i) => (
                <tr key={i} className="border-t border-border/30">
                  <td className="px-4 py-2.5 font-semibold tabular-nums">{r.score}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.percentile}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={i} className="group p-4 rounded-xl border border-border/40 bg-card/50">
              <summary className="cursor-pointer font-semibold text-sm flex items-center justify-between gap-2 list-none">
                <span>{f.q}</span>
                <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center space-y-4 rounded-xl border border-border/40 bg-card/50 p-6">
        <h2 className="text-xl font-bold">Find out where you stand — free</h2>
        <p className="text-sm text-muted-foreground">Take a 3-minute diagnostic on your AP, SAT, or ACT exam and see your predicted score right away.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/am-i-ready">
            <Button size="lg" className="gap-2 w-full sm:w-auto">Check My Readiness <ArrowRight className="h-4 w-4" /></Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">Start Free Practice</Button>
          </Link>
        </div>
      </section>

      <p className="text-[10px] text-muted-foreground/50 text-center">
        AP® and SAT® are trademarks registered by the College Board. ACT® is a trademark of ACT, Inc. Neither is affiliated with or endorses this product.
        Rates are approximations from publicly released 2023–2025 CB and ACT reports.
      </p>
    </div>
  );
}

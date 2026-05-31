import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * 2026-05-31 — Shared CB-style product page template for /ap-prep,
 * /sat-prep, /act-prep, /psat-prep. Mirrors the CB landing's visual
 * language so all 4 tile destinations feel cohesive after landing
 * navigation. Each consumer passes family-specific copy + course list.
 */

export interface CbProductCourse {
  name: string;
  units: number;
  desc: string;
}

export interface CbProductPageProps {
  family: "AP" | "SAT" | "ACT" | "PSAT";
  headline: string;
  subhead: string;
  diagnosticHref: string; // e.g. /register?module=psat
  ctaLabel?: string; // default "Start free diagnostic"
  courses: CbProductCourse[];
  bottomCtaText: string;
}

export function CbProductPage({
  family,
  headline,
  subhead,
  diagnosticHref,
  ctaLabel = "Start free diagnostic",
  courses,
  bottomCtaText,
}: CbProductPageProps) {
  return (
    <>
      {/* Hero — CB cobalt band */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-wider text-white/70 mb-4">
            {family} Prep
          </p>
          <h1 className="font-roboto-slab font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl">
            {headline}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
            {subhead}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center sm:items-start">
            <Link
              href={diagnosticHref}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/30 text-white/90 hover:bg-white/10 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Courses / sections grid — white band */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl text-cb-indigo mb-3">
            What you&rsquo;ll practice
          </h2>
          <p className="text-cb-muted text-base max-w-2xl mb-10">
            Each {family === "AP" ? "exam" : "section"} drills its content
            domains independently. Switch between them from your dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {courses.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-cb-cardBorder bg-white p-6"
              >
                <h3 className="font-roboto-slab font-bold text-lg text-cb-indigo mb-1">
                  {c.name}
                </h3>
                <p className="text-sm text-cb-muted mb-3">
                  {c.units} unit{c.units === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-cb-indigo/85 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — gray band */}
      <section className="bg-cb-bandGray">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl text-cb-indigo mb-10">
            How it works
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <li>
              <div className="font-roboto-slab font-bold text-cb-cobalt text-3xl mb-2">
                1
              </div>
              <h3 className="font-medium text-lg text-cb-indigo mb-1.5">
                Diagnostic
              </h3>
              <p className="text-cb-muted text-base leading-relaxed">
                Answer 10 questions. We rank every unit by where
                you&rsquo;re strongest and weakest.
              </p>
            </li>
            <li>
              <div className="font-roboto-slab font-bold text-cb-cobalt text-3xl mb-2">
                2
              </div>
              <h3 className="font-medium text-lg text-cb-indigo mb-1.5">
                Practice
              </h3>
              <p className="text-cb-muted text-base leading-relaxed">
                Drill your weakest unit one question at a time. Every wrong
                answer comes with a worked explanation.
              </p>
            </li>
            <li>
              <div className="font-roboto-slab font-bold text-cb-cobalt text-3xl mb-2">
                3
              </div>
              <h3 className="font-medium text-lg text-cb-indigo mb-1.5">
                Master
              </h3>
              <p className="text-cb-muted text-base leading-relaxed">
                Keep going until your projected score crosses your target.
                Then walk in ready.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* Repeat CTA — CB cobalt band */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center sm:text-left">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl max-w-2xl">
            {bottomCtaText}
          </h2>
          <div className="mt-6">
            <Link
              href={diagnosticHref}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

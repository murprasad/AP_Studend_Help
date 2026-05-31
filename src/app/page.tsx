import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getVisibleCourses } from "@/lib/settings";

// 2026-05-31 — CB-style landing page rewrite (task #99). Replaces the
// previous 1,202-line AP-flavored landing with a 4-exam parity layout
// matching College Board's visual language: cobalt hero + sky accents +
// yellow CTA pill, Roboto Slab display + Roboto body, white + light-gray
// bands, 1px card borders with no shadow. Adds PSAT as a co-equal product
// (previously missing entirely from the landing). The full design rationale
// is in the agent-design-and-deploy note for #99.

export const metadata: Metadata = {
  title: "StudentNest Prep — AP, SAT, ACT & PSAT Practice",
  description:
    "Prepare for the AP, SAT, ACT, and PSAT exams in one place. Free to start, no credit card. 10-question diagnostic shows your weakest unit so every session moves the needle.",
  alternates: { canonical: "https://studentnest.ai/" },
};

// Per-product tile metadata. Tile counts read live from the same
// visibility allowlist the sidebar uses (`visible_courses` SiteSetting)
// so the landing never advertises courses we can't actually serve.
type ProductTile = {
  family: "AP" | "SAT" | "ACT" | "PSAT";
  href: string;
  examLabel: string; // e.g. "14 exams" vs "2 sections"
  exams: string[]; // ApCourse[] members in this family
};

const PRODUCT_FAMILIES: ProductTile[] = [
  {
    family: "AP",
    href: "/ap-prep",
    examLabel: "exams",
    exams: [
      "AP_WORLD_HISTORY", "AP_COMPUTER_SCIENCE_PRINCIPLES", "AP_PHYSICS_1",
      "AP_CALCULUS_AB", "AP_CALCULUS_BC", "AP_STATISTICS",
      "AP_CHEMISTRY", "AP_BIOLOGY", "AP_US_HISTORY",
      "AP_PSYCHOLOGY", "AP_ENVIRONMENTAL_SCIENCE", "AP_HUMAN_GEOGRAPHY",
      "AP_US_GOVERNMENT", "AP_PRECALCULUS",
    ],
  },
  {
    family: "SAT",
    href: "/sat-prep",
    examLabel: "sections",
    exams: ["SAT_MATH", "SAT_READING_WRITING"],
  },
  {
    family: "ACT",
    href: "/act-prep",
    examLabel: "sections",
    exams: ["ACT_MATH", "ACT_ENGLISH", "ACT_SCIENCE", "ACT_READING"],
  },
  {
    family: "PSAT",
    href: "/psat-prep",
    examLabel: "sections",
    exams: ["PSAT_MATH", "PSAT_READING_WRITING"],
  },
];

export default async function LandingPage() {
  const visibility = await getVisibleCourses().catch(() => "all" as const);
  const isVisible = (course: string) =>
    visibility === "all" || visibility.includes(course);

  // Compute live counts per product family. Drop a tile entirely if a
  // family has zero visible exams (we never advertise an empty product).
  const tiles = PRODUCT_FAMILIES
    .map((p) => {
      const visibleExams = p.exams.filter(isVisible);
      return { ...p, visibleCount: visibleExams.length };
    })
    .filter((p) => p.visibleCount > 0);

  return (
    <main className="font-roboto text-cb-indigo bg-white">
      {/* ───── Top nav ───── */}
      <header className="border-b border-cb-cardBorder bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-cb-cobalt text-white text-xs font-bold">
              SN
            </span>
            <span className="text-base font-medium text-cb-indigo">
              StudentNest
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link
              href="/pricing"
              className="text-cb-muted hover:text-cb-cobalt transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-cb-muted hover:text-cb-cobalt transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ───── Hero — CB cobalt band ───── */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center sm:text-left">
          <h1 className="font-roboto-slab font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl">
            Prepare for the exams that get you in.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl leading-relaxed">
            Practice AP, SAT, ACT, and PSAT in one place. Start with a
            10-question diagnostic. No credit card.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center sm:items-start">
            <Link
              href="#choose-exam"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <span className="text-sm text-white/70">
              Free forever. Premium optional.
            </span>
          </div>
        </div>
      </section>

      {/* ───── Choose your exam — 4 tiles ───── */}
      <section id="choose-exam" className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl text-cb-indigo mb-3">
            Choose your exam
          </h2>
          <p className="text-cb-muted text-base max-w-2xl mb-10">
            Same diagnostic flow across every product. Pick one to begin —
            you can add others later from your dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {tiles.map((tile) => (
              <Link
                key={tile.family}
                href={tile.href}
                className="block rounded-2xl border border-cb-cardBorder bg-white p-6 hover:border-cb-cobalt transition-colors group"
              >
                <h3 className="font-roboto-slab font-bold text-2xl text-cb-indigo mb-2">
                  {tile.family}
                </h3>
                <p className="text-sm text-cb-muted mb-6">
                  {tile.visibleCount} {tile.examLabel}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-cb-cobalt group-hover:gap-2 transition-all">
                  Start
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How it works — gray band ───── */}
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
                Answer 10 questions. We rank every unit by where you're
                strongest and weakest.
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

      {/* ───── Testimonials — white band ───── */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl text-cb-indigo mb-10">
            Students who walked in ready
          </h2>

          <div className="space-y-8 max-w-3xl">
            <figure>
              <blockquote className="text-cb-indigo text-base sm:text-lg italic leading-relaxed">
                &ldquo;AP Calc went from a D to a B in one marking
                period.&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-sm text-cb-muted not-italic">
                — Marcus T., Grade 12, Texas
              </figcaption>
            </figure>
            <figure>
              <blockquote className="text-cb-indigo text-base sm:text-lg italic leading-relaxed">
                &ldquo;PSAT 1340 → 1480 in six weeks of nightly
                practice.&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-sm text-cb-muted not-italic">
                — Priya K., Grade 10, New Jersey
              </figcaption>
            </figure>
            <figure>
              <blockquote className="text-cb-indigo text-base sm:text-lg italic leading-relaxed">
                &ldquo;AP World 3 → 5 — finally understood why, not just
                what.&rdquo;
              </blockquote>
              <figcaption className="mt-2 text-sm text-cb-muted not-italic">
                — Sofia R., Grade 11, California
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ───── Repeat CTA — CB cobalt band ───── */}
      <section className="bg-cb-cobalt text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16 text-center sm:text-left">
          <h2 className="font-roboto-slab font-bold text-2xl sm:text-3xl max-w-2xl">
            Pick your exam. Take 10 questions. See your score.
          </h2>
          <div className="mt-6">
            <Link
              href="#choose-exam"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-cb-yellow text-cb-indigo font-medium text-base hover:bg-yellow-400 transition-colors"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-cb-cardBorder bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-cb-muted">
          <div>
            <span className="font-medium text-cb-indigo">StudentNest</span>
            <span className="mx-2 text-cb-cardBorder">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-cb-cobalt">
              Pricing
            </Link>
            <Link href="/faq" className="hover:text-cb-cobalt">
              FAQ
            </Link>
            <Link href="/about" className="hover:text-cb-cobalt">
              About
            </Link>
            <Link href="/privacy" className="hover:text-cb-cobalt">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-cb-cobalt">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

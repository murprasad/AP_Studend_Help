/**
 * <PassGuaranteeBadge> — high-conversion trust signal derived from the
 * NurseHub competitive analysis (docs/competitor-analysis-nursehub-2026-05-13.md
 * §"Pass Guarantee — biggest conversion lever"). NurseHub charges $29.99/mo
 * and uses the pass guarantee as their primary moat; we charge $9.99 and
 * mirror the guarantee at a tighter completion bar.
 *
 * Three variants:
 *   - `inline` : compact pill, for hero / hero-adjacent placement
 *   - `card`   : full block with the criteria, for pricing page section
 *   - `banner` : dashboard banner shown when user qualifies (eligibility
 *                tracked on User.passGuaranteeEligible, schema in Batch 2)
 *
 * Refund flow itself + eligibility cron live in Batch 2; this component
 * ships in Batch 1 as the UI surface so we can collect conversion-rate
 * data on having the badge visible before wiring the actual refund flow.
 */

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface PassGuaranteeBadgeProps {
  variant?: "inline" | "card" | "banner";
  /** Override copy for the exam name shown in the variant. Default "AP". */
  examLabel?: string;
  className?: string;
}

const CRITERIA_COPY = [
  "Complete ≥80% of your generated study plan",
  "Take at least 3 full-length mock exams with a ≥75 average",
  "Submit your exam score within 60 days of the exam date",
];

export function PassGuaranteeBadge({
  variant = "card",
  examLabel = "AP",
  className = "",
}: PassGuaranteeBadgeProps) {
  if (variant === "inline") {
    return (
      <Link
        href="/pass-guarantee"
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400 ${className}`}
        aria-label={`Pass Guarantee — refund + retake fee if you don't pass your ${examLabel} exam`}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Pass Guarantee
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 ${className}`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              You qualify for the Pass Guarantee
            </p>
            <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-100/80">
              If you don&apos;t pass your {examLabel} exam, we&apos;ll refund your subscription and cover the official retake fee.{" "}
              <Link href="/pass-guarantee" className="underline underline-offset-2">
                Read the terms
              </Link>
            </p>
            <div className="mt-2.5">
              <Link
                href="/pass-guarantee/claim"
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Start your claim →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: card variant
  return (
    <section
      className={`rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent p-6 sm:p-8 ${className}`}
      aria-labelledby="pass-guarantee-heading"
    >
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Pass Guarantee
        </span>
      </div>
      <h2 id="pass-guarantee-heading" className="text-2xl font-bold leading-tight">
        Pass your {examLabel} exam or your money back — plus the retake fee.
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        We&apos;ll refund your full subscription and pay your official exam retake fee if you finish the program and still don&apos;t pass. No fine print, no hoops.
      </p>
      <ul className="mt-5 space-y-2">
        {CRITERIA_COPY.map((line: string) => (
          <li key={line} className="flex items-start gap-2 text-sm">
            <Check />
            <span className="text-foreground/90">{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link
          href="/pass-guarantee"
          className="text-xs font-semibold text-emerald-700 underline underline-offset-4 hover:text-emerald-600 dark:text-emerald-400"
        >
          Read the full terms →
        </Link>
      </div>
    </section>
  );
}

function Check(): ReactNode {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700 dark:text-emerald-400"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 010 1.408l-8 8a1 1 0 01-1.408 0l-4-4a1 1 0 011.408-1.408L8 12.592l7.296-7.296a1 1 0 011.408 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

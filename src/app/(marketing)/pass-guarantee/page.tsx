/**
 * /pass-guarantee — policy page linked from <PassGuaranteeBadge>.
 *
 * Public, marketing-grouped, server-rendered. No JS interactivity — pure
 * content. Covers eligibility criteria + claim process + edge cases. Refund
 * automation lands in Batch 2; until then, claims route through
 * contact@studentnest.ai.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Mail, Clock, FileText, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pass Guarantee — StudentNest",
  description:
    "Pass your AP, SAT, or ACT exam or we'll refund your subscription plus your retake fee. Full terms inside.",
};

export default function PassGuaranteePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      {/* Hero */}
      <section className="text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="rounded-2xl bg-emerald-500/15 p-3">
            <ShieldCheck className="h-8 w-8 text-emerald-700 dark:text-emerald-400" aria-hidden />
          </div>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Pass Guarantee
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
          Pass your exam or your money back — plus the retake fee.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          If you finish our program and still don&apos;t pass your AP, SAT, or ACT exam, we&apos;ll refund your full StudentNest subscription <em>and</em> reimburse your official retake fee. No fine print. No hoops.
        </p>
      </section>

      {/* How to qualify */}
      <section className="mt-12 rounded-2xl border border-border/40 bg-card p-6 sm:p-8">
        <h2 className="text-xl font-bold">How to qualify</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Three things — all reasonable, all tracked automatically inside the app:
        </p>
        <ol className="mt-5 space-y-4">
          <Criterion
            n={1}
            title="Complete ≥80% of your study plan"
            body="The personalized plan StudentNest builds after your diagnostic. We track completion as you go; you'll see your progress on the dashboard."
          />
          <Criterion
            n={2}
            title="Take at least 3 full-length mock exams"
            body="With an average score of 75% or higher across those 3 mocks. You can take as many as you'd like — only your best 3 count toward this criterion."
          />
          <Criterion
            n={3}
            title="Submit your exam score within 60 days"
            body="Once you receive your official AP / SAT / ACT score report, email it to support@studentnest.ai within 60 days of the exam date."
          />
        </ol>
      </section>

      {/* What we refund */}
      <section className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8">
        <h2 className="text-xl font-bold">What we refund</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <Mail className="h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
            <span>
              <strong>Your full StudentNest subscription</strong> — every dollar you&apos;ve paid us, refunded to the card on file. Typically processed within 5 business days.
            </span>
          </li>
          <li className="flex gap-3">
            <FileText className="h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
            <span>
              <strong>Your official exam retake fee</strong> — current College Board AP exam fee is $99, SAT is $68, ACT is $69 (without writing). We reimburse the exam-board receipt for your retake.
            </span>
          </li>
        </ul>
      </section>

      {/* How to claim */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">How to claim</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          One email. We do the rest.
        </p>
        <ol className="mt-5 space-y-3 text-sm">
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <strong>1. Email us within 60 days</strong> of receiving your official exam score.
              <br />
              <Link href="mailto:support@studentnest.ai?subject=Pass%20Guarantee%20Claim" className="text-blue-700 underline underline-offset-2 dark:text-blue-400">
                support@studentnest.ai
              </Link>
            </div>
          </li>
          <li className="flex gap-3">
            <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <strong>2. Attach two things:</strong> (a) your official score report (screenshot of the College Board / SAT / ACT dashboard or PDF), and (b) your retake-fee receipt if you&apos;ve already paid for it.
            </div>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <strong>3. We process within 5 business days.</strong> We confirm your eligibility against the criteria above (we already see your study-plan completion and mock-exam scores), and process both refunds.
            </div>
          </li>
        </ol>
      </section>

      {/* Edge cases */}
      <section className="mt-10 rounded-2xl border border-border/40 p-6 sm:p-8">
        <h2 className="text-xl font-bold">Edge cases &amp; small print</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              <strong>One claim per user, per exam course.</strong> If you&apos;re prepping multiple exams (e.g., AP Bio + AP Chem), each one is eligible separately.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              <strong>Subscription must be active</strong> on the exam date. If you cancelled before the exam, the guarantee doesn&apos;t apply to that exam.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              <strong>&quot;Don&apos;t pass&quot; is exam-specific.</strong> AP = score &lt; 3 (or whatever the program counts as passing for credit). SAT/ACT = below your stated target score, captured during onboarding.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              <strong>One retake fee reimbursement per claim</strong> — additional retakes are on you.
            </span>
          </li>
          <li className="flex gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              <strong>Good-faith standard.</strong> We don&apos;t demand third-party verification, audit logs, or anything else. If you completed the program and didn&apos;t pass, we trust you.
            </span>
          </li>
        </ul>
      </section>

      {/* Why we offer this */}
      <section className="mt-10 text-center text-sm text-muted-foreground">
        <p className="mx-auto max-w-xl">
          We&apos;re confident enough in our prep that putting our money on the line is just a way to share the bet. If you do the work, we&apos;re betting with you.
        </p>
      </section>

      <div className="mt-12 border-t border-border/40 pt-6 text-center">
        <Link href="/pricing" className="text-sm text-blue-700 underline underline-offset-2 hover:text-blue-600 dark:text-blue-400">
          ← Back to pricing
        </Link>
      </div>
    </main>
  );
}

function Criterion({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-700 dark:text-emerald-400">
        {n}
      </div>
      <div>
        <p className="font-semibold leading-tight">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </li>
  );
}

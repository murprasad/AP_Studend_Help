/**
 * /pass-guarantee/claim — Pass Guarantee refund claim form.
 *
 * NurseHub Batch 2 part 2 — refund-claim flow.
 *
 * Authenticated (sits in (dashboard) group so middleware gates anonymous
 * visitors to /login). Renders one of three states:
 *   - eligible + not claimed → claim form
 *   - eligible + claimed     → confirmation card with date + amount
 *   - not eligible           → criteria reminder + link back to dashboard
 *
 * The form POSTs to /api/pass-guarantee/claim. On success it shows a
 * success state inline (no navigation) so the user knows the claim is
 * recorded.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

interface ClaimResponse {
  ok: boolean;
  claimedAt?: string;
  refundCents?: number;
  message?: string;
  error?: string;
}

export default function PassGuaranteeClaimPage() {
  const { data: session, status } = useSession();
  const [examCourse, setExamCourse] = useState("");
  const [examScore, setExamScore] = useState("");
  const [examDate, setExamDate] = useState("");
  const [scoreReportNote, setScoreReportNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimResponse | null>(null);
  const [claimedAt, setClaimedAt] = useState<string | null>(null);
  const [refundCents, setRefundCents] = useState<number | null>(null);

  // Once session loads, populate any existing claim state on User
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const u = d?.user ?? d;
        if (u?.passGuaranteeClaimedAt) setClaimedAt(u.passGuaranteeClaimedAt);
        if (typeof u?.passGuaranteeRefundCents === "number") setRefundCents(u.passGuaranteeRefundCents);
      })
      .catch(() => {});
  }, [status]);

  if (status === "loading") {
    return <Skeleton />;
  }
  if (status !== "authenticated") {
    return <NotSignedIn />;
  }

  const eligible = session?.user?.passGuaranteeEligible === true;
  const alreadyClaimed = !!claimedAt || !!result?.ok;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/pass-guarantee/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examCourse, examScore, examDate, scoreReportNote }),
      });
      const data = (await res.json()) as ClaimResponse;
      setResult(data);
      if (data.ok && data.claimedAt) setClaimedAt(data.claimedAt);
      if (data.ok && typeof data.refundCents === "number") setRefundCents(data.refundCents);
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to dashboard
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" aria-hidden />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Pass Guarantee
        </span>
      </div>
      <h1 className="text-2xl font-bold leading-tight sm:text-3xl">Claim your refund</h1>

      {!eligible && !alreadyClaimed && <NotEligible />}

      {eligible && alreadyClaimed && (
        <AlreadyClaimed claimedAt={claimedAt ?? ""} refundCents={refundCents ?? 999} />
      )}

      {eligible && !alreadyClaimed && (
        <form onSubmit={submit} className="mt-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Submit your official exam score below. We&apos;ll verify, refund your
            subscription, and reimburse your retake fee within 5 business days.
          </p>

          <Field label="Exam course" required>
            <input
              type="text"
              value={examCourse}
              onChange={(e) => setExamCourse(e.target.value)}
              placeholder="e.g. AP World History, SAT Math"
              required
              maxLength={120}
              className="input"
            />
          </Field>

          <Field label="Your score" required>
            <input
              type="text"
              value={examScore}
              onChange={(e) => setExamScore(e.target.value)}
              placeholder="e.g. 2, 480, 18"
              required
              maxLength={32}
              className="input"
            />
          </Field>

          <Field label="Exam date" required>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
              className="input"
            />
          </Field>

          <Field label="Anything else we should know? (optional)">
            <textarea
              value={scoreReportNote}
              onChange={(e) => setScoreReportNote(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Score report attached to follow-up email, retake date, etc."
              className="input"
            />
          </Field>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="mr-1 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
            After submitting, email your official College Board / SAT / ACT
            score report to contact@studentnest.ai so we can verify.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit refund claim"}
          </button>

          {result && !result.ok && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-900 dark:text-red-200">
              {result.error || "Something went wrong. Please try again or email contact@studentnest.ai."}
            </div>
          )}
        </form>
      )}
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function NotEligible() {
  return (
    <div className="mt-6 rounded-xl border border-border/40 bg-secondary/20 p-5">
      <p className="text-sm">
        You aren&apos;t marked eligible for the guarantee yet. To qualify:
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
        <li>Complete ≥80% of your generated study plan</li>
        <li>Take ≥3 full-length mock exams with a ≥75 average</li>
        <li>Maintain an active paid subscription</li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Eligibility is checked hourly. <Link href="/pass-guarantee" className="underline">Read the full terms</Link>.
      </p>
    </div>
  );
}

function AlreadyClaimed({ claimedAt, refundCents }: { claimedAt: string; refundCents: number }) {
  const refundDollars = (refundCents / 100).toFixed(2);
  return (
    <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
      <CheckCircle2 className="h-6 w-6 text-emerald-700 dark:text-emerald-400" aria-hidden />
      <p className="mt-2 text-sm font-semibold">Claim received</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Submitted {new Date(claimedAt).toLocaleString()} · Refund estimate: ${refundDollars}
      </p>
      <p className="mt-3 text-sm">
        Our team will verify your score report and reach out within 5 business days
        with the refund + retake fee reimbursement.
      </p>
    </div>
  );
}

function NotSignedIn() {
  return (
    <main className="mx-auto max-w-md px-4 py-10 text-center">
      <p className="text-sm">
        Please <Link href="/login" className="underline">sign in</Link> to submit a claim.
      </p>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 animate-pulse">
      <div className="mb-6 h-3 w-32 rounded bg-secondary/40" />
      <div className="h-7 w-64 rounded bg-secondary/40" />
      <div className="mt-6 space-y-3">
        <div className="h-10 rounded bg-secondary/30" />
        <div className="h-10 rounded bg-secondary/30" />
        <div className="h-10 rounded bg-secondary/30" />
        <div className="h-24 rounded bg-secondary/30" />
        <div className="h-11 rounded bg-emerald-500/20" />
      </div>
    </main>
  );
}

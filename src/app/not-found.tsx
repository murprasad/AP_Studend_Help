import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — StudentNest Prep",
  description: "We couldn't find that page. Get back to your AP, SAT, or ACT prep — it's just a click away.",
  robots: { index: false, follow: false },
};

/**
 * Branded 404. Replaces the framework default with something on-brand
 * and useful — three clear escape hatches (dashboard / home / pricing)
 * so users always have a way forward instead of a dead end.
 *
 * 2026-04-25: shipped as a UX-quality pass. Anyone hitting a stale
 * link, typing a wrong URL, or following a broken external link now
 * lands here instead of a generic Next.js fallback.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Friendly visual — tilted Sage emoji over a soft accent */}
        <div className="text-6xl select-none" aria-hidden="true">
          🌿
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            That page wandered off
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We couldn't find what you were looking for. The link may have
            changed or the page no longer exists. Pick a direction below — your
            prep is waiting.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            className="block w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 transition-colors"
          >
            Back to your dashboard
          </Link>
          <Link
            href="/"
            className="block w-full rounded-lg border border-border/60 hover:bg-accent text-sm font-medium px-4 py-2.5 transition-colors"
          >
            Go to the home page
          </Link>
          <Link
            href="/pricing"
            className="text-xs text-muted-foreground underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-muted-foreground pt-1"
          >
            See pricing
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground/70 pt-4">
          Stuck? Email{" "}
          <a
            href="mailto:contact@studentnest.ai"
            className="underline underline-offset-2 decoration-muted-foreground/50 hover:decoration-muted-foreground"
          >
            contact@studentnest.ai
          </a>
          .
        </p>
      </div>
    </main>
  );
}

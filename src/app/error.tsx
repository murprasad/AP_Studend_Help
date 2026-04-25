"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Branded error boundary. Replaces the bare default with copy that:
 *   - Doesn't expose raw error.message to users (could leak server details)
 *   - Always offers Try Again + a navigation escape (Dashboard)
 *   - Surfaces the digest so user can quote it to support if needed
 *   - Reports to Sentry once for visibility
 *
 * 2026-04-25: UX-quality pass — paired with branded not-found.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Best-effort capture — Sentry init may not have run yet on cold-start;
    // the global handlers will pick it up either way.
    try {
      Sentry.captureException(error);
    } catch {
      /* silent */
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl select-none" aria-hidden="true">
          🌿
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something hiccupped
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We logged the error and our team will look into it. Try again, or
            head back to your dashboard and pick up where you were.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="block w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 transition-colors"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="block w-full rounded-lg border border-border/60 hover:bg-accent text-sm font-medium px-4 py-2.5 transition-colors"
          >
            Back to your dashboard
          </a>
        </div>
        {error.digest && (
          <p className="text-[11px] text-muted-foreground/70 pt-2">
            Reference:{" "}
            <code className="text-[11px] bg-secondary/40 px-1.5 py-0.5 rounded font-mono">
              {error.digest}
            </code>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70">
          Persistent issue? Email{" "}
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

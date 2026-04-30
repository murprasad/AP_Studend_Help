"use client";

/**
 * JourneyShell — shared chrome for every step inside /journey (Beta 9.5).
 *
 * Renders:
 *   - top progress bar ("Step N of 5") + small "Exit" button (returns to
 *     dashboard; journey state is preserved for resume)
 *   - centered card content area with max-width for readability
 */

import Link from "next/link";
import { X } from "lucide-react";

interface Props {
  step: number;
  totalSteps?: number;
  children: React.ReactNode;
  /** When true, the step itself owns the full viewport — no padded
   *  card wrapper. Use for step 1/3/4 MCQ carousels which want their
   *  own immersive layout. */
  raw?: boolean;
}

export function JourneyShell({ step, totalSteps = 5, children, raw = false }: Props) {
  const pct = Math.min(100, Math.max(0, (step / totalSteps) * 100));
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top progress bar + exit */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Step {step} of {totalSteps}
              </p>
              <Link
                href="/dashboard"
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                onClick={() => {
                  // fire-and-forget journey exit so resume works
                  fetch("/api/journey", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "exit" }),
                  }).catch(() => {});
                }}
              >
                <X className="h-3 w-3" /> Exit
              </Link>
            </div>
            <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className={raw ? "flex-1" : "flex-1 px-4 py-8"}>
        {raw ? children : <div className="max-w-2xl mx-auto">{children}</div>}
      </main>
    </div>
  );
}

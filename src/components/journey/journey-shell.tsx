"use client";

/**
 * JourneyShell — shared chrome for every step inside /journey.
 *
 * Renders:
 *   - top progress bar ("Step N of 5") + small "Exit" button
 *   - centered card content area with max-width for readability
 *
 * Beta 9.6 (2026-04-30): Exit click no longer calls /api/journey
 * directly — it opens the ExitIntentModal first so we can capture
 * preloaded reason + optional free-text. Modal handles the API write
 * and the redirect.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { ExitIntentModal } from "./exit-intent-modal";

interface Props {
  step: number;
  totalSteps?: number;
  children: React.ReactNode;
  /** When true, the step itself owns the full viewport — no padded
   *  card wrapper. */
  raw?: boolean;
}

export function JourneyShell({ step, totalSteps = 5, children, raw = false }: Props) {
  const router = useRouter();
  const [exitOpen, setExitOpen] = useState(false);
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
              <button
                type="button"
                onClick={() => setExitOpen(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Exit
              </button>
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

      <ExitIntentModal
        open={exitOpen}
        onOpenChange={setExitOpen}
        onExited={() => {
          try { localStorage.setItem("journey_status_v1", "exited"); } catch { /* ignore */ }
          router.push("/dashboard");
        }}
      />
    </div>
  );
}

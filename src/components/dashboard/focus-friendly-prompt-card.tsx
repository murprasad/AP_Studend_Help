"use client";

/**
 * FocusFriendlyPromptCard — 2026-06-05 (ADHD activation moment).
 *
 * The focus tools (Focus Mode, energy check-in, extended time) all ship
 * OFF by default and were only reachable by hunting through /settings — so
 * a student who arrives from the focus-friendly marketing never discovered
 * them. This is the one-tap opt-in activation moment: a single tap enables
 * a sensible focus-friendly bundle (Focus Mode + energy check-in).
 *
 * Guardrail-safe: self-selected, no diagnosis required, never labels the
 * student. Framed as "study your way", not "ADHD mode".
 *
 * Self-suppressing — renders null when:
 *   - the student already enabled any focus tool, OR
 *   - the prompt was already actioned/dismissed (localStorage flag).
 * Placed LOW in the dashboard stack so it never competes with the day-0
 * diagnostic CTA.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useFocusPrefs } from "@/hooks/use-focus-prefs";
import { useToast } from "@/hooks/use-toast";

const SEEN_KEY = "sn_focus_prompt_seen";

export function FocusFriendlyPromptCard() {
  const { prefs, setFocusMode, setEnergyCheckIn } = useFocusPrefs();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [seen, setSeen] = useState(true); // assume seen until we read storage (SSR-safe, avoids flash)

  useEffect(() => {
    setMounted(true);
    try {
      setSeen(localStorage.getItem(SEEN_KEY) === "1");
    } catch {
      setSeen(true);
    }
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setSeen(true);
  }

  function turnOn() {
    setFocusMode(true);
    setEnergyCheckIn(true);
    markSeen();
    toast({
      title: "Focus-friendly setup is on",
      description:
        "One question at a time, with a quick energy check-in. Adjust anytime in Settings.",
    });
  }

  // Already actioned/dismissed, still hydrating, or the student already
  // turned a focus tool on elsewhere → don't show.
  const alreadyUsingFocus =
    prefs.focusMode || prefs.energyCheckIn || prefs.extendedTime !== "1x";
  if (!mounted || seen || alreadyUsingFocus) return null;

  return (
    <div className="relative rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
      <button
        type="button"
        onClick={markSeen}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="space-y-1 pr-6">
          <h3 className="font-semibold text-foreground">Study your way</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Prefer fewer distractions? Turn on a focus-friendly setup &mdash; one
            question at a time, gentle pacing, and a quick energy check-in so you
            can study at the pace that works for you.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 pl-11">
        <button
          type="button"
          onClick={turnOn}
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          Turn on
        </button>
        <button
          type="button"
          onClick={markSeen}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Not now
        </button>
        <Link
          href="/settings"
          className="text-xs text-blue-500 hover:underline ml-auto"
        >
          Customize in Settings
        </Link>
      </div>
    </div>
  );
}

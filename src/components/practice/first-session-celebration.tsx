"use client";

/**
 * FirstSessionCelebration — one-time confetti on the user's very first
 * practice-summary screen, plus a smaller pop on subsequent ≥80% sessions.
 *
 * Renders nothing visible; returns null. All effect is in the confetti
 * canvas overlay from src/lib/confetti.ts.
 *
 * Gated by sessionStorage["shown_first_session_celebration"] — not
 * localStorage, because we want the celebration to fire once per tab
 * session. If the user opens the dashboard a week later in a fresh tab,
 * they're not a "first session" user anymore, but our heuristic is good
 * enough: the `first-only` feedback popup uses the same semantics.
 */

import { useEffect } from "react";
import { celebrateBig, celebrateMedium } from "@/lib/confetti";

interface Props {
  accuracy: number;
}

const SESSION_KEY = "shown_first_session_celebration";

export function FirstSessionCelebration({ accuracy }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let alreadyCelebrated = false;
    try {
      alreadyCelebrated = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // sessionStorage unavailable (Safari private mode etc.) — skip
      // silently; no celebration is better than a broken one.
      return;
    }
    if (alreadyCelebrated) {
      if (accuracy >= 80) celebrateMedium();
      return;
    }
    // First summary screen this tab has ever shown — go big.
    celebrateBig();
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* non-blocking */ }
  }, [accuracy]);

  return null;
}

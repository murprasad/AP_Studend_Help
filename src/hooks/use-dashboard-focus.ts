"use client";

/**
 * useDashboardFocus — Beta 9.6 (2026-04-30).
 *
 * Reads ?focus=X from the URL on /dashboard mount and scrolls + pulses
 * the matching surface so the user lands on it after the journey-rail
 * "What to do next" tiles route here.
 *
 * Supported tokens (data-focus-target attributes on the card):
 *   - primary-action  → PrimaryActionStrip (the "next session" tile)
 *   - flashcards      → FlashcardsDueCard
 *   - sage            → SageCoachPromoCard (or AI Tutor surface if rendered)
 *   - analytics       → OutcomeProgressStrip / Predicted-score area
 *
 * The hook strips the param after scroll so reload doesn't re-pulse.
 */

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function useDashboardFocus() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const focus = params?.get("focus");
    if (!focus) return;
    if (typeof window === "undefined") return;

    // Wait a tick for the dashboard to render its cards
    const timer = setTimeout(() => {
      const target = document.querySelector(`[data-focus-target="${focus}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      // Add a short pulse highlight
      target.classList.add("journey-focus-pulse");
      window.setTimeout(() => target.classList.remove("journey-focus-pulse"), 2400);

      // Strip the param so refresh doesn't re-fire
      const url = new URL(window.location.href);
      url.searchParams.delete("focus");
      router.replace(`${pathname}${url.search}`, { scroll: false });
    }, 350);

    return () => clearTimeout(timer);
  }, [params, router, pathname]);
}

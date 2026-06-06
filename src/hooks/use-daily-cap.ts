"use client";

/**
 * useDailyCap — single source of truth for "is this free user capped today?"
 *
 * 2026-06-06 (Dashboard clarity ICA, defect D3). The dashboard primary card
 * flipped between "you've hit today's cap" (JourneyHeroCard) and "Today: N
 * questions" (TodaysSetCard) on reload because each card fetched its own
 * "answered today" snapshot — a race. This hook fetches the cap signal ONCE
 * (module-cached per course for the page session) so every consumer agrees,
 * eliminating the competing-card flip.
 *
 * Mirrors JourneyHeroCard's cap rule exactly:
 *   capped = !isPremium && (answeredTodayInCourse ?? answeredToday) >= FREE_LIMITS.practiceQuestionsPerDay
 */

import { useEffect, useState } from "react";
import { FREE_LIMITS } from "@/lib/tier-limits";

export interface DailyCap {
  capped: boolean;
  answeredToday: number;
  isPremium: boolean;
}

// Per-course cache shared across all card mounts in one page load, so cards
// can't disagree. Cleared on full page reload (module re-eval).
const capCache = new Map<string, DailyCap>();
const inflight = new Map<string, Promise<DailyCap | null>>();

function fetchCap(course: string): Promise<DailyCap | null> {
  const cached = inflight.get(course);
  if (cached) return cached;
  const p = fetch(`/api/user/conversion-signal?course=${encodeURIComponent(course)}`, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: unknown): DailyCap | null => {
      if (!d || typeof d !== "object") return null;
      // Endpoint returns the signal object directly (JourneyHeroCard reads its fields flat).
      const s = d as {
        isPremium?: boolean;
        answeredToday?: number;
        answeredTodayInCourse?: number;
      };
      const answeredToday = s.answeredTodayInCourse ?? s.answeredToday ?? 0;
      const isPremium = !!s.isPremium;
      const capped = !isPremium && answeredToday >= FREE_LIMITS.practiceQuestionsPerDay;
      const v: DailyCap = { capped, answeredToday, isPremium };
      capCache.set(course, v);
      return v;
    })
    .catch(() => null)
    .finally(() => { inflight.delete(course); });
  inflight.set(course, p);
  return p;
}

/** Returns the cap state, or null while the single shared fetch is in flight. */
export function useDailyCap(course: string | undefined): DailyCap | null {
  const [state, setState] = useState<DailyCap | null>(() =>
    course ? capCache.get(course) ?? null : null,
  );

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    const cached = capCache.get(course);
    if (cached) { setState(cached); return; }
    fetchCap(course).then((v) => { if (!cancelled && v) setState(v); });
    return () => { cancelled = true; };
  }, [course]);

  return state;
}

"use client";

/**
 * useNextStep — single client hook that exposes the engine's verdict.
 *
 * Beta 10 (2026-05-01). Every recommendation surface (dashboard hero,
 * post-session card, post-journey hero, FRQ-cap screen) calls this hook
 * — never fetches /api/journey + /api/user/conversion-signal + /api/readiness
 * separately anymore.
 *
 * Caches per-course in a module-level Map for 30s. Calling refresh() forces
 * a re-fetch (use after a mutation that changes the engine output —
 * session complete, FRQ submit, billing change).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { NextStep } from "@/lib/next-step-engine";

interface CacheEntry {
  data: NextStep;
  fetchedAt: number;
}

const CACHE = new Map<string, CacheEntry>();
const TTL_MS = 30 * 1000;

interface Options {
  /** When true, skip the fetch entirely (e.g. for a course not yet selected). */
  enabled?: boolean;
}

export interface UseNextStepResult {
  nextStep: NextStep | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNextStep(course: string, opts: Options = {}): UseNextStepResult {
  const { enabled = true } = opts;
  const [nextStep, setNextStep] = useState<NextStep | null>(() => {
    const hit = CACHE.get(course);
    if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.data;
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(!CACHE.has(course));
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const fetchNow = useCallback(async (): Promise<void> => {
    if (!enabled || !course) return;
    if (inFlight.current) return inFlight.current;
    setError(null);
    setIsLoading(true);

    const p = (async () => {
      try {
        const res = await fetch(`/api/next-step?course=${encodeURIComponent(course)}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          return;
        }
        const json = await res.json();
        if (json?.nextStep) {
          CACHE.set(course, { data: json.nextStep, fetchedAt: Date.now() });
          setNextStep(json.nextStep);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "fetch failed");
      } finally {
        setIsLoading(false);
        inFlight.current = null;
      }
    })();
    inFlight.current = p;
    return p;
  }, [course, enabled]);

  // Boot — use cached value if fresh, otherwise fetch.
  useEffect(() => {
    if (!enabled) return;
    const hit = CACHE.get(course);
    if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
      setNextStep(hit.data);
      setIsLoading(false);
      return;
    }
    fetchNow();
  }, [course, enabled, fetchNow]);

  const refresh = useCallback(async () => {
    CACHE.delete(course);
    await fetchNow();
  }, [course, fetchNow]);

  return { nextStep, isLoading, error, refresh };
}

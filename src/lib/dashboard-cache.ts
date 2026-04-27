/**
 * Window-scoped fetch dedupe + cache for dashboard cards.
 *
 * Beta 8.3 added 2 new dashboard cards (CramModeCard, DailyStudyOSCard)
 * that each call /api/coach-plan and /api/user. Together with the
 * existing WeaknessFocusCard + OutcomeProgressStrip, that's 4
 * simultaneous fetches to /api/coach-plan per dashboard load. On CF
 * Workers cold-start, this causes the Predicted Score card to load
 * slowly because it's competing with the new cards for isolate warmup.
 *
 * Fix: cache the in-flight promise per (path, course) tuple. First
 * caller fetches; subsequent callers within 30s window share the same
 * promise. Cache invalidates after 30s so subsequent dashboard visits
 * get fresh data.
 *
 * Why 30s: long enough that all 4 cards on a single dashboard load
 * share one fetch; short enough that user-triggered reload (course
 * switch, navigation) gets fresh data.
 *
 * Module-scoped Map = window-scoped cache (one per browser tab).
 */

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  promise: Promise<unknown>;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

export function fetchCached<T = unknown>(url: string): Promise<T> {
  const now = Date.now();
  const existing = cache.get(url);
  if (existing && existing.expires > now) {
    return existing.promise as Promise<T>;
  }
  const promise = fetch(url, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache.set(url, { promise, expires: now + CACHE_TTL_MS });
  return promise as Promise<T>;
}

/** Clear cache — useful when course changes or after a write operation. */
export function clearDashboardCache(): void {
  cache.clear();
}

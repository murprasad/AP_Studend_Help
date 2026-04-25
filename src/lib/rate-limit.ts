// Rate limiter — Cloudflare Workers Rate Limiting API when running on the
// edge, in-process sliding window when running locally / during build.
//
// Why both paths? The in-process Map (originally the only implementation)
// silently no-ops for anonymous IPs in production because each CF Worker
// isolate has its own Map and isolates are short-lived (recycled per
// request batch). That made the IP-keyed rate limits at /api/auth/check-
// verified, /api/am-i-ready-quiz, and the anon path of /api/chat/sage
// effectively unenforceable — flagged as SEC-2b in the 2026-04-25 audit.
//
// Cloudflare's native Rate Limiting API is free, edge-distributed, and
// persists across isolate recycles. Bindings are configured in
// wrangler.toml (see [[unsafe.bindings]] block named RATELIMIT_5/10/20/60).
//
// Each binding has a FIXED limit at config time, so we map the caller's
// requested maxPerMinute to the nearest matching bucket.

const inProcessWindows = new Map<string, number[]>();

/**
 * Map a numeric per-minute limit to one of the configured CF bindings.
 * Falls back to the next-larger bucket if no exact match exists, so a
 * caller asking for 30/min gets the 60/min bucket (slightly more lenient
 * is safer than slightly more strict for an unintended typo).
 */
function bucketFor(maxPerMinute: number): "RATELIMIT_5" | "RATELIMIT_10" | "RATELIMIT_20" | "RATELIMIT_60" {
  if (maxPerMinute <= 5) return "RATELIMIT_5";
  if (maxPerMinute <= 10) return "RATELIMIT_10";
  if (maxPerMinute <= 20) return "RATELIMIT_20";
  return "RATELIMIT_60";
}

interface CFRateLimitBinding {
  limit: (opts: { key: string }) => Promise<{ success: boolean }>;
}

interface CFEnv {
  RATELIMIT_5?: CFRateLimitBinding;
  RATELIMIT_10?: CFRateLimitBinding;
  RATELIMIT_20?: CFRateLimitBinding;
  RATELIMIT_60?: CFRateLimitBinding;
}

/**
 * Best-effort lookup of the CF Workers env. On OpenNext, bindings are
 * threaded through process.env as a flat map. Returns undefined locally
 * or during build so the in-process fallback kicks in.
 */
function getCfEnv(): CFEnv | undefined {
  // OpenNext exposes bindings on process.env at runtime.
  const env = (process.env as unknown) as CFEnv;
  if (env && (env.RATELIMIT_5 || env.RATELIMIT_60)) return env;
  return undefined;
}

function inProcess(key: string, maxPerMinute: number): { allowed: boolean } {
  const now = Date.now();
  const windowMs = 60_000;
  let timestamps = inProcessWindows.get(key) ?? [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxPerMinute) {
    inProcessWindows.set(key, timestamps);
    return { allowed: false };
  }
  timestamps.push(now);
  inProcessWindows.set(key, timestamps);
  return { allowed: true };
}

/**
 * Sync wrapper preserved for callers that don't want to refactor to async.
 * Uses the in-process fallback. Prefer `rateLimitAsync` for new code or
 * for any IP-keyed (anonymous) gate where edge persistence matters.
 */
export function rateLimit(
  userId: string,
  route: string,
  maxPerMinute: number,
): { allowed: boolean } {
  return inProcess(`${userId}:${route}`, maxPerMinute);
}

/**
 * Edge-persistent rate limit. Uses CF Workers Rate Limiting bindings on
 * production; falls back to in-process Map locally / during build.
 *
 * IMPORTANT for SEC-2b: any IP-keyed gate (anonymous flood protection)
 * MUST use this async variant, not the sync `rateLimit` above. The sync
 * one resets per isolate and is functionally a no-op for unauthenticated
 * attackers in production.
 */
export async function rateLimitAsync(
  key: string,
  route: string,
  maxPerMinute: number,
): Promise<{ allowed: boolean }> {
  const env = getCfEnv();
  if (env) {
    try {
      const bucket = bucketFor(maxPerMinute);
      const binding = env[bucket];
      if (binding) {
        const { success } = await binding.limit({ key: `${route}:${key}` });
        return { allowed: success };
      }
    } catch {
      // Fall through to in-process
    }
  }
  return inProcess(`${key}:${route}`, maxPerMinute);
}

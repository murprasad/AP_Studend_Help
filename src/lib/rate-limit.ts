// In-process sliding-window rate limiter.
// Works on Cloudflare Workers (pure JS, no Node.js deps, no Redis needed).
// State resets on worker restart — acceptable at this scale.

const windows = new Map<string, number[]>();

/**
 * Returns { allowed: false } when the caller exceeds maxPerMinute requests
 * in the last 60 seconds, otherwise { allowed: true }.
 */
export function rateLimit(
  userId: string,
  route: string,
  maxPerMinute: number
): { allowed: boolean } {
  const key = `${userId}:${route}`;
  const now = Date.now();
  const windowMs = 60_000;

  let timestamps = windows.get(key) ?? [];
  // Purge entries older than 60s
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxPerMinute) {
    windows.set(key, timestamps);
    return { allowed: false };
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  return { allowed: true };
}

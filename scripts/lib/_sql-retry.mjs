/**
 * Neon HTTP client with automatic retry on transient network errors.
 *
 * Background: Neon's HTTP edge proxy drops idle connections aggressively
 * (~30s). Long-running orchestrator scripts that make hundreds of sequential
 * queries routinely hit ECONNRESET / "fetch failed" mid-batch, killing the
 * whole script and forcing a full restart.
 *
 * This wrapper preserves the tagged-template call signature of the raw
 * neon() client while retrying transient network errors with exponential
 * backoff. Non-network errors (SQL errors, schema violations, etc.) are
 * passed through unchanged.
 *
 * Usage:
 *   import { neonRetry } from "./lib/_sql-retry.mjs";
 *   const sql = neonRetry(process.env.DATABASE_URL);
 *   const rows = await sql`SELECT * FROM users WHERE id = ${userId}`;
 */
import { neon } from "@neondatabase/serverless";

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EPIPE",
  "EAI_AGAIN",
  "ENETUNREACH",
  "UND_ERR_SOCKET",
]);

function isTransientNetworkError(err) {
  if (!err) return false;
  const code = err.cause?.code || err.sourceError?.code || err.code;
  if (code && NETWORK_ERROR_CODES.has(code)) return true;
  const msg = String(err.message || err.sourceError?.message || "");
  if (msg.includes("fetch failed")) return true;
  if (msg.includes("ECONNRESET")) return true;
  if (msg.includes("socket hang up")) return true;
  if (msg.includes("other side closed")) return true;
  return false;
}

export function neonRetry(url, opts = {}) {
  const cleanUrl = (url || "").replace(/^["']|["']$/g, "");
  const baseSql = neon(cleanUrl);
  const maxRetries = opts.maxRetries ?? 6;
  const baseDelay = opts.baseDelay ?? 250;
  const verbose = opts.verbose ?? true;

  const wrapped = async (...args) => {
    let lastErr;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await baseSql(...args);
      } catch (err) {
        lastErr = err;
        if (!isTransientNetworkError(err) || attempt === maxRetries - 1) {
          throw err;
        }
        const code = err.cause?.code || err.sourceError?.code || "network";
        const delay = baseDelay * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
        if (verbose) {
          console.warn(`[sql-retry] ${code} on attempt ${attempt + 1}/${maxRetries} — sleeping ${delay}ms`);
        }
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };

  // Preserve any helper methods Neon exposes on the sql function (e.g. transaction, query)
  Object.assign(wrapped, baseSql);
  return wrapped;
}

"use client";

import { useEffect } from "react";

/**
 * Initializes Sentry browser SDK once per page load. Reads
 * NEXT_PUBLIC_SENTRY_DSN from build-time env (set in Cloudflare Pages
 * env vars). If unset, init is a no-op so we don't break local dev.
 *
 * Why a client component instead of next.config.js withSentryConfig?
 * - Avoids the @sentry/nextjs server/edge runtime configs that have
 *   compatibility friction with OpenNext + Cloudflare Workers.
 * - Browser-only init catches every JS error a user sees, which is the
 *   biggest visibility gap right now.
 * - Server-side errors are already logged via console.error and
 *   captured in CF Pages logs; we'll add a dedicated server reporter
 *   later if needed.
 */
export function SentryInit() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    // Dynamic import so the SDK only loads if DSN is configured.
    import("@sentry/nextjs").then((Sentry) => {
      try {
        Sentry.init({
          dsn,
          // 10% performance traces — adjust if quota tight.
          tracesSampleRate: 0.1,
          // Capture replays of 1% of sessions (free tier-friendly).
          replaysSessionSampleRate: 0.01,
          // Always capture replay when an error occurs.
          replaysOnErrorSampleRate: 1.0,
          // Tag all events with environment so prod vs preview is clear.
          environment:
            typeof window !== "undefined" && window.location.hostname === "studentnest.ai"
              ? "production"
              : "preview",
          // Suppress the default "Sentry initialized" console message.
          debug: false,
          // Don't capture noisy errors from extensions / third-party scripts.
          ignoreErrors: [
            "ResizeObserver loop limit exceeded",
            "Non-Error promise rejection captured",
            "Network request failed",
            // NextAuth session refresh races
            "Failed to fetch",
          ],
        });
      } catch (err) {
        // Init failure should never crash the app
        console.warn("[sentry] init failed:", err);
      }
    });
  }, []);

  return null;
}

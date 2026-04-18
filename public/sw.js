// EMERGENCY PASS-THROUGH v6 — 2026-04-18 (late)
//
// Previous versions (v3/v4) used a cache-first strategy on /dashboard,
// /practice, and /ai-tutor. During the Prisma `--no-engine` incident they
// cached broken responses and kept serving them even after the server
// was fixed. On top of that, the broken cache caused ERR_FAILED on
// navigation because the cached HTML referenced chunk URLs that no
// longer existed.
//
// This version:
//  1. Purges every previous cache on activation (studentnest-v3, -v4, etc.)
//  2. Takes over all clients immediately (claim)
//  3. Does NOT cache anything — every fetch goes to the network
//
// PWA offline capability is disabled for now in exchange for reliability.
// If we want offline later, bring back caching with a NETWORK-FIRST
// strategy + short TTL so a bad response can't get stuck.
//
// v6 bump: some users still hit "Loading chunk NNN failed" after the
// Coach Mode deploy because their browsers held HTML referencing old
// chunk hashes. The version bump triggers skipWaiting → claim → purge
// for every client with an old SW, without needing a hard refresh.
const CACHE_NAME = "studentnest-v6";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Purge every cache — both ours and any v3/v4 leftovers.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // Take over all open tabs so they stop serving the old SW's cache.
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  // Network-only. Caller (browser) may still hit HTTP cache, but that
  // respects Cache-Control headers from the server, not this SW.
  event.respondWith(fetch(event.request).catch(() => {
    // If the network fails entirely, return a minimal 503 so browsers
    // don't show ERR_FAILED — they'll show a proper error page.
    return new Response("Service temporarily unavailable — refresh in a moment.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }));
});

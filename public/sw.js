// SELF-UNREGISTERING SW v7 — 2026-04-20
//
// The previous SW (v6) passed through every fetch with a 503 fallback on
// network failure. On CF Workers, when the origin is slow (auth'd /api/
// routes on evaluate), the SW's `fetch` would eventually reject, the
// `.catch` returned 503, and the client saw "Failed to load resource:
// 503" — a hang masquerading as a clean error.
//
// This version does NOT intercept fetches at all. It exists only to
// purge caches on activation and then unregister itself, so returning
// users escape the old SW. Future traffic goes direct to the network,
// respecting standard HTTP caching rules only.
const CACHE_NAME = "studentnest-v7";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Purge every legacy cache.
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    // Take over all tabs so they get this no-intercept version immediately.
    await self.clients.claim();
    // Unregister this worker so future loads are fully direct-to-network.
    // New users won't re-register because layout.tsx still calls
    // `navigator.serviceWorker.register('/sw.js')`, but this sw.js no
    // longer does anything useful — it purges+unregisters on every install.
    try { await self.registration.unregister(); } catch { /* ignored */ }
  })());
});

// Intentionally NO `fetch` listener. The browser goes straight to the
// network for every request, and any 5xx comes from the real origin
// rather than a SW fallback masquerading as a server error.

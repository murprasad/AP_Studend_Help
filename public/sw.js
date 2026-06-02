// 2026-06-02 — Renamed from preplion-v7 → studentnest-v8 (copy-paste bug
// from PL fork). A user with the old SW installed will keep serving
// stale /sat-prep navigation outcomes; bumping the cache name + the SW
// activate step (already calls caches.delete on non-current keys)
// forces all users to drop the legacy preplion-v7 entries.
// Also fixed STATIC_PAGES: dropped /clep-prep and /dsst-prep (not SN
// pages — those are PrepLion); added the actual 4 SN product pages.
const CACHE_NAME = "studentnest-v8";
const QUESTION_CACHE = "studentnest-questions-v1";
const STATIC_PAGES = [
  "/", "/pricing", "/about", "/faq", "/login", "/register",
  "/ap-prep", "/sat-prep", "/act-prep", "/psat-prep",
  "/dashboard", "/practice", "/ai-tutor", "/billing", "/mock-exam", "/diagnostic",
  "/analytics", "/study-plan", "/resources", "/community", "/onboarding", "/flashcards",
];

// API paths that should cache responses for offline use
const CACHEABLE_API_PATHS = [
  "/api/questions",
  "/api/flashcards",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== QUESTION_CACHE).map((key) => caches.delete(key)))
    ).then(() => caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_PAGES)))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== QUESTION_CACHE).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 2026-05-27 — Web Push handler. Server payload shape:
//   { title, body, url, icon, tag }
// Falls back to safe defaults so a malformed payload still notifies.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "StudentNest", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "StudentNest";
  const opts = {
    body: payload.body || "Pick up where you left off",
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "default",
    data: { url: payload.url || "/dashboard" },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

// On tap → focus an existing StudentNest tab or open a new one to the url.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      const u = new URL(client.url);
      if (u.origin === self.location.origin) {
        await client.focus();
        client.navigate(targetUrl);
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cacheable API requests — network-first, cache for offline
  if (CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p)) && event.request.method === "GET") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(QUESTION_CACHE).then((cache) => {
              cache.put(event.request, clone);
              // Limit cache to 50 entries to prevent unbounded growth
              cache.keys().then((keys) => {
                if (keys.length > 50) cache.delete(keys[0]);
              });
            });
          }
          return response;
        })
        .catch(() =>
          caches.open(QUESTION_CACHE).then((cache) => cache.match(event.request)).then((cached) =>
            cached || new Response(JSON.stringify({ error: "You appear to be offline" }), {
              status: 503, headers: { "Content-Type": "application/json" },
            })
          )
        )
    );
    return;
  }

  // Non-cacheable API requests — always network, error JSON if offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "You appear to be offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Cache-first for static assets (JS chunks, CSS, fonts, images)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for pages — always try fresh content, fall back to cache
  if (event.request.mode === "navigate" || STATIC_PAGES.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

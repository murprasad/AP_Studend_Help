/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // 2026-05-03 — StudentNest is AP/SAT/ACT only. CLEP/DSST live on PrepLion.
  // Permanent (308) redirect for any /clep-prep or /dsst-prep URL so existing
  // search-engine links and bookmarks land on the right product.
  async redirects() {
    return [
      { source: "/clep-prep", destination: "https://preplion.ai", permanent: true },
      { source: "/clep-prep/:path*", destination: "https://preplion.ai", permanent: true },
      { source: "/dsst-prep", destination: "https://preplion.ai", permanent: true },
      { source: "/dsst-prep/:path*", destination: "https://preplion.ai", permanent: true },
      // 2026-06-28 — One Platform, One Brand: consolidate ACT/SAT/PSAT to
      // PrepLion (marketing redirects only; no user/data migration). ACT + SAT
      // point to PrepLion's dedicated prep pages; PSAT folds into SAT prep
      // (PrepLion has no separate PSAT product — PSAT ≈ pre-SAT, same skills).
      // ?from=studentnest lets PrepLion show a dismissible "now part of PrepLion"
      // welcome banner to redirected visitors (transparency without breaking the 301).
      { source: "/act-prep", destination: "https://preplion.ai/act-prep?from=studentnest", permanent: true },
      { source: "/act-prep/:path*", destination: "https://preplion.ai/act-prep?from=studentnest", permanent: true },
      { source: "/act-vs-sat-which-should-i-take", destination: "https://preplion.ai/act-prep?from=studentnest", permanent: true },
      { source: "/sat-prep", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      { source: "/sat-prep/:path*", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      { source: "/free-sat-practice", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      { source: "/digital-sat-2024-changes", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      { source: "/psat-prep", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      { source: "/psat-prep/:path*", destination: "https://preplion.ai/sat-prep?from=studentnest", permanent: true },
      // NOTE (2026-06-28): AP stays on StudentNest for now (user decision), so
      // NO blanket catch-all — only the ACT/SAT/PSAT course pages above redirect
      // to PrepLion. AP, home, blog, login, etc. keep serving on StudentNest.
    ];
  },
  async headers() {
    // CF Pages `_headers` file only applies to static assets, not to
    // OpenNext Worker-served requests. Setting headers here routes them
    // through the Next.js response chain, which OpenNext preserves.
    // Resolves Category J (security-header audit, 120 rows) on next deploy.
    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // microphone=(self) allows Sage Coach voice practice on our own
      // origin while still blocking it for cross-origin iframes.
      // camera=() and geolocation=() stay blanket-blocked — no current
      // feature needs them.
      { key: "Permissions-Policy", value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()' },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // 'unsafe-inline' + 'unsafe-eval' required for Next.js 14 + KaTeX +
          // inline theme-boot script in layout.tsx. Tightening to nonce-based
          // tracked in FMEA as future hardening.
          // static.cloudflareinsights.com: CF Pages auto-injects Web Analytics
          // beacon. Without this allowlist, every public page logs a CSP
          // violation in console (caught by persona-c-console-errors.spec).
          // 2026-06-02 — desmos.com added for SAT=CB parity F4 Desmos
          // embed. SAT_MATH practice loaded the question text but the
          // calculator showed "Desmos script failed to load" because
          // www.desmos.com/api/v1.x/calculator.js was CSP-blocked. The
          // calc fetches assets from a CDN subdomain too — *.desmos.com.
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clarity.ms https://www.clarity.ms https://www.googletagmanager.com https://*.ingest.sentry.io https://browser.sentry-cdn.com https://js.stripe.com https://static.cloudflareinsights.com https://www.desmos.com https://*.desmos.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.desmos.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com https://*.desmos.com",
          "connect-src 'self' https://*.ingest.sentry.io https://*.sentry.io https://*.clarity.ms https://www.clarity.ms https://api.stripe.com https://checkout.stripe.com https://api.groq.com https://generativelanguage.googleapis.com https://text.pollinations.ai https://en.wikipedia.org https://www.reddit.com https://api.stackexchange.com https://cloudflareinsights.com https://static.cloudflareinsights.com https://*.desmos.com wss: ws:",
          "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://accounts.google.com https://*.desmos.com",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self' https://checkout.stripe.com https://accounts.google.com",
        ].join("; "),
      },
    ];
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // Beta 9.5 (2026-04-30) — `canvas` is a Node-native package that
  // vega-canvas tries to resolve when react-vega is imported (even via
  // dynamic import, Next.js's webpack pre-analysis follows the chain).
  // We don't ship server-side vega rendering — react-vega is loaded
  // client-side only via dynamic import in visual-block.tsx — so
  // aliasing canvas to false on the server is safe.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = { ...(config.resolve.alias ?? {}), canvas: false };
    }
    return config;
  },
};

export default nextConfig;

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
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clarity.ms https://www.clarity.ms https://www.googletagmanager.com https://*.ingest.sentry.io https://browser.sentry-cdn.com https://js.stripe.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://*.ingest.sentry.io https://*.sentry.io https://*.clarity.ms https://www.clarity.ms https://api.stripe.com https://checkout.stripe.com https://api.groq.com https://generativelanguage.googleapis.com https://text.pollinations.ai https://en.wikipedia.org https://www.reddit.com https://api.stackexchange.com wss: ws:",
          "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://hooks.stripe.com https://accounts.google.com",
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
};

export default nextConfig;

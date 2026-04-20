import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Auth-gated path prefixes. Keep in sync with earlier (auth)/layout expectations.
const AUTH_PATHS = [
  "/dashboard", "/practice", "/analytics", "/study-plan", "/mock-exam",
  "/ai-tutor", "/sage-coach", "/admin", "/community", "/resources",
  "/diagnostic", "/frq-practice",
];

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth check only on gated paths. Admin sub-check too.
  if (isAuthPath(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Cache-Control fix (applied to ALL matched routes, including landing/login).
  // Hashed JS chunks stay immutable-cached (Cloudflare Pages adds that header
  // automatically for /_next/static/*). Forcing no-store on HTML means users
  // always land on HTML whose chunk references actually exist in the current
  // deploy. Fixes "Loading chunk NNN failed" after deploys + the Sage Coach
  // stale-bundle issue where users kept hitting pre-fix client code.
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

// Broad matcher — run on all routes EXCEPT static assets and Next internals.
// This ensures landing/login pages also get the no-store header (fixes the
// chunk-load error). Excludes: _next/static, _next/image, favicon, sw.js,
// manifest, and most public assets.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|icon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf)).*)",
  ],
};

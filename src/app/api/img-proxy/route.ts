/**
 * GET /api/img-proxy?u=<encoded-image-url>
 *
 * Caching proxy for external image stimuli (primarily Wikimedia Commons).
 * Why this exists: Wikimedia has a per-IP rate limit (~60 req/min). With
 * 300+ concurrent students loading question images, all hitting Wikimedia
 * directly from their browsers, the IP that proxies through CF can trip
 * 429 rate-limits and break visuals during peak load.
 *
 * This route runs on the CF Workers edge — first hit fetches Wikimedia
 * once, caches at the edge for 30 days, all subsequent hits served from
 * cache. Wikimedia sees one request per (image, edge node) instead of one
 * per user.
 *
 * Allowlist hosts to prevent open-proxy abuse:
 *   - upload.wikimedia.org
 *   - commons.wikimedia.org
 *   - en.wikipedia.org
 *   - studentnest.ai (self — for any internal redirects)
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const ALLOWED_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "en.wikipedia.org",
  "studentnest.ai",
]);

const CACHE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) {
    return NextResponse.json({ error: "Missing 'u' parameter" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json(
      { error: `Host not allowed: ${target.hostname}` },
      { status: 403 },
    );
  }

  // Use the global Cache API at the edge.
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(target.toString());

  let response = await cache?.match(cacheKey);
  if (response) {
    // Re-wrap so we can mutate headers safely
    const cached = new Response(response.body, response);
    cached.headers.set("X-Cache", "HIT");
    return cached;
  }

  // Cache miss — fetch from origin with our own UA
  const upstream = await fetch(target.toString(), {
    headers: {
      "User-Agent": "studentnest.ai-img-proxy/1.0 (https://studentnest.ai)",
      "Accept": "image/*",
    },
    cf: {
      cacheTtl: CACHE_SECONDS,
      cacheEverything: true,
    },
  } as RequestInit);

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Non-image response" }, { status: 502 });
  }

  // Build cacheable response
  const body = await upstream.arrayBuffer();
  response = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, immutable`,
      "X-Cache": "MISS",
      "Access-Control-Allow-Origin": "*",
    },
  });

  // Store in edge cache (fire-and-forget)
  if (cache) {
    cache.put(cacheKey, response.clone()).catch(() => {});
  }

  return response;
}

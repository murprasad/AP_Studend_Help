/**
 * Build-time sitemap generator → writes public/sitemap.xml
 *
 * 2026-06-08: app/sitemap.ts (Next.js metadata route) 404s under OpenNext/
 * Cloudflare. Static public/ files serve fine, so we emit a real sitemap.xml
 * into public/ at build time. Wired into `pages:build`. Run: npx tsx scripts/gen-sitemap.ts
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getSitemapEntries } from "../src/lib/sitemap-data";

const lastmod = new Date().toISOString().slice(0, 10);
const entries = getSitemapEntries();

const body = entries
  .map(
    (e) =>
      `  <url>\n    <loc>${e.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
      `    <changefreq>${e.changeFrequency}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
  )
  .join("\n");

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${body}\n</urlset>\n`;

writeFileSync(join(process.cwd(), "public", "sitemap.xml"), xml, "utf8");
console.log(`✅ Wrote ${entries.length} URLs to public/sitemap.xml`);

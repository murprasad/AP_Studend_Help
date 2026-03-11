/**
 * Free Educational Data APIs — no API keys required.
 *
 * Integrated services:
 *  - Wikipedia REST API      https://en.wikipedia.org/api/rest_v1/
 *  - Wikimedia / Wikidata    https://www.wikidata.org/w/api.php
 *  - Library of Congress     https://www.loc.gov/apis/json-and-yaml-apis/
 *  - Stack Exchange API      https://api.stackexchange.com/2.3/  (CC BY-SA 4.0)
 *  - Reddit JSON API         https://www.reddit.com/r/{sub}.json (public read)
 *  - College Board FRQ       https://apcentral.collegeboard.org  (public PDFs)
 *
 * Static resource references (no public API, linked only):
 *  - OpenStax                https://openstax.org
 *  - CK-12 Foundation        https://www.ck12.org
 *  - Khan Academy            https://www.khanacademy.org
 */

export interface WikipediaResult {
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
}

export interface LocResult {
  title: string;
  description: string;
  url: string;
  date?: string;
  mediaType?: string;
  imageUrl?: string;
}

export interface WikidataResult {
  id: string;
  label: string;
  description: string;
  url: string;
}

export interface EduSearchResult {
  source: "wikipedia" | "loc" | "wikidata";
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  date?: string;
  mediaType?: string;
}

// ── Wikipedia ────────────────────────────────────────────────────────────────

export async function searchWikipedia(query: string, limit = 3): Promise<WikipediaResult[]> {
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&list=search` +
      `&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.query?.search || []).slice(0, limit).map(
      (r: { title: string; snippet: string }) => ({
        title: r.title,
        summary: r.snippet.replace(/<[^>]+>/g, "").slice(0, 300),
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
      })
    );
  } catch {
    return [];
  }
}

export async function getWikipediaSummary(title: string): Promise<WikipediaResult | null> {
  try {
    const encoded = encodeURIComponent(title.replace(/ /g, "_"));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      title: d.title,
      summary: d.extract?.slice(0, 600) || "",
      url: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encoded}`,
      imageUrl: d.thumbnail?.source,
    };
  } catch {
    return null;
  }
}

// ── Library of Congress ──────────────────────────────────────────────────────

export async function searchLibraryOfCongress(query: string, limit = 5): Promise<LocResult[]> {
  try {
    const url =
      `https://www.loc.gov/search/?fo=json` +
      `&q=${encodeURIComponent(query)}&c=${limit}&at=results`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).slice(0, limit).map(
      (item: Record<string, unknown>) => ({
        title: (item.title as string) || "Untitled",
        description: ((item.description as string[]) || []).join(" ").slice(0, 300),
        url:
          (item.url as string) ||
          `https://www.loc.gov/search/?q=${encodeURIComponent(query)}`,
        date: item.date as string | undefined,
        mediaType: ((item.original_format as string[]) || []).join(", "),
        imageUrl: item.image_url as string | undefined,
      })
    );
  } catch {
    return [];
  }
}

// ── Wikidata ─────────────────────────────────────────────────────────────────

export async function searchWikidata(query: string, limit = 3): Promise<WikidataResult[]> {
  try {
    const url =
      `https://www.wikidata.org/w/api.php?action=wbsearchentities` +
      `&search=${encodeURIComponent(query)}&language=en&limit=${limit}&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.search || []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      label: item.label as string,
      description: (item.description as string) || "",
      url: `https://www.wikidata.org/wiki/${item.id}`,
    }));
  } catch {
    return [];
  }
}

// ── Combined search ──────────────────────────────────────────────────────────

export async function searchAllEduAPIs(
  query: string,
  sources: ("wikipedia" | "loc" | "wikidata")[] = ["wikipedia", "loc", "wikidata"]
): Promise<EduSearchResult[]> {
  const results: EduSearchResult[] = [];

  await Promise.allSettled([
    sources.includes("wikipedia")
      ? searchWikipedia(query, 3).then((r) =>
          results.push(
            ...r.map((w) => ({
              source: "wikipedia" as const,
              title: w.title,
              description: w.summary,
              url: w.url,
              imageUrl: w.imageUrl,
            }))
          )
        )
      : Promise.resolve(),

    sources.includes("loc")
      ? searchLibraryOfCongress(query, 4).then((r) =>
          results.push(
            ...r.map((l) => ({
              source: "loc" as const,
              title: l.title,
              description: l.description,
              url: l.url,
              date: l.date,
              mediaType: l.mediaType,
              imageUrl: l.imageUrl,
            }))
          )
        )
      : Promise.resolve(),

    sources.includes("wikidata")
      ? searchWikidata(query, 3).then((r) =>
          results.push(
            ...r.map((w) => ({
              source: "wikidata" as const,
              title: w.label,
              description: w.description,
              url: w.url,
            }))
          )
        )
      : Promise.resolve(),
  ]);

  return results;
}

// ── AI context enrichment ─────────────────────────────────────────────────────
// Returns a compact string to inject into AI system prompts.

export async function getEduContextForQuery(query: string): Promise<string> {
  const [wikiRes, locRes] = await Promise.allSettled([
    searchWikipedia(query, 2),
    searchLibraryOfCongress(query, 2),
  ]);

  const parts: string[] = [];

  if (wikiRes.status === "fulfilled" && wikiRes.value.length > 0) {
    parts.push(
      `Wikipedia:\n${wikiRes.value
        .map((w) => `• ${w.title}: ${w.summary}`)
        .join("\n")}`
    );
  }

  if (locRes.status === "fulfilled" && locRes.value.length > 0) {
    parts.push(
      `Library of Congress primary sources:\n${locRes.value
        .map((l) => `• ${l.title}${l.date ? ` (${l.date})` : ""}: ${l.description}`)
        .join("\n")}`
    );
  }

  return parts.join("\n\n");
}

// ── Stack Exchange API (CC BY-SA 4.0 — free, no key required for 300 req/day) ─

export interface StackResult {
  title: string;
  body: string;
  url: string;
  score: number;
  tags: string[];
}

/**
 * Search Stack Exchange for AP-relevant Q&A content.
 * site: "physics" | "cs" | "stackoverflow"
 * Content is CC BY-SA 4.0 licensed — safe for educational use with attribution.
 */
export async function searchStackExchange(
  query: string,
  site: "physics" | "cs" | "stackoverflow" = "physics",
  limit = 5
): Promise<StackResult[]> {
  try {
    const url =
      `https://api.stackexchange.com/2.3/search/advanced` +
      `?q=${encodeURIComponent(query)}&site=${site}&sort=votes&pagesize=${limit}` +
      `&filter=withbody&order=desc`;
    const res = await fetch(url, {
      headers: { "Accept-Encoding": "identity" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data.items || []) as Record<string, unknown>[]).slice(0, limit).map((item) => ({
      title: item.title as string,
      body: ((item.body as string) || "").replace(/<[^>]+>/g, "").slice(0, 400),
      url: item.link as string,
      score: (item.score as number) || 0,
      tags: (item.tags as string[]) || [],
    }));
  } catch {
    return [];
  }
}

// ── Reddit JSON API (public subreddits, no auth for read-only) ────────────────

export interface RedditPost {
  title: string;
  selftext: string;
  url: string;
  score: number;
  subreddit: string;
}

const AP_SUBREDDITS: Record<string, string[]> = {
  AP_WORLD_HISTORY: ["AP_World", "APStudents"],
  AP_COMPUTER_SCIENCE_PRINCIPLES: ["APComputerScience", "APStudents"],
  AP_PHYSICS_1: ["apphysics", "APStudents"],
};

/**
 * Fetch top posts from AP-relevant subreddits.
 * Uses Reddit's public .json endpoint — no auth required for public subreddits.
 */
export async function searchRedditAP(
  query: string,
  course: string = "AP_WORLD_HISTORY",
  limit = 5
): Promise<RedditPost[]> {
  const subs = AP_SUBREDDITS[course] ?? ["APStudents"];
  const results: RedditPost[] = [];

  for (const sub of subs.slice(0, 2)) {
    try {
      const url =
        `https://www.reddit.com/r/${sub}/search.json` +
        `?q=${encodeURIComponent(query)}&sort=top&t=year&limit=${limit}&restrict_sr=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "PrepNova/1.0 (Educational AP Prep App)" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const posts = (data?.data?.children || []) as { data: Record<string, unknown> }[];
      results.push(
        ...posts.slice(0, limit).map((p) => ({
          title: p.data.title as string,
          selftext: ((p.data.selftext as string) || "").slice(0, 300),
          url: `https://reddit.com${p.data.permalink}`,
          score: (p.data.score as number) || 0,
          subreddit: sub,
        }))
      );
      if (results.length >= limit) break;
    } catch {
      continue;
    }
  }
  return results.slice(0, limit);
}

// ── College Board FRQ catalog (publicly released, no auth required) ───────────

/** Publicly released College Board FRQ PDFs per course (3 years × 2 sets each). */
export const CB_FRQ_CATALOG: Record<string, Array<{ year: number; set: number; url: string }>> = {
  AP_WORLD_HISTORY: [
    { year: 2025, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-modern-set-1.pdf" },
    { year: 2025, set: 2, url: "https://apcentral.collegeboard.org/media/pdf/ap25-frq-world-history-modern-set-2.pdf" },
    { year: 2024, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-set-1.pdf" },
    { year: 2024, set: 2, url: "https://apcentral.collegeboard.org/media/pdf/ap24-frq-world-history-set-2.pdf" },
    { year: 2023, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-modern-set-1.pdf" },
    { year: 2023, set: 2, url: "https://apcentral.collegeboard.org/media/pdf/ap23-frq-world-history-modern-set-2.pdf" },
  ],
  AP_COMPUTER_SCIENCE_PRINCIPLES: [
    { year: 2025, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-1.pdf" },
    { year: 2025, set: 2, url: "https://apcentral.collegeboard.org/media/pdf/ap25-frq-computer-science-principles-set-2.pdf" },
    { year: 2024, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap24-frq-csp-set-1.pdf" },
    { year: 2024, set: 2, url: "https://apcentral.collegeboard.org/media/pdf/ap24-frq-csp-set-2.pdf" },
  ],
  AP_PHYSICS_1: [
    { year: 2025, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap25-frq-physics-1.pdf" },
    { year: 2024, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap24-frq-physics-1.pdf" },
    { year: 2023, set: 1, url: "https://apcentral.collegeboard.org/media/pdf/ap23-frq-physics-1.pdf" },
  ],
};

/**
 * Build enriched AI context for question generation, combining:
 *  - Wikipedia (humanities/history)
 *  - Stack Exchange (STEM)
 *  - Reddit AP community discussions
 *  - Library of Congress (history primary sources)
 */
export async function getEnrichedContext(
  query: string,
  course: string = "AP_WORLD_HISTORY"
): Promise<string> {
  const isSTEM = course === "AP_PHYSICS_1" || course === "AP_COMPUTER_SCIENCE_PRINCIPLES";
  const seSite = course === "AP_PHYSICS_1" ? "physics" : "cs";

  const [wikiRes, seRes, redditRes] = await Promise.allSettled([
    isSTEM ? Promise.resolve([]) : searchWikipedia(query, 2),
    isSTEM ? searchStackExchange(query, seSite, 3) : Promise.resolve([]),
    searchRedditAP(query, course, 3),
  ]);

  const parts: string[] = [];

  if (wikiRes.status === "fulfilled" && wikiRes.value.length > 0) {
    parts.push(`Wikipedia:\n${wikiRes.value.map((w) => `• ${w.title}: ${w.summary}`).join("\n")}`);
  }

  if (seRes.status === "fulfilled" && seRes.value.length > 0) {
    parts.push(
      `Stack Exchange (CC BY-SA):\n${seRes.value
        .map((s) => `• ${s.title} [score:${s.score}]: ${s.body}`)
        .join("\n")}`
    );
  }

  if (redditRes.status === "fulfilled" && redditRes.value.length > 0) {
    parts.push(
      `AP Student Discussions (Reddit):\n${redditRes.value
        .map((r) => `• r/${r.subreddit}: ${r.title}`)
        .join("\n")}`
    );
  }

  return parts.join("\n\n");
}

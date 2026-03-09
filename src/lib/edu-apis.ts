/**
 * Free Educational Data APIs — no API keys required.
 *
 * Integrated services:
 *  - Wikipedia REST API      https://en.wikipedia.org/api/rest_v1/
 *  - Wikimedia / Wikidata    https://www.wikidata.org/w/api.php
 *  - Library of Congress     https://www.loc.gov/apis/json-and-yaml-apis/
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

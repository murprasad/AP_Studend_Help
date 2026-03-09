import { NextRequest, NextResponse } from "next/server";
import { searchAllEduAPIs } from "@/lib/edu-apis";

export const dynamic = "force-dynamic";

/**
 * GET /api/resources/search?q=query&source=all|wikipedia|loc|wikidata
 *
 * Searches free educational APIs:
 *   - Wikipedia (summaries + full articles)
 *   - Library of Congress (primary sources, documents, images, timelines)
 *   - Wikidata (structured historical facts)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const sourceParam = searchParams.get("source") || "all";

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required (min 2 characters)" },
      { status: 400 }
    );
  }

  const validSources = ["wikipedia", "loc", "wikidata"] as const;
  const sources =
    sourceParam === "all"
      ? [...validSources]
      : ([sourceParam].filter((s) =>
          validSources.includes(s as (typeof validSources)[number])
        ) as ("wikipedia" | "loc" | "wikidata")[]);

  if (sources.length === 0) {
    return NextResponse.json(
      { error: "Invalid source. Use: wikipedia, loc, wikidata, or all" },
      { status: 400 }
    );
  }

  try {
    const results = await searchAllEduAPIs(query, sources);
    return NextResponse.json({
      query,
      sources,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Resource search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

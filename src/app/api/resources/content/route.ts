import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UNIT_RESOURCES } from "@/data/resources";
import { ApUnit } from "@prisma/client";

// Fetches publicly accessible study content from open educational resources
// to enrich AI responses and provide study materials
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unit = searchParams.get("unit") as ApUnit | null;
  const source = searchParams.get("source") || "fiveable";

  const unitResource = unit
    ? UNIT_RESOURCES.find((r) => r.unit === unit)
    : null;

  if (!unitResource) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  try {
    let content = null;
    let fetchUrl = "";

    // Try to fetch content from the requested source
    switch (source) {
      case "fiveable":
        fetchUrl = unitResource.fiveableUrl;
        break;
      case "oer":
        fetchUrl = unitResource.oerUrl;
        break;
      default:
        fetchUrl = unitResource.fiveableUrl;
    }

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AP-SmartPrep/1.0; Educational Tool)",
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (response.ok) {
      const html = await response.text();
      // Extract text content (strip HTML tags)
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 3000); // limit to 3000 chars for AI context
      content = text;
    }

    return NextResponse.json({
      unit,
      source,
      url: fetchUrl,
      content,
      unitResource: {
        unitName: unitResource.unitName,
        timePeriod: unitResource.timePeriod,
        keyThemes: unitResource.keyThemes,
      },
    });
  } catch (error) {
    console.error("Content fetch error:", error);
    return NextResponse.json({
      unit,
      source,
      content: null,
      unitResource: unit ? {
        unitName: unitResource.unitName,
        timePeriod: unitResource.timePeriod,
        keyThemes: unitResource.keyThemes,
      } : null,
    });
  }
}

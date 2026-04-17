import { MetadataRoute } from "next";
import { isClepEnabled, isDsstEnabled } from "@/lib/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://studentnest.ai";
  const now = new Date();
  const [clepOn, dsstOn] = await Promise.all([isClepEnabled(), isDsstEnabled()]);

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/ap-prep`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...["ap-world-history-modern", "ap-computer-science-principles", "ap-physics-1"].map(slug => ({
      url: `${baseUrl}/ap-prep/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${baseUrl}/sat-prep`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/act-prep`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    // CLEP pages (only when clep_enabled flag is on)
    ...(clepOn ? [
      { url: `${baseUrl}/clep-prep`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
      ...["college-algebra", "college-composition", "introductory-psychology", "principles-of-marketing",
          "principles-of-management", "introductory-sociology", "american-government", "macroeconomics",
          "microeconomics", "biology", "us-history-1", "us-history-2", "human-growth-development",
          "calculus", "chemistry", "financial-accounting", "american-literature",
          "analyzing-interpreting-literature", "college-composition-modular", "english-literature",
          "humanities", "educational-psychology", "social-sciences-history", "western-civilization-1",
          "western-civilization-2", "college-mathematics", "natural-sciences", "precalculus",
          "information-systems", "business-law", "french", "german", "spanish", "spanish-writing",
      ].map(slug => ({ url: `${baseUrl}/clep-prep/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ] : []),
    // DSST pages (only when dsst_enabled flag is on)
    ...(dsstOn ? [
      { url: `${baseUrl}/dsst-prep`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
      ...["principles-of-supervision", "human-resource-management", "organizational-behavior",
          "personal-finance", "lifespan-developmental-psychology",
          "intro-to-business", "human-development", "ethics-in-america",
          "environmental-science", "technical-writing", "principles-of-finance",
          "management-information-systems", "money-and-banking", "substance-abuse",
          "criminal-justice", "fundamentals-of-counseling", "general-anthropology",
          "world-religions", "art-of-the-western-world", "astronomy",
          "computing-and-it", "civil-war-and-reconstruction",
      ].map(slug => ({ url: `${baseUrl}/dsst-prep/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ] : []),
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

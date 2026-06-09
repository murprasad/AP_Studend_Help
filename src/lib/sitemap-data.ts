// Sitemap URL data — plain module (NOT a Next.js metadata route).
//
// 2026-06-08: OpenNext/Cloudflare does NOT serve app/sitemap.ts (the metadata
// route 404s, even with force-static — confirmed against prod). Static files in
// public/ DO serve (robots.txt proves it). So we generate public/sitemap.xml at
// build time from this data via scripts/gen-sitemap.ts, and app/sitemap.ts is
// removed.

export interface SitemapEntry {
  url: string;
  changeFrequency: "weekly" | "monthly" | "yearly" | "daily";
  priority: number;
}

export function getSitemapEntries(baseUrl = "https://studentnest.ai"): SitemapEntry[] {
  const m = (url: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number): SitemapEntry => ({ url, changeFrequency, priority });

  const clepSlugs = [
    "college-algebra", "college-composition", "introductory-psychology", "principles-of-marketing",
    "principles-of-management", "introductory-sociology", "american-government", "macroeconomics",
    "microeconomics", "biology", "us-history-1", "us-history-2", "human-growth-development",
    "calculus", "chemistry", "financial-accounting", "american-literature",
    "analyzing-interpreting-literature", "college-composition-modular", "english-literature",
    "humanities", "educational-psychology", "social-sciences-history", "western-civilization-1",
    "western-civilization-2", "college-mathematics", "natural-sciences", "precalculus",
    "information-systems", "business-law", "french", "german", "spanish", "spanish-writing",
  ];
  const dsstSlugs = [
    "principles-of-supervision", "human-resource-management", "organizational-behavior",
    "personal-finance", "lifespan-developmental-psychology",
    "intro-to-business", "human-development", "ethics-in-america",
    "environmental-science", "technical-writing", "principles-of-finance",
    "management-information-systems", "money-and-banking", "substance-abuse",
    "criminal-justice", "fundamentals-of-counseling", "general-anthropology",
    "world-religions", "art-of-the-western-world", "astronomy",
    "computing-and-it", "civil-war-and-reconstruction",
  ];
  const blogSlugs = [
    "how-to-study-for-the-sat-with-adhd",
    "test-anxiety-how-to-stay-calm-on-exam-day",
    "study-strategies-learn-differently",
    "how-to-study-for-the-digital-sat-complete-guide",
  ];

  const entries: SitemapEntry[] = [
    m(baseUrl, "weekly", 1),
    m(`${baseUrl}/ap-prep`, "weekly", 0.9),
    ...["ap-world-history-modern", "ap-computer-science-principles", "ap-physics-1"].map(s => m(`${baseUrl}/ap-prep/${s}`, "monthly", 0.8)),
    m(`${baseUrl}/sat-prep`, "weekly", 0.9),
    m(`${baseUrl}/sat-prep/free-vs-paid`, "monthly", 0.85),
    m(`${baseUrl}/act-prep`, "weekly", 0.9),
    m(`${baseUrl}/act-vs-sat-which-should-i-take`, "monthly", 0.85),
    m(`${baseUrl}/digital-sat-2024-changes`, "monthly", 0.85),
    m(`${baseUrl}/clep-prep`, "weekly", 0.9),
    ...clepSlugs.map(s => m(`${baseUrl}/clep-prep/${s}`, "monthly", 0.7)),
    m(`${baseUrl}/dsst-prep`, "weekly", 0.9),
    ...dsstSlugs.map(s => m(`${baseUrl}/dsst-prep/${s}`, "monthly", 0.7)),
    m(`${baseUrl}/focus-friendly`, "monthly", 0.85),
    m(`${baseUrl}/blog`, "weekly", 0.6),
    ...blogSlugs.map(s => m(`${baseUrl}/blog/${s}`, "monthly", 0.7)),
    m(`${baseUrl}/pricing`, "monthly", 0.8),
    m(`${baseUrl}/about`, "monthly", 0.6),
    m(`${baseUrl}/register`, "monthly", 0.7),
    m(`${baseUrl}/login`, "monthly", 0.5),
    m(`${baseUrl}/terms`, "yearly", 0.3),
    m(`${baseUrl}/privacy`, "yearly", 0.3),
  ];

  return entries;
}

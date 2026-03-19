/**
 * Free Educational Data APIs — no API keys required.
 *
 * Actively fetched (live content used in AI context):
 *  - Wikipedia REST API      https://en.wikipedia.org/api/rest_v1/
 *  - Wikimedia / Wikidata    https://www.wikidata.org/w/api.php
 *  - Library of Congress     https://www.loc.gov/apis/json-and-yaml-apis/
 *  - Stack Exchange API      https://api.stackexchange.com/2.3/  (CC BY-SA 4.0)
 *  - Reddit JSON API         https://www.reddit.com/r/{sub}.json (public read)
 *  - MIT OpenCourseWare      https://ocw.mit.edu  (static HTML, Physics only)
 *  - Digital Inquiry Group   https://www.inquirygroup.org  (Stanford/SHEG, WH only)
 *  - College Board FRQ       https://apcentral.collegeboard.org  (public PDFs)
 *
 * Linked only (APIs blocked/CSR — shown on Resources page but not live-fetched):
 *  - OpenStax                https://openstax.org  (client-side rendered)
 *  - CK-12 Foundation        https://www.ck12.org  (403 on fetch)
 *  - PhET Simulations        https://phet.colorado.edu  (SPA, no static API)
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
        headers: { "User-Agent": "StudentNest/1.0 (Educational AP Prep App)" },
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

// ── MIT OpenCourseWare (Physics only — confirmed 200 OK for static HTML) ──────

/**
 * Fetch MIT OCW week-page content for a Physics unit.
 * Strips HTML and returns plain text of lesson titles + descriptions.
 * URL must be a confirmed-working OCW week page (set in courses.ts UnitMeta.mitocwUrl).
 */
export async function fetchMITOCWContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "StudentNest/1.0 (Educational AP Prep)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip scripts, styles, nav, footer — keep main content
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Extract the most content-dense portion (after page boilerplate)
    const start = cleaned.indexOf("Week");
    const useful = start > 0 ? cleaned.slice(start) : cleaned;
    return useful.slice(0, 1200);
  } catch {
    return "";
  }
}

// ── Digital Inquiry Group / Stanford (World History — confirmed 200 OK) ────────

/**
 * Fetch Digital Inquiry Group content for a World History topic.
 * Returns lesson titles and descriptions relevant to the query.
 * Uses /history-lessons or /history-assessments (both confirmed working).
 */
export async function fetchDIGContent(url: string, topic: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "StudentNest/1.0 (Educational AP Prep)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    // Find the section most relevant to the topic
    const topicLower = topic.toLowerCase();
    const words = topicLower.split(/\s+/).filter((w) => w.length > 3);
    let best = "";
    let bestScore = 0;
    // Score 500-char windows by keyword density
    for (let i = 0; i < cleaned.length - 500; i += 200) {
      const chunk = cleaned.slice(i, i + 500);
      const score = words.reduce((s, w) => s + (chunk.toLowerCase().includes(w) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = chunk; }
    }
    return bestScore > 0 ? best : cleaned.slice(0, 600);
  } catch {
    return "";
  }
}

// ── OpenStax Archive API (archive.cnx.org — free JSON API, no key) ───────────

/**
 * Search OpenStax educational content via the CNX archive API.
 * Returns concept descriptions and learning objectives relevant to a topic.
 * Subject map: physics → College Physics 2e | world-history → World History | cs → CS Principles
 */
export async function fetchOpenStaxContent(
  topic: string,
  subject: "physics" | "world-history" | "cs"
): Promise<string> {
  const subjectQuery =
    subject === "physics"
      ? "college physics algebra-based"
      : subject === "world-history"
      ? "world history modern"
      : "computer science principles";
  try {
    const url =
      `https://archive.cnx.org/search?q=${encodeURIComponent(`${subjectQuery} ${topic}`)}` +
      `&per_page=4&sort=pubDate%20desc`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "StudentNest/1.0 (Educational AP Prep)",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const items: Record<string, unknown>[] = (data.results?.items || []).slice(0, 3);
    if (!items.length) return "";
    return (
      `OpenStax educational content (open license):\n` +
      items
        .map(
          (r) =>
            `• ${r.title}: ${((r.abstract as string) || "").replace(/<[^>]+>/g, "").slice(0, 220)}`
        )
        .join("\n")
    );
  } catch {
    return "";
  }
}

// ── Smithsonian Open Access API (free, DEMO_KEY = 30 req/hour) ───────────────

/**
 * Fetch Smithsonian museum collection items relevant to a historical query.
 * Uses the Smithsonian Open Access API (CC0 and open license content).
 * Great for primary source image descriptions in AP World History DBQ context.
 */
export async function fetchSmithsonianContent(query: string, limit = 3): Promise<string> {
  try {
    const url =
      `https://api.si.edu/openaccess/api/v1.0/search` +
      `?q=${encodeURIComponent(query)}&api_key=DEMO_KEY&rows=${limit}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return "";
    const data = await res.json();
    const rows: Record<string, unknown>[] = data.response?.rows || [];
    if (!rows.length) return "";
    const lines = rows
      .slice(0, limit)
      .map((item) => {
        const content = item.content as Record<string, unknown> | undefined;
        const dnr = content?.descriptiveNonRepeating as Record<string, unknown> | undefined;
        const titleObj = dnr?.title as Record<string, unknown> | undefined;
        const title = (titleObj?.content as string) || (item.id as string) || "Item";
        const notesArr = (content?.freetext as Record<string, unknown>)?.notes;
        const note = Array.isArray(notesArr)
          ? ((notesArr[0] as Record<string, unknown>)?.content as string) || ""
          : "";
        return `• ${title}: ${note.slice(0, 200)}`;
      })
      .join("\n");
    return `Smithsonian collections (open access):\n${lines}`;
  } catch {
    return "";
  }
}

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

// ── SAT Content: static topic summaries derived from College Board SAT Study Guide ──
// No API call needed — authoritative topic data extracted from public College Board materials.
const SAT_TOPIC_MAP: Record<string, string> = {
  SAT_MATH_1_ALGEBRA: `SAT Algebra covers:
• Linear equations in one variable (solving, interpreting solutions)
• Linear equations in two variables (graphing, intercepts, slope)
• Systems of two linear equations (substitution, elimination, graphical interpretation)
• Linear inequalities in one or two variables
• Linear functions: domain, range, rate of change
• Interpreting linear models in context (slope = rate, y-intercept = initial value)
Common traps: sign errors when dividing by negatives, confusing no-solution vs. infinite-solution systems.`,

  SAT_MATH_2_ADVANCED_MATH: `SAT Advanced Math covers:
• Quadratic functions and equations (factoring, completing the square, quadratic formula, discriminant)
• Vertex form, standard form, and intercept form of parabolas
• Polynomial functions (zeros, factors, remainder theorem, end behavior)
• Rational expressions and equations (simplifying, solving, extraneous solutions)
• Exponential functions: growth (b > 1) and decay (0 < b < 1), half-life, doubling time
Common traps: forgetting to check for extraneous solutions, confusing exponential and linear growth.`,

  SAT_MATH_3_PROBLEM_SOLVING: `SAT Problem-Solving & Data Analysis covers:
• Ratios, rates, proportional relationships, unit conversion
• Percentages: percent change, percent of a whole, markup/discount
• Two-way tables: joint, marginal, conditional probability
• Statistics: mean, median, mode, range, standard deviation, outliers
• Probability: basic, conditional, independent events
• Evaluating statistical claims: sample representativeness, correlation vs. causation
Common traps: misidentifying the median in even-numbered sets, confusing correlation with causation.`,

  SAT_MATH_4_GEOMETRY_TRIG: `SAT Geometry & Trigonometry covers:
• Area and perimeter of common figures (triangles, rectangles, circles, composite shapes)
• Volume of prisms, cylinders, pyramids, cones, spheres
• Coordinate geometry: distance, midpoint, slope, equations of lines and circles
• Properties of triangles (similar triangles, special right triangles: 30-60-90, 45-45-90)
• Circle theorems: arc length, sector area, central and inscribed angles
• Basic trigonometry: SOH-CAH-TOA in right triangles; radian measure basics
Common traps: using diameter instead of radius, forgetting to square in the distance formula.`,

  SAT_RW_1_CRAFT_STRUCTURE: `SAT Craft and Structure covers:
• Words in context: selecting the most precise word (denotation + connotation)
• Text structure and purpose: chronological, compare-contrast, problem-solution, cause-effect
• Author's purpose: informing, persuading, narrating, analyzing
• Cross-text connections: comparing two short passages (agreement, disagreement, extension)
• Rhetorical devices: analogy, anecdote, repetition, rhetorical questions
Common traps: choosing a word that fits loosely but not precisely, confusing tone with purpose.`,

  SAT_RW_2_INFO_IDEAS: `SAT Information and Ideas covers:
• Central ideas and details: distinguishing main idea from supporting details
• Command of evidence: selecting the quote or data that best supports a claim
• Inferences: drawing conclusions that are supported but not overstated by the text
• Quantitative data: interpreting graphs, charts, tables embedded in passages
• Strengthening and weakening arguments: identifying supporting or undermining evidence
• Research methodology: sampling methods, confounding variables, correlation vs. causation
Common traps: choosing inferences that are too broad or add information not in the text.`,

  SAT_RW_3_STANDARD_ENGLISH: `SAT Standard English Conventions covers:
• Sentence boundaries: run-ons, comma splices, fragments
• Punctuation: commas, semicolons, colons, dashes, apostrophes
• Subject-verb agreement: collective nouns, indefinite pronouns, intervening phrases
• Verb tense and aspect: consistency, sequence of tenses
• Pronoun agreement: number, person, case (who/whom)
• Parallel structure: matching grammatical form in lists and comparisons
• Modifier placement: dangling and misplaced modifiers
Common traps: agreeing verb with nearest noun (not the actual subject), it's vs. its.`,

  SAT_RW_4_EXPRESSION_IDEAS: `SAT Expression of Ideas covers:
• Transitions: choosing words that correctly signal logical relationships (contrast, cause-effect, addition, exemplification)
• Rhetorical synthesis: combining information from notes into a coherent sentence
• Logical sequence: determining the best placement of a sentence within a paragraph
• Precision: choosing the most accurate word for a specific meaning
• Concision: eliminating redundancy and wordiness without losing meaning
• Relevance: identifying which sentence best supports or concludes a paragraph
Common traps: choosing a transition that sounds right but signals the wrong logical relationship.`,
};

/**
 * Returns static SAT topic context derived from College Board SAT study materials.
 * Covers all 8 SAT units. No API call needed — pure static data.
 */
export function fetchCollegeBoardSATTopics(unit: string): string {
  return SAT_TOPIC_MAP[unit] ?? "";
}

// ── ACT Content: static topic summaries derived from official ACT test specifications ─
// No API call needed — authoritative topic data extracted from public ACT materials.
const ACT_TOPIC_MAP: Record<string, string> = {
  // ── ACT Math ──
  ACT_MATH_1_NUMBER: `ACT Number and Quantity covers:
• Integers: divisibility, factors, multiples, primes, absolute value
• Fractions and decimals: operations, converting between forms, ordering
• Exponents: integer, fractional, negative exponents; scientific notation
• Ratios, proportions, and percents: direct/inverse proportion, percent change
• Number properties: odd/even, sets, sequences, number lines
Common traps: confusing factors with multiples, forgetting order of operations (PEMDAS), sign errors with negatives.`,

  ACT_MATH_2_ALGEBRA: `ACT Algebra covers:
• Linear equations and inequalities in one variable
• Systems of two linear equations (substitution and elimination)
• Polynomial operations: factoring, FOIL, special products
• Quadratic equations: factoring, quadratic formula, discriminant
• Functions: domain/range, composition, inverse, function notation
• Absolute value equations and inequalities
Common traps: forgetting to flip inequality sign when dividing by a negative, extraneous solutions in rational equations.`,

  ACT_MATH_3_GEOMETRY: `ACT Geometry covers:
• Triangles: area, perimeter, similar triangles, Pythagorean theorem, 30-60-90, 45-45-90
• Circles: area, circumference, arc length, sector area, inscribed angles
• Coordinate geometry: slope, midpoint, distance formula, equations of lines and circles
• Polygons: area and perimeter of rectangles, parallelograms, trapezoids
• 3D shapes: volume and surface area of prisms, cylinders, cones, spheres
• Basic trigonometry: SOH-CAH-TOA in right triangles, SOHCAHTOA
Common traps: using diameter instead of radius in circle formulas, forgetting to halve base×height for triangles.`,

  ACT_MATH_4_STATISTICS: `ACT Statistics and Probability covers:
• Measures of center: mean, median, mode; effect of outliers
• Measures of spread: range, standard deviation concepts
• Data displays: reading and interpreting bar graphs, histograms, box plots, scatterplots
• Counting: fundamental counting principle, permutations, combinations
• Probability: basic probability, complementary events, conditional probability
• Two-way frequency tables: joint and marginal frequencies
Common traps: confusing mean and median when outliers are present, misreading scale on graphs.`,

  ACT_MATH_5_INTEGRATING_SKILLS: `ACT Integrating Essential Skills covers:
• Multi-step real-world problems requiring 3+ calculations
• Rate, distance, and time: d = rt applied to complex scenarios
• Mixture and work problems
• Financial mathematics: simple interest, percent applications
• Modeling with equations and inequalities
• Interpreting mathematical results in context
Common traps: setting up the equation incorrectly, misidentifying what the variable represents.`,

  // ── ACT English ──
  ACT_ENG_1_PRODUCTION_WRITING: `ACT Production of Writing covers:
• Topic development: adding, deleting, or revising sentences to support the main idea
• Organization: introductions, conclusions, transitions between paragraphs
• Unity and cohesion: whether a sentence belongs in a paragraph
• Relevance: whether a detail supports the author's purpose
Common traps: choosing an answer that is grammatically correct but irrelevant to the passage's focus.`,

  ACT_ENG_2_KNOWLEDGE_LANGUAGE: `ACT Knowledge of Language covers:
• Word choice (diction): selecting the most precise or appropriate word in context
• Style: matching tone (formal vs. informal) to the passage's audience
• Concision: eliminating redundant or wordy phrases
• Clarity: revising vague or ambiguous expressions
Common traps: choosing a longer answer that "sounds better" but adds no meaning; avoiding the shortest answer when concision is the point.`,

  ACT_ENG_3_CONVENTIONS: `ACT Conventions of Standard English covers:
• Commas: with non-restrictive clauses, after introductory elements, in series
• Semicolons and colons: joining independent clauses, introducing lists
• Apostrophes: possession vs. contraction (its/it's, their/they're)
• Subject-verb agreement: collective nouns, intervening prepositional phrases
• Pronoun-antecedent agreement: number and person
• Verb tense consistency: sequence of tenses in a passage
• Parallel structure: matching grammatical form in lists and comparisons
• Run-on sentences, comma splices, and fragments
Common traps: agreeing verb with the nearest noun rather than the subject; its/it's confusion.`,

  // ── ACT Science ──
  ACT_SCI_1_DATA_REPRESENTATION: `ACT Data Representation covers:
• Reading values directly from graphs, tables, diagrams, and scatter plots
• Identifying trends (increasing, decreasing, constant, non-linear)
• Interpolating between data points on a graph
• Converting between units using given data
• Identifying the independent and dependent variables from a figure
Common traps: reading the wrong axis; confusing independent (x-axis) with dependent (y-axis) variable.`,

  ACT_SCI_2_RESEARCH_SUMMARIES: `ACT Research Summaries covers:
• Identifying the hypothesis of an experiment
• Identifying controlled variables vs. manipulated variables
• Evaluating whether experimental results support or contradict a hypothesis
• Identifying flaws or improvements in experimental design
• Predicting results of a new experiment based on observed trends
Common traps: confusing correlation with causation; selecting an answer that requires knowledge not provided in the passage.`,

  ACT_SCI_3_CONFLICTING_VIEWPOINTS: `ACT Conflicting Viewpoints covers:
• Understanding two or more competing scientific explanations for the same phenomenon
• Identifying which evidence supports each viewpoint
• Identifying points of agreement and disagreement between scientists
• Determining which new data would strengthen or weaken a given viewpoint
Common traps: attributing an argument to the wrong scientist; choosing an answer that is true in general science but not supported by the specific passage.`,

  // ── ACT Reading ──
  ACT_READ_1_LITERARY: `ACT Literary Narrative passage strategy:
• Passage type: prose fiction or personal narrative with a named narrator or characters
• Question types: character motivation, tone/mood, figurative language, point of view, sequence of events
• EASY: locate a specific detail stated directly (e.g., character's age, setting description)
• MEDIUM: infer a character's motivation or emotional state from actions/dialogue
• HARD: analyze how the author's narrative technique (irony, imagery, unreliable narrator) affects meaning
Key skill: Pay attention to narrator's attitude and tone; figurative language (similes, metaphors, personification) signals themes.`,

  ACT_READ_2_SOCIAL_SCIENCE: `ACT Social Science passage strategy:
• Passage type: essay or article about economics, psychology, sociology, or anthropology
• Question types: main idea, author's claim, specific detail, inference, vocabulary in context
• EASY: identify the central argument stated in the first or last paragraph
• MEDIUM: infer the author's implied conclusion from evidence presented
• HARD: evaluate whether a new piece of evidence would support or undermine the author's argument
Key skill: Identify the author's thesis early; social science passages often use hedging language ("may suggest," "appears to indicate").`,

  ACT_READ_3_HUMANITIES: `ACT Humanities passage strategy:
• Passage type: memoir, cultural criticism, art/music/literature analysis, philosophical essay
• Question types: author's perspective, rhetorical devices, vocabulary in context, implied meaning
• EASY: identify the author's stated opinion or the subject of the piece
• MEDIUM: interpret the author's use of an analogy, metaphor, or historical reference
• HARD: analyze how the author's background or cultural context shapes their argument
Key skill: Humanities passages often have a first-person or opinionated voice; tone words (wistful, skeptical, reverent) are frequently tested.`,

  ACT_READ_4_NATURAL_SCIENCE: `ACT Natural Science passage strategy:
• Passage type: informational article about biology, chemistry, physics, earth science, or environmental science
• Question types: main idea, specific detail, inference, vocabulary in context, author's purpose
• EASY: locate a fact stated explicitly in the passage
• MEDIUM: infer a cause-and-effect relationship described implicitly
• HARD: evaluate the strength of a scientific argument or identify a limitation in the author's reasoning
Key skill: No outside science knowledge required — all answers are in the passage. Focus on logical reasoning, not memorized facts.`,
};

/**
 * Returns static ACT topic context derived from official ACT test specifications.
 * Covers all 15 ACT units. No API call needed — pure static data.
 */
export function fetchACTTopics(unit: string): string {
  return ACT_TOPIC_MAP[unit] ?? "";
}

// ── College Board FRQ Content (Phase 4) ──────────────────────────────────────

/**
 * Fetch and extract readable text from a College Board FRQ PDF URL.
 * Modern CB PDFs contain plaintext streams — we extract readable word sequences
 * without a full PDF parser, which is compatible with CF Workers.
 * Returns a plain-text excerpt suitable for use as AI seed context.
 */
export async function fetchCBFRQContent(pdfUrl: string): Promise<string> {
  try {
    const res = await fetch(pdfUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StudentNest/1.0; Educational AP Prep)",
        "Accept": "application/pdf,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return "";

    // Read as text — PDF binary will be mostly garbage, but modern CB PDFs
    // embed readable text in plaintext streams between BT...ET markers
    const raw = await res.text();

    // Extract text between BT (Begin Text) and ET (End Text) PDF operators
    const textBlocks: string[] = [];
    const btEtRegex = /BT[\s\S]{0,2000}?ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      // Extract string literals from parentheses: (text here)
      const parenStrings = match[0].match(/\(([^)]{2,100})\)/g) || [];
      const extracted = parenStrings
        .map((s) => s.slice(1, -1).replace(/\\n/g, " ").replace(/\\r/g, " ").trim())
        .filter((s) => /[A-Za-z]{3,}/.test(s)) // must contain real words
        .join(" ");
      if (extracted.length > 20) textBlocks.push(extracted);
      if (textBlocks.join(" ").length > 2000) break;
    }

    if (textBlocks.length > 0) {
      return textBlocks.join(" ").replace(/\s+/g, " ").trim().slice(0, 1500);
    }

    // Fallback: extract sequences of 4+ consecutive alphabetic words from raw binary
    const wordSequences = raw.match(/[A-Z][a-z]{2,}(?:\s+[A-Za-z]{3,}){3,}/g) || [];
    const fallback = wordSequences.slice(0, 30).join(" ").slice(0, 1000);
    return fallback;
  } catch {
    return "";
  }
}

/**
 * Fetch the best CB FRQ PDF URL for a given course from the catalog.
 * Returns the most recent entry available.
 */
export function getCBFRQUrl(course: string): string | null {
  const entries = CB_FRQ_CATALOG[course];
  if (!entries || entries.length === 0) return null;
  // Sort by year descending, return most recent
  const sorted = [...entries].sort((a, b) => b.year - a.year);
  return sorted[0].url;
}

// ── Khan Academy Topic Context (Phase 5) ─────────────────────────────────────

/**
 * Attempt to fetch Khan Academy article content for a topic.
 * Uses the KA CDN article API (public, no key required).
 * Fails silently — KA may block server-side requests.
 * Returns topic explanation text suitable for AI context enrichment.
 */
export async function fetchKhanAcademyContext(topic: string, course?: string): Promise<string> {
  try {
    // Khan Academy's internal search API (public, returns JSON)
    const query = course
      ? `${topic} ${course.toLowerCase().replace(/_/g, " ")}`
      : topic;
    const url = `https://www.khanacademy.org/api/internal/search?q=${encodeURIComponent(query)}&lang=en&page_size=3`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StudentNest/1.0; Educational)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const data = await res.json() as { results?: { hits?: Array<{ title?: string; description?: string; url?: string }> } };
    const hits = data.results?.hits ?? [];
    if (hits.length === 0) return "";
    const lines = hits
      .slice(0, 3)
      .filter((h) => h.title)
      .map((h) => `• ${h.title}${h.description ? `: ${h.description.slice(0, 150)}` : ""}`);
    if (lines.length === 0) return "";
    return `Khan Academy resources:\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

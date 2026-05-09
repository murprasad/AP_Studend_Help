/**
 * scripts/feedback-ingest.mjs
 *
 * Phase 2 of the user-feedback loop (per project_user_feedback_loop_design.md
 * + project_reddit_feedback_loop_plan.md).
 *
 * Fetches a Reddit post, extracts structured insights via LLM, classifies
 * by course enum, and appends to data/user-feedback-insights/<course>.json.
 *
 * Then re-aggregates the per-course calibration profile.
 *
 * Usage:
 *   node scripts/feedback-ingest.mjs <reddit-post-url>
 *   node scripts/feedback-ingest.mjs --text="<raw post body>" --course=CLEP_BIOLOGY
 *
 * Env: GROQ_API_KEY (used for fast/cheap insight extraction)
 *
 * Cost: ~$0.005/post via Groq.
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    if (!a.startsWith("--")) return ["url", a];
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

let url = args.url;
let rawText = args.text;
let courseHint = args.course;

if (!url && !rawText) {
  console.error("usage: node scripts/feedback-ingest.mjs <reddit-url> | --text='...' --course=COURSE_ENUM");
  process.exit(1);
}

// Fetch from Reddit if URL given
let postTitle = "";
let postBody = "";
let postUrl = url ?? "";
let postFlair = "";
let postScore = 0;

if (url) {
  // Reddit's public JSON: append .json to any reddit URL
  const jsonUrl = url.replace(/\/?$/, "/.json");
  const res = await fetch(jsonUrl, {
    headers: { "User-Agent": "studentnest-feedback-ingest/1.0 (contact: contact@studentnest.ai)" },
  });
  if (!res.ok) {
    console.error(`Reddit fetch failed: HTTP ${res.status}`);
    process.exit(2);
  }
  const data = await res.json();
  const post = data?.[0]?.data?.children?.[0]?.data;
  if (!post) {
    console.error("Could not parse Reddit JSON shape");
    process.exit(3);
  }
  postTitle = post.title ?? "";
  postBody = post.selftext ?? "";
  postFlair = post.link_flair_text ?? "";
  postScore = post.score ?? 0;
  postUrl = `https://reddit.com${post.permalink}`;
} else {
  postBody = rawText;
}

console.log(`Title: ${postTitle.slice(0, 100)}`);
console.log(`Flair: ${postFlair}`);
console.log(`Score: ${postScore}`);
console.log(`Body length: ${postBody.length} chars`);

// LLM extraction — Groq llama-3.3-70b
const groqKey = process.env.GROQ_API_KEY;
if (!groqKey) {
  console.error("GROQ_API_KEY not set");
  process.exit(4);
}

// Load courses dynamically from prisma schema or COURSE_REGISTRY (works in both products)
async function loadCourseEnums() {
  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const text = fs.readFileSync(schemaPath, "utf-8");
    // Find all enum blocks like: enum ApCourse { ... } or enum ExamCourse { ... }
    const enumMatches = [...text.matchAll(/enum\s+(\w*Course)\s*\{([^}]+)\}/g)];
    const courses = new Set();
    for (const m of enumMatches) {
      const body = m[2];
      for (const line of body.split("\n")) {
        const t = line.trim();
        if (t && !t.startsWith("//") && /^[A-Z_][A-Z0-9_]*$/.test(t)) courses.add(t);
      }
    }
    return [...courses];
  } catch (e) {
    console.error("Failed to load courses from prisma schema:", e.message);
    return [];
  }
}
const COURSES = await loadCourseEnums();
if (COURSES.length === 0) {
  console.error("No courses loaded — refusing to proceed");
  process.exit(10);
}

const extractPrompt = `You are extracting structured insights from a real test-taker's social media post about a standardized exam they took.

Post title: ${postTitle}
Post flair: ${postFlair}
Post body:
"""
${postBody.slice(0, 4000)}
"""

Tasks:
1. Classify which course this post is about. Pick from this list (return EXACT enum value, or "UNKNOWN" if unclear):
${COURSES.join(", ")}

2. Extract structured insights. Return JSON only with this shape:
{
  "course": "<enum from list above OR UNKNOWN>",
  "test_outcome": "pass" | "fail" | "in_progress" | "unknown",
  "test_score": <number or null>,
  "study_hours_to_pass": <number or null>,
  "extracted_insights": [
    { "type": "topic_emphasis", "topic": "<short keyword>", "weight_signal": "high"|"medium"|"low", "evidence": "<short quote>" },
    { "type": "coverage_strategy", "value": "wide_not_deep" | "deep_narrow" | "balanced", "evidence": "<quote>" },
    { "type": "wording_style", "value": "clean" | "moderate_tricky" | "very_tricky", "evidence": "<quote>" },
    { "type": "subtopic_struggle_signal", "topics": ["..."], "evidence": "<quote>" },
    { "type": "prep_resource_signal", "resources_that_worked": ["..."], "implication": "<short>" },
    { "type": "difficulty_calibration", "evidence": "<quote>", "min_pass_score": <number or null> }
  ]
}

Only include insight types that the post actually evidences. If the post is unrelated to test-prep (memes, off-topic), return {"course":"UNKNOWN","extracted_insights":[]}.`;

const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: extractPrompt }],
    response_format: { type: "json_object" },
    max_tokens: 1500,
  }),
});
if (!res.ok) {
  console.error(`Groq HTTP ${res.status}: ${await res.text()}`);
  process.exit(5);
}
const data = await res.json();
const extraction = JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
const course = courseHint ?? extraction.course;

if (!course || course === "UNKNOWN" || !COURSES.includes(course)) {
  console.log(`Could not classify post into a known course (got: ${course}). Skipping.`);
  process.exit(0);
}

// Append to course JSON
const insightsDir = join(process.cwd(), "data", "user-feedback-insights");
mkdirSync(insightsDir, { recursive: true });
const insightsPath = join(insightsDir, `${course}.json`);
let store = { course, insights: [] };
if (existsSync(insightsPath)) {
  store = JSON.parse(readFileSync(insightsPath, "utf-8"));
}

const record = {
  ingested_at: new Date().toISOString(),
  source_type: url ? "reddit" : "manual_text",
  source_url: postUrl,
  source_excerpt: postBody.slice(0, 600),
  post_title: postTitle,
  post_flair: postFlair,
  post_score: postScore,
  test_outcome: extraction.test_outcome,
  test_score: extraction.test_score,
  study_hours_to_pass: extraction.study_hours_to_pass,
  extracted_insights: extraction.extracted_insights,
};
// Dedup by URL — don't double-ingest
if (postUrl && store.insights.some((i) => i.source_url === postUrl)) {
  console.log(`Already ingested: ${postUrl}`);
  process.exit(0);
}
store.insights.push(record);
writeFileSync(insightsPath, JSON.stringify(store, null, 2));
console.log(`✓ Appended insight to ${insightsPath}`);
console.log(`  course=${course}, insight_count=${record.extracted_insights?.length ?? 0}`);

/**
 * Reddit Weekly Insights Report (StudentNest).
 *
 * Reads the latest scripts/data/reddit-exam-signals-<date>.json (produced
 * by crawl-reddit-exam-subs.mjs) and emits a human-readable markdown
 * summary to data/reddit-weekly-<date>.md.
 *
 * Designed to be reviewed weekly — what's trending on r/APStudents +
 * r/SAT + r/ACT, what resources students recommend, fresh score reports.
 *
 * Usage:
 *   node scripts/reddit-weekly-report.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const SIGNALS_DIR = "scripts/data";
const OUT_DIR = "data";

function findLatestSignalsFile() {
  const files = readdirSync(SIGNALS_DIR)
    .filter((f) => /^reddit-exam-signals-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  return files.length > 0 ? `${SIGNALS_DIR}/${files[files.length - 1]}` : null;
}

const path = findLatestSignalsFile();
if (!path) {
  console.error("No reddit-exam-signals-*.json found. Run scripts/crawl-reddit-exam-subs.mjs first.");
  process.exit(1);
}

const { date, signals } = JSON.parse(readFileSync(path, "utf8"));
console.log(`Using ${path} — ${signals.length} signals from ${date}`);

const today = new Date().toISOString().slice(0, 10);
const lines = [`# Reddit Weekly Insights — ${today}\n`];
lines.push(`Source: \`${path}\` (${signals.length} signals)\n`);

// StudentNest scope = AP, SAT, ACT.
const BY_EXAM = ["AP", "SAT", "ACT"];
for (const exam of BY_EXAM) {
  const posts = signals.filter((s) => s.exam === exam);
  if (posts.length === 0) continue;
  lines.push(`\n## r/${exam.toLowerCase()} — ${posts.length} posts\n`);

  const top = [...posts].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8);
  lines.push(`### Top posts by upvotes\n`);
  for (const p of top) {
    lines.push(`- **★${p.score} 💬${p.numComments}** [${(p.title || "").slice(0, 100)}](${p.url || "#"})`);
  }

  // Pattern analysis. AP/SAT/ACT-relevant subjects only.
  const courseRegex = /\b(AP Biology|AP Chemistry|AP Physics (?:1|2|C)|AP Calculus (?:AB|BC)|AP Statistics|AP Computer Science (?:A|Principles)|AP CSP|AP Lang(?:uage)?|AP Lit(?:erature)?|AP US History|AP World History|AP European History|AP Gov(?:ernment)?|AP Macroeconomics|AP Microeconomics|AP Psychology|AP Environmental Science|AP Human Geography|AP Spanish|AP French|SAT Math|SAT Reading|SAT Writing|SAT R\/W|PSAT|ACT Math|ACT Reading|ACT English|ACT Science)\b/gi;
  const resourceRegex = /\b(AP Classroom|AP Daily|Marco Learning|Albert(?:\.io)?|Princeton Review|Barron'?s?|Kaplan|Bluebook|Khan Academy|Heimler'?s History|UWorld|5 Steps to a 5|Quizlet|Anki|Schoolhouse(?:\.world)?|R\.r\.review|College Board|Reddit Wiki)\b/gi;
  const courseFreq = {};
  const resourceFreq = {};
  for (const p of posts) {
    const text = [p.title || "", p.selftext || "", p.body || "", ...(p.topComments || []).map((c) => c.body || "")].join(" ");
    const courses = text.match(courseRegex) || [];
    for (const c of courses) courseFreq[c] = (courseFreq[c] || 0) + 1;
    const resources = text.match(resourceRegex) || [];
    for (const r of resources) resourceFreq[r] = (resourceFreq[r] || 0) + 1;
  }
  lines.push(`\n### Most-mentioned courses\n`);
  const topCourses = Object.entries(courseFreq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [c, n] of topCourses) lines.push(`- ${n}× **${c}**`);
  lines.push(`\n### Most-cited resources\n`);
  const topResources = Object.entries(resourceFreq).sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [r, n] of topResources) lines.push(`- ${n}× **${r}**`);

  const topComments = posts
    .flatMap((p) => (p.topComments || []).map((c) => ({ score: c.score || 0, body: c.body || "", postTitle: p.title })))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  if (topComments.length > 0) {
    lines.push(`\n### Top comments (the actual student voice)\n`);
    for (const c of topComments) {
      const body = c.body.replace(/\s+/g, " ").slice(0, 250);
      lines.push(`> ★${c.score} on "${(c.postTitle || "").slice(0, 60)}"\n>\n> ${body}\n`);
    }
  }
}

lines.push(`\n## Action items to review this week\n`);
lines.push(`1. **New resources mentioned** — add them to \`data/user-feedback-profiles/<COURSE>.json\` endorsed_resources if they appear ≥3× this week and aren't already there.`);
lines.push(`2. **Pass-score reports** — update \`difficulty_distribution.rationale\` for any course where ≥2 fresh score reports appeared.`);
lines.push(`3. **Complaints about StudentNest** — search posts for our brand mentions (none found this week is the default expectation while we're small).`);
lines.push(`4. **Trending courses** — if a course appears in top-3 mentions for 2 consecutive weeks, prioritize content backfill / SEO for it.\n`);

const outPath = `${OUT_DIR}/reddit-weekly-${today}.md`;
writeFileSync(outPath, lines.join("\n"));
console.log(`Wrote ${outPath}`);

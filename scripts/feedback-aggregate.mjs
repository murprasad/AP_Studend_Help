/**
 * scripts/feedback-aggregate.mjs
 *
 * Re-aggregates the per-course insights log into a calibration profile
 * the generator + popup actually consume.
 *
 * Usage:
 *   node scripts/feedback-aggregate.mjs                # all courses with insights
 *   node scripts/feedback-aggregate.mjs --course=X     # one course
 *
 * Reads:  data/user-feedback-insights/<COURSE>.json
 * Writes: data/user-feedback-profiles/<COURSE>.json
 *
 * Schema v1.0 per project_feedback_loop_standard_spec.md.
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const courseFilter = args.course ?? null;
const insightsDir = join(process.cwd(), "data", "user-feedback-insights");
const profilesDir = join(process.cwd(), "data", "user-feedback-profiles");
mkdirSync(profilesDir, { recursive: true });

if (!existsSync(insightsDir)) {
  console.log("No insights directory yet. Nothing to aggregate.");
  process.exit(0);
}

const courseFiles = readdirSync(insightsDir)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !courseFilter || f === `${courseFilter}.json`);

console.log(`Aggregating ${courseFiles.length} course(s)...`);

for (const file of courseFiles) {
  const course = file.replace(/\.json$/, "");
  const insightsPath = join(insightsDir, file);
  const store = JSON.parse(readFileSync(insightsPath, "utf-8"));
  const insights = store.insights ?? [];
  if (insights.length === 0) continue;

  // (filter applied below — quality gate at aggregation, not ingest, so we
  // keep raw history but only feed confirmed-outcome posts into the profile.)

  // Aggregate
  const topicCounts = {};
  let coverageVotes = { wide_not_deep: 0, deep_narrow: 0, balanced: 0 };
  let wordingVotes = { clean: 0, moderate_tricky: 0, very_tricky: 0 };
  const subtopicStruggles = new Map();
  const prepResources = new Map();
  const passScores = [];
  const popupTipPool = [];

  // Quality filter: only keep insights from posts with confirmed test_outcome.
  // "unknown" outcomes are usually off-topic posts (cheating discussions,
  // admissions chatter, general anxiety) that got mis-classified.
  const filtered = insights.filter((r) => r.test_outcome === "pass" || r.test_outcome === "fail");
  if (filtered.length === 0) {
    console.log(`  ${course}: 0 confirmed-outcome insights — skipping (had ${insights.length} raw)`);
    continue;
  }
  if (filtered.length < insights.length) {
    console.log(`  ${course}: filtered ${insights.length - filtered.length} low-confidence posts (off-topic / unknown outcome)`);
  }

  for (const record of filtered) {
    const passerWeight = record.test_outcome === "pass" ? 2.0 : 1.0;
    if (typeof record.test_score === "number") passScores.push(record.test_score);

    for (const ins of record.extracted_insights ?? []) {
      switch (ins.type) {
        case "topic_emphasis": {
          const t = (ins.topic ?? "").toLowerCase().trim().replace(/[^a-z0-9_]+/g, "_");
          if (!t) break;
          const sig = ins.weight_signal === "high" ? 1.5 : ins.weight_signal === "medium" ? 1.0 : 0.5;
          topicCounts[t] = (topicCounts[t] ?? 0) + sig * passerWeight;
          break;
        }
        case "coverage_strategy": {
          if (coverageVotes[ins.value] !== undefined) coverageVotes[ins.value] += passerWeight;
          break;
        }
        case "wording_style": {
          if (wordingVotes[ins.value] !== undefined) wordingVotes[ins.value] += passerWeight;
          break;
        }
        case "subtopic_struggle_signal": {
          for (const t of ins.topics ?? []) {
            const k = t.toLowerCase().trim();
            if (!subtopicStruggles.has(k)) subtopicStruggles.set(k, { count: 0, evidence: [] });
            const entry = subtopicStruggles.get(k);
            entry.count += passerWeight;
            if (ins.evidence) entry.evidence.push(ins.evidence.slice(0, 100));
          }
          break;
        }
        case "prep_resource_signal": {
          for (const r of ins.resources_that_worked ?? []) {
            prepResources.set(r, (prepResources.get(r) ?? 0) + passerWeight);
          }
          if (ins.implication) {
            popupTipPool.push({
              text: ins.implication.slice(0, 200),
              source_attribution: `From a recent ${course.replace(/_/g, " ")} test-taker`,
              category: "prep_resource",
            });
          }
          break;
        }
      }

      // Build pop-up tips from evidence-bearing insights
      if (ins.evidence && (ins.type === "topic_emphasis" || ins.type === "subtopic_struggle_signal" || ins.type === "wording_style")) {
        const tipText = ins.evidence.slice(0, 200);
        if (tipText.length > 20) {
          popupTipPool.push({
            text: tipText,
            source_attribution: `From a recent ${course.replace(/_/g, " ")} test-taker`,
            category: ins.type,
          });
        }
      }
    }
  }

  // Normalize topic weights
  const maxTopicCount = Math.max(...Object.values(topicCounts), 1);
  const topicWeights = { _default: 1.0 };
  for (const [t, c] of Object.entries(topicCounts)) {
    topicWeights[t] = Math.min(1.5, 1.0 + (c / maxTopicCount) * 0.6); // 1.0 to 1.6 range
  }

  // Coverage strategy = majority vote, fallback balanced
  const coverageStrategy =
    Object.entries(coverageVotes).reduce((a, b) => (a[1] >= b[1] ? a : b))[0] || "balanced";
  const coverageStrategyTotal = Object.values(coverageVotes).reduce((a, b) => a + b, 0);
  const coverageNote = coverageStrategy === "wide_not_deep"
    ? "Real test-takers report this exam covers breadth over depth. Stay at college 101 level on each topic."
    : coverageStrategy === "deep_narrow"
    ? "Real test-takers report this exam goes deep on a narrower topic set."
    : "Balanced coverage — neither overly wide nor deep.";

  // Wording style fraction (blend)
  const wordingTotal = Object.values(wordingVotes).reduce((a, b) => a + b, 0) || 1;
  const trickyFraction =
    (wordingVotes.clean * 0.05 + wordingVotes.moderate_tricky * 0.12 + wordingVotes.very_tricky * 0.25) / wordingTotal;

  // Difficulty distribution from pass scores
  const avgPassScore = passScores.length ? passScores.reduce((a, b) => a + b, 0) / passScores.length : null;
  const difficultyDistribution = avgPassScore
    ? avgPassScore < 60
      ? { easy: 0.30, medium: 0.50, hard: 0.20, rationale: `avg pass score ${avgPassScore.toFixed(0)} suggests easier test` }
      : avgPassScore < 70
      ? { easy: 0.20, medium: 0.55, hard: 0.25, rationale: `avg pass score ${avgPassScore.toFixed(0)} — calibrated mid` }
      : { easy: 0.15, medium: 0.50, hard: 0.35, rationale: `avg pass score ${avgPassScore.toFixed(0)} — harder test` }
    : { easy: 0.20, medium: 0.55, hard: 0.25, rationale: "default — no pass-score data yet" };

  // Pop-up tips: dedup by hash + take top 5 unique
  const tipSeen = new Set();
  const popupTips = [];
  for (const t of popupTipPool) {
    const id = createHash("sha256").update(t.text).digest("hex").slice(0, 8);
    if (tipSeen.has(id)) continue;
    tipSeen.add(id);
    popupTips.push({ tip_id: id, text: t.text, source_attribution: t.source_attribution, first_seen: new Date().toISOString().slice(0, 10), topic_filter: [] });
    if (popupTips.length >= 5) break;
  }

  // Subtopic struggles → top 3
  const struggleList = [...subtopicStruggles.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([t, v]) => ({ topic: t, note: v.evidence[0] ?? "Real test-takers self-report struggling here." }));

  // Top prep resources
  const topResources = [...prepResources.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([r]) => r);

  // Generator prompt injection (natural-language summary)
  const courseDisplay = course.replace(/_/g, " ");
  let injection = `REAL TEST-TAKER INSIGHTS (sourced from r/${course.startsWith("CLEP_") ? "clep" : course.startsWith("AP_") ? "APStudents" : course.startsWith("SAT_") ? "Sat" : course.startsWith("ACT_") ? "ACT" : "exam-prep"}, updated ${new Date().toISOString().slice(0, 10)}):\n`;
  injection += `- Coverage: ${coverageNote}\n`;
  const topTopics = Object.entries(topicWeights)
    .filter(([k]) => k !== "_default")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t.replace(/_/g, " "));
  if (topTopics.length) injection += `- High-emphasis topics (per real students): ${topTopics.join(", ")}.\n`;
  if (struggleList.length) injection += `- Students struggle most with: ${struggleList.map((s) => s.topic).join(", ")}. Generate proportionally more on these.\n`;
  injection += `- Wording style: ~${(trickyFraction * 100).toFixed(0)}% of items should use realistic exam-style indirection (NOT unfair ambiguity).\n`;
  injection += `- Difficulty target: ${(difficultyDistribution.easy * 100).toFixed(0)}% easy / ${(difficultyDistribution.medium * 100).toFixed(0)}% medium / ${(difficultyDistribution.hard * 100).toFixed(0)}% hard. ${difficultyDistribution.rationale}.\n`;
  if (topResources.length) injection += `- Authenticity bar: students compare us to ${topResources.slice(0, 3).join(", ")}. Match that register.`;

  const profile = {
    schema_version: "1.0",
    course,
    last_updated: new Date().toISOString().slice(0, 10),
    source_count: insights.length,
    calibration: {
      coverage_strategy: coverageStrategy,
      coverage_strategy_note: coverageNote,
      topic_weights: topicWeights,
      wording_style: { tricky_wording_fraction: Number(trickyFraction.toFixed(2)), guidance: "Realistic exam-style indirection. Always single-correct-answer." },
      difficulty_distribution: difficultyDistribution,
      subtopic_struggle_signals: struggleList,
      perceived_authenticity_bar: { competitors: topResources, note: "Students compare us to these — match the register." },
    },
    generator_prompt_injection: injection,
    popup_tips: popupTips,
  };

  const profilePath = join(profilesDir, `${course}.json`);
  writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  console.log(`✓ ${course}: ${insights.length} insights → profile (${popupTips.length} popup tips, ${topTopics.length} top topics)`);
}

console.log("Done.");

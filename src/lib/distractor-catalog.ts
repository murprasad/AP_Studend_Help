/**
 * Distractor-pattern catalog consumer (Goal A #36).
 *
 * The catalog (data/distractor-patterns/*.json) encodes, per skill, the
 * specific WRONG-answer reasoning real students use — each with a
 * `synthesisCue` telling the generator how to build that distractor. Until
 * now the catalog was inert (no consumer). This module loads it and produces
 * prompt guidance so generated MCQs get plausible, curated distractors instead
 * of generic ones.
 *
 * Runtime: fs-based (Node only), mirroring src/lib/cb-corpus.ts. Callers MUST
 * dynamic-import this inside a try/catch (it throws on CF Workers where fs is
 * unavailable — same gating as the CB-corpus injection in ai.ts).
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

export interface MistakeCategory {
  id: string;
  name: string;
  description: string;
  studentExample?: string;
  synthesisCue: string;
}

export interface DistractorCatalog {
  skill: string;
  exam: string; // e.g. "SAT_MATH", "ACT_SCIENCE"
  domain?: string;
  source?: string;
  mistakeCategories: MistakeCategory[];
}

let _cache: DistractorCatalog[] | null = null;

export function loadDistractorCatalogs(): DistractorCatalog[] {
  if (_cache) return _cache;
  const dir = path.join(process.cwd(), "data", "distractor-patterns");
  const out: DistractorCatalog[] = [];
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      try {
        const c = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as DistractorCatalog;
        if (c?.exam && Array.isArray(c.mistakeCategories) && c.mistakeCategories.length) out.push(c);
      } catch {
        // skip malformed catalog file
      }
    }
  }
  _cache = out;
  return out;
}

/** Cheap keyword-overlap score between a topic string and a catalog's skill/domain. */
function matchScore(topic: string, c: DistractorCatalog): number {
  const hay = `${c.skill} ${c.domain ?? ""}`.toLowerCase();
  const words = topic.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  let score = 0;
  for (const w of words) if (hay.includes(w)) score += 1;
  return score;
}

/**
 * Build a generation-prompt section listing `count` real student-mistake
 * patterns for the best-matching catalog. Returns "" if no catalog matches the
 * exam (so the generator falls back to its generic misconception instruction).
 *
 * @param course  the question's course/exam (e.g. "SAT_MATH")
 * @param topic   the question topic (used to pick the most relevant catalog)
 */
export function getDistractorGuidance(course: string, topic: string | undefined, count = 3): string {
  const catalogs = loadDistractorCatalogs();
  // ACT_MATH currently has no MATH-specific catalog → allow SAT_MATH fallback.
  const examMatches = catalogs.filter(
    (c) => c.exam === course || (course === "ACT_MATH" && c.exam === "SAT_MATH"),
  );
  if (examMatches.length === 0) return "";

  // Prefer the catalog whose skill/domain best overlaps the topic; else first.
  let best = examMatches[0];
  if (topic) {
    let bestScore = -1;
    for (const c of examMatches) {
      const s = matchScore(topic, c);
      if (s > bestScore) { bestScore = s; best = c; }
    }
  }

  const cats = best.mistakeCategories.slice(0, count);
  if (cats.length === 0) return "";
  const lines = cats.map((m, i) => `  ${i + 1}. ${m.name}: ${m.synthesisCue}`).join("\n");
  return (
    `\n\nDISTRACTOR GUIDANCE (real student misconceptions for "${best.skill}" — ` +
    `make the 3 wrong options reflect these distinct mistakes, NOT random values):\n${lines}\n` +
    `Each distractor must be a value/answer a student would actually reach via one of these errors.`
  );
}

/** Test/debug helper: catalog count + skills loaded. */
export function distractorCatalogSummary(): { count: number; skills: string[] } {
  const c = loadDistractorCatalogs();
  return { count: c.length, skills: c.map((x) => `${x.exam}:${x.skill}`) };
}

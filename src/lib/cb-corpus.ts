// CB-corpus loader — reads parsed CB SAT practice tests from data/cb-corpus/
// to feed generator prompts as few-shot anchors and stylometric validators.
//
// Source: data/cb-corpus/sat-practice-test-{4..10}.json (327 parsed CB-authored
// items, mostly R&W; Math is thin due to pdftotext math-notation loss).
//
// Per goal 2026-06-03: "Generator must validate every question against the
// real CB corpus before approval — no question reaches students unless it
// matches CB stylometric, structural, and distractor-pattern norms."

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

export interface CbCorpusQuestion {
  n: number;
  section: "READING_WRITING" | "MATH";
  module?: number;
  stem: string;
  options: Record<string, string>;
  correctAnswer?: string;
  officialExplanation?: string;
}

interface CbCorpusModule {
  section: "READING_WRITING" | "MATH";
  module: number;
  questions: CbCorpusQuestion[];
}

interface CbCorpusTest {
  test: string;
  modules: CbCorpusModule[];
}

let cachedCorpus: CbCorpusQuestion[] | null = null;

/**
 * Load all CB corpus questions across all parsed tests.
 * Cached after first call.
 */
export function loadCbCorpus(): CbCorpusQuestion[] {
  if (cachedCorpus) return cachedCorpus;
  const corpusDir = path.resolve(process.cwd(), "data", "cb-corpus");
  if (!existsSync(corpusDir)) {
    cachedCorpus = [];
    return cachedCorpus;
  }
  const out: CbCorpusQuestion[] = [];
  for (const file of readdirSync(corpusDir).filter((f) => f.endsWith(".json"))) {
    const test = JSON.parse(readFileSync(path.join(corpusDir, file), "utf8")) as CbCorpusTest;
    for (const m of test.modules) {
      for (const q of m.questions) {
        out.push({ ...q, section: m.section, module: m.module });
      }
    }
  }
  cachedCorpus = out;
  return out;
}

/**
 * Pick N random CB-corpus questions matching the given section.
 * Used as few-shot anchors in generator prompts.
 */
export function pickAnchorsForSection(
  section: "READING_WRITING" | "MATH",
  n = 3,
): CbCorpusQuestion[] {
  const pool = loadCbCorpus().filter((q) => q.section === section);
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, pool.length));
}

/**
 * Stylometric distribution stats for a section. Computed from corpus once.
 */
export interface SectionStats {
  section: "READING_WRITING" | "MATH";
  sampleSize: number;
  stemWordCount: { mean: number; sd: number };
  optionWordCount: { mean: number; sd: number };
  vocabularyCues: string[];
}

let cachedStats: Map<string, SectionStats> | null = null;

function wordCount(s: string): number {
  if (!s || typeof s !== "string") return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function meanSd(nums: number[]): { mean: number; sd: number } {
  if (nums.length === 0) return { mean: 0, sd: 0 };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
  return { mean, sd: Math.sqrt(variance) };
}

export function getSectionStats(section: "READING_WRITING" | "MATH"): SectionStats {
  if (!cachedStats) cachedStats = new Map();
  const cached = cachedStats.get(section);
  if (cached) return cached;
  const corpus = loadCbCorpus().filter((q) => q.section === section);
  const stemLens = corpus.map((q) => wordCount(q.stem));
  const optLens: number[] = [];
  for (const q of corpus) {
    for (const v of Object.values(q.options)) {
      optLens.push(wordCount(String(v)));
    }
  }
  // Mine vocabulary cues: frequent stem starts ("Which", "What is", "Based on", etc.)
  const cueMap = new Map<string, number>();
  for (const q of corpus) {
    const trimmed = q.stem.trim();
    // Take last meaningful sentence (after passage), look for "Which... ?" pattern
    const cueMatch = trimmed.match(/(Which (?:choice|of the following)[^?]+\?|What is[^?]+\?|Which equation[^?]+\?|How (?:much|many)[^?]+\?|Based on[^?]+\?)/i);
    if (cueMatch) {
      const cue = cueMatch[1].slice(0, 40).toLowerCase();
      cueMap.set(cue, (cueMap.get(cue) ?? 0) + 1);
    }
  }
  const topCues = Array.from(cueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cue]) => cue);

  const stats: SectionStats = {
    section,
    sampleSize: corpus.length,
    stemWordCount: meanSd(stemLens),
    optionWordCount: meanSd(optLens),
    vocabularyCues: topCues,
  };
  cachedStats.set(section, stats);
  return stats;
}

/**
 * Score a generated question against the CB-corpus distribution for the
 * section. Returns a per-dimension breakdown + overall pass/fail.
 *
 * Thresholds: within ± 1σ of corpus mean = pass; ± 2σ = warn; beyond = fail.
 */
export interface StylometricScore {
  stemWords: { value: number; mean: number; sd: number; zScore: number; pass: boolean };
  optionWords: { value: number; mean: number; sd: number; zScore: number; pass: boolean };
  hasCbVocabularyCue: boolean;
  optionsCount: { value: number; expected: 4; pass: boolean };
  distractorLengths: { ratio: number; pass: boolean }; // longest distractor / shortest, should be < 2.5
  overall: { pass: boolean; reasons: string[] };
}

export function scoreAgainstCb(
  candidate: { stem: string; options: string[] | Record<string, string> | string; correctAnswer?: string },
  section: "READING_WRITING" | "MATH",
): StylometricScore {
  const stats = getSectionStats(section);
  const stemWords = wordCount(candidate.stem ?? "");

  // Normalize options to array of strings
  let opts: string[] = [];
  if (Array.isArray(candidate.options)) opts = candidate.options.map(String);
  else if (typeof candidate.options === "object" && candidate.options) opts = Object.values(candidate.options).map(String);
  else if (typeof candidate.options === "string") {
    try {
      const parsed = JSON.parse(candidate.options);
      opts = Array.isArray(parsed) ? parsed.map(String) : Object.values(parsed).map(String);
    } catch {
      opts = [];
    }
  }

  const optLens = opts.map((o) => wordCount(o));
  const avgOptLen = optLens.length ? optLens.reduce((a, b) => a + b, 0) / optLens.length : 0;

  const stemZ = stats.stemWordCount.sd > 0 ? (stemWords - stats.stemWordCount.mean) / stats.stemWordCount.sd : 0;
  const optZ = stats.optionWordCount.sd > 0 ? (avgOptLen - stats.optionWordCount.mean) / stats.optionWordCount.sd : 0;

  const stemLower = (candidate.stem ?? "").toLowerCase();
  const hasCue = stats.vocabularyCues.some((cue) => stemLower.includes(cue.slice(0, 12).toLowerCase()));

  const distractorRatio =
    optLens.length >= 2 ? Math.max(...optLens) / Math.max(Math.min(...optLens.filter((x) => x > 0)), 1) : 1;

  const reasons: string[] = [];
  const stemPass = Math.abs(stemZ) <= 2;
  const optPass = Math.abs(optZ) <= 2;
  const optCountPass = opts.length === 4;
  const distractorPass = distractorRatio < 2.5;
  if (!stemPass) reasons.push(`stem-words ${stemWords} is ${stemZ.toFixed(1)}σ from CB mean ${stats.stemWordCount.mean.toFixed(0)} (limit ±2σ)`);
  if (!optPass) reasons.push(`avg-option-words ${avgOptLen.toFixed(1)} is ${optZ.toFixed(1)}σ from CB mean ${stats.optionWordCount.mean.toFixed(1)}`);
  if (!optCountPass) reasons.push(`options count ${opts.length} ≠ 4`);
  if (!distractorPass) reasons.push(`option-length ratio ${distractorRatio.toFixed(1)} > 2.5 (suspicious uneven distractors)`);

  return {
    stemWords: { value: stemWords, mean: stats.stemWordCount.mean, sd: stats.stemWordCount.sd, zScore: stemZ, pass: stemPass },
    optionWords: { value: avgOptLen, mean: stats.optionWordCount.mean, sd: stats.optionWordCount.sd, zScore: optZ, pass: optPass },
    hasCbVocabularyCue: hasCue,
    optionsCount: { value: opts.length, expected: 4, pass: optCountPass },
    distractorLengths: { ratio: distractorRatio, pass: distractorPass },
    overall: { pass: stemPass && optPass && optCountPass && distractorPass, reasons },
  };
}

/**
 * Format an anchor question as a few-shot example for an LLM prompt.
 */
export function formatAnchorForPrompt(q: CbCorpusQuestion, idx: number): string {
  const optsBlock = Object.entries(q.options)
    .map(([k, v]) => `  ${k}) ${v}`)
    .join("\n");
  return `EXAMPLE ${idx} (from official CB SAT practice test):
Stem: ${q.stem.slice(0, 500)}
Options:
${optsBlock}`;
}

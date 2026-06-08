/**
 * Today's Set generator — picks 12 questions/day per (user, course) that
 * maximally move the user's pass probability.
 *
 * Strategy (PRD §3.3):
 *   1. Identify user's 3 weakest concepts (using MasteryScore per unit
 *      until QuestionConcept rows are backfilled — see PRD migration plan).
 *   2. Pull candidate Qs: approved, in those concepts, NOT answered in the
 *      last 14 days, NOT marked unapproved or pending.
 *   3. Sample with weighting: 50% from weakest concept, 30% from 2nd,
 *      20% from 3rd. Apply SM-2 + CBR multiplier for ordering.
 *   4. If fewer than 12 candidates exist (thin course / new student),
 *      fall back: pull oldest 30-day mistakes from any unit, then any
 *      unattempted question in the course.
 *
 * Inputs are passed in rather than queried inline so this module is
 * pure-functional + unit-testable.
 */

export interface CandidateQuestion {
  id: string;
  unit: string;
  /** "EASY" | "MEDIUM" | "HARD" */
  difficulty: string;
}

export interface PastResponse {
  questionId: string;
  isCorrect: boolean;
  /** 1-5 Brainscape CBR; null = treat as 3. */
  confidenceSelf: number | null;
  answeredAt: Date;
}

export interface UnitMastery {
  unit: string;
  /** 0-100 */
  masteryScore: number;
}

export interface TodaysSetInputs {
  candidatePool: CandidateQuestion[];
  /** All responses from this user in this course, newest first. Used for SM-2 + 14d dedup. */
  pastResponses: PastResponse[];
  unitMasteries: UnitMastery[];
  /** Defaults to 12. Lower if you want shorter sessions. */
  targetSize?: number;
  /** Reference "now" in ms. Defaults to Date.now(). Inject for deterministic,
   *  time-independent tests (14-day dedup + SM-2 ageing key off it). */
  nowMs?: number;
}

export interface TodaysSetResult {
  questionIds: string[];
  conceptKeys: string[];
  /**
   * Rough expected pass% delta if user completes. Computed downstream
   * from PassProbResult.drivers; this module just emits a hint based on
   * mastery gap.
   */
  expectedDeltaPctHint: number;
}

const TARGET_SIZE_DEFAULT = 12;
const WEAK_CONCEPTS_TO_TARGET = 3;
const RECENT_DEDUP_DAYS = 14;
// 2026-06-01 — Bug #4 fix: dropped per-concept weights from [0.5, 0.3, 0.2]
// to [0.4, 0.25, 0.15] to free 20% of the set for exploration. Without
// exploration, persona walkthrough showed the system serving the same unit
// to a user for 25 consecutive sessions while other units' mastery silently
// staled. Exploration spreads ~2-3 Qs of every 12-Q set across non-targeted
// units so all units stay re-verified.
const PER_CONCEPT_WEIGHTS = [0.4, 0.25, 0.15];
const EXPLORATION_RATIO = 0.20;

/**
 * Brainscape-style CBR multiplier on SM-2 interval. confidence 5 stretches
 * the interval 1.3x; 1 shrinks it 0.7x. null is treated as 3 (1.0x).
 */
function cbrMultiplier(confidenceSelf: number | null): number {
  const c = confidenceSelf ?? 3;
  return 1 + (c - 3) * 0.15;
}

/**
 * SM-2 priority for re-surfacing. Higher = surface sooner.
 * Wrong answer = top priority. Correct + low confidence = next.
 * Correct + high confidence = lowest.
 */
function sm2Priority(resp: PastResponse | undefined, nowMs: number): number {
  if (!resp) return 0.5; // unseen — moderate priority (give the user something fresh)
  const ageDays = (nowMs - resp.answeredAt.getTime()) / 86400000;
  if (!resp.isCorrect) return 1.0 - Math.max(0, 1 - ageDays / 7) * 0.5;
  const stretch = cbrMultiplier(resp.confidenceSelf);
  const due = ageDays / (3 * stretch);
  return Math.max(0, Math.min(1, due));
}

export function generateTodaysSet(inputs: TodaysSetInputs): TodaysSetResult {
  const targetSize = inputs.targetSize ?? TARGET_SIZE_DEFAULT;
  const nowMs = inputs.nowMs ?? Date.now();
  const cutoff = nowMs - RECENT_DEDUP_DAYS * 86400000;
  const recentQids = new Set(
    inputs.pastResponses
      .filter(r => r.answeredAt.getTime() >= cutoff)
      .map(r => r.questionId),
  );
  const lastResponseByQ = new Map<string, PastResponse>();
  for (const r of inputs.pastResponses) {
    if (!lastResponseByQ.has(r.questionId)) lastResponseByQ.set(r.questionId, r);
  }

  // 2026-06-01 — Bug #13 fix: diagnostic-mode first set. For a brand-new
  // user (no responses ever), targeting "weakest" by mastery is meaningless
  // — every unit has the default 50% mastery. Picking weakest 3 is
  // arbitrary. Instead, distribute the first set evenly across ALL units
  // so the dashboard's "weakest" recommendation is data-driven by session 2.
  if (inputs.pastResponses.length === 0) {
    const allUnits = Array.from(new Set(inputs.candidatePool.map((c) => c.unit)));
    const perUnit = Math.max(1, Math.ceil(targetSize / Math.max(allUnits.length, 1)));
    const picked: string[] = [];
    for (const unit of allUnits) {
      const bucket = inputs.candidatePool.filter((c) => c.unit === unit);
      // Shuffle bucket so different new users don't get identical sets
      const shuffled = bucket.sort(() => Math.random() - 0.5).slice(0, perUnit);
      for (const c of shuffled) {
        if (picked.length >= targetSize) break;
        if (!picked.includes(c.id)) picked.push(c.id);
      }
      if (picked.length >= targetSize) break;
    }
    return {
      questionIds: picked.slice(0, targetSize),
      conceptKeys: allUnits.map((u) => `unit:${u}`),
      // For a diagnostic, the value isn't "your readiness will move +Xpp" —
      // it's "establish a baseline." Encode that as a small positive hint
      // so the card knows this is informative, not aspirational.
      expectedDeltaPctHint: 0.02,
    };
  }

  // Rank units by mastery — lowest first.
  const sortedUnits = [...inputs.unitMasteries]
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, WEAK_CONCEPTS_TO_TARGET);
  const weakUnits = sortedUnits.map(u => u.unit);
  const conceptKeys = weakUnits.map(u => `unit:${u}`);

  // Bucket candidates by unit, exclude recent dedup.
  const buckets: Record<string, CandidateQuestion[]> = {};
  for (const c of inputs.candidatePool) {
    if (recentQids.has(c.id)) continue;
    if (!buckets[c.unit]) buckets[c.unit] = [];
    buckets[c.unit].push(c);
  }

  const picked: string[] = [];
  const weights = PER_CONCEPT_WEIGHTS.slice(0, weakUnits.length);
  // First pass: take per-concept quotas.
  for (let i = 0; i < weakUnits.length; i++) {
    const unit = weakUnits[i];
    const quota = Math.round(targetSize * weights[i]);
    const bucket = buckets[unit] ?? [];
    const ranked = bucket
      .map(c => ({ c, prio: sm2Priority(lastResponseByQ.get(c.id), nowMs) }))
      .sort((a, b) => b.prio - a.prio)
      .map(x => x.c);
    for (const c of ranked) {
      if (picked.length >= targetSize) break;
      if (picked.includes(c.id)) continue;
      picked.push(c.id);
      if (picked.filter(id => bucket.some(b => b.id === id)).length >= quota) break;
    }
  }

  // 2026-06-01 — Bug #4 fix: exploration tail. Reserve EXPLORATION_RATIO
  // of the set for units OUTSIDE the targeted weak set. Without this, a
  // user's "weakest unit" never gets challenged because Today's Set never
  // serves it. Picks oldest-attempted (lowest prio = haven't seen in
  // longest) from non-targeted units so stale mastery surfaces.
  const weakUnitSet = new Set(weakUnits);
  const explorationTarget = Math.floor(targetSize * EXPLORATION_RATIO);
  if (explorationTarget > 0 && picked.length < targetSize) {
    const nonTargetCandidates = inputs.candidatePool.filter(
      (c) => !recentQids.has(c.id) && !weakUnitSet.has(c.unit) && !picked.includes(c.id),
    );
    // Sort by SM-2 priority (oldest seen / unseen → top)
    const ranked = nonTargetCandidates
      .map((c) => ({ c, prio: sm2Priority(lastResponseByQ.get(c.id), nowMs) }))
      .sort((a, b) => b.prio - a.prio)
      .map((x) => x.c);
    let explorationTaken = 0;
    for (const c of ranked) {
      if (picked.length >= targetSize) break;
      if (explorationTaken >= explorationTarget) break;
      picked.push(c.id);
      explorationTaken += 1;
    }
  }

  // Backfill from ANY weak-unit candidate if we under-quota'd.
  if (picked.length < targetSize) {
    const all = weakUnits.flatMap(u => buckets[u] ?? []);
    const ranked = all
      .map(c => ({ c, prio: sm2Priority(lastResponseByQ.get(c.id), nowMs) }))
      .sort((a, b) => b.prio - a.prio)
      .map(x => x.c);
    for (const c of ranked) {
      if (picked.length >= targetSize) break;
      if (!picked.includes(c.id)) picked.push(c.id);
    }
  }

  // Final fallback: pull any unattempted Q from the whole pool.
  if (picked.length < targetSize) {
    for (const c of inputs.candidatePool) {
      if (picked.length >= targetSize) break;
      if (picked.includes(c.id)) continue;
      if (recentQids.has(c.id)) continue;
      picked.push(c.id);
    }
  }

  // Expected delta hint: average gap-to-target across targeted weak units
  // times the coverage weight in the formula (0.1).
  const avgGap = sortedUnits.length
    ? sortedUnits.reduce((s, u) => s + Math.max(0, 0.85 - u.masteryScore / 100), 0) / sortedUnits.length
    : 0;
  const expectedDeltaPctHint = 0.1 * avgGap;

  return { questionIds: picked.slice(0, targetSize), conceptKeys, expectedDeltaPctHint };
}

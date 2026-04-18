/**
 * Mastery tier-up detection — pure helpers.
 *
 * Tier boundaries are 0→20, 20→40, 40→60, 60→80, 80→100. A tier-up is any
 * increase where `tierOf(after) > tierOf(before)` on the same unit. Multiple
 * tier jumps in a single session count as ONE tier-up row (the deltas from
 * before→after, with beforeTier/afterTier both captured).
 *
 * Negative-case mindset (3:1 vs positive):
 *   - after < before  → tier DOWN, NOT a tier-up, must not emit.
 *   - after === before → no change, must not emit.
 *   - same tier (e.g. 21→39) → must not emit; boundary not crossed.
 *   - unit present in after but not before (fresh unit) → before treated as 0
 *     (tier 0); only emit if after crosses ≥20. Handled by caller passing 0.
 *   - unit present in before but not after (unlikely) → skip; we only iterate
 *     the intersection with "after" as the authoritative post-session state.
 *   - NaN / non-finite inputs → tierOf clamps to 0 via the initial `<20` branch;
 *     we defensively guard against NaN here.
 */

export function tierOf(masteryScore: number): number {
  // Defensive: NaN, undefined, or negative → tier 0.
  if (!Number.isFinite(masteryScore) || masteryScore < 20) return 0;
  if (masteryScore >= 80) return 4;
  if (masteryScore >= 60) return 3;
  if (masteryScore >= 40) return 2;
  return 1; // 20–39.999…
}

export interface TierUpDiff {
  unit: string;
  beforeScore: number;
  afterScore: number;
  beforeTier: number;
  afterTier: number;
}

/**
 * Returns the units where a tier boundary was crossed upward.
 *
 * @param before unit → mastery % snapshot BEFORE the grading pass
 * @param after  unit → mastery % snapshot AFTER the grading pass
 */
export function detectTierUps(
  before: Record<string, number>,
  after: Record<string, number>,
): TierUpDiff[] {
  const diffs: TierUpDiff[] = [];
  for (const [unit, afterScoreRaw] of Object.entries(after)) {
    const afterScore = Number.isFinite(afterScoreRaw) ? afterScoreRaw : 0;
    // Unit not yet in "before" snapshot → treat as 0 so a fresh unit that
    // jumps straight to 25% still registers a 0→1 tier-up.
    const beforeScoreRaw = before[unit];
    const beforeScore = Number.isFinite(beforeScoreRaw) ? beforeScoreRaw : 0;
    const beforeTier = tierOf(beforeScore);
    const afterTier = tierOf(afterScore);
    if (afterTier > beforeTier) {
      diffs.push({ unit, beforeScore, afterScore, beforeTier, afterTier });
    }
  }
  return diffs;
}

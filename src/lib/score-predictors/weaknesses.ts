/**
 * Weakness-to-action recommender for Phase A score predictor.
 *
 * Bridges the gap from "you're a 3.7" → "fix Unit 3 + Unit 5 to reach 4."
 * Pure function — no DB access. Caller hands in mastery rows + course
 * + current readiness; returns ranked actionable items the UI renders
 * as clickable practice CTAs.
 */

import type { ApCourse, ApUnit } from "@prisma/client";
import { COURSE_REGISTRY } from "@/lib/courses";

export interface ScoreAction {
  /** ApUnit enum value, used to deep-link practice. */
  unit: string;
  /** Human-readable unit name from COURSE_REGISTRY (e.g. "Unit 3: Cellular Energetics"). */
  unitLabel: string;
  /** Current mastery 0-100. */
  currentMastery: number;
  /** Total attempts across all questions in this unit. */
  totalAttempts: number;
  /** Rough estimate of questions needed to bump mastery into the next score tier. */
  estQuestionsToTier: number;
  /** Where to send the user when they tap the action. */
  href: string;
  /** Short reason badge ("Lowest mastery" / "Highest impact" / "Untouched"). */
  reason: string;
}

interface MasteryRow {
  unit: string;
  masteryScore: number;
  totalAttempts: number;
}

/**
 * Rank weak units by boost potential and return top N actions.
 *
 * Boost potential = (100 - mastery) × evidenceMultiplier.
 *   - evidenceMultiplier favors units with at least some attempts so we
 *     don't keep recommending units the student has never touched (those
 *     get a smaller multiplier — surface them but don't rank above units
 *     where data is real).
 *   - Untouched units (totalAttempts = 0) get reason = "Untouched" so the
 *     UI can frame them as exploration, not weakness.
 *
 * Estimated questions to next tier: assumes ~10 well-targeted practice
 * questions per 8pp mastery gain. Conservative — actual rate varies by
 * student and difficulty mix. The number is a rough north star, not a
 * promise. Calibrated against PrepLion REQ-031 historical data.
 */
export function getScoreActions(
  course: ApCourse,
  masteryRows: MasteryRow[],
  topN: number = 3,
): ScoreAction[] {
  const config = COURSE_REGISTRY[course];
  if (!config) return [];

  const knownUnits = new Set(Object.keys(config.units));

  // Build candidate list: include every mastery row whose unit is in the
  // course config. Filter out unknown enums (defensive — old data).
  const candidates: ScoreAction[] = [];

  for (const m of masteryRows) {
    if (!knownUnits.has(m.unit)) continue;
    const meta = config.units[m.unit as ApUnit];
    if (!meta) continue;

    const masteryGap = Math.max(0, 100 - m.masteryScore);
    const evidenceMultiplier = m.totalAttempts >= 5 ? 1.0 : 0.6;
    const boostPotential = masteryGap * evidenceMultiplier;

    // Estimate questions to next tier — assumes ~10 questions per 8pp.
    // Floor at 5 (you can't usefully practice 1 question for a tier),
    // cap at 50 (sane upper bound — diminishing returns past this).
    const estQuestionsToTier = Math.max(
      5,
      Math.min(50, Math.round((masteryGap / 8) * 10)),
    );

    let reason: string;
    if (m.totalAttempts === 0) reason = "Untouched";
    else if (m.masteryScore < 40) reason = "Lowest mastery";
    else if (m.masteryScore < 70) reason = "High impact";
    else reason = "Reinforce strength";

    candidates.push({
      unit: m.unit,
      unitLabel: meta.name,
      currentMastery: Math.round(m.masteryScore),
      totalAttempts: m.totalAttempts,
      estQuestionsToTier,
      href: `/practice?course=${course}&unit=${encodeURIComponent(m.unit)}`,
      reason,
      // Sort key (not in interface, used during ranking only)
      // @ts-expect-error - private sort key
      _boost: boostPotential,
    });
  }

  // Also include units the student has NEVER touched (no mastery row at
  // all). These are exploration candidates — high-potential but no
  // evidence. Score them lower than mastered-but-weak units.
  const seenUnits = new Set(candidates.map((c) => c.unit));
  for (const unitKey of Array.from(knownUnits)) {
    if (seenUnits.has(unitKey)) continue;
    const meta = config.units[unitKey as ApUnit];
    if (!meta) continue;
    candidates.push({
      unit: unitKey,
      unitLabel: meta.name,
      currentMastery: 0,
      totalAttempts: 0,
      estQuestionsToTier: 15, // conservative starting estimate
      href: `/practice?course=${course}&unit=${encodeURIComponent(unitKey)}`,
      reason: "Untouched",
      // @ts-expect-error - private sort key
      _boost: 60, // mid-rank: above mastered-but-weak (real signal preferred)
    });
  }

  // Sort by boost potential descending, take top N.
  candidates.sort((a, b) => {
    const aBoost = (a as unknown as { _boost: number })._boost;
    const bBoost = (b as unknown as { _boost: number })._boost;
    return bBoost - aBoost;
  });

  // Strip the private sort key before returning.
  return candidates.slice(0, topN).map((c) => {
    const { unit, unitLabel, currentMastery, totalAttempts, estQuestionsToTier, href, reason } = c;
    return { unit, unitLabel, currentMastery, totalAttempts, estQuestionsToTier, href, reason };
  });
}

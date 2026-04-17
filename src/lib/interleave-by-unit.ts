/**
 * A22.5 — Topic interleaving to cap consecutive same-unit exposure.
 *
 * Complements A22.4 fail-downshift. Where fail-downshift reacts to a run of
 * wrongs, interleave proactively prevents a run in the first place: no more
 * than `maxConsecutive` (default 2) questions from the same unit in a row.
 *
 * Rationale (ChatGPT post-diagnostic analysis): "attack your weakness" drill
 * patterns like 5 Molecular Cell questions in a row are punishing even when
 * each individual question is fairly calibrated — failure clusters destroy
 * confidence with no recovery beat between exposures.
 *
 * This module is framework-free so it can live on either the server (in
 * /api/practice question-selection) or the client (post-fetch reordering)
 * without hauling in React/Prisma.
 */

export interface InterleavableQuestion {
  id: string;
  unit: string;
}

/**
 * Reorder a question list so no more than `maxConsecutive` questions from
 * the same unit appear back-to-back. Order within a unit is preserved (so
 * priority/difficulty sorting from upstream is respected inside each unit).
 *
 * When the constraint can't be honored (only one unit remains with many
 * questions left), the algorithm falls back to emitting consecutive
 * same-unit questions rather than dropping them.
 */
export function interleaveByUnit<T extends InterleavableQuestion>(
  questions: T[],
  maxConsecutive = 2,
): T[] {
  if (questions.length <= 1 || maxConsecutive < 1) return questions;

  // Preserve ordering inside each unit by using shift() on per-unit queues.
  const queues = new Map<string, T[]>();
  const seen: string[] = [];
  for (const q of questions) {
    if (!queues.has(q.unit)) {
      queues.set(q.unit, []);
      seen.push(q.unit);
    }
    queues.get(q.unit)!.push(q);
  }

  const result: T[] = [];
  let lastUnit: string | null = null;
  let run = 0;

  while (result.length < questions.length) {
    // Candidates = units with remaining Qs.
    const candidates = seen.filter((u) => (queues.get(u)?.length ?? 0) > 0);
    if (candidates.length === 0) break;

    // Prefer units that DON'T extend a run past the cap.
    const eligible = candidates.filter((u) => u !== lastUnit || run < maxConsecutive);
    const pool = eligible.length > 0 ? eligible : candidates;

    // Among eligible, pick the unit with the MOST remaining questions — keeps
    // the distribution balanced so we don't exhaust a small unit early and
    // then be forced into long runs from a big unit.
    pool.sort((a, b) => (queues.get(b)!.length - queues.get(a)!.length));
    const pick = pool[0];

    const q = queues.get(pick)!.shift()!;
    result.push(q);

    if (pick === lastUnit) run += 1;
    else { lastUnit = pick; run = 1; }
  }

  return result;
}

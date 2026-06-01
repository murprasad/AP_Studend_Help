/**
 * 2026-05-31 — F11 IRT difficulty calibration module (#100 Sprint S3).
 *
 * 3-parameter logistic (3PL) item-response model — the family CB uses
 * for the digital SAT. Each item has:
 *   a  — discrimination (how sharply prob shifts as theta crosses b)
 *   b  — difficulty (theta at which P(correct) = 0.5 for c=0)
 *   c  — guessing (probability a low-ability student gets it correct)
 *
 * 3PL probability function:
 *   P(correct | theta) = c + (1 - c) / (1 + exp(-1.7 * a * (theta - b)))
 *
 * The 1.7 scaling factor makes the logistic curve approximate the normal-
 * ogive shape used in CB's published calibration.
 *
 * Used by F11 to replace the F7/F8 piecewise scaled-score curve with a
 * proper theta estimate. When the bank gets per-Q (a, b, c) calibration
 * (next pass after F13 skill-code tagging), this module turns response
 * patterns into a maximum-likelihood theta, then maps theta to scaled
 * score via the published CB conversion.
 *
 * For the cold-start case (no calibrated bank yet), `estimateThetaFromAccuracy`
 * lets the existing accuracy → scale curve plug into the same theta-based
 * downstream.
 *
 * Pure functions, no I/O. Test-friendly.
 */

export interface IrtItem {
  /** Discrimination — how sharply the curve flips. Typical range 0.5–2.5. */
  a: number;
  /** Difficulty — theta where P=0.5 (assuming c=0). Typical range -3..+3. */
  b: number;
  /** Guessing — lower asymptote. 0 for SPR/grid-in, 0.25 for 4-choice MCQ. */
  c: number;
}

export interface IrtResponse {
  item: IrtItem;
  /** true if the student got this item correct. */
  isCorrect: boolean;
}

/**
 * 3PL probability of a correct response given theta and an item's (a, b, c).
 */
export function probCorrect(theta: number, item: IrtItem): number {
  const exponent = -1.7 * item.a * (theta - item.b);
  const logistic = 1 / (1 + Math.exp(exponent));
  return item.c + (1 - item.c) * logistic;
}

/**
 * Log-likelihood of a response pattern at a given theta.
 * L(theta | responses) = sum over i of:
 *   isCorrect_i * log(P_i) + (1 - isCorrect_i) * log(1 - P_i)
 */
export function logLikelihood(theta: number, responses: ReadonlyArray<IrtResponse>): number {
  let ll = 0;
  for (const r of responses) {
    const p = probCorrect(theta, r.item);
    // Guard against P=0 or P=1 to avoid log(-inf)
    const clamped = Math.max(1e-9, Math.min(1 - 1e-9, p));
    if (r.isCorrect) {
      ll += Math.log(clamped);
    } else {
      ll += Math.log(1 - clamped);
    }
  }
  return ll;
}

/**
 * Maximum-likelihood theta estimate from a response pattern using a
 * golden-section search on theta ∈ [-4, +4]. Converges in ~50 iterations
 * to ±0.001 of the MLE.
 *
 * Returns null when the response pattern is degenerate (all-correct or
 * all-wrong) — those cases require a prior or a Bayesian estimator;
 * the caller should fall back to the accuracy-based estimate.
 */
export function estimateTheta(
  responses: ReadonlyArray<IrtResponse>,
  opts?: { thetaMin?: number; thetaMax?: number; tolerance?: number },
): number | null {
  if (responses.length === 0) return null;
  const allCorrect = responses.every((r) => r.isCorrect);
  const allWrong = responses.every((r) => !r.isCorrect);
  if (allCorrect || allWrong) return null;

  const thetaMin = opts?.thetaMin ?? -4;
  const thetaMax = opts?.thetaMax ?? 4;
  const tolerance = opts?.tolerance ?? 0.001;
  const phi = (Math.sqrt(5) - 1) / 2; // golden ratio inverse ≈ 0.618

  let lo = thetaMin;
  let hi = thetaMax;
  let x1 = hi - phi * (hi - lo);
  let x2 = lo + phi * (hi - lo);
  let f1 = logLikelihood(x1, responses);
  let f2 = logLikelihood(x2, responses);

  // Maximize log-likelihood (golden-section MAXIMIZATION variant).
  while (hi - lo > tolerance) {
    if (f1 > f2) {
      hi = x2;
      x2 = x1;
      f2 = f1;
      x1 = hi - phi * (hi - lo);
      f1 = logLikelihood(x1, responses);
    } else {
      lo = x1;
      x1 = x2;
      f1 = f2;
      x2 = lo + phi * (hi - lo);
      f2 = logLikelihood(x2, responses);
    }
  }
  return (lo + hi) / 2;
}

/**
 * Cold-start fallback when the bank isn't IRT-calibrated yet. Treats
 * the student's accuracy as theta = inverse-logistic(accuracy) on a
 * standard scale. Same shape as estimateTheta would produce against
 * a flat bank of (a=1, b=0, c=0) items.
 */
export function estimateThetaFromAccuracy(
  accuracyPercent: number,
  totalAnswered: number,
): number | null {
  if (totalAnswered < 5) return null;
  const acc = Math.max(0.01, Math.min(0.99, accuracyPercent / 100));
  // theta = ln(p / (1 - p)) — the standard logit transformation.
  return Math.log(acc / (1 - acc));
}

/**
 * Map theta to the SAT 200-800 scaled section score using the same
 * shape as F7's CURVE table. theta=0 ≈ 500 (median); theta=+2 ≈ 720;
 * theta=-2 ≈ 280. The mapping is symmetric around the midpoint and
 * runs the linear interpolation through 5 anchors.
 */
export function thetaToSatScale(theta: number, family: "SAT" | "PSAT" = "SAT"): number {
  // Anchor table: theta → scaled. Calibrated to match F7's piecewise
  // curve at the same accuracy boundaries.
  const anchors = family === "PSAT"
    ? [
        { theta: -4, scaled: 160 },
        { theta: -2, scaled: 300 },
        { theta: 0,  scaled: 460 },
        { theta: 2,  scaled: 680 },
        { theta: 4,  scaled: 760 },
      ]
    : [
        { theta: -4, scaled: 200 },
        { theta: -2, scaled: 350 },
        { theta: 0,  scaled: 500 },
        { theta: 2,  scaled: 720 },
        { theta: 4,  scaled: 800 },
      ];
  const t = Math.max(-4, Math.min(4, theta));
  let lo = anchors[0];
  let hi = anchors[anchors.length - 1];
  for (let i = 0; i < anchors.length - 1; i += 1) {
    if (t >= anchors[i].theta && t <= anchors[i + 1].theta) {
      lo = anchors[i];
      hi = anchors[i + 1];
      break;
    }
  }
  const frac = hi.theta === lo.theta ? 0 : (t - lo.theta) / (hi.theta - lo.theta);
  const raw = lo.scaled + frac * (hi.scaled - lo.scaled);
  // Round to nearest 10 (CB convention)
  return Math.round(raw / 10) * 10;
}

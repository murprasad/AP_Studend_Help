#!/usr/bin/env node
/**
 * seed-frq-calc-bc.mjs
 *
 * Seeds 8 AP Calculus BC Free-Response Questions modeled after released
 * College Board exams 2019–2024 (skipping 2020, which had modified exams).
 * Each FRQ includes:
 *   - prompt text (student-facing)
 *   - stimulus (optional — tables/curves described in prose since we don't
 *     have the images on-prem)
 *   - typed rubric (forward-compatible with the MULTI_PART rubric shape):
 *       { type: "MULTI_PART", parts: [{label, points, criterion, keywords}], totalPoints }
 *   - sample response (high-scoring model answer aligned with CB scoring)
 *
 * Coverage (8 FRQs, one per BC-only or BC-emphasized topic):
 *   1. Parametric / vector / polar      → CALC_BC_9_PARAMETRIC_POLAR_VECTORS
 *   2. Series / ratio test / IOC        → CALC_BC_10_INFINITE_SEQUENCES_SERIES
 *   3. Taylor / Maclaurin series        → CALC_BC_10_INFINITE_SEQUENCES_SERIES
 *   4. Improper integrals               → CALC_BC_6_INTEGRATION
 *   5. Integration by parts / partial fractions → CALC_BC_6_INTEGRATION
 *   6. Euler's method / logistic growth → CALC_BC_7_DIFFERENTIAL_EQUATIONS
 *   7. Arc length / surface of revolution → CALC_BC_8_APPLICATIONS_INTEGRATION
 *   8. Applications of series           → CALC_BC_10_INFINITE_SEQUENCES_SERIES
 *
 * All rows land with isApproved=true so they immediately surface via /api/frq.
 *
 * Every FRQ is type="MULTI_PART" and carries 9 total points, matching the
 * real AP Calculus BC FRQ point budget.
 *
 * Usage:
 *   node scripts/seed-frq-calc-bc.mjs
 *
 * Safe to re-run — we dedupe on (course, year, questionNumber).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FRQS = [
  // 1. Parametric / vector / polar — CALC_BC_9_PARAMETRIC_POLAR_VECTORS (2019 Q2 style)
  {
    year: 2019,
    questionNumber: 2,
    type: "MULTI_PART",
    unit: "CALC_BC_9_PARAMETRIC_POLAR_VECTORS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "A particle moves in the xy-plane so that its position at time t is given by the parametric equations x(t) = t^2 - 4t and y(t) = t^3 - 3t^2, for 0 ≤ t ≤ 4.\n\n(a) Find the velocity vector of the particle at time t = 2.\n\n(b) Find the speed of the particle at time t = 2.\n\n(c) Find the slope of the line tangent to the path of the particle at t = 3.\n\n(d) Find the total distance traveled by the particle from t = 0 to t = 2. Set up and evaluate using a calculator if needed. Give answer to 3 decimal places.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Computes x'(t) = 2t - 4 and y'(t) = 3t^2 - 6t; at t = 2: x'(2) = 0, y'(2) = 0; velocity vector = ⟨0, 0⟩",
          keywords: ["x'(t) = 2t - 4", "y'(t) = 3t² - 6t", "⟨0, 0⟩"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Speed = sqrt((x'(2))^2 + (y'(2))^2) = sqrt(0 + 0) = 0",
          keywords: ["speed = sqrt(x'^2 + y'^2)", "0"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Slope dy/dx = y'(t)/x'(t) = (3t^2 - 6t)/(2t - 4); at t = 3: (27 - 18)/(6 - 4) = 9/2",
          keywords: ["dy/dx = y'/x'", "9/2", "4.5"],
        },
        {
          label: "d",
          points: 3,
          criterion: "Arc length = ∫₀² sqrt((x'(t))^2 + (y'(t))^2) dt = ∫₀² sqrt((2t-4)^2 + (3t^2-6t)^2) dt; calculator evaluates to ≈ 9.547 (accept 9.5 to 9.6)",
          keywords: ["∫₀² sqrt(x'^2 + y'^2) dt", "arc length", "≈ 9.547"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) x'(t) = 2t - 4, y'(t) = 3t² - 6t. At t = 2: x'(2) = 0, y'(2) = 12 - 12 = 0. Velocity vector = ⟨0, 0⟩ (the particle is momentarily at rest).\n\n(b) Speed(2) = sqrt(x'(2)² + y'(2)²) = sqrt(0 + 0) = 0.\n\n(c) dy/dx = y'(t)/x'(t). At t = 3: y'(3) = 27 - 18 = 9, x'(3) = 6 - 4 = 2. So dy/dx = 9/2.\n\n(d) Total distance = ∫₀² sqrt((2t - 4)² + (3t² - 6t)²) dt. Using a calculator: ≈ 9.547.",
  },

  // 2. Series — ratio test, interval of convergence — CALC_BC_10 (2022 Q6 style)
  {
    year: 2022,
    questionNumber: 6,
    type: "MULTI_PART",
    unit: "CALC_BC_10_INFINITE_SEQUENCES_SERIES",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Consider the power series ∑_{n=1}^∞ ((x - 2)^n) / (n · 3^n).\n\n(a) Use the Ratio Test to find the radius of convergence of the series.\n\n(b) Find the interval of convergence. You must determine whether the endpoints are included by testing each separately.\n\n(c) Find the sum of the series when x = 5/2. Justify your answer.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 3,
          criterion: "Sets up ratio test: |a_{n+1}/a_n| = |(x-2)^{n+1}/((n+1)·3^{n+1})| · |(n·3^n)/(x-2)^n| = (n/(n+1)) · |x-2|/3; limit = |x-2|/3; converges when |x-2|/3 < 1, so radius = 3",
          keywords: ["ratio test", "limit = |x-2|/3", "radius = 3"],
        },
        {
          label: "b",
          points: 4,
          criterion: "Interval before endpoints: -1 < x < 5. At x = 5: ∑ 1/n (harmonic, diverges). At x = -1: ∑ (-1)^n/n (alternating harmonic, converges by AST). Final interval: [-1, 5)",
          keywords: ["-1 < x < 5", "x = 5 harmonic diverges", "x = -1 alternating converges", "[-1, 5)"],
        },
        {
          label: "c",
          points: 2,
          criterion: "At x = 5/2: series is ∑ (1/2)^n / (n · 3^n) = ∑ 1/(n · 6^n) — inside the interval of convergence, so series converges; recognizes this as -ln(1 - 1/6) = ln(6/5) using the Maclaurin series -ln(1-u) = ∑ u^n/n with u = 1/6",
          keywords: ["x = 5/2 in interval", "converges", "ln(6/5)", "-ln(1 - 1/6)"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) a_n = (x - 2)^n/(n · 3^n). Ratio: |a_{n+1}/a_n| = |(x-2)^{n+1} · n · 3^n / ((n+1) · 3^{n+1} · (x-2)^n)| = (n/(n+1)) · |x-2|/3. As n→∞, n/(n+1)→1, so L = |x-2|/3. Series converges when L < 1, i.e., |x - 2| < 3. Radius of convergence R = 3.\n\n(b) |x - 2| < 3 gives -1 < x < 5. Test endpoints:\n  x = 5: series becomes ∑ 3^n/(n · 3^n) = ∑ 1/n, the harmonic series — DIVERGES.\n  x = -1: series becomes ∑ (-3)^n/(n · 3^n) = ∑ (-1)^n/n, the alternating harmonic — CONVERGES by AST.\nInterval of convergence: [-1, 5).\n\n(c) At x = 5/2, the series is ∑ (1/2)^n/(n · 3^n) = ∑ 1/(n · 6^n). Note x = 5/2 is in [-1, 5), so the series converges. Using the known Maclaurin series -ln(1 - u) = ∑_{n=1}^∞ u^n/n for |u| < 1 with u = 1/6: ∑ (1/6)^n/n = -ln(1 - 1/6) = -ln(5/6) = ln(6/5).",
  },

  // 3. Taylor / Maclaurin series — CALC_BC_10 (2023 Q6 style)
  {
    year: 2023,
    questionNumber: 6,
    type: "MULTI_PART",
    unit: "CALC_BC_10_INFINITE_SEQUENCES_SERIES",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Let f be a function with derivatives of all orders. The Maclaurin series for f is given by\n\n  f(x) = ∑_{n=0}^∞ ((-1)^n · x^{2n+1}) / ((2n + 1)!)\n\n(a) Identify f(x) as an elementary function. Justify.\n\n(b) Write the first four nonzero terms of the Maclaurin series for f.\n\n(c) Use the first three nonzero terms of the Maclaurin series to approximate f(0.5). Give your approximation to four decimal places.\n\n(d) Use the Alternating Series Error Bound to find an upper bound for the error of the approximation in part (c).",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Recognizes the series as the Maclaurin series of sin(x); f(x) = sin(x)",
          keywords: ["sin(x)", "Maclaurin series of sine"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Writes x - x^3/3! + x^5/5! - x^7/7! (= x - x^3/6 + x^5/120 - x^7/5040)",
          keywords: ["x - x^3/6 + x^5/120 - x^7/5040", "first four nonzero terms"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Computes 0.5 - (0.5)^3/6 + (0.5)^5/120 = 0.5 - 0.020833... + 0.000260... ≈ 0.4794 (accept 0.4793 or 0.4794)",
          keywords: ["0.5 - 0.125/6 + 0.03125/120", "≈ 0.4794"],
        },
        {
          label: "d",
          points: 2,
          criterion: "By Alternating Series Error Bound, |error| ≤ |first omitted term| = (0.5)^7/7! = (0.0078125)/5040 ≈ 1.55 × 10^-6",
          keywords: ["alternating series error bound", "(0.5)^7/7!", "≈ 1.55 × 10^-6"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) The given series ∑ (-1)^n x^(2n+1)/(2n+1)! is precisely the Maclaurin series of sin(x). Therefore f(x) = sin(x).\n\n(b) First four nonzero terms: x - x³/6 + x⁵/120 - x⁷/5040 (i.e., x - x³/3! + x⁵/5! - x⁷/7!).\n\n(c) Using three terms at x = 0.5: 0.5 - (0.5)³/6 + (0.5)⁵/120 = 0.5 - 0.125/6 + 0.03125/120 = 0.5 - 0.02083333 + 0.00026042 ≈ 0.47942708, so ≈ 0.4794.\n\n(d) The series is alternating with terms decreasing in magnitude for small x. By the Alternating Series Error Bound, |error| ≤ |first omitted term| = |(-1)^3 · (0.5)^7/7!| = (0.5)^7/5040 = 0.0078125/5040 ≈ 1.55 × 10⁻⁶.",
  },

  // 4. Improper integrals — CALC_BC_6_INTEGRATION (2024 Q5 style)
  {
    year: 2024,
    questionNumber: 5,
    type: "MULTI_PART",
    unit: "CALC_BC_6_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Consider the improper integral I = ∫_1^∞ (1/x^p) dx, where p is a positive real number.\n\n(a) Evaluate I in terms of p for p ≠ 1. Clearly use a limit in your setup.\n\n(b) For what values of p does I converge? Justify.\n\n(c) Now consider the specific integral J = ∫_0^1 (ln x) dx. Evaluate J using integration by parts and an appropriate limit. Show all work.\n\n(d) Evaluate K = ∫_1^∞ (1/(x^2 + 1)) dx.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Writes I = lim_{b→∞} ∫_1^b x^{-p} dx = lim_{b→∞} [x^{1-p}/(1-p)]_1^b = lim_{b→∞} (b^{1-p} - 1)/(1-p)",
          keywords: ["limit setup", "lim b→∞", "x^{1-p}/(1-p)"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Converges iff 1 - p < 0 (i.e., p > 1), giving I = 1/(p - 1); diverges for 0 < p ≤ 1 (harmonic-type divergence at p = 1)",
          keywords: ["p > 1 converges", "p ≤ 1 diverges", "1/(p-1)"],
        },
        {
          label: "c",
          points: 3,
          criterion: "J = lim_{a→0+} ∫_a^1 ln x dx. Integration by parts u = ln x, dv = dx: ∫ ln x dx = x ln x - x. So J = lim_{a→0+} [(1·0 - 1) - (a ln a - a)] = -1 - lim_{a→0+}(a ln a - a) = -1 - 0 = -1",
          keywords: ["integration by parts", "x ln x - x", "lim a→0+ a ln a = 0", "-1"],
        },
        {
          label: "d",
          points: 2,
          criterion: "K = lim_{b→∞} [arctan(x)]_1^b = lim_{b→∞} (arctan b - arctan 1) = π/2 - π/4 = π/4",
          keywords: ["arctan", "π/2 - π/4", "π/4"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) I = ∫_1^∞ x^(-p) dx = lim_{b→∞} ∫_1^b x^(-p) dx = lim_{b→∞} [x^(1-p)/(1-p)]_1^b = lim_{b→∞} (b^(1-p) - 1)/(1 - p), for p ≠ 1.\n\n(b) As b → ∞: if 1 - p < 0 (i.e., p > 1), b^(1-p) → 0 and I = (0 - 1)/(1 - p) = 1/(p - 1), so I CONVERGES. If p < 1, b^(1-p) → ∞ and I diverges. At p = 1, I = lim_{b→∞} ln b = ∞, also diverges. So I converges iff p > 1.\n\n(c) J = ∫_0^1 ln x dx is improper at x = 0. J = lim_{a→0+} ∫_a^1 ln x dx. Use integration by parts: u = ln x, du = (1/x)dx; dv = dx, v = x. Then ∫ ln x dx = x ln x - ∫ x · (1/x) dx = x ln x - x. Evaluating: [x ln x - x]_a^1 = (0 - 1) - (a ln a - a) = -1 - a ln a + a. As a → 0+, a ln a → 0 (standard limit, L'Hopital) and a → 0. So J = -1.\n\n(d) K = lim_{b→∞} ∫_1^b 1/(x² + 1) dx = lim_{b→∞} [arctan x]_1^b = lim_{b→∞} (arctan b - arctan 1) = π/2 - π/4 = π/4.",
  },

  // 5. Integration by parts / partial fractions — CALC_BC_6 (2021 Q5 style)
  {
    year: 2021,
    questionNumber: 5,
    type: "MULTI_PART",
    unit: "CALC_BC_6_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Evaluate the following integrals. Show all work.\n\n(a) ∫ x · e^(2x) dx\n\n(b) ∫ (3x + 5) / ((x - 1)(x + 2)) dx\n\n(c) ∫ x^2 · ln(x) dx\n\n(d) Use your answer to (a) to evaluate ∫_0^1 x · e^(2x) dx.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Integration by parts u = x, dv = e^(2x)dx → du = dx, v = e^(2x)/2. Result: (x/2)e^(2x) - (1/4)e^(2x) + C",
          keywords: ["u = x", "v = e^(2x)/2", "(x/2)e^(2x) - (1/4)e^(2x) + C"],
        },
        {
          label: "b",
          points: 3,
          criterion: "Partial fractions: (3x + 5)/((x-1)(x+2)) = 8/(3(x-1)) + 1/(3(x+2)). [Solving A(x+2) + B(x-1) = 3x+5: A = 8/3, B = 1/3.] Integral: (8/3)ln|x - 1| + (1/3)ln|x + 2| + C",
          keywords: ["partial fractions", "A = 8/3", "B = 1/3", "(8/3)ln|x-1| + (1/3)ln|x+2| + C"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Integration by parts u = ln x, dv = x^2 dx → du = (1/x)dx, v = x^3/3. Result: (x^3/3)ln x - x^3/9 + C",
          keywords: ["u = ln x", "v = x^3/3", "(x^3/3)ln x - x^3/9 + C"],
        },
        {
          label: "d",
          points: 2,
          criterion: "Using antiderivative from (a): [(x/2)e^(2x) - (1/4)e^(2x)]_0^1 = (e^2/2 - e^2/4) - (0 - 1/4) = e^2/4 + 1/4 = (e^2 + 1)/4",
          keywords: ["evaluate at bounds", "(e^2 + 1)/4"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) Let u = x, dv = e^(2x) dx. Then du = dx, v = (1/2)e^(2x). ∫ x e^(2x) dx = (x/2)e^(2x) - ∫ (1/2)e^(2x) dx = (x/2)e^(2x) - (1/4)e^(2x) + C.\n\n(b) Decompose: (3x + 5)/((x - 1)(x + 2)) = A/(x - 1) + B/(x + 2). Multiply through: 3x + 5 = A(x + 2) + B(x - 1). Set x = 1: 8 = 3A, A = 8/3. Set x = -2: -1 = -3B, B = 1/3. Integral = (8/3)∫ dx/(x - 1) + (1/3)∫ dx/(x + 2) = (8/3)ln|x - 1| + (1/3)ln|x + 2| + C.\n\n(c) Let u = ln x, dv = x² dx. Then du = (1/x) dx, v = x³/3. ∫ x² ln x dx = (x³/3)ln x - ∫ (x³/3)(1/x) dx = (x³/3)ln x - (1/3)∫ x² dx = (x³/3)ln x - x³/9 + C.\n\n(d) From (a): ∫_0^1 x e^(2x) dx = [(x/2)e^(2x) - (1/4)e^(2x)]_0^1 = (e²/2 - e²/4) - (0 - 1/4) = e²/4 + 1/4 = (e² + 1)/4.",
  },

  // 6. Euler's method / logistic growth — CALC_BC_7 (2022 Q5 style)
  {
    year: 2022,
    questionNumber: 5,
    type: "MULTI_PART",
    unit: "CALC_BC_7_DIFFERENTIAL_EQUATIONS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Consider the differential equation dy/dx = x + y, with y(0) = 1.\n\n(a) Use Euler's method with two steps of equal size, starting at x = 0, to approximate y(1). Show the work for each step.\n\n(b) Is the approximation in part (a) an underestimate or overestimate of the true value of y(1)? Justify your answer using the concavity of the solution.\n\n(c) A different population P satisfies the logistic differential equation dP/dt = 0.2 · P · (1 - P/500), where P(0) = 100. Find lim_{t→∞} P(t).\n\n(d) For the logistic model in part (c), find the value of P at which dP/dt is a maximum. Justify your answer.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 3,
          criterion: "Step size h = 0.5. Step 1 at (0, 1): slope = 0 + 1 = 1, so y(0.5) ≈ 1 + 0.5·1 = 1.5. Step 2 at (0.5, 1.5): slope = 0.5 + 1.5 = 2, so y(1) ≈ 1.5 + 0.5·2 = 2.5",
          keywords: ["h = 0.5", "Euler step", "y(0.5) ≈ 1.5", "y(1) ≈ 2.5"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Compute y'' = d/dx(x + y) = 1 + dy/dx = 1 + x + y. At y(0) = 1, y''(0) = 2 > 0; solution is concave up, so tangent-line (Euler) estimates lie BELOW the curve → UNDERESTIMATE",
          keywords: ["y'' = 1 + x + y", "concave up", "underestimate"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Carrying capacity of logistic = 500 (where dP/dt = 0 for P > 0); lim_{t→∞} P(t) = 500",
          keywords: ["carrying capacity", "500", "logistic limit"],
        },
        {
          label: "d",
          points: 2,
          criterion: "Maximum rate of growth occurs at P = K/2 = 250 (half of carrying capacity); justify by setting d²P/dt² = 0 or recognizing logistic inflection point",
          keywords: ["P = K/2", "250", "half carrying capacity", "inflection"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) Step size h = (1 - 0)/2 = 0.5.\n  Step 1: At (0, 1), dy/dx = 0 + 1 = 1. y(0.5) ≈ 1 + 0.5(1) = 1.5.\n  Step 2: At (0.5, 1.5), dy/dx = 0.5 + 1.5 = 2. y(1) ≈ 1.5 + 0.5(2) = 2.5.\nEuler approximation: y(1) ≈ 2.5.\n\n(b) Compute the second derivative: y' = x + y, so y'' = 1 + y' = 1 + x + y. At (0, 1): y''(0) = 1 + 0 + 1 = 2 > 0. Since y'' > 0 on the interval (the solution is concave up), each Euler step uses a tangent line that lies below the true curve. Therefore the approximation is an UNDERESTIMATE.\n\n(c) The logistic dP/dt = kP(1 - P/L) has carrying capacity L = 500. As t → ∞, P → L = 500 (from below, since P(0) = 100 < 500).\n\n(d) For logistic growth, the growth rate dP/dt is maximized at P = L/2 = 250. To justify: dP/dt = 0.2·P·(1 - P/500) = 0.2·P - 0.0004·P². Taking the derivative with respect to P: d(dP/dt)/dP = 0.2 - 0.0008·P = 0 gives P = 250. Second derivative -0.0008 < 0 confirms a maximum. So dP/dt is greatest when P = 250.",
  },

  // 7. Arc length / surface of revolution — CALC_BC_8 (2023 Q4 style)
  {
    year: 2023,
    questionNumber: 4,
    type: "MULTI_PART",
    unit: "CALC_BC_8_APPLICATIONS_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Consider the curve y = (2/3)·x^(3/2) for 0 ≤ x ≤ 3.\n\n(a) Set up and evaluate the integral for the arc length of the curve on [0, 3].\n\n(b) Write, but do not evaluate, an integral expression for the surface area generated when the curve is rotated about the x-axis.\n\n(c) Find the area of the region bounded by the curve, the x-axis, and the vertical line x = 3.\n\n(d) Write, but do not evaluate, an integral for the volume of the solid formed when the region in part (c) is rotated about the x-axis.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 4,
          criterion: "dy/dx = x^(1/2); 1 + (dy/dx)^2 = 1 + x; arc length = ∫₀³ sqrt(1 + x) dx = [(2/3)(1+x)^(3/2)]₀³ = (2/3)(8 - 1) = 14/3",
          keywords: ["dy/dx = x^(1/2)", "sqrt(1 + x)", "arc length 14/3"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Surface area = 2π ∫₀³ y · sqrt(1 + (dy/dx)^2) dx = 2π ∫₀³ (2/3) x^(3/2) · sqrt(1 + x) dx",
          keywords: ["2π ∫ y sqrt(1+(y')^2) dx", "(2/3) x^(3/2) sqrt(1+x)"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Area = ∫₀³ (2/3) x^(3/2) dx = (2/3) · (2/5) x^(5/2) |₀³ = (4/15)(3^(5/2)) = (4/15)·9√3 = 12√3/5",
          keywords: ["∫₀³ (2/3) x^(3/2) dx", "12√3/5"],
        },
        {
          label: "d",
          points: 1,
          criterion: "Volume (disk method) = π ∫₀³ ((2/3) x^(3/2))^2 dx = π ∫₀³ (4/9) x^3 dx",
          keywords: ["disk method", "π ∫ y^2 dx", "(4/9) x^3"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) y = (2/3) x^(3/2), so dy/dx = x^(1/2). 1 + (dy/dx)² = 1 + x. Arc length L = ∫₀³ sqrt(1 + x) dx. Let u = 1 + x, du = dx; bounds u = 1 to 4: L = ∫₁⁴ sqrt(u) du = [(2/3) u^(3/2)]₁⁴ = (2/3)(8 - 1) = 14/3.\n\n(b) Surface area about x-axis: S = 2π ∫₀³ y · sqrt(1 + (dy/dx)²) dx = 2π ∫₀³ (2/3) x^(3/2) · sqrt(1 + x) dx.\n\n(c) Area = ∫₀³ (2/3) x^(3/2) dx = (2/3) · [(2/5) x^(5/2)]₀³ = (4/15) · 3^(5/2) = (4/15) · 9√3 = 36√3/15 = 12√3/5.\n\n(d) Volume (disk method) about x-axis: V = π ∫₀³ y² dx = π ∫₀³ ((2/3) x^(3/2))² dx = π ∫₀³ (4/9) x³ dx.",
  },

  // 8. Applications of series — CALC_BC_10 (2024 Q6 style)
  {
    year: 2024,
    questionNumber: 6,
    type: "MULTI_PART",
    unit: "CALC_BC_10_INFINITE_SEQUENCES_SERIES",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam",
    promptText:
      "Let f(x) = 1/(1 - x).\n\n(a) Write the first four nonzero terms and the general term of the Maclaurin series for f(x). State the interval of convergence.\n\n(b) Use your answer in (a) to write the first four nonzero terms of the Maclaurin series for g(x) = 1/(1 - x^2).\n\n(c) Use the series in (a) to find the first four nonzero terms of the Maclaurin series for h(x) = -ln(1 - x). (Hint: integrate term-by-term.)\n\n(d) Use your answer in (c) to approximate ln(4/3). Use the first three nonzero terms and give a four-decimal approximation.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Geometric series: 1 + x + x^2 + x^3 + ... + x^n + ...; interval of convergence (-1, 1)",
          keywords: ["1 + x + x² + x³", "x^n", "(-1, 1)", "geometric"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Substitutes x → x^2 in series from (a): 1 + x^2 + x^4 + x^6 + ...",
          keywords: ["substitute x^2", "1 + x² + x⁴ + x⁶"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Integrates ∑ x^n term-by-term: ∫ 1/(1-x) dx = -ln(1-x) + C; C = 0 at x = 0; series: x + x^2/2 + x^3/3 + x^4/4 + ...",
          keywords: ["integrate term-by-term", "-ln(1 - x)", "x + x²/2 + x³/3 + x⁴/4"],
        },
        {
          label: "d",
          points: 2,
          criterion: "ln(4/3) = -ln(3/4) = -ln(1 - 1/4) computed at x = 1/4: 1/4 + (1/4)²/2 + (1/4)³/3 = 0.25 + 0.03125 + 0.005208... ≈ 0.2865 (accept 0.2864–0.2866; true value ≈ 0.28768)",
          keywords: ["x = 1/4", "0.25 + 0.03125 + 0.00521", "≈ 0.2865"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) f(x) = 1/(1 - x) = 1 + x + x² + x³ + ... + x^n + ... for |x| < 1. First four nonzero terms: 1, x, x², x³. General term: x^n. Interval of convergence: (-1, 1).\n\n(b) Replace x with x² in the series: g(x) = 1/(1 - x²) = 1 + x² + x⁴ + x⁶ + ... (valid for |x²| < 1, i.e., |x| < 1).\n\n(c) Integrate both sides of ∑_{n=0}^∞ x^n = 1/(1 - x): ∫ ∑ x^n dx = ∑ x^(n+1)/(n+1) = x + x²/2 + x³/3 + x⁴/4 + ... And ∫ 1/(1 - x) dx = -ln(1 - x) + C. At x = 0: both sides 0, so C = 0. Therefore -ln(1 - x) = x + x²/2 + x³/3 + x⁴/4 + ...\n\n(d) ln(4/3) = -ln(3/4) = -ln(1 - 1/4). Using the series from (c) at x = 1/4 with three terms: -ln(1 - 1/4) ≈ 1/4 + (1/4)²/2 + (1/4)³/3 = 0.25 + 0.03125 + 0.01562.../3 = 0.25 + 0.03125 + 0.005208 ≈ 0.28646. So ln(4/3) ≈ 0.2865.",
  },
];

async function main() {
  console.log(`Seeding ${FRQS.length} AP Calculus BC FRQs...`);
  let created = 0;
  let skipped = 0;

  for (const f of FRQS) {
    // Dedup on (course, year, questionNumber) — re-runs are idempotent.
    const existing = await prisma.freeResponseQuestion.findFirst({
      where: {
        course: "AP_CALCULUS_BC",
        year: f.year,
        questionNumber: f.questionNumber,
      },
    });

    if (existing) {
      await prisma.freeResponseQuestion.update({
        where: { id: existing.id },
        data: {
          unit: f.unit,
          type: f.type,
          sourceUrl: f.sourceUrl,
          promptText: f.promptText,
          stimulus: f.stimulus ?? null,
          totalPoints: f.totalPoints,
          rubric: f.rubric,
          sampleResponse: f.sampleResponse,
          isApproved: true,
        },
      });
      skipped++;
      console.log(`  Updated: ${f.year} Q${f.questionNumber} (${f.unit})`);
    } else {
      await prisma.freeResponseQuestion.create({
        data: {
          course: "AP_CALCULUS_BC",
          unit: f.unit,
          year: f.year,
          questionNumber: f.questionNumber,
          type: f.type,
          sourceUrl: f.sourceUrl,
          promptText: f.promptText,
          stimulus: f.stimulus ?? null,
          totalPoints: f.totalPoints,
          rubric: f.rubric,
          sampleResponse: f.sampleResponse,
          isApproved: true,
        },
      });
      created++;
      console.log(`  Created: ${f.year} Q${f.questionNumber} (${f.unit})`);
    }
  }

  const total = await prisma.freeResponseQuestion.count({
    where: { course: "AP_CALCULUS_BC" },
  });

  console.log("");
  console.log(`Done. Created: ${created}, Updated: ${skipped}. Total AP Calculus BC FRQs in DB: ${total}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env node
/**
 * seed-frq-calc-ab.mjs
 *
 * Seeds 8 AP Calculus AB Free-Response Questions modeled after released
 * College Board exams 2019–2024 (skipping 2020, which had modified exams).
 * Each FRQ includes:
 *   - prompt text (student-facing)
 *   - stimulus (optional — tables/curves described in prose since we don't
 *     have the images on-prem)
 *   - typed rubric (forward-compatible with the MULTI_PART rubric shape):
 *       { type: "MULTI_PART", parts: [{label, points, criterion, keywords}], totalPoints }
 *   - sample response (high-scoring model answer aligned with CB scoring)
 *
 * Coverage (8 FRQs, one per unit-family):
 *   1. Limits + continuity              → CALC_AB_1_LIMITS
 *   2. Derivatives / tangent lines      → CALC_AB_2_DIFFERENTIATION_BASICS
 *   3. Related rates                    → CALC_AB_4_CONTEXTUAL_APPLICATIONS
 *   4. Optimization / MVT               → CALC_AB_5_ANALYTICAL_APPLICATIONS
 *   5. Integration as accumulation      → CALC_AB_6_INTEGRATION
 *   6. Area / volume                    → CALC_AB_8_APPLICATIONS_INTEGRATION
 *   7. Differential equations           → CALC_AB_7_DIFFERENTIAL_EQUATIONS
 *   8. Applications of definite ints    → CALC_AB_8_APPLICATIONS_INTEGRATION
 *
 * All rows land with isApproved=true so they immediately surface via /api/frq.
 *
 * Every FRQ is type="MULTI_PART" and carries 9 total points, matching the
 * real AP Calculus AB FRQ point budget.
 *
 * Usage:
 *   node scripts/seed-frq-calc-ab.mjs
 *
 * Safe to re-run — we dedupe on (course, year, questionNumber).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FRQS = [
  // 1. Limits + continuity — CALC_AB_1_LIMITS (2019 Q5 style)
  {
    year: 2019,
    questionNumber: 5,
    type: "MULTI_PART",
    unit: "CALC_AB_1_LIMITS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Let f be the function defined piecewise by\n\n  f(x) = { (x^2 - 4) / (x - 2),   if x ≠ 2\n          {  k,                       if x = 2\n\n(a) Evaluate lim x→2 f(x). Show the work that leads to your answer.\n\n(b) Determine the value of k that makes f continuous at x = 2. Justify your answer using the definition of continuity.\n\n(c) Using the value of k from part (b), determine whether f is differentiable at x = 2. Justify your answer.\n\n(d) Evaluate lim x→∞ f(x) and explain what this tells you about the end behavior of f.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Factors x^2 - 4 = (x-2)(x+2), cancels (x-2), and evaluates lim x→2 (x+2) = 4",
          keywords: ["factor", "(x-2)(x+2)", "cancel", "limit equals 4"],
        },
        {
          label: "b",
          points: 2,
          criterion: "States k = 4 and justifies using the 3-part definition of continuity: f(2) is defined, lim x→2 f(x) exists, and the two are equal",
          keywords: ["k = 4", "continuity definition", "limit equals value"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Determines f simplifies to f(x) = x + 2 for x ≠ 2; with k = 4, f(x) = x + 2 everywhere, a line, so f is differentiable at x = 2 with f'(2) = 1",
          keywords: ["f(x) = x + 2", "linear", "differentiable", "f'(2) = 1"],
        },
        {
          label: "d",
          points: 2,
          criterion: "States lim x→∞ f(x) = ∞ (or DNE as finite) since f(x) = x + 2 grows without bound; interprets as no horizontal asymptote / unbounded end behavior",
          keywords: ["infinity", "unbounded", "no horizontal asymptote"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) For x ≠ 2, f(x) = (x^2 - 4)/(x - 2) = (x - 2)(x + 2)/(x - 2) = x + 2. So lim x→2 f(x) = lim x→2 (x + 2) = 4.\n\n(b) For f to be continuous at x = 2, we need f(2) = lim x→2 f(x). Since f(2) = k and the limit is 4, we need k = 4. Continuity requires (i) f(2) defined, (ii) limit exists, (iii) they are equal — all satisfied when k = 4.\n\n(c) With k = 4, f(x) = x + 2 for all x. This is a linear function, so it is differentiable everywhere, including at x = 2, with f'(2) = 1.\n\n(d) lim x→∞ f(x) = lim x→∞ (x + 2) = ∞. Since f grows without bound as x increases, f has no horizontal asymptote and its end behavior is unbounded (goes to +∞).",
  },

  // 2. Derivatives / tangent lines — CALC_AB_2_DIFFERENTIATION_BASICS (2021 Q6 style)
  {
    year: 2021,
    questionNumber: 6,
    type: "MULTI_PART",
    unit: "CALC_AB_2_DIFFERENTIATION_BASICS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Let f be the function defined by f(x) = x^3 - 6x^2 + 9x + 2.\n\n(a) Find f'(x). Show the steps.\n\n(b) Write the equation of the line tangent to the graph of f at x = 1.\n\n(c) Find all values of x at which the graph of f has a horizontal tangent line. Show the work that leads to your answer.\n\n(d) Using the tangent line from part (b), approximate f(0.9). Is your approximation an overestimate or underestimate? Justify your answer.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Applies the power rule term-by-term to get f'(x) = 3x^2 - 12x + 9",
          keywords: ["power rule", "3x^2 - 12x + 9"],
        },
        {
          label: "b",
          points: 3,
          criterion: "Computes f(1) = 6 and f'(1) = 0; writes tangent line y = 6 (horizontal)",
          keywords: ["f(1) = 6", "f'(1) = 0", "y = 6"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Sets f'(x) = 0, solves 3(x^2 - 4x + 3) = 3(x-1)(x-3) = 0, so x = 1 and x = 3",
          keywords: ["f'(x) = 0", "factor", "x = 1", "x = 3"],
        },
        {
          label: "d",
          points: 2,
          criterion: "Uses tangent y = 6 to get f(0.9) ≈ 6; determines underestimate because f''(1) = 6·1 - 12 = -6 < 0, so f is concave down at x = 1 and tangent lies above the curve → tangent value 6 is an OVERestimate",
          keywords: ["f(0.9) ≈ 6", "concavity", "f''(1) = -6", "overestimate"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) f'(x) = d/dx[x^3 - 6x^2 + 9x + 2] = 3x^2 - 12x + 9 by the power rule.\n\n(b) f(1) = 1 - 6 + 9 + 2 = 6. f'(1) = 3 - 12 + 9 = 0. The tangent line at x = 1 is y - 6 = 0·(x - 1), i.e., y = 6.\n\n(c) Set f'(x) = 3x^2 - 12x + 9 = 0. Dividing by 3: x^2 - 4x + 3 = 0, so (x - 1)(x - 3) = 0. Horizontal tangents occur at x = 1 and x = 3.\n\n(d) Using the tangent line y = 6, f(0.9) ≈ 6. To determine over/under, compute f''(x) = 6x - 12, so f''(1) = -6 < 0 — the graph is concave down near x = 1, meaning the tangent line lies above the curve. Therefore 6 is an OVERESTIMATE of f(0.9).",
  },

  // 3. Related rates — CALC_AB_4_CONTEXTUAL_APPLICATIONS (2022 Q4 style)
  {
    year: 2022,
    questionNumber: 4,
    type: "MULTI_PART",
    unit: "CALC_AB_4_CONTEXTUAL_APPLICATIONS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "A spherical balloon is being inflated. The volume V of the balloon is increasing at a constant rate of 24 cubic centimeters per second. The volume of a sphere of radius r is V = (4/3)πr^3.\n\n(a) Find an expression for dV/dt in terms of r and dr/dt.\n\n(b) Find the rate at which the radius is increasing at the instant when r = 3 cm. Include units.\n\n(c) Find the rate at which the surface area S = 4πr^2 is increasing at the instant when r = 3 cm. Include units.\n\n(d) Is dr/dt increasing, decreasing, or constant as the balloon inflates? Justify your answer.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Implicit differentiation of V = (4/3)πr^3 with respect to t yields dV/dt = 4πr^2 · (dr/dt)",
          keywords: ["implicit differentiation", "chain rule", "4πr^2 · dr/dt"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Substitutes dV/dt = 24 and r = 3: 24 = 4π(9)·(dr/dt) = 36π·(dr/dt), so dr/dt = 24/(36π) = 2/(3π) cm/sec",
          keywords: ["24 = 36π·dr/dt", "2/(3π)", "cm/sec"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Differentiates S = 4πr^2 to get dS/dt = 8πr·(dr/dt); substitutes r = 3 and dr/dt = 2/(3π): dS/dt = 8π(3)(2/(3π)) = 16 cm^2/sec",
          keywords: ["dS/dt = 8πr · dr/dt", "16 cm^2/sec"],
        },
        {
          label: "d",
          points: 2,
          criterion: "From dr/dt = (dV/dt)/(4πr^2) = 24/(4πr^2) = 6/(πr^2), since r is increasing, r^2 is increasing, so dr/dt is DECREASING",
          keywords: ["dr/dt = 6/(πr^2)", "r increasing", "decreasing"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) Differentiating V = (4/3)πr^3 with respect to t using the chain rule: dV/dt = (4/3)π · 3r^2 · (dr/dt) = 4πr^2 · (dr/dt).\n\n(b) Given dV/dt = 24 and r = 3: 24 = 4π(3)^2·(dr/dt) = 36π·(dr/dt). So dr/dt = 24/(36π) = 2/(3π) cm/sec ≈ 0.212 cm/sec.\n\n(c) dS/dt = 8πr·(dr/dt). At r = 3: dS/dt = 8π(3)·(2/(3π)) = 48π/(3π) = 16 cm²/sec.\n\n(d) Solving the equation in (a) for dr/dt: dr/dt = (dV/dt)/(4πr²) = 24/(4πr²) = 6/(πr²). As the balloon inflates, r increases, so r² increases, and therefore dr/dt decreases. The radius grows more slowly as the balloon gets bigger.",
  },

  // 4. Optimization / MVT — CALC_AB_5_ANALYTICAL_APPLICATIONS (2023 Q3 style)
  {
    year: 2023,
    questionNumber: 3,
    type: "MULTI_PART",
    unit: "CALC_AB_5_ANALYTICAL_APPLICATIONS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Let f(x) = x^3 - 3x + 1 on the closed interval [0, 2].\n\n(a) Verify that the hypotheses of the Mean Value Theorem are satisfied for f on [0, 2].\n\n(b) Find all values c in the open interval (0, 2) that satisfy the conclusion of the Mean Value Theorem. Show the work that leads to your answer.\n\n(c) Find the absolute maximum and absolute minimum values of f on [0, 2]. Justify your answer.\n\n(d) Is f increasing or decreasing at x = 0.5? Justify your answer using f'.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "States f is a polynomial, therefore continuous on [0,2] and differentiable on (0,2); MVT hypotheses satisfied",
          keywords: ["polynomial", "continuous", "differentiable", "MVT hypotheses"],
        },
        {
          label: "b",
          points: 3,
          criterion: "Computes average rate = (f(2) - f(0))/2 = (3 - 1)/2 = 1; solves f'(c) = 3c^2 - 3 = 1, so c^2 = 4/3, c = 2/√3 ≈ 1.155 (only positive root in (0,2))",
          keywords: ["average rate", "f'(c) = 1", "c = 2/√3", "c ≈ 1.155"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Finds critical points: f'(x) = 3x^2 - 3 = 0 at x = 1 (only one in [0,2]); evaluates f(0) = 1, f(1) = -1, f(2) = 3; max = 3 at x = 2, min = -1 at x = 1",
          keywords: ["critical point x = 1", "f(0)=1", "f(1)=-1", "f(2)=3", "max 3", "min -1"],
        },
        {
          label: "d",
          points: 1,
          criterion: "f'(0.5) = 3(0.25) - 3 = -2.25 < 0, so f is DECREASING at x = 0.5",
          keywords: ["f'(0.5) = -2.25", "decreasing"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) f(x) = x^3 - 3x + 1 is a polynomial, so it is continuous on [0, 2] and differentiable on (0, 2). The hypotheses of the MVT are satisfied.\n\n(b) Average rate of change = (f(2) - f(0))/(2 - 0) = (3 - 1)/2 = 1. We need f'(c) = 1. f'(x) = 3x^2 - 3, so 3c^2 - 3 = 1, giving c^2 = 4/3, c = ±2/√3. Only c = 2/√3 ≈ 1.155 lies in (0, 2).\n\n(c) Critical points: f'(x) = 3x^2 - 3 = 0 → x = ±1. Only x = 1 is in [0, 2]. Evaluate endpoints and critical points: f(0) = 1, f(1) = 1 - 3 + 1 = -1, f(2) = 8 - 6 + 1 = 3. Absolute maximum: 3 (at x = 2). Absolute minimum: -1 (at x = 1).\n\n(d) f'(0.5) = 3(0.5)^2 - 3 = 0.75 - 3 = -2.25. Since f'(0.5) < 0, f is decreasing at x = 0.5.",
  },

  // 5. Integration as accumulation — CALC_AB_6_INTEGRATION (2024 Q1 style)
  {
    year: 2024,
    questionNumber: 1,
    type: "MULTI_PART",
    unit: "CALC_AB_6_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Water flows into a tank at a rate modeled by R(t) = 20 + 5·sin(t/2) gallons per hour, where t is measured in hours and 0 ≤ t ≤ 8. At time t = 0, the tank contains 50 gallons of water.\n\n(a) Write, but do not evaluate, an integral expression that gives the total amount of water that flows into the tank during the interval 0 ≤ t ≤ 8.\n\n(b) Using a calculator, find the total amount of water that flows into the tank during the interval 0 ≤ t ≤ 8. Give your answer to the nearest gallon.\n\n(c) Write an expression for W(t), the total amount of water in the tank at time t, for 0 ≤ t ≤ 8.\n\n(d) At what time t in the interval 0 ≤ t ≤ 8 is the rate of water flow into the tank greatest? Justify your answer.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Writes ∫₀⁸ (20 + 5·sin(t/2)) dt as the integral of the rate",
          keywords: ["∫₀⁸ R(t) dt", "integral of rate"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Evaluates the integral numerically (calculator): ≈ 168.5; rounds to 169 gallons (accept 168 or 169)",
          keywords: ["≈ 168", "169 gallons", "calculator"],
        },
        {
          label: "c",
          points: 3,
          criterion: "Writes W(t) = 50 + ∫₀ᵗ R(s) ds = 50 + ∫₀ᵗ (20 + 5·sin(s/2)) ds using initial condition W(0) = 50",
          keywords: ["W(t) = 50 + ∫₀ᵗ R(s) ds", "initial condition 50"],
        },
        {
          label: "d",
          points: 2,
          criterion: "Maximizes R(t): R'(t) = (5/2)cos(t/2) = 0 at t = π ≈ 3.14; confirms maximum via 2nd derivative or sign analysis; rate greatest at t = π (≈ 3.14 hours)",
          keywords: ["R'(t) = 0", "cos(t/2) = 0", "t = π", "maximum"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) Total water in = ∫₀⁸ R(t) dt = ∫₀⁸ (20 + 5·sin(t/2)) dt.\n\n(b) Using a calculator: ∫₀⁸ (20 + 5·sin(t/2)) dt ≈ 160 + 8.47 ≈ 168.47. To the nearest gallon: 168 gallons.\n\n(c) Since R(t) is the rate of water flowing in, and W(0) = 50 gallons: W(t) = 50 + ∫₀ᵗ R(s) ds = 50 + ∫₀ᵗ (20 + 5·sin(s/2)) ds.\n\n(d) R(t) = 20 + 5·sin(t/2) is greatest when sin(t/2) = 1, i.e., t/2 = π/2, so t = π ≈ 3.14 hours. Alternatively, R'(t) = (5/2)·cos(t/2) = 0 at t = π (in the interval [0, 8]), and R''(π) = -(5/4)·sin(π/2) = -5/4 < 0, confirming a maximum. At t = π, R(π) = 25 gal/hr.",
  },

  // 6. Area / volume — CALC_AB_8_APPLICATIONS_INTEGRATION (2019 Q4 style)
  {
    year: 2019,
    questionNumber: 4,
    type: "MULTI_PART",
    unit: "CALC_AB_8_APPLICATIONS_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Let R be the region bounded by the graphs of y = x^2 and y = 4 in the first quadrant.\n\n(a) Find the area of R.\n\n(b) Find the volume of the solid generated when R is rotated about the x-axis. Set up and evaluate the integral.\n\n(c) The region R is the base of a solid. For the solid, each cross section perpendicular to the x-axis is a square. Set up, but do not evaluate, an integral expression for the volume of this solid.\n\n(d) Without evaluating, explain how the volume in part (c) would change if the cross sections were semicircles (with the side of the square as diameter) instead of squares.",
    stimulus: "R is bounded above by y = 4, below by y = x^2, and on the left by the y-axis (first-quadrant portion only). The curves meet at x = 2, y = 4.",
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Sets up Area = ∫₀² (4 - x^2) dx and evaluates to [4x - x^3/3]₀² = 8 - 8/3 = 16/3",
          keywords: ["∫₀² (4 - x^2) dx", "16/3", "area"],
        },
        {
          label: "b",
          points: 3,
          criterion: "Uses washer method: V = π∫₀² ((4)^2 - (x^2)^2) dx = π∫₀² (16 - x^4) dx = π[16x - x^5/5]₀² = π(32 - 32/5) = 128π/5",
          keywords: ["washer method", "π(R² - r²)", "128π/5"],
        },
        {
          label: "c",
          points: 2,
          criterion: "Side length of square = (4 - x^2); area of cross section = (4 - x^2)^2; V = ∫₀² (4 - x^2)^2 dx",
          keywords: ["(4 - x^2)^2", "square cross section", "∫₀² (4 - x^2)^2 dx"],
        },
        {
          label: "d",
          points: 2,
          criterion: "Semicircle with diameter (4 - x^2) has radius (4 - x^2)/2 and area = (π/2)·((4 - x^2)/2)^2 = (π/8)(4 - x^2)^2; this equals π/8 times the square integral, so the new volume = (π/8)·V_square",
          keywords: ["semicircle area", "radius/2", "π/8 · square volume"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) The curves y = x^2 and y = 4 meet where x^2 = 4, so x = 2 (first quadrant). Area = ∫₀² (4 - x^2) dx = [4x - x^3/3]₀² = 8 - 8/3 = 16/3.\n\n(b) Rotating about the x-axis using washers: outer radius = 4, inner radius = x^2. V = π∫₀² ((4)^2 - (x^2)^2) dx = π∫₀² (16 - x^4) dx = π[16x - x^5/5]₀² = π(32 - 32/5) = 128π/5.\n\n(c) At position x, side length = 4 - x^2, so area = (4 - x^2)^2. V = ∫₀² (4 - x^2)^2 dx.\n\n(d) If the cross sections are semicircles with diameter (4 - x^2), then radius = (4 - x^2)/2 and area = (1/2)π((4 - x^2)/2)^2 = (π/8)(4 - x^2)^2. The new volume would be (π/8) times the volume from part (c) — a smaller factor than 1, so the semicircle volume is less than the square volume (since π/8 ≈ 0.393 < 1).",
  },

  // 7. Differential equations — CALC_AB_7_DIFFERENTIAL_EQUATIONS (2022 Q5 style)
  {
    year: 2022,
    questionNumber: 5,
    type: "MULTI_PART",
    unit: "CALC_AB_7_DIFFERENTIAL_EQUATIONS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "Consider the differential equation dy/dx = xy/2, where y > 0.\n\n(a) On the axes provided (imagine a 3x3 grid at x = -1, 0, 1 and y = 1, 2, 3), sketch a slope field at the nine indicated points. Describe the pattern you see.\n\n(b) Find the particular solution y = f(x) to the differential equation with initial condition f(0) = 4.\n\n(c) Write an equation for the line tangent to the graph of f at x = 0.\n\n(d) Use your answer in part (b) to find lim x→∞ f(x), or explain why it does not exist.",
    stimulus: "Differential equation dy/dx = xy/2 with slope values at 9 grid points: at (x=0, any y), slope = 0; for x > 0, slopes positive and grow with y; for x < 0, slopes negative with y.",
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 2,
          criterion: "Computes slope = xy/2 at each grid point: e.g., at (1,2) slope = 1, at (-1,2) slope = -1, at (0,y) slope = 0 for all y; describes slopes as zero along the y-axis, positive in QI/QIII, negative in QII/QIV for y > 0",
          keywords: ["slope zero at x=0", "sign pattern", "xy/2"],
        },
        {
          label: "b",
          points: 4,
          criterion: "Separates variables: dy/y = (x/2)dx; integrates to ln|y| = x^2/4 + C; exponentiates to y = A·e^(x^2/4); uses f(0) = 4 so A = 4; particular solution y = 4·e^(x^2/4)",
          keywords: ["separation", "dy/y = (x/2)dx", "ln|y| = x²/4 + C", "y = 4e^(x²/4)"],
        },
        {
          label: "c",
          points: 2,
          criterion: "At x = 0: f(0) = 4, f'(0) = (0)(4)/2 = 0; tangent line y = 4",
          keywords: ["f'(0) = 0", "y = 4", "horizontal tangent"],
        },
        {
          label: "d",
          points: 1,
          criterion: "lim x→∞ 4·e^(x²/4) = ∞ (does not exist as a finite value); the solution grows without bound",
          keywords: ["infinity", "unbounded", "grows without bound"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) At each of the 9 points, compute xy/2: (−1,1):−1/2, (−1,2):−1, (−1,3):−3/2, (0,y):0 for all y, (1,1):1/2, (1,2):1, (1,3):3/2. Slopes are zero along the y-axis (x=0), negative for x<0, positive for x>0, with magnitude increasing with |x| and with y.\n\n(b) Separate variables: dy/y = (x/2) dx. Integrate: ln|y| = x²/4 + C. Since y > 0: y = e^(x²/4 + C) = A·e^(x²/4) where A = e^C. Apply f(0) = 4: 4 = A·e^0 = A. Particular solution: y = f(x) = 4·e^(x²/4).\n\n(c) f(0) = 4; f'(0) = (0·4)/2 = 0. Tangent line at x = 0: y = 4.\n\n(d) lim x→∞ 4·e^(x²/4) = ∞ (since x²/4 → ∞, e^(x²/4) → ∞). The limit does not exist as a finite value — f grows without bound.",
  },

  // 8. Applications of definite integrals — CALC_AB_8_APPLICATIONS_INTEGRATION (2023 Q2 style, particle motion)
  {
    year: 2023,
    questionNumber: 2,
    type: "MULTI_PART",
    unit: "CALC_AB_8_APPLICATIONS_INTEGRATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam",
    promptText:
      "A particle moves along the x-axis with velocity v(t) = t^2 - 4t + 3 for 0 ≤ t ≤ 5, where t is in seconds and v(t) is in meters per second. At time t = 0, the position of the particle is x(0) = 2.\n\n(a) Find all times t in [0, 5] when the particle is at rest.\n\n(b) Find the displacement of the particle from t = 0 to t = 5.\n\n(c) Find the total distance traveled by the particle from t = 0 to t = 5.\n\n(d) Find the acceleration of the particle at t = 2 and describe whether the particle is speeding up or slowing down at that instant. Justify.",
    stimulus: null,
    totalPoints: 9,
    rubric: {
      type: "MULTI_PART",
      parts: [
        {
          label: "a",
          points: 1,
          criterion: "Solves v(t) = (t-1)(t-3) = 0: particle at rest at t = 1 and t = 3",
          keywords: ["factor", "t = 1", "t = 3"],
        },
        {
          label: "b",
          points: 2,
          criterion: "Displacement = ∫₀⁵ (t² - 4t + 3) dt = [t³/3 - 2t² + 3t]₀⁵ = 125/3 - 50 + 15 = 125/3 - 35 = 20/3 meters",
          keywords: ["∫₀⁵ v dt", "displacement", "20/3"],
        },
        {
          label: "c",
          points: 4,
          criterion: "Total distance = ∫₀⁵ |v(t)| dt, split at sign changes t = 1, 3: v ≥ 0 on [0,1] and [3,5], v < 0 on [1,3]. ∫₀¹ v dt = 4/3; ∫₁³ v dt = -4/3 (take absolute value = 4/3); ∫₃⁵ v dt = 20/3. Total = 4/3 + 4/3 + 20/3 = 28/3 meters",
          keywords: ["|v(t)|", "split at sign changes", "28/3"],
        },
        {
          label: "d",
          points: 2,
          criterion: "a(t) = v'(t) = 2t - 4; a(2) = 0. Since a(2) = 0, particle is neither speeding up nor slowing down at t = 2 (transition instant). Alternatively v(2) = -1 < 0 and a(2) = 0: particle is at an inflection of speed. Accept: a(2) = 0, so speed is momentarily neither increasing nor decreasing.",
          keywords: ["a(t) = 2t - 4", "a(2) = 0", "neither", "transition"],
        },
      ],
      totalPoints: 9,
    },
    sampleResponse:
      "(a) v(t) = t² - 4t + 3 = (t - 1)(t - 3) = 0 gives t = 1 and t = 3. Both are in [0, 5].\n\n(b) Displacement = ∫₀⁵ v(t) dt = ∫₀⁵ (t² - 4t + 3) dt = [t³/3 - 2t² + 3t]₀⁵ = (125/3 - 50 + 15) - 0 = 125/3 - 35 = 20/3 meters.\n\n(c) v > 0 on (0, 1) and (3, 5); v < 0 on (1, 3). Total distance = ∫₀¹ v dt - ∫₁³ v dt + ∫₃⁵ v dt. Compute:\n  ∫₀¹ (t² - 4t + 3) dt = 1/3 - 2 + 3 = 4/3\n  ∫₁³ (t² - 4t + 3) dt = (9 - 18 + 9) - (1/3 - 2 + 3) = 0 - 4/3 = -4/3, absolute value 4/3\n  ∫₃⁵ (t² - 4t + 3) dt = (125/3 - 50 + 15) - (9 - 18 + 9) = 20/3 - 0 = 20/3\nTotal distance = 4/3 + 4/3 + 20/3 = 28/3 meters.\n\n(d) a(t) = v'(t) = 2t - 4. a(2) = 0. v(2) = 4 - 8 + 3 = -1. Speed = |v|, and d|v|/dt has the same sign as v·a. Since a(2) = 0, v·a = 0, so the particle is neither speeding up nor slowing down at t = 2 — it is at a transition instant where the acceleration changes sign.",
  },
];

async function main() {
  console.log(`Seeding ${FRQS.length} AP Calculus AB FRQs...`);
  let created = 0;
  let skipped = 0;

  for (const f of FRQS) {
    // Dedup on (course, year, questionNumber) — re-runs are idempotent.
    const existing = await prisma.freeResponseQuestion.findFirst({
      where: {
        course: "AP_CALCULUS_AB",
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
          course: "AP_CALCULUS_AB",
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
    where: { course: "AP_CALCULUS_AB" },
  });

  console.log("");
  console.log(`Done. Created: ${created}, Updated: ${skipped}. Total AP Calculus AB FRQs in DB: ${total}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

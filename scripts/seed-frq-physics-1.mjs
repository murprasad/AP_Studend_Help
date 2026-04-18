#!/usr/bin/env node
/**
 * seed-frq-physics-1.mjs
 *
 * Seeds 10 AP Physics 1 Free-Response Questions modeled after released
 * College Board exams 2019–2024. Each FRQ includes:
 *   - prompt text (student-facing)
 *   - stimulus (optional — diagram/data descriptions in prose since we
 *     don't have the images on-prem)
 *   - rubric (array of {step, points, keywords, note})
 *   - sample response (high-scoring model answer per CB scoring guidelines)
 *
 * Coverage:
 *   - Kinematics                  x1
 *   - Forces/Newton's Laws        x2
 *   - Energy                      x1
 *   - Momentum                    x1
 *   - Simple Harmonic Motion      x1
 *   - Torque/Rotation             x1
 *   - Circuits                    x1
 *   - Waves/Sound                 x1
 *   - Circular Motion/Gravitation x1
 *
 * All rows land with isApproved=true so they immediately surface via /api/frq.
 *
 * Usage:
 *   node scripts/seed-frq-physics-1.mjs
 *
 * Safe to re-run — we dedupe on (course, year, questionNumber).
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Rubric format mirrors what CollegeBoard publishes in AP Physics 1 scoring
 * guidelines: each row is one scorable "point" (or point cluster) with a short
 * description, the points awarded, and — helpfully for our self-grade UI —
 * keywords the student can check their answer against.
 */
const FRQS = [
  // 1. Kinematics — PHY1_1_KINEMATICS
  {
    year: 2019,
    questionNumber: 2,
    type: "SHORT",
    unit: "PHY1_1_KINEMATICS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A student drops a ball of mass m from rest at a height h above the ground. Air resistance is negligible.\n\n(a) Derive an expression for the speed of the ball just before it hits the ground in terms of h and fundamental constants.\n\n(b) On a second trial the student drops the ball from twice the original height. By what factor does the ball's speed just before impact change? Justify your answer.\n\n(c) Sketch a graph of the ball's vertical position y (measured upward from the ground) as a function of time t for the first trial, from the moment of release until just before impact.",
    stimulus: null,
    totalPoints: 7,
    rubric: [
      { step: "Uses energy conservation or kinematics to set up relationship between h and final speed", points: 1, keywords: ["mgh", "(1/2)mv^2", "v^2 = 2gh"], note: "Either conservation of energy or v^2 = v0^2 + 2a·Δy is acceptable" },
      { step: "Correctly solves for v = sqrt(2gh) with correct units", points: 2, keywords: ["sqrt(2gh)", "m/s"], note: "Full credit only with correct final expression AND units" },
      { step: "States the new speed is sqrt(2) times the original", points: 1, keywords: ["sqrt(2)", "1.41", "factor of √2"], note: "" },
      { step: "Justification references v ∝ sqrt(h)", points: 1, keywords: ["proportional", "square root", "doubles h"], note: "" },
      { step: "Graph shows parabolic (quadratic) curve opening downward", points: 1, keywords: ["parabola", "concave down", "quadratic"], note: "" },
      { step: "Graph starts at y = h and ends at y = 0 at the correct time t = sqrt(2h/g)", points: 1, keywords: ["starts at h", "ends at 0"], note: "" },
    ],
    sampleResponse:
      "(a) Using conservation of energy between release and impact: mgh = (1/2)mv². Solving for v: v = sqrt(2gh).\n\n(b) From v = sqrt(2gh), if h doubles then v scales by sqrt(2) ≈ 1.41. The speed is sqrt(2) times the original speed.\n\n(c) The graph is a downward-opening parabola starting at y = h at t = 0 and reaching y = 0 at t = sqrt(2h/g). The curve is concave down because the ball is accelerating downward at g throughout the fall.",
  },

  // 2. Forces / Newton's Laws #1 — PHY1_2_FORCES_AND_NEWTONS_LAWS
  {
    year: 2022,
    questionNumber: 1,
    type: "SHORT",
    unit: "PHY1_2_FORCES_AND_NEWTONS_LAWS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A block of mass M rests on a rough horizontal surface. A student pulls the block to the right with a constant horizontal force F. The coefficient of kinetic friction between the block and surface is μk.\n\n(a) Draw a free-body diagram for the block while it is sliding to the right. Label all forces.\n\n(b) Write Newton's second law for the block in the horizontal direction.\n\n(c) Derive an expression for the acceleration of the block in terms of F, M, μk, and g.",
    stimulus: null,
    totalPoints: 6,
    rubric: [
      { step: "Free-body diagram shows exactly four forces: weight (Mg down), normal (N up), applied force (F right), kinetic friction (f right-opposed, i.e., left)", points: 2, keywords: ["weight", "normal", "applied", "friction"], note: "1 pt for correct forces; 1 pt for correct directions. -1 if extra forces added." },
      { step: "Writes ΣFx = Ma with F and friction force opposing", points: 1, keywords: ["F - f = Ma", "ΣFx"], note: "" },
      { step: "Correctly identifies friction force as f = μk·N = μk·Mg", points: 1, keywords: ["μk·Mg", "μk·N"], note: "Must substitute N = Mg explicitly or implicitly" },
      { step: "Derives a = (F - μk·Mg)/M", points: 2, keywords: ["(F - μkMg)/M", "a = F/M - μkg"], note: "Algebraic manipulation to a = F/M - μkg also earns full credit" },
    ],
    sampleResponse:
      "(a) FBD: arrow up labeled N (normal), arrow down labeled Mg (weight), arrow right labeled F (applied force), arrow left labeled f (kinetic friction). Block is a single point/box.\n\n(b) ΣFx = F - f = Ma, where f is the kinetic friction force.\n\n(c) In the vertical direction, N = Mg (no vertical acceleration). Therefore f = μk·N = μk·Mg. Substituting into Newton's second law: F - μk·Mg = Ma. Solving: a = (F - μk·Mg)/M, or equivalently a = F/M - μk·g.",
  },

  // 3. Forces / Newton's Laws #2 — PHY1_2_FORCES_AND_NEWTONS_LAWS
  {
    year: 2021,
    questionNumber: 3,
    type: "LONG",
    unit: "PHY1_2_FORCES_AND_NEWTONS_LAWS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "Two blocks are connected by a light string that passes over a frictionless, massless pulley. Block A (mass mA = 2.0 kg) hangs vertically, and block B (mass mB = 3.0 kg) sits on a frictionless horizontal table. Block A is released from rest.\n\n(a) Draw separate free-body diagrams for block A and block B.\n\n(b) Write Newton's second law equations for each block.\n\n(c) Solve for the acceleration of the system and the tension in the string. Use g = 9.8 m/s².\n\n(d) A student claims that if both masses were doubled, the acceleration would also double. Evaluate whether this claim is correct. Justify your answer quantitatively.",
    stimulus: "System: block B (3.0 kg) on horizontal frictionless table connected over a pulley at the edge of the table to a hanging block A (2.0 kg). String is light and inextensible.",
    totalPoints: 10,
    rubric: [
      { step: "FBD for block A shows tension T up and weight mA·g down", points: 1, keywords: ["T", "mA·g", "tension up", "weight down"], note: "" },
      { step: "FBD for block B shows tension T (horizontal toward pulley), normal N up, weight mB·g down", points: 1, keywords: ["T", "N", "mB·g"], note: "" },
      { step: "Newton's 2nd law for A: mA·g - T = mA·a", points: 1, keywords: ["mA·g - T = mA·a"], note: "Sign convention accepted if consistent" },
      { step: "Newton's 2nd law for B: T = mB·a", points: 1, keywords: ["T = mB·a"], note: "" },
      { step: "Solves a = mA·g/(mA + mB)", points: 1, keywords: ["mA·g/(mA+mB)", "a ="], note: "" },
      { step: "Plugs in values: a = (2.0)(9.8)/5.0 = 3.92 m/s² (accept 3.9 m/s²)", points: 1, keywords: ["3.9 m/s²", "3.92"], note: "" },
      { step: "Solves T = mA·mB·g/(mA+mB); plugs in to get T ≈ 11.8 N (accept 12 N)", points: 1, keywords: ["11.8 N", "12 N"], note: "" },
      { step: "(d) Claims student is WRONG — doubling both masses does not change a", points: 1, keywords: ["incorrect", "wrong", "same", "unchanged"], note: "" },
      { step: "(d) Justifies: a = mA·g/(mA+mB) → doubling both numerator and denominator leaves a unchanged", points: 2, keywords: ["ratio", "cancels", "2mA·g/(2mA+2mB) = mA·g/(mA+mB)"], note: "Must show acceleration is independent of mass scaling" },
    ],
    sampleResponse:
      "(a) Block A (hanging): T up, mA·g down. Block B (on table): T horizontal toward pulley, N up, mB·g down.\n\n(b) For A: mA·g - T = mA·a. For B: T = mB·a (only the horizontal direction matters since N and mB·g cancel).\n\n(c) Adding the two equations: mA·g = (mA + mB)·a, so a = mA·g/(mA + mB) = (2.0)(9.8)/(5.0) = 3.92 m/s². Tension: T = mB·a = (3.0)(3.92) = 11.8 N.\n\n(d) The student is incorrect. If both masses are doubled, a = (2mA)(g)/(2mA + 2mB) = mA·g/(mA + mB), which is the same acceleration. The mass terms cancel, so a is unchanged. Tension would double (T = mB·a and mB doubled), but acceleration would not.",
  },

  // 4. Energy — PHY1_4_ENERGY
  {
    year: 2023,
    questionNumber: 2,
    type: "SHORT",
    unit: "PHY1_4_ENERGY",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A spring with spring constant k = 200 N/m is compressed by a distance x = 0.10 m. A block of mass m = 0.50 kg is placed against the compressed spring on a frictionless horizontal surface. The spring is released, launching the block.\n\n(a) Calculate the speed of the block at the moment it leaves the spring.\n\n(b) The block then slides onto a rough region where the coefficient of kinetic friction is μk = 0.20. Calculate the distance the block travels on the rough surface before coming to rest. Use g = 9.8 m/s².",
    stimulus: null,
    totalPoints: 5,
    rubric: [
      { step: "Uses conservation of energy: (1/2)kx² = (1/2)mv²", points: 1, keywords: ["(1/2)kx²", "spring PE", "kinetic energy"], note: "" },
      { step: "Solves v = x·sqrt(k/m) = (0.10)·sqrt(200/0.50) = 2.0 m/s", points: 2, keywords: ["2.0 m/s", "sqrt(k/m)"], note: "1 pt setup, 1 pt numerical answer with units" },
      { step: "Uses work-energy theorem with friction: (1/2)mv² = μk·m·g·d", points: 1, keywords: ["μk·m·g·d", "work done by friction"], note: "" },
      { step: "Solves d = v²/(2μk·g) = 4/(2·0.20·9.8) ≈ 1.02 m (accept 1.0 m)", points: 1, keywords: ["1.0 m", "1.02 m"], note: "" },
    ],
    sampleResponse:
      "(a) Conservation of energy: elastic PE at compression = KE at launch. (1/2)kx² = (1/2)mv². Solving: v = x·sqrt(k/m) = 0.10·sqrt(200/0.50) = 0.10·20 = 2.0 m/s.\n\n(b) All kinetic energy is dissipated by friction: (1/2)mv² = μk·m·g·d. Mass cancels: d = v²/(2μk·g) = (2.0)²/(2·0.20·9.8) = 4.0/3.92 ≈ 1.02 m.",
  },

  // 5. Momentum — PHY1_5_MOMENTUM
  {
    year: 2022,
    questionNumber: 4,
    type: "SHORT",
    unit: "PHY1_5_MOMENTUM",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A 0.50 kg cart moving to the right at 4.0 m/s collides with a stationary 1.5 kg cart on a frictionless track. The two carts stick together after the collision.\n\n(a) Calculate the velocity of the combined carts immediately after the collision.\n\n(b) Calculate the kinetic energy of the system before and after the collision. Is kinetic energy conserved? Justify your answer.\n\n(c) Identify the type of collision and explain in terms of what is and is not conserved.",
    stimulus: null,
    totalPoints: 6,
    rubric: [
      { step: "Applies conservation of momentum: m1·v1 = (m1+m2)·vf", points: 1, keywords: ["conservation of momentum", "m1v1 = (m1+m2)vf"], note: "" },
      { step: "Solves vf = (0.50)(4.0)/(2.0) = 1.0 m/s to the right", points: 1, keywords: ["1.0 m/s"], note: "Direction must be stated" },
      { step: "Computes KEi = (1/2)(0.50)(4.0)² = 4.0 J", points: 1, keywords: ["4.0 J", "KE initial"], note: "" },
      { step: "Computes KEf = (1/2)(2.0)(1.0)² = 1.0 J", points: 1, keywords: ["1.0 J", "KE final"], note: "" },
      { step: "States KE is NOT conserved (3.0 J lost)", points: 1, keywords: ["not conserved", "lost", "dissipated"], note: "" },
      { step: "Identifies as perfectly inelastic; states momentum conserved but KE not conserved (lost to heat/sound/deformation)", points: 1, keywords: ["perfectly inelastic", "momentum conserved", "kinetic energy not conserved"], note: "" },
    ],
    sampleResponse:
      "(a) Conservation of momentum: (0.50)(4.0) + (1.5)(0) = (2.0)vf. So vf = 2.0/2.0 = 1.0 m/s to the right.\n\n(b) KE before = (1/2)(0.50)(4.0)² = 4.0 J. KE after = (1/2)(2.0)(1.0)² = 1.0 J. Kinetic energy is NOT conserved — 3.0 J was lost (converted to thermal energy, sound, and deformation of the carts).\n\n(c) This is a perfectly inelastic collision. Momentum is conserved (no external horizontal forces), but kinetic energy is not conserved because internal forces during the collision dissipated energy into heat, sound, and deformation.",
  },

  // 6. Simple Harmonic Motion — PHY1_6_SIMPLE_HARMONIC_MOTION
  {
    year: 2024,
    questionNumber: 3,
    type: "LONG",
    unit: "PHY1_6_SIMPLE_HARMONIC_MOTION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A block of mass m is attached to a horizontal spring of spring constant k on a frictionless surface. The block is pulled to the right a distance A from equilibrium and released from rest.\n\n(a) Derive an expression for the period of oscillation in terms of m and k.\n\n(b) Derive an expression for the maximum speed of the block in terms of A, m, and k.\n\n(c) Sketch position x, velocity v, and acceleration a versus time for one full period, starting from the moment of release.\n\n(d) The experiment is repeated with a block of mass 4m but the same spring and amplitude. State how (i) the period and (ii) the maximum speed change. Justify each answer.",
    stimulus: null,
    totalPoints: 10,
    rubric: [
      { step: "States or derives T = 2π·sqrt(m/k)", points: 1, keywords: ["2π·sqrt(m/k)", "period"], note: "" },
      { step: "Uses energy conservation: (1/2)kA² = (1/2)mv_max²", points: 1, keywords: ["(1/2)kA²", "(1/2)mv_max²"], note: "" },
      { step: "Solves v_max = A·sqrt(k/m)", points: 1, keywords: ["A·sqrt(k/m)", "v_max"], note: "" },
      { step: "Graph x(t): cosine starting at +A, period T", points: 1, keywords: ["cosine", "starts at A"], note: "" },
      { step: "Graph v(t): negative sine, max magnitude at x = 0, zero at turning points", points: 1, keywords: ["sine", "zero at turning points"], note: "" },
      { step: "Graph a(t): negative cosine, max at x = ±A, zero at x = 0", points: 1, keywords: ["opposite sign of x", "a = -ω²x"], note: "" },
      { step: "(d)(i) Period increases by factor of 2 (sqrt(4) = 2)", points: 1, keywords: ["doubles", "factor of 2", "sqrt(4)"], note: "" },
      { step: "(d)(i) Justification: T ∝ sqrt(m), so m→4m means T→2T", points: 1, keywords: ["T proportional to sqrt(m)"], note: "" },
      { step: "(d)(ii) Maximum speed decreases by factor of 2 (halves)", points: 1, keywords: ["halves", "factor of 1/2"], note: "" },
      { step: "(d)(ii) Justification: v_max ∝ 1/sqrt(m), so m→4m means v_max → v_max/2", points: 1, keywords: ["v_max proportional to 1/sqrt(m)"], note: "" },
    ],
    sampleResponse:
      "(a) Newton's 2nd law: -kx = m·(d²x/dt²), giving ω = sqrt(k/m) and T = 2π/ω = 2π·sqrt(m/k).\n\n(b) Energy conservation between maximum displacement and equilibrium: (1/2)kA² = (1/2)m·v_max². Solving: v_max = A·sqrt(k/m).\n\n(c) x(t) = A·cos(ωt) — starts at +A, cosine curve. v(t) = -Aω·sin(ωt) — starts at 0, dips negative, returns. a(t) = -Aω²·cos(ωt) — starts at -Aω², opposite shape to x.\n\n(d) If mass becomes 4m:\n   (i) T = 2π·sqrt(4m/k) = 2·(2π·sqrt(m/k)) = 2T_original. Period doubles because T ∝ sqrt(m).\n   (ii) v_max = A·sqrt(k/4m) = (1/2)·A·sqrt(k/m) = v_max_original/2. Maximum speed halves because v_max ∝ 1/sqrt(m).",
  },

  // 7. Torque / Rotation — PHY1_7_TORQUE_AND_ROTATION
  {
    year: 2023,
    questionNumber: 4,
    type: "LONG",
    unit: "PHY1_7_TORQUE_AND_ROTATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A uniform rod of mass M = 2.0 kg and length L = 1.2 m is pivoted at its left end and held horizontally. A small object of mass m = 0.50 kg is placed at the right end of the rod. The rod is released from rest.\n\n(a) Calculate the net torque on the rod-object system about the pivot at the moment of release.\n\n(b) Calculate the moment of inertia of the system about the pivot. (Treat the rod as uniform and the object as a point mass.)\n\n(c) Calculate the angular acceleration of the system at the moment of release.\n\n(d) At the moment of release, calculate the linear acceleration of the free end of the rod.",
    stimulus: "Uniform rod (2.0 kg, 1.2 m) pivoted at one end, held horizontal. A 0.50-kg point mass is attached at the free (far) end. System is released from rest.",
    totalPoints: 7,
    rubric: [
      { step: "Torque from rod's weight: τ_rod = M·g·(L/2) (lever arm to center of mass)", points: 1, keywords: ["Mg(L/2)", "center of mass"], note: "" },
      { step: "Torque from point mass: τ_m = m·g·L", points: 1, keywords: ["mgL"], note: "" },
      { step: "Net torque total: (2.0)(9.8)(0.6) + (0.50)(9.8)(1.2) = 11.76 + 5.88 = 17.64 N·m (accept 17–18 N·m)", points: 1, keywords: ["17.6 N·m", "17.64"], note: "" },
      { step: "Moment of inertia: I = (1/3)ML² + mL² = (1/3)(2.0)(1.44) + (0.50)(1.44) = 0.96 + 0.72 = 1.68 kg·m²", points: 2, keywords: ["(1/3)ML²", "mL²", "1.68"], note: "1 pt for correct formula with both terms, 1 pt for numerical value" },
      { step: "Angular acceleration α = τ/I = 17.64/1.68 ≈ 10.5 rad/s²", points: 1, keywords: ["10.5 rad/s²", "α"], note: "" },
      { step: "Linear acceleration of free end a = αL = (10.5)(1.2) = 12.6 m/s²", points: 1, keywords: ["12.6 m/s²", "a = αL"], note: "" },
    ],
    sampleResponse:
      "(a) The rod's weight acts at its center of mass (L/2 from the pivot): τ_rod = M·g·(L/2) = (2.0)(9.8)(0.6) = 11.76 N·m. The point mass contributes τ_m = m·g·L = (0.50)(9.8)(1.2) = 5.88 N·m. Net torque = 11.76 + 5.88 = 17.64 N·m.\n\n(b) I = I_rod + I_point_mass = (1/3)ML² + mL² = (1/3)(2.0)(1.2)² + (0.50)(1.2)² = 0.96 + 0.72 = 1.68 kg·m².\n\n(c) α = τ_net/I = 17.64/1.68 ≈ 10.5 rad/s².\n\n(d) At the free end (distance L from pivot), the tangential acceleration is a = αL = (10.5)(1.2) = 12.6 m/s².",
  },

  // 8. Circuits — PHY1_9_DC_CIRCUITS
  {
    year: 2024,
    questionNumber: 2,
    type: "SHORT",
    unit: "PHY1_9_DC_CIRCUITS",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A battery with emf ε = 12 V and negligible internal resistance is connected to three identical resistors, each with resistance R = 4.0 Ω. Resistors R1 and R2 are in parallel with each other, and that combination is in series with R3.\n\n(a) Calculate the equivalent resistance of the circuit.\n\n(b) Calculate the current through R3.\n\n(c) Calculate the current through R1.\n\n(d) Calculate the power dissipated by R3.",
    stimulus: "Circuit: 12 V battery → R3 (4.0 Ω) → parallel combo of R1 (4.0 Ω) and R2 (4.0 Ω) → back to battery.",
    totalPoints: 6,
    rubric: [
      { step: "Calculates R1||R2 = 2.0 Ω", points: 1, keywords: ["2.0 Ω", "parallel"], note: "" },
      { step: "Adds R3 in series: R_eq = 4.0 + 2.0 = 6.0 Ω", points: 1, keywords: ["6.0 Ω", "R_eq"], note: "" },
      { step: "Current through R3 (total): I = ε/R_eq = 12/6.0 = 2.0 A", points: 1, keywords: ["2.0 A", "I = V/R"], note: "" },
      { step: "Current through R1 is half of total (identical parallel branches): 1.0 A", points: 2, keywords: ["1.0 A", "splits equally"], note: "1 pt reasoning, 1 pt answer" },
      { step: "Power in R3: P = I²R = (2.0)²(4.0) = 16 W", points: 1, keywords: ["16 W", "I²R"], note: "" },
    ],
    sampleResponse:
      "(a) R1||R2 = (4.0·4.0)/(4.0+4.0) = 2.0 Ω. In series with R3: R_eq = 4.0 + 2.0 = 6.0 Ω.\n\n(b) I_total (which flows through R3) = ε/R_eq = 12/6.0 = 2.0 A.\n\n(c) Because R1 and R2 are identical, the 2.0 A divides equally, so I_1 = 1.0 A.\n\n(d) P_3 = I² · R_3 = (2.0)² · 4.0 = 16 W.",
  },

  // 9. Waves / Sound — PHY1_10_WAVES_AND_SOUND
  {
    year: 2022,
    questionNumber: 5,
    type: "SHORT",
    unit: "PHY1_10_WAVES_AND_SOUND",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A string of length L = 1.0 m is fixed at both ends. The wave speed on the string is v = 200 m/s.\n\n(a) Determine the wavelength of the fundamental (first harmonic) standing wave on the string.\n\n(b) Determine the frequency of the fundamental.\n\n(c) Sketch the standing wave pattern for the second harmonic, labeling nodes and antinodes.\n\n(d) Calculate the frequency of the third harmonic.",
    stimulus: null,
    totalPoints: 5,
    rubric: [
      { step: "Fundamental wavelength λ1 = 2L = 2.0 m", points: 1, keywords: ["2L", "2.0 m"], note: "" },
      { step: "Fundamental frequency f1 = v/λ1 = 200/2.0 = 100 Hz", points: 1, keywords: ["100 Hz"], note: "" },
      { step: "Second harmonic shows one full wavelength: 3 nodes (both ends + middle) and 2 antinodes", points: 1, keywords: ["2 antinodes", "3 nodes", "one wavelength"], note: "" },
      { step: "Labels nodes at x = 0, L/2, L and antinodes at L/4 and 3L/4", points: 1, keywords: ["nodes at ends", "antinodes between"], note: "" },
      { step: "Third harmonic frequency: f3 = 3·f1 = 300 Hz", points: 1, keywords: ["300 Hz", "3·f1"], note: "" },
    ],
    sampleResponse:
      "(a) For a string fixed at both ends, λ1 = 2L = 2.0 m.\n\n(b) f1 = v/λ1 = 200/2.0 = 100 Hz.\n\n(c) Second harmonic shows one full wavelength between the fixed ends: nodes at x = 0, L/2, and L; antinodes at x = L/4 and x = 3L/4. The shape is one full sine curve (one positive lobe and one negative lobe).\n\n(d) Harmonics of a string fixed at both ends: fn = n·f1. So f3 = 3·100 = 300 Hz.",
  },

  // 10. Circular Motion / Gravitation — PHY1_3_CIRCULAR_MOTION_GRAVITATION
  {
    year: 2021,
    questionNumber: 2,
    type: "SHORT",
    unit: "PHY1_3_CIRCULAR_MOTION_GRAVITATION",
    sourceUrl: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam",
    promptText:
      "A car of mass m travels at constant speed v around a flat, horizontal circular track of radius r. The coefficient of static friction between the tires and road is μs.\n\n(a) Draw a free-body diagram for the car as it travels around the curve.\n\n(b) Identify which force provides the centripetal force, and explain why.\n\n(c) Derive an expression for the maximum speed v_max at which the car can travel around the curve without sliding, in terms of μs, r, and g.\n\n(d) Is the normal force equal to, greater than, or less than the car's weight? Justify.",
    stimulus: null,
    totalPoints: 6,
    rubric: [
      { step: "FBD shows weight (mg) down, normal (N) up, and static friction (f_s) pointing toward center of circle (horizontal)", points: 2, keywords: ["weight down", "normal up", "friction toward center"], note: "1 pt for three forces, 1 pt for friction direction toward center" },
      { step: "Identifies static friction as centripetal force; explains it's the only horizontal force acting", points: 1, keywords: ["static friction", "centripetal", "only horizontal"], note: "" },
      { step: "Sets μs·N = mv²/r; uses N = mg so μs·mg = mv²/r", points: 1, keywords: ["μs·mg", "mv²/r", "N = mg"], note: "" },
      { step: "Solves v_max = sqrt(μs·g·r)", points: 1, keywords: ["sqrt(μs·g·r)", "v_max"], note: "" },
      { step: "N = mg (equal to weight); justification: vertical forces balance because there is no vertical acceleration on a flat track", points: 1, keywords: ["equal", "N = mg", "no vertical acceleration"], note: "" },
    ],
    sampleResponse:
      "(a) FBD: arrow up labeled N (normal), arrow down labeled mg (weight), arrow pointing toward center of the circle labeled f_s (static friction). Drawn from the car as a point.\n\n(b) Static friction provides the centripetal force. It is the only force with a horizontal component, and centripetal force must point toward the center of the circle.\n\n(c) At the maximum speed, static friction is at its maximum: f_s = μs·N. The vertical direction gives N = mg. Setting friction equal to centripetal force: μs·mg = mv²/r. Mass cancels: v_max = sqrt(μs·g·r).\n\n(d) N = mg, equal to the car's weight. Justification: the car has no vertical acceleration (the circular path is horizontal), so ΣFy = 0 and N = mg.",
  },
];

async function main() {
  console.log(`Seeding ${FRQS.length} AP Physics 1 FRQs...`);
  let created = 0;
  let skipped = 0;

  for (const f of FRQS) {
    // Dedup on (course, year, questionNumber) — re-runs are idempotent.
    const existing = await prisma.freeResponseQuestion.findFirst({
      where: {
        course: "AP_PHYSICS_1",
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
          course: "AP_PHYSICS_1",
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
    where: { course: "AP_PHYSICS_1" },
  });

  console.log("");
  console.log(`Done. Created: ${created}, Updated: ${skipped}. Total AP Physics 1 FRQs in DB: ${total}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Question bank generator script.
 *
 * Connects to the database and fills every unit up to MIN_PER_UNIT questions
 * using the Groq API (falls back to Pollinations.ai if Groq fails).
 *
 * Usage:
 *   npx tsx prisma/generate-questions.ts
 *
 * Environment variables read from .env automatically.
 */

import { PrismaClient, ApUnit, ApCourse, Difficulty, QuestionType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// ── Load .env manually since we're outside Next.js ────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const prisma = new PrismaClient();

// ── Configuration ─────────────────────────────────────────────────────────────
const MIN_PER_UNIT = parseInt(process.env.GEN_MIN_PER_UNIT ?? "20");
const COURSES_TO_FILL: ApCourse[] = (process.env.GEN_COURSES ?? "AP_WORLD_HISTORY,AP_COMPUTER_SCIENCE_PRINCIPLES,AP_PHYSICS_1")
  .split(",") as ApCourse[];
const DELAY_MS = 700; // rate-limit padding between calls

// ── Course/unit metadata ──────────────────────────────────────────────────────
// Inlined here so the script has no Next.js dependencies
const UNIT_DATA: Record<ApCourse, Array<{
  unit: ApUnit;
  name: string;
  timePeriod?: string;
  keyThemes: string[];
  examNotes: string;
  stimulusGuide: string;
}>> = {
  AP_WORLD_HISTORY: [
    { unit: ApUnit.UNIT_1_GLOBAL_TAPESTRY, name: "Unit 1: The Global Tapestry", timePeriod: "1200–1450 CE",
      keyThemes: ["Song Dynasty China", "Dar al-Islam", "Mongol Empire", "Mali Empire", "Khmer Empire", "Byzantine Empire", "Americas civilizations"],
      examNotes: "Focus on political/economic/social structures of major civilizations. Compare across regions.",
      stimulusGuide: "Primary source excerpt from Ibn Battuta, Marco Polo, or another period traveler/chronicler" },
    { unit: ApUnit.UNIT_2_NETWORKS_OF_EXCHANGE, name: "Unit 2: Networks of Exchange", timePeriod: "1200–1450 CE",
      keyThemes: ["Silk Roads", "Indian Ocean trade", "Trans-Saharan trade", "Mongol impact", "Black Death spread", "cultural diffusion"],
      examNotes: "Emphasize HOW trade networks spread religion, disease, technology. Cause-and-effect framing.",
      stimulusGuide: "Map description or merchant account describing trade routes" },
    { unit: ApUnit.UNIT_3_LAND_BASED_EMPIRES, name: "Unit 3: Land-Based Empires", timePeriod: "1450–1750 CE",
      keyThemes: ["Ottoman Empire", "Safavid Empire", "Mughal Empire", "Ming/Qing China", "gunpowder empires", "religious legitimacy"],
      examNotes: "Compare empire-building methods, use of gunpowder, religious policies. Analyze tax and military systems.",
      stimulusGuide: "Excerpt from imperial decree, court chronicle, or European observer account" },
    { unit: ApUnit.UNIT_4_TRANSOCEANIC_INTERCONNECTIONS, name: "Unit 4: Transoceanic Interconnections", timePeriod: "1450–1750 CE",
      keyThemes: ["Columbian Exchange", "Atlantic slave trade", "European maritime expansion", "coercive labor systems", "silver trade", "joint-stock companies"],
      examNotes: "Assess economic and demographic consequences of European exploration. Analyze continuity vs. change.",
      stimulusGuide: "Map of trade routes, demographic table, or excerpt from colonial document" },
    { unit: ApUnit.UNIT_5_REVOLUTIONS, name: "Unit 5: Revolutions", timePeriod: "1750–1900 CE",
      keyThemes: ["Atlantic Revolutions", "Haitian Revolution", "Latin American independence", "Enlightenment ideas", "nationalism", "social upheaval"],
      examNotes: "Analyze causes/effects of revolutions. Compare revolutionary outcomes across regions.",
      stimulusGuide: "Revolutionary pamphlet excerpt, political cartoon description, or speech" },
    { unit: ApUnit.UNIT_6_INDUSTRIALIZATION, name: "Unit 6: Industrialization and Its Consequences", timePeriod: "1750–1900 CE",
      keyThemes: ["Industrial Revolution origins", "migration", "imperialism", "social Darwinism", "labor systems", "environmental change"],
      examNotes: "Compare industrial development across regions. Assess global consequences: colonialism, urbanization.",
      stimulusGuide: "Factory worker account, imperialist speech, or economic data table" },
    { unit: ApUnit.UNIT_7_GLOBAL_CONFLICT, name: "Unit 7: Global Conflict", timePeriod: "1900–1945 CE",
      keyThemes: ["World War I", "World War II", "Russian Revolution", "Great Depression", "colonial resistance", "nationalism"],
      examNotes: "Analyze how global conflicts disrupted existing orders. Compare nationalist movements.",
      stimulusGuide: "Propaganda poster description, treaty text excerpt, or leader speech" },
    { unit: ApUnit.UNIT_8_COLD_WAR, name: "Unit 8: Cold War and Decolonization", timePeriod: "1945–1980 CE",
      keyThemes: ["Cold War ideologies", "proxy wars", "decolonization in Africa/Asia", "non-aligned movement", "nuclear deterrence", "economic development"],
      examNotes: "Compare superpower strategies. Analyze decolonization patterns and independence movement outcomes.",
      stimulusGuide: "Political speech, treaty text, or post-colonial leader statement" },
    { unit: ApUnit.UNIT_9_GLOBALIZATION, name: "Unit 9: Globalization", timePeriod: "1980–present",
      keyThemes: ["economic interdependence", "multinational corporations", "migration", "digital revolution", "environmental challenges", "cultural exchange"],
      examNotes: "Analyze continuities and changes in globalization. Assess political and social responses.",
      stimulusGuide: "Economic statistic, news excerpt, or global organization statement" },
  ],
  AP_COMPUTER_SCIENCE_PRINCIPLES: [
    { unit: ApUnit.CSP_1_CREATIVE_DEVELOPMENT, name: "Unit 1: Creative Development",
      keyThemes: ["program design process", "abstraction in programs", "debugging strategies", "collaboration", "program documentation", "iterative development"],
      examNotes: "Test understanding of software development practices. Pseudocode and algorithm design are key.",
      stimulusGuide: "Pseudocode snippet or program design diagram" },
    { unit: ApUnit.CSP_2_DATA, name: "Unit 2: Data",
      keyThemes: ["binary representation", "data compression", "analog vs digital", "metadata", "encryption basics", "data analysis"],
      examNotes: "Focus on how data is represented, stored, and analyzed. Lossless vs lossy compression.",
      stimulusGuide: "Binary sequence, data table, or compression scenario" },
    { unit: ApUnit.CSP_3_ALGORITHMS_AND_PROGRAMMING, name: "Unit 3: Algorithms and Programming",
      keyThemes: ["sequencing", "conditionals", "iteration", "lists and arrays", "procedures/functions", "searching and sorting algorithms", "undecidable problems"],
      examNotes: "Trace pseudocode execution. Analyze algorithm efficiency. Identify errors in programs.",
      stimulusGuide: "AP-style pseudocode block (using College Board pseudocode conventions)" },
    { unit: ApUnit.CSP_4_COMPUTER_SYSTEMS_NETWORKS, name: "Unit 4: Computer Systems and Networks",
      keyThemes: ["internet protocols", "TCP/IP", "fault tolerance", "routing", "hardware components", "parallel vs sequential computing"],
      examNotes: "Understand how the internet works at a conceptual level. Packet routing and redundancy.",
      stimulusGuide: "Network diagram description or protocol scenario" },
    { unit: ApUnit.CSP_5_IMPACT_OF_COMPUTING, name: "Unit 5: Impact of Computing",
      keyThemes: ["digital divide", "privacy", "cybersecurity", "intellectual property", "computing innovations", "beneficial and harmful effects"],
      examNotes: "Evaluate social and ethical implications. Analyze tradeoffs of computing innovations.",
      stimulusGuide: "News article excerpt or technology policy scenario" },
  ],
  AP_PHYSICS_1: [
    { unit: ApUnit.PHY1_1_KINEMATICS, name: "Unit 1: Kinematics",
      keyThemes: ["position, velocity, acceleration", "kinematic equations", "free fall", "motion graphs", "projectile motion", "reference frames"],
      examNotes: "Interpret motion graphs. Apply kinematic equations. Analyze 2D projectile motion.",
      stimulusGuide: "Position-time or velocity-time graph description" },
    { unit: ApUnit.PHY1_2_FORCES_AND_NEWTONS_LAWS, name: "Unit 2: Forces and Newton's Laws",
      keyThemes: ["Newton's 3 laws", "free body diagrams", "friction", "normal force", "tension", "net force and acceleration"],
      examNotes: "Draw and interpret free body diagrams. Apply F=ma to multi-body systems.",
      stimulusGuide: "Free body diagram scenario or system of objects" },
    { unit: ApUnit.PHY1_3_CIRCULAR_MOTION_GRAVITATION, name: "Unit 3: Circular Motion and Gravitation",
      keyThemes: ["centripetal acceleration", "centripetal force", "Newton's law of gravitation", "orbital motion", "apparent weight"],
      examNotes: "Apply centripetal force concept. Analyze satellite and planetary orbits.",
      stimulusGuide: "Circular motion diagram or orbital scenario" },
    { unit: ApUnit.PHY1_4_ENERGY, name: "Unit 4: Energy",
      keyThemes: ["work-energy theorem", "kinetic energy", "potential energy", "conservation of energy", "power", "energy graphs"],
      examNotes: "Apply conservation of energy to systems. Interpret energy bar charts.",
      stimulusGuide: "Energy diagram or work-energy scenario" },
    { unit: ApUnit.PHY1_5_MOMENTUM, name: "Unit 5: Momentum",
      keyThemes: ["momentum and impulse", "conservation of momentum", "elastic collisions", "inelastic collisions", "center of mass"],
      examNotes: "Analyze collisions using conservation of momentum. Compare elastic and inelastic outcomes.",
      stimulusGuide: "Collision scenario with initial/final velocities" },
    { unit: ApUnit.PHY1_6_SIMPLE_HARMONIC_MOTION, name: "Unit 6: Simple Harmonic Motion",
      keyThemes: ["period and frequency", "spring-mass systems", "pendulums", "energy in SHM", "restoring force"],
      examNotes: "Calculate period of springs and pendulums. Analyze energy transformations in SHM.",
      stimulusGuide: "Spring-mass or pendulum diagram" },
    { unit: ApUnit.PHY1_7_TORQUE_AND_ROTATION, name: "Unit 7: Torque and Rotational Motion",
      keyThemes: ["torque", "rotational inertia", "angular momentum", "rotational kinematics", "rolling motion"],
      examNotes: "Apply rotational Newton's second law. Analyze rolling without slipping.",
      stimulusGuide: "Rotational system diagram with forces" },
    { unit: ApUnit.PHY1_8_ELECTRIC_CHARGE_AND_FORCE, name: "Unit 8: Electric Charge and Electric Force",
      keyThemes: ["Coulomb's law", "electric charge", "conductors vs insulators", "charge distribution", "electric force"],
      examNotes: "Apply Coulomb's law. Analyze charge distributions on conductors.",
      stimulusGuide: "Charged object arrangement diagram" },
    { unit: ApUnit.PHY1_9_DC_CIRCUITS, name: "Unit 9: DC Circuits",
      keyThemes: ["Ohm's law", "resistance", "series and parallel circuits", "Kirchhoff's laws", "power in circuits", "capacitance"],
      examNotes: "Analyze series/parallel circuits. Apply Kirchhoff's laws to circuit problems.",
      stimulusGuide: "Circuit diagram with resistors or batteries" },
    { unit: ApUnit.PHY1_10_WAVES_AND_SOUND, name: "Unit 10: Mechanical Waves and Sound",
      keyThemes: ["wave properties", "superposition", "standing waves", "sound intensity", "Doppler effect", "resonance"],
      examNotes: "Apply wave equations. Analyze standing waves on strings and in pipes.",
      stimulusGuide: "Wave diagram or sound intensity scenario" },
  ],
  AP_CALCULUS_AB: [
    { unit: ApUnit.CALC_AB_1_LIMITS, name: "Unit 1: Limits and Continuity",
      keyThemes: ["limit laws", "one-sided limits", "continuity", "IVT", "squeeze theorem"],
      examNotes: "Evaluate limits algebraically and graphically. Identify discontinuities.",
      stimulusGuide: "Graph of f(x) with labeled features or piecewise function" },
    { unit: ApUnit.CALC_AB_2_DIFFERENTIATION_BASICS, name: "Unit 2: Differentiation Basics",
      keyThemes: ["power rule", "product rule", "quotient rule", "derivative definition"],
      examNotes: "Apply differentiation rules. Interpret derivative as rate of change.",
      stimulusGuide: "Explicit function f(x) for differentiation" },
    { unit: ApUnit.CALC_AB_3_DIFFERENTIATION_COMPOSITE, name: "Unit 3: Chain Rule and Implicit Differentiation",
      keyThemes: ["chain rule", "implicit differentiation", "inverse trig derivatives"],
      examNotes: "Apply chain rule to composite functions. Differentiate implicitly.",
      stimulusGuide: "Composite function or implicit equation" },
    { unit: ApUnit.CALC_AB_4_CONTEXTUAL_APPLICATIONS, name: "Unit 4: Contextual Applications",
      keyThemes: ["related rates", "L'Hôpital's rule", "linearization", "motion"],
      examNotes: "Set up and solve related rates. Apply L'Hôpital's rule to indeterminate forms.",
      stimulusGuide: "Geometric or physical scenario with changing quantities" },
    { unit: ApUnit.CALC_AB_5_ANALYTICAL_APPLICATIONS, name: "Unit 5: Analytical Applications",
      keyThemes: ["MVT", "optimization", "curve sketching", "concavity", "critical points"],
      examNotes: "Find and classify extrema. Sketch f from f' information.",
      stimulusGuide: "Graph of f'(x) to analyze f(x)" },
    { unit: ApUnit.CALC_AB_6_INTEGRATION, name: "Unit 6: Integration",
      keyThemes: ["Riemann sums", "FTC", "antiderivatives", "u-substitution"],
      examNotes: "Apply FTC. Evaluate definite integrals. Use u-substitution.",
      stimulusGuide: "Table of values for Riemann sum or explicit integral" },
    { unit: ApUnit.CALC_AB_7_DIFFERENTIAL_EQUATIONS, name: "Unit 7: Differential Equations",
      keyThemes: ["slope fields", "separation of variables", "exponential growth"],
      examNotes: "Match slope field to equation. Solve separable ODEs.",
      stimulusGuide: "Slope field description or initial value problem" },
    { unit: ApUnit.CALC_AB_8_APPLICATIONS_INTEGRATION, name: "Unit 8: Applications of Integration",
      keyThemes: ["area between curves", "volume of revolution", "average value"],
      examNotes: "Set up area and volume integrals. Find average value of a function.",
      stimulusGuide: "Graph of two functions with shaded region" },
  ],
  AP_CALCULUS_BC: [
    { unit: ApUnit.CALC_BC_1_LIMITS, name: "Unit 1: Limits and Continuity",
      keyThemes: ["limit laws", "continuity", "IVT"],
      examNotes: "Same as AB Unit 1.", stimulusGuide: "Graph of f(x)" },
    { unit: ApUnit.CALC_BC_2_DIFFERENTIATION_BASICS, name: "Unit 2: Differentiation Basics",
      keyThemes: ["power rule", "product rule", "quotient rule"],
      examNotes: "Same as AB Unit 2.", stimulusGuide: "Explicit function f(x)" },
    { unit: ApUnit.CALC_BC_3_DIFFERENTIATION_COMPOSITE, name: "Unit 3: Chain Rule and Implicit",
      keyThemes: ["chain rule", "implicit differentiation"],
      examNotes: "Same as AB Unit 3.", stimulusGuide: "Composite or implicit equation" },
    { unit: ApUnit.CALC_BC_4_CONTEXTUAL_APPLICATIONS, name: "Unit 4: Contextual Applications",
      keyThemes: ["related rates", "L'Hôpital's rule"],
      examNotes: "Same as AB Unit 4.", stimulusGuide: "Physical scenario" },
    { unit: ApUnit.CALC_BC_5_ANALYTICAL_APPLICATIONS, name: "Unit 5: Analytical Applications",
      keyThemes: ["optimization", "curve sketching", "MVT"],
      examNotes: "Same as AB Unit 5.", stimulusGuide: "Graph of f'(x)" },
    { unit: ApUnit.CALC_BC_6_INTEGRATION, name: "Unit 6: Integration",
      keyThemes: ["FTC", "integration by parts", "partial fractions", "u-substitution"],
      examNotes: "Includes BC techniques: integration by parts, partial fractions, improper integrals.",
      stimulusGuide: "Integral expression requiring technique selection" },
    { unit: ApUnit.CALC_BC_7_DIFFERENTIAL_EQUATIONS, name: "Unit 7: Differential Equations",
      keyThemes: ["Euler's method", "logistic growth", "separation of variables"],
      examNotes: "Includes Euler's method and logistic differential equation.",
      stimulusGuide: "Logistic model scenario or Euler's method table" },
    { unit: ApUnit.CALC_BC_8_APPLICATIONS_INTEGRATION, name: "Unit 8: Applications of Integration",
      keyThemes: ["arc length", "area", "volume"],
      examNotes: "Includes arc length and area/volume with parametric.",
      stimulusGuide: "Graph with shaded region or parametric curve" },
    { unit: ApUnit.CALC_BC_9_PARAMETRIC_POLAR_VECTORS, name: "Unit 9: Parametric, Polar, Vectors",
      keyThemes: ["parametric derivatives", "polar area", "vector functions"],
      examNotes: "BC exclusive: differentiation and integration in parametric and polar forms.",
      stimulusGuide: "Parametric curve equations or polar graph" },
    { unit: ApUnit.CALC_BC_10_INFINITE_SEQUENCES_SERIES, name: "Unit 10: Sequences and Series",
      keyThemes: ["convergence tests", "Taylor series", "Maclaurin series", "radius of convergence"],
      examNotes: "Apply convergence tests. Write Taylor/Maclaurin series. Find interval of convergence.",
      stimulusGuide: "Partial sums table or series expression" },
  ],
  AP_STATISTICS: [
    { unit: ApUnit.STATS_1_EXPLORING_DATA, name: "Unit 1: Exploring One-Variable Data",
      keyThemes: ["distributions", "center/spread", "normal distribution", "z-scores"],
      examNotes: "Describe distributions with shape, center, spread. Apply normal model.",
      stimulusGuide: "Histogram, boxplot, or dotplot with data" },
    { unit: ApUnit.STATS_2_MODELING_DATA, name: "Unit 2: Two-Variable Data",
      keyThemes: ["scatterplots", "correlation", "regression", "residuals"],
      examNotes: "Interpret slope and intercept in context. Analyze residuals.",
      stimulusGuide: "Scatterplot or regression computer output" },
    { unit: ApUnit.STATS_3_COLLECTING_DATA, name: "Unit 3: Collecting Data",
      keyThemes: ["sampling methods", "experiments vs observational", "bias", "randomization"],
      examNotes: "Identify sampling method and potential bias. Distinguish experiments from observational studies.",
      stimulusGuide: "Study description" },
    { unit: ApUnit.STATS_4_PROBABILITY, name: "Unit 4: Probability",
      keyThemes: ["probability rules", "conditional probability", "binomial", "geometric"],
      examNotes: "Apply addition and multiplication rules. Calculate binomial probabilities.",
      stimulusGuide: "Two-way table or probability scenario" },
    { unit: ApUnit.STATS_5_SAMPLING_DISTRIBUTIONS, name: "Unit 5: Sampling Distributions",
      keyThemes: ["CLT", "sampling distribution of x̄", "standard error"],
      examNotes: "Apply CLT. Calculate and interpret standard error.",
      stimulusGuide: "Simulated sampling distribution graph" },
    { unit: ApUnit.STATS_6_INFERENCE_PROPORTIONS, name: "Unit 6: Inference for Proportions",
      keyThemes: ["one-sample z-test", "two-sample z-test", "confidence interval for p"],
      examNotes: "State H₀/Hₐ, check conditions, calculate z, state conclusion in context.",
      stimulusGuide: "Study description with sample proportion data" },
    { unit: ApUnit.STATS_7_INFERENCE_MEANS, name: "Unit 7: Inference for Means",
      keyThemes: ["t-distribution", "one-sample t", "two-sample t", "paired t"],
      examNotes: "Identify correct t procedure. Check conditions. Interpret t-interval in context.",
      stimulusGuide: "Sample data table or summary statistics" },
    { unit: ApUnit.STATS_8_CHI_SQUARE, name: "Unit 8: Chi-Square Tests",
      keyThemes: ["goodness of fit", "independence", "homogeneity", "expected counts"],
      examNotes: "Identify correct chi-square test. Calculate expected counts and chi-square statistic.",
      stimulusGuide: "Two-way table or observed frequency table" },
    { unit: ApUnit.STATS_9_INFERENCE_SLOPES, name: "Unit 9: Inference for Slopes",
      keyThemes: ["t-test for slope", "confidence interval for slope", "regression conditions"],
      examNotes: "Test whether slope differs from zero. Check regression inference conditions.",
      stimulusGuide: "Regression computer output with SE of slope" },
  ],
  AP_CHEMISTRY: [
    { unit: ApUnit.CHEM_1_ATOMIC_STRUCTURE, name: "Unit 1: Atomic Structure",
      keyThemes: ["moles", "electron configuration", "periodic trends", "photoelectron spectroscopy"],
      examNotes: "Calculate molar mass and moles. Predict periodic trends.",
      stimulusGuide: "Periodic table data or photoelectron spectrum" },
    { unit: ApUnit.CHEM_2_MOLECULAR_BONDING, name: "Unit 2: Molecular Bonding",
      keyThemes: ["Lewis structures", "VSEPR", "hybridization", "resonance"],
      examNotes: "Draw Lewis structures with formal charges. Predict molecular geometry.",
      stimulusGuide: "Molecular formula or structural diagram" },
    { unit: ApUnit.CHEM_3_INTERMOLECULAR_FORCES, name: "Unit 3: Intermolecular Forces",
      keyThemes: ["London dispersion", "dipole-dipole", "hydrogen bonding", "solubility"],
      examNotes: "Rank IMF strength. Predict physical properties from IMFs.",
      stimulusGuide: "Molecule structures for comparison" },
    { unit: ApUnit.CHEM_4_CHEMICAL_REACTIONS, name: "Unit 4: Chemical Reactions",
      keyThemes: ["stoichiometry", "limiting reagent", "net ionic equations", "redox"],
      examNotes: "Balance equations. Calculate limiting reagent and theoretical yield.",
      stimulusGuide: "Reaction equation and mass/mole data" },
    { unit: ApUnit.CHEM_5_KINETICS, name: "Unit 5: Kinetics",
      keyThemes: ["rate law", "integrated rate laws", "activation energy", "Arrhenius"],
      examNotes: "Determine rate law from data. Identify reaction order from graphs.",
      stimulusGuide: "Concentration vs time data table" },
    { unit: ApUnit.CHEM_6_THERMODYNAMICS, name: "Unit 6: Thermodynamics",
      keyThemes: ["ΔH", "Hess's law", "ΔS", "ΔG", "spontaneity"],
      examNotes: "Apply Hess's law. Predict spontaneity from ΔG = ΔH − TΔS.",
      stimulusGuide: "Bond enthalpies table or thermochemical equations" },
    { unit: ApUnit.CHEM_7_EQUILIBRIUM, name: "Unit 7: Equilibrium",
      keyThemes: ["K expression", "Q vs K", "Le Chatelier", "ICE tables"],
      examNotes: "Write K expression. Use ICE table. Apply Le Chatelier's principle.",
      stimulusGuide: "Reaction with initial concentrations for ICE table" },
    { unit: ApUnit.CHEM_8_ACIDS_BASES, name: "Unit 8: Acids and Bases",
      keyThemes: ["Ka/Kb", "pH", "buffers", "Henderson-Hasselbalch", "titration"],
      examNotes: "Calculate pH of weak acid/base. Design and analyze buffer. Interpret titration curve.",
      stimulusGuide: "Titration curve or Ka table" },
    { unit: ApUnit.CHEM_9_ELECTROCHEMISTRY, name: "Unit 9: Electrochemistry",
      keyThemes: ["standard reduction potentials", "cell potential", "Nernst equation", "electrolysis"],
      examNotes: "Calculate cell potential from reduction potentials. Apply Nernst equation.",
      stimulusGuide: "Standard reduction potential table or galvanic cell diagram" },
  ],
  AP_BIOLOGY: [
    { unit: ApUnit.BIO_1_CHEMISTRY_OF_LIFE, name: "Unit 1: Chemistry of Life",
      keyThemes: ["water", "macromolecules", "enzymes", "activation energy"],
      examNotes: "Relate macromolecule structure to function. Analyze enzyme activity graphs.",
      stimulusGuide: "Enzyme activity graph or molecule structure diagram" },
    { unit: ApUnit.BIO_2_CELL_STRUCTURE_FUNCTION, name: "Unit 2: Cell Structure and Function",
      keyThemes: ["organelles", "membrane transport", "osmosis", "prokaryotes vs eukaryotes"],
      examNotes: "Predict osmosis direction. Classify transport types. Compare cell types.",
      stimulusGuide: "Cell diagram or osmosis scenario with concentrations" },
    { unit: ApUnit.BIO_3_CELLULAR_ENERGETICS, name: "Unit 3: Cellular Energetics",
      keyThemes: ["photosynthesis", "cellular respiration", "ATP", "electron transport"],
      examNotes: "Trace ATP production pathways. Compare aerobic vs anaerobic.",
      stimulusGuide: "Energy diagram or experimental data on photosynthesis rate" },
    { unit: ApUnit.BIO_4_CELL_COMMUNICATION, name: "Unit 4: Cell Communication and Cell Cycle",
      keyThemes: ["signal transduction", "mitosis", "cell cycle", "apoptosis"],
      examNotes: "Trace signal transduction cascade. Identify mitosis stages.",
      stimulusGuide: "Cell cycle diagram or signaling pathway" },
    { unit: ApUnit.BIO_5_HEREDITY, name: "Unit 5: Heredity",
      keyThemes: ["Mendelian genetics", "meiosis", "non-Mendelian", "chi-square"],
      examNotes: "Solve Mendelian crosses. Apply chi-square to genetic data.",
      stimulusGuide: "Pedigree chart or genetic cross data" },
    { unit: ApUnit.BIO_6_GENE_EXPRESSION, name: "Unit 6: Gene Expression",
      keyThemes: ["transcription", "translation", "mutations", "regulation", "biotechnology"],
      examNotes: "Trace central dogma. Identify mutation effects. Explain gene regulation.",
      stimulusGuide: "DNA/RNA sequence or lac operon diagram" },
    { unit: ApUnit.BIO_7_NATURAL_SELECTION, name: "Unit 7: Natural Selection",
      keyThemes: ["Hardy-Weinberg", "natural selection", "speciation", "phylogenetics"],
      examNotes: "Apply Hardy-Weinberg equations. Identify evolutionary mechanisms.",
      stimulusGuide: "Allele frequency data or phylogenetic tree" },
    { unit: ApUnit.BIO_8_ECOLOGY, name: "Unit 8: Ecology",
      keyThemes: ["population growth", "carrying capacity", "community ecology", "energy flow"],
      examNotes: "Interpret population growth curves. Trace energy through trophic levels.",
      stimulusGuide: "Population growth graph or food web diagram" },
  ],
  AP_US_HISTORY: [
    { unit: ApUnit.APUSH_1_PERIOD_1491_1607, name: "Unit 1: Period 1 — 1491–1607", timePeriod: "1491–1607",
      keyThemes: ["Native American societies", "European exploration", "Columbian Exchange"],
      examNotes: "Analyze contact between Native Americans and Europeans. Effects of Columbian Exchange.",
      stimulusGuide: "Primary source from European explorer or Native American oral tradition" },
    { unit: ApUnit.APUSH_2_PERIOD_1607_1754, name: "Unit 2: Period 2 — 1607–1754", timePeriod: "1607–1754",
      keyThemes: ["colonial economies", "slavery", "Great Awakening", "salutary neglect"],
      examNotes: "Compare colonial economies. Analyze growth of slavery in British colonies.",
      stimulusGuide: "Colonial document, sermon excerpt, or economic data" },
    { unit: ApUnit.APUSH_3_PERIOD_1754_1800, name: "Unit 3: Period 3 — 1754–1800", timePeriod: "1754–1800",
      keyThemes: ["American Revolution", "Constitution", "Federalism", "Early Republic"],
      examNotes: "Analyze causes/outcomes of Revolution. Compare Federalist and Anti-Federalist views.",
      stimulusGuide: "Pamphlet excerpt, Federalist Paper quote, or political cartoon" },
    { unit: ApUnit.APUSH_4_PERIOD_1800_1848, name: "Unit 4: Period 4 — 1800–1848", timePeriod: "1800–1848",
      keyThemes: ["Jacksonian democracy", "Market Revolution", "Manifest Destiny", "reform movements"],
      examNotes: "Analyze Jacksonian democracy's contradictions. Assess sectional tensions.",
      stimulusGuide: "Political speech, abolitionist pamphlet, or census data" },
    { unit: ApUnit.APUSH_5_PERIOD_1844_1877, name: "Unit 5: Period 5 — 1844–1877", timePeriod: "1844–1877",
      keyThemes: ["Civil War causes", "Emancipation", "Reconstruction", "Amendments 13-15"],
      examNotes: "Analyze sectional causes of Civil War. Evaluate successes and failures of Reconstruction.",
      stimulusGuide: "Freedmen's Bureau document, Reconstruction-era political cartoon, or speech" },
    { unit: ApUnit.APUSH_6_PERIOD_1865_1898, name: "Unit 6: Period 6 — 1865–1898", timePeriod: "1865–1898",
      keyThemes: ["Gilded Age", "industrialization", "immigration", "Populism", "Jim Crow"],
      examNotes: "Analyze industrialization's effects. Compare immigrant experiences. Evaluate Populist movement.",
      stimulusGuide: "Political cartoon, immigration statistics, or labor newspaper excerpt" },
    { unit: ApUnit.APUSH_7_PERIOD_1890_1945, name: "Unit 7: Period 7 — 1890–1945", timePeriod: "1890–1945",
      keyThemes: ["Progressive Era", "World War I", "Great Depression", "New Deal", "World War II"],
      examNotes: "Analyze Progressive reforms. Evaluate New Deal effectiveness. Assess US entry into WWI/WWII.",
      stimulusGuide: "Muckraker article excerpt, New Deal program document, or propaganda poster" },
    { unit: ApUnit.APUSH_8_PERIOD_1945_1980, name: "Unit 8: Period 8 — 1945–1980", timePeriod: "1945–1980",
      keyThemes: ["Cold War", "Civil Rights Movement", "Vietnam", "Great Society", "counterculture"],
      examNotes: "Analyze Cold War domestic effects. Evaluate Civil Rights tactics and achievements.",
      stimulusGuide: "Presidential speech, protest document, or political cartoon" },
    { unit: ApUnit.APUSH_9_PERIOD_1980_PRESENT, name: "Unit 9: Period 9 — 1980–Present", timePeriod: "1980–Present",
      keyThemes: ["Reagan Revolution", "end of Cold War", "globalization", "post-9/11"],
      examNotes: "Analyze Reagan's domestic and foreign policy. Evaluate US response to globalization.",
      stimulusGuide: "Political speech, economic data chart, or news excerpt" },
  ],
  AP_PSYCHOLOGY: [
    { unit: ApUnit.PSYCH_1_SCIENTIFIC_FOUNDATIONS, name: "Unit 1: Scientific Foundations",
      keyThemes: ["research methods", "statistics", "history of psychology", "major perspectives"],
      examNotes: "Distinguish correlational from experimental studies. Identify research method limitations.",
      stimulusGuide: "Study description for methodology analysis" },
    { unit: ApUnit.PSYCH_2_BIOLOGICAL_BASES, name: "Unit 2: Biological Bases of Behavior",
      keyThemes: ["neurons", "neurotransmitters", "brain structures", "nervous system"],
      examNotes: "Identify neurotransmitter functions. Locate and describe brain regions.",
      stimulusGuide: "Brain diagram or case study of neurological condition" },
    { unit: ApUnit.PSYCH_3_SENSATION_PERCEPTION, name: "Unit 3: Sensation and Perception",
      keyThemes: ["thresholds", "visual processing", "Gestalt principles", "perceptual constancy"],
      examNotes: "Distinguish sensation from perception. Apply Gestalt principles.",
      stimulusGuide: "Visual illusion description or signal detection scenario" },
    { unit: ApUnit.PSYCH_4_LEARNING, name: "Unit 4: Learning",
      keyThemes: ["classical conditioning", "operant conditioning", "reinforcement schedules", "observational learning"],
      examNotes: "Identify conditioning type. Apply reinforcement schedule to behavior.",
      stimulusGuide: "Behavioral scenario for conditioning analysis" },
    { unit: ApUnit.PSYCH_5_COGNITION, name: "Unit 5: Cognition",
      keyThemes: ["memory types", "encoding/retrieval", "problem solving", "language", "heuristics"],
      examNotes: "Classify memory types. Identify cognitive biases and heuristics.",
      stimulusGuide: "Memory experiment description or problem-solving scenario" },
    { unit: ApUnit.PSYCH_6_DEVELOPMENTAL, name: "Unit 6: Developmental Psychology",
      keyThemes: ["Piaget's stages", "Erikson's stages", "attachment theory", "adolescence"],
      examNotes: "Match development stage to behavior. Apply attachment theory.",
      stimulusGuide: "Child behavior scenario or developmental case study" },
    { unit: ApUnit.PSYCH_7_MOTIVATION_EMOTION, name: "Unit 7: Motivation and Personality",
      keyThemes: ["Maslow's hierarchy", "drive-reduction", "emotion theories", "personality theories"],
      examNotes: "Apply Maslow's hierarchy. Identify emotion theory from scenario.",
      stimulusGuide: "Motivational scenario or personality assessment description" },
    { unit: ApUnit.PSYCH_8_CLINICAL, name: "Unit 8: Clinical Psychology",
      keyThemes: ["psychological disorders", "DSM-5", "therapies", "biomedical treatments"],
      examNotes: "Identify disorder from symptoms. Compare therapy types.",
      stimulusGuide: "Case study with symptoms for diagnosis" },
    { unit: ApUnit.PSYCH_9_SOCIAL, name: "Unit 9: Social Psychology",
      keyThemes: ["attribution", "conformity", "obedience", "prejudice", "groupthink"],
      examNotes: "Apply social psychology concepts to scenarios. Identify attribution errors.",
      stimulusGuide: "Social scenario requiring psychological explanation" },
  ],
  SAT_MATH: [
    { unit: ApUnit.SAT_MATH_1_ALGEBRA, name: "Algebra", keyThemes: ["linear equations", "systems", "inequalities"],
      examNotes: "Focus on solving and interpreting linear equations and systems.",
      stimulusGuide: "Word problem with real-world context" },
    { unit: ApUnit.SAT_MATH_2_ADVANCED_MATH, name: "Advanced Math", keyThemes: ["quadratics", "polynomials", "exponential"],
      examNotes: "Nonlinear equations and functions.",
      stimulusGuide: "Equation or graph description" },
    { unit: ApUnit.SAT_MATH_3_PROBLEM_SOLVING, name: "Problem-Solving and Data Analysis", keyThemes: ["ratios", "percentages", "statistics"],
      examNotes: "Quantitative reasoning with real data.",
      stimulusGuide: "Table or chart with data" },
    { unit: ApUnit.SAT_MATH_4_GEOMETRY_TRIG, name: "Geometry and Trigonometry", keyThemes: ["area", "circles", "trigonometry"],
      examNotes: "Apply geometric formulas and basic trig identities.",
      stimulusGuide: "Diagram description or geometric scenario" },
  ],
  SAT_READING_WRITING: [
    { unit: ApUnit.SAT_RW_1_CRAFT_STRUCTURE, name: "Craft and Structure", keyThemes: ["vocabulary", "text structure", "purpose"],
      examNotes: "Vocabulary in context and author purpose questions.",
      stimulusGuide: "Short passage excerpt (2-4 sentences)" },
    { unit: ApUnit.SAT_RW_2_INFO_IDEAS, name: "Information and Ideas", keyThemes: ["central idea", "evidence", "inferences"],
      examNotes: "Evidence-based reading comprehension.",
      stimulusGuide: "Passage excerpt with data or argumentation" },
    { unit: ApUnit.SAT_RW_3_STANDARD_ENGLISH, name: "Standard English Conventions", keyThemes: ["punctuation", "grammar", "sentence structure"],
      examNotes: "Grammar and mechanics correction questions.",
      stimulusGuide: "Sentence with underlined portion to correct" },
    { unit: ApUnit.SAT_RW_4_EXPRESSION_IDEAS, name: "Expression of Ideas", keyThemes: ["transitions", "organization", "rhetorical synthesis"],
      examNotes: "Logical flow and precise language questions.",
      stimulusGuide: "Paragraph with transition or organization question" },
  ],
  ACT_MATH: [
    { unit: ApUnit.ACT_MATH_1_NUMBER, name: "Number and Quantity", keyThemes: ["arithmetic", "fractions", "exponents"],
      examNotes: "Basic number properties and arithmetic.", stimulusGuide: "Word problem" },
    { unit: ApUnit.ACT_MATH_2_ALGEBRA, name: "Algebra", keyThemes: ["equations", "functions", "polynomials"],
      examNotes: "Algebraic manipulation and function analysis.", stimulusGuide: "Equation or function problem" },
    { unit: ApUnit.ACT_MATH_3_GEOMETRY, name: "Geometry", keyThemes: ["triangles", "circles", "coordinate geometry"],
      examNotes: "Geometric formulas and spatial reasoning.", stimulusGuide: "Diagram description" },
    { unit: ApUnit.ACT_MATH_4_STATISTICS, name: "Statistics and Probability", keyThemes: ["mean", "probability", "data interpretation"],
      examNotes: "Statistical reasoning and data analysis.", stimulusGuide: "Table or chart" },
    { unit: ApUnit.ACT_MATH_5_INTEGRATING_SKILLS, name: "Integrating Essential Skills", keyThemes: ["multi-step problems", "real-world applications"],
      examNotes: "Complex multi-step problems integrating multiple math skills.", stimulusGuide: "Complex word problem" },
  ],
  ACT_ENGLISH: [
    { unit: ApUnit.ACT_ENG_1_PRODUCTION_WRITING, name: "Production of Writing", keyThemes: ["organization", "unity", "development"],
      examNotes: "Rhetorical skills and writing strategy.", stimulusGuide: "Passage paragraph" },
    { unit: ApUnit.ACT_ENG_2_KNOWLEDGE_LANGUAGE, name: "Knowledge of Language", keyThemes: ["word choice", "style", "concision"],
      examNotes: "Style and word choice in context.", stimulusGuide: "Sentence from passage" },
    { unit: ApUnit.ACT_ENG_3_CONVENTIONS, name: "Conventions of Standard English", keyThemes: ["punctuation", "grammar", "sentence structure"],
      examNotes: "Grammar and mechanics correction.", stimulusGuide: "Underlined sentence portion" },
  ],
  ACT_SCIENCE: [
    { unit: ApUnit.ACT_SCI_1_DATA_REPRESENTATION, name: "Data Representation", keyThemes: ["graphs", "tables", "figures"],
      examNotes: "Reading and interpreting scientific data displays.", stimulusGuide: "Graph or table description with data values" },
    { unit: ApUnit.ACT_SCI_2_RESEARCH_SUMMARIES, name: "Research Summaries", keyThemes: ["experimental design", "hypotheses", "conclusions"],
      examNotes: "Understanding experimental methods and results.", stimulusGuide: "Brief experiment description with results" },
    { unit: ApUnit.ACT_SCI_3_CONFLICTING_VIEWPOINTS, name: "Conflicting Viewpoints", keyThemes: ["competing theories", "evidence evaluation"],
      examNotes: "Comparing two or more scientific positions.", stimulusGuide: "Two brief scientist viewpoints on a phenomenon" },
  ],
  ACT_READING: [
    { unit: ApUnit.ACT_READ_1_LITERARY, name: "Literary Narrative", keyThemes: ["character motivation", "tone", "figurative language", "point of view"],
      examNotes: "Passage-based: fiction or personal narrative. All answers in the passage.", stimulusGuide: "5-8 sentence prose fiction or memoir excerpt" },
    { unit: ApUnit.ACT_READ_2_SOCIAL_SCIENCE, name: "Social Science", keyThemes: ["main idea", "inference", "author's purpose", "evidence"],
      examNotes: "Passage-based: economics, psychology, sociology, anthropology.", stimulusGuide: "5-8 sentence informational excerpt on a social science topic" },
    { unit: ApUnit.ACT_READ_3_HUMANITIES, name: "Humanities", keyThemes: ["arts", "language", "philosophy", "rhetorical devices"],
      examNotes: "Passage-based: arts, cultural commentary, language, philosophy.", stimulusGuide: "5-8 sentence humanities essay or cultural commentary excerpt" },
    { unit: ApUnit.ACT_READ_4_NATURAL_SCIENCE, name: "Natural Science", keyThemes: ["biology", "chemistry", "physics", "scientific reasoning"],
      examNotes: "Passage-based: natural science article. No prior science knowledge required.", stimulusGuide: "5-8 sentence natural science article excerpt" },
  ],
};

// ── AI caller (Groq cascade → Pollinations fallback) ──────────────────────────
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",       // 100K TPD free
  "llama-3.1-8b-instant",           // 500K TPD free (separate quota)
  "mixtral-8x7b-32768",             // also has separate quota
  "gemma2-9b-it",                   // another separate-quota model
];

async function callGroqModel(prompt: string, model: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("No GROQ_API_KEY");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 1200, temperature: 0.7 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq/${model} ${res.status}: ${body.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Groq/${model} empty response`);
  return text;
}

async function callPollinations(prompt: string, attempt = 0): Promise<string> {
  const seeds = [42, 123, 777, 999];
  const res = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: "You are an AP exam question generator. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      seed: seeds[attempt % seeds.length],
      private: true,
    }),
    signal: AbortSignal.timeout(35000),
  });
  if (!res.ok) throw new Error(`Pollinations ${res.status}`);
  const text = await res.text();
  if (!text?.trim() || text.includes("Bad Gateway")) throw new Error("Pollinations bad response");
  return text.trim();
}

async function callAI(prompt: string): Promise<string> {
  // Try each Groq model in sequence
  for (const model of GROQ_MODELS) {
    try {
      const text = await callGroqModel(prompt, model);
      if (text?.trim()) return text.trim();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("429") || msg.includes("rate_limit")) {
        continue; // try next model
      }
      // Non-rate-limit error: try next model anyway
      continue;
    }
  }
  // All Groq models failed or rate-limited — use Pollinations
  console.warn("  All Groq models rate-limited, using Pollinations...");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await callPollinations(prompt, attempt);
      if (text?.trim()) return text.trim();
    } catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error("All providers failed");
}

// ── Question generation prompt ────────────────────────────────────────────────
function buildPrompt(course: ApCourse, unitData: (typeof UNIT_DATA)[ApCourse][number], difficulty: Difficulty, topic: string): string {
  const courseName = course === "AP_WORLD_HISTORY"
    ? "AP World History: Modern"
    : course === "AP_COMPUTER_SCIENCE_PRINCIPLES"
    ? "AP Computer Science Principles"
    : "AP Physics 1: Algebra-Based";

  return `You are a ${courseName} question generator trained on College Board curriculum standards.

Unit: ${unitData.name}${unitData.timePeriod ? ` (${unitData.timePeriod})` : ""}
Key Themes: ${unitData.keyThemes.join(", ")}
Difficulty: ${difficulty}
Focus: specifically about "${topic}"

${unitData.examNotes}

Requirements:
- ${unitData.stimulusGuide}
- Exactly 4 answer choices: A, B, C, D (only one correct)
- Explanation must identify why correct answer is right and why each distractor is wrong

Return ONLY valid JSON (no markdown, no extra text):
{
  "topic": "${topic}",
  "subtopic": "specific aspect",
  "questionText": "the full question text",
  "stimulus": "passage/diagram description or null",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correctAnswer": "A",
  "explanation": "Why A is correct. Why B is wrong (trap: ...). Why C is wrong. Why D is wrong."
}`;
}

// ── Main script ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎯 PrepNova Question Bank Generator`);
  console.log(`   Min questions per unit: ${MIN_PER_UNIT}`);
  console.log(`   Courses: ${COURSES_TO_FILL.join(", ")}\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const course of COURSES_TO_FILL) {
    const units = UNIT_DATA[course];
    if (!units) { console.warn(`Unknown course: ${course}`); continue; }
    console.log(`\n── ${course} ──────────────────────────`);

    const existingCounts = await prisma.question.groupBy({
      by: ["unit"],
      where: { course, isApproved: true },
      _count: { id: true },
    });
    const countMap = new Map(existingCounts.map((c) => [c.unit, c._count.id]));

    for (const unitData of units) {
      const existing = countMap.get(unitData.unit) ?? 0;
      const needed = Math.max(0, MIN_PER_UNIT - existing);

      if (needed === 0) {
        console.log(`  ✓ ${unitData.name}: ${existing} questions (OK)`);
        totalSkipped++;
        continue;
      }

      console.log(`  ⚡ ${unitData.name}: ${existing} → ${MIN_PER_UNIT} (generating ${needed})`);
      const difficulties: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];
      let unitGenerated = 0;

      for (let i = 0; i < needed; i++) {
        const difficulty = difficulties[i % difficulties.length];
        const topic = unitData.keyThemes[i % unitData.keyThemes.length];

        try {
          const raw = await callAI(buildPrompt(course, unitData, difficulty, topic));
          const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          const parsed = JSON.parse(jsonMatch[0]);

          if (!parsed.questionText || !parsed.correctAnswer || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
            throw new Error("Invalid question structure");
          }

          await prisma.question.create({
            data: {
              course,
              unit: unitData.unit,
              topic: String(parsed.topic ?? topic),
              subtopic: String(parsed.subtopic ?? ""),
              difficulty,
              questionType: QuestionType.MCQ,
              questionText: String(parsed.questionText),
              stimulus: parsed.stimulus && parsed.stimulus !== "null" ? String(parsed.stimulus) : null,
              options: parsed.options,
              correctAnswer: String(parsed.correctAnswer).trim().charAt(0).toUpperCase(),
              explanation: String(parsed.explanation ?? ""),
              isAiGenerated: true,
              isApproved: true,
            },
          });
          unitGenerated++;
          totalGenerated++;
          process.stdout.write(".");
        } catch (err) {
          process.stdout.write("✗");
          totalFailed++;
          if (process.env.VERBOSE) console.warn(`\n    Error: ${(err as Error).message}`);
        }

        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
      console.log(` (${unitGenerated}/${needed} OK)`);
    }
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Generated: ${totalGenerated}`);
  console.log(`⏭  Skipped:   ${totalSkipped} units already at min`);
  console.log(`❌ Failed:    ${totalFailed}`);
  console.log(`═══════════════════════════════════\n`);

  // Final counts
  for (const course of COURSES_TO_FILL) {
    const total = await prisma.question.count({ where: { course, isApproved: true } });
    console.log(`${course}: ${total} total approved questions`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

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
  AP_ENVIRONMENTAL_SCIENCE: [
    { unit: ApUnit.APES_1_ECOSYSTEMS, name: "Unit 1: Ecosystems",
      keyThemes: ["Biomes", "Energy flow (10% rule)", "Biogeochemical cycles", "Trophic levels"],
      examNotes: "Unit 1 weights 6-8%. Classic MCQ: apply 10% rule to a food chain. Biogeochemical cycle Qs often ask about sources and sinks.",
      stimulusGuide: "Food web diagram or biogeochemical cycle flow chart" },
    { unit: ApUnit.APES_2_BIODIVERSITY, name: "Unit 2: Biodiversity",
      keyThemes: ["Species/genetic/ecosystem diversity", "Ecological tolerance", "Succession (primary vs secondary)"],
      examNotes: "Unit 2 weights 6-8%. Distinguish primary vs secondary succession; name indicator species.",
      stimulusGuide: "Succession stage diagram or species-area curve" },
    { unit: ApUnit.APES_3_POPULATIONS, name: "Unit 3: Populations",
      keyThemes: ["K vs r selection", "Logistic vs exponential growth", "Survivorship curves", "Demographic transition"],
      examNotes: "Unit 3 weights 10-15%. Calculate growth rate (r = (birth-death)/population * 1000).",
      stimulusGuide: "Population pyramid, growth curve, or survivorship graph" },
    { unit: ApUnit.APES_4_EARTH_SYSTEMS, name: "Unit 4: Earth Systems & Resources",
      keyThemes: ["Plate tectonics", "Soil formation", "Atmospheric layers", "Coriolis effect"],
      examNotes: "Unit 4 weights 10-15%. Test soil horizons, atmospheric layers, El Niño patterns.",
      stimulusGuide: "Cross-section diagram of soil/atmosphere or ocean current map" },
    { unit: ApUnit.APES_5_LAND_WATER_USE, name: "Unit 5: Land and Water Use",
      keyThemes: ["Tragedy of commons", "Sustainable agriculture", "Irrigation impacts", "Urbanization"],
      examNotes: "Unit 5 weights 10-15%. Assess pros/cons of farming practices (CAFOs, monoculture).",
      stimulusGuide: "Agricultural method comparison or land-use map" },
    { unit: ApUnit.APES_6_ENERGY, name: "Unit 6: Energy Resources",
      keyThemes: ["Fossil fuels", "Nuclear", "Renewables", "Energy conservation"],
      examNotes: "Unit 6 weights 10-15%. Compare energy sources on cost/emissions/scalability.",
      stimulusGuide: "Energy mix pie chart or efficiency comparison table" },
    { unit: ApUnit.APES_7_ATMOSPHERIC_POLLUTION, name: "Unit 7: Atmospheric Pollution",
      keyThemes: ["Acid rain", "Smog", "Ozone depletion vs tropospheric ozone", "Thermal inversions"],
      examNotes: "Unit 7 weights 7-10%. Confuse-check: ozone depletion (stratosphere, CFCs) vs ozone pollution (troposphere, smog).",
      stimulusGuide: "Atmospheric cross-section or pollution formation diagram" },
    { unit: ApUnit.APES_8_AQUATIC_TERRESTRIAL_POLLUTION, name: "Unit 8: Aquatic and Terrestrial Pollution",
      keyThemes: ["Point vs non-point sources", "Eutrophication / DO-BOD", "Biomagnification", "LD50"],
      examNotes: "Unit 8 weights 7-10%. Calculate half-life, biomagnification factor. LD50 interpretation.",
      stimulusGuide: "Dose-response curve, DO-vs-depth graph, or biomagnification pyramid" },
    { unit: ApUnit.APES_9_GLOBAL_CHANGE, name: "Unit 9: Global Change",
      keyThemes: ["Greenhouse gases & radiative forcing", "Ocean acidification", "Invasive species", "HIPPCO"],
      examNotes: "Unit 9 weights 15-20% — heaviest. Climate change mechanisms + mitigation strategies dominate.",
      stimulusGuide: "CO2 ppm graph (Keeling curve), ocean pH chart, or biodiversity loss chart" },
  ],
  AP_PRECALCULUS: [
    { unit: ApUnit.PRECALC_1_POLYNOMIAL_RATIONAL, name: "Unit 1: Polynomial and Rational Functions",
      keyThemes: ["End behavior", "Asymptotes (H/V/slant)", "Zeros & multiplicity", "Long/synthetic division", "Complex zeros"],
      examNotes: "Unit 1 weights 30-40%. Heavy on asymptote identification, zeros with multiplicity (behavior at each zero).",
      stimulusGuide: "Function graph, table of values, or algebraic expression" },
    { unit: ApUnit.PRECALC_2_EXPONENTIAL_LOGARITHMIC, name: "Unit 2: Exponential and Logarithmic Functions",
      keyThemes: ["Growth/decay models", "Log rules", "Change of base", "Solving exp/log equations"],
      examNotes: "Unit 2 weights 27-40%. Test inverse relationship between exp and log. Common error: sign-flip in log(ab) vs log(a/b).",
      stimulusGuide: "Exp/log function graph or modeling scenario (population, radioactive decay)" },
    { unit: ApUnit.PRECALC_3_TRIGONOMETRIC_POLAR, name: "Unit 3: Trigonometric and Polar Functions",
      keyThemes: ["Unit circle", "Transformations of sin/cos/tan", "Inverse trig (quadrants)", "Polar coordinates", "Parametric equations"],
      examNotes: "Unit 3 weights 30-35%. Test transformations (amplitude, period, phase shift) + inverse trig quadrant rules.",
      stimulusGuide: "Trig graph with transformations, unit circle, or polar curve" },
    { unit: ApUnit.PRECALC_4_FUNCTIONS_PARAMETERS_VECTORS_MATRICES, name: "Unit 4: Parameters, Vectors, Matrices (NOT on AP exam)",
      keyThemes: ["Vectors", "Matrix operations", "Vector-valued functions"],
      examNotes: "Unit 4 is NOT assessed on the AP exam. Teach for the class but do not generate AP-style Qs.",
      stimulusGuide: "Vector diagram or matrix operation" },
  ],
  AP_ENGLISH_LANGUAGE: [
    { unit: ApUnit.ENGLANG_1_CLAIMS_EVIDENCE, name: "Unit 1: Claims, Reasoning, Evidence",
      keyThemes: ["Thesis ID", "Claim-evidence linkage", "Strength of evidence"],
      examNotes: "Skill band. Test whether students can distinguish a defensible claim from mere observation.",
      stimulusGuide: "Short prose passage (200-400 words) — essay, speech, or article" },
    { unit: ApUnit.ENGLANG_2_ORGANIZATION_AUDIENCE, name: "Unit 2: Organization and Audience",
      keyThemes: ["Text structure", "Audience targeting", "Ethos/pathos/logos"],
      examNotes: "Test structure recognition and appeals to audience. Revision Qs ask which sentence best completes a purpose.",
      stimulusGuide: "Passage with clear structural moves, or an unfinished student draft" },
    { unit: ApUnit.ENGLANG_3_MULTIPLE_PERSPECTIVES, name: "Unit 3: Perspectives and Counterarguments",
      keyThemes: ["Perspective ID", "Counterargument structure", "Concession vs refutation"],
      examNotes: "Identify and analyze counterarguments. Test whether student can distinguish concession from rebuttal.",
      stimulusGuide: "Passage that explicitly concedes and refutes — editorial or opinion piece" },
    { unit: ApUnit.ENGLANG_4_DEVELOPMENT_METHODS, name: "Unit 4: Development Methods",
      keyThemes: ["Narration", "Description", "Comparison", "Cause-effect", "Examples"],
      examNotes: "Recognize method of development. FRQ-style application: which method best develops the argument?",
      stimulusGuide: "Passage showing clear development method; memoir, biography, or expository essay" },
    { unit: ApUnit.ENGLANG_5_SENTENCE_WRITING, name: "Unit 5: Sentence-Level Writing Choices",
      keyThemes: ["Syntax variation", "Punctuation", "Diction", "Tone"],
      examNotes: "Writing-set MCQs test precise sentence revisions for tone, emphasis, concision.",
      stimulusGuide: "Unfinished draft with highlighted sentence for revision" },
    { unit: ApUnit.ENGLANG_6_POSITION_BIAS, name: "Unit 6: Position, Perspective, Bias",
      keyThemes: ["Author's stance", "Bias acknowledgment", "Qualified claims"],
      examNotes: "Detect bias signals; evaluate qualification of claims.",
      stimulusGuide: "Opinion or argument passage with explicit stance" },
    { unit: ApUnit.ENGLANG_7_ARGUMENT_COMPLEXITY, name: "Unit 7: Argument Complexity",
      keyThemes: ["Nuance", "Qualified argumentation", "Complex reasoning"],
      examNotes: "Test recognition of nuanced arguments — avoid oversimplification.",
      stimulusGuide: "Passage with layered argumentation and concession" },
    { unit: ApUnit.ENGLANG_8_STYLISTIC_CHOICES, name: "Unit 8: Stylistic Choices",
      keyThemes: ["Figurative language", "Stylistic patterns", "Effect on audience"],
      examNotes: "Identify tropes (metaphor, anaphora, antithesis) and their effect.",
      stimulusGuide: "Prose with rich stylistic texture — literary essay or famous speech" },
    { unit: ApUnit.ENGLANG_9_COMPLEX_ARGUMENTATION, name: "Unit 9: Complex Argumentation",
      keyThemes: ["Sophisticated thesis", "Multiple viewpoints synthesis", "Rhetorical sophistication"],
      examNotes: "The sophistication band on the FRQ rubric — can the student handle multiple viewpoints?",
      stimulusGuide: "Synthesis-style source set or complex argument passage" },
  ],
  AP_US_GOVERNMENT: [
    { unit: ApUnit.USGOV_1_FOUNDATIONS, name: "Unit 1: Foundations of American Democracy",
      keyThemes: ["Declaration of Independence", "Articles of Confederation", "Constitution ratification debates", "Federalism", "Separation of powers", "Federalist 10/51", "Brutus No. 1"],
      examNotes: "Unit 1 weights 15-22%. Heavy on foundational docs. Compare Federalist 10 (factions) with Brutus No. 1 (anti-federalism) — classic FRQ pairing.",
      stimulusGuide: "Excerpt from a required foundational document (Dec of Independence, Constitution article, Federalist/Brutus paper)" },
    { unit: ApUnit.USGOV_2_INTERACTIONS_BRANCHES, name: "Unit 2: Interactions Among Branches of Government",
      keyThemes: ["Congress structure/powers", "Presidency (formal/informal powers)", "Federal courts (judicial review, stare decisis)", "Bureaucracy & iron triangles", "Checks and balances in practice"],
      examNotes: "Unit 2 is the heaviest at 25-36%. Test specific congressional procedure, presidential power limits, judicial activism vs restraint. Marbury v Madison, McCulloch v Maryland are required cases.",
      stimulusGuide: "SCOTUS opinion excerpt, congressional procedure description, or bureaucracy scenario" },
    { unit: ApUnit.USGOV_3_CIVIL_LIBERTIES_RIGHTS, name: "Unit 3: Civil Liberties and Civil Rights",
      keyThemes: ["Bill of Rights (1st, 2nd, 4th, 5th, 6th, 8th)", "Incorporation doctrine", "Equal Protection Clause", "Selective incorporation cases", "Civil rights movement & legislation"],
      examNotes: "Unit 3 weights 13-18%. Required cases include Gideon v Wainwright, Tinker v Des Moines, NYT v US, Schenck v US, Brown v Board, McDonald v Chicago.",
      stimulusGuide: "SCOTUS majority/dissent excerpt, or civil rights movement primary source" },
    { unit: ApUnit.USGOV_4_IDEOLOGIES_BELIEFS, name: "Unit 4: American Political Ideologies and Beliefs",
      keyThemes: ["Liberal vs conservative ideologies", "Core American values (individualism, equality of opportunity, rule of law)", "Political socialization", "Public opinion polling (sampling, margin of error)", "Voting behavior correlates"],
      examNotes: "Unit 4 weights 10-15%. Classic MCQ: interpret a polling margin of error. FRQ: explain why demographic X leans party Y.",
      stimulusGuide: "Polling data table, ideological-scale chart, or party-platform excerpt" },
    { unit: ApUnit.USGOV_5_POLITICAL_PARTICIPATION, name: "Unit 5: Political Participation",
      keyThemes: ["Voting rights history (15th/19th/24th/26th Amendments, VRA)", "Voter turnout factors", "Political parties (realignment, polarization, third parties)", "Interest groups (pluralism vs elitism, free-rider problem)", "Campaign finance (FECA, BCRA, Citizens United)", "Media & elections"],
      examNotes: "Unit 5 weights 20-27%. Test Citizens United v FEC impact, polarization trends, interest-group tactics, PACs vs Super PACs.",
      stimulusGuide: "Voter turnout chart, campaign spending graph, or news article on interest group activity" },
  ],
  AP_HUMAN_GEOGRAPHY: [
    { unit: ApUnit.HUGEO_1_THINKING_GEOGRAPHICALLY, name: "Unit 1: Thinking Geographically",
      keyThemes: ["Map projections", "Spatial concepts", "Types of regions", "Scales of analysis", "Geographic data"],
      examNotes: "Unit 1 weights 8-10% of the exam. Test map-reading + scale interpretation. Distinguish formal, functional, perceptual regions.",
      stimulusGuide: "Map description (choropleth or dot-density) or a geographer excerpt on spatial thinking" },
    { unit: ApUnit.HUGEO_2_POPULATION_MIGRATION, name: "Unit 2: Population and Migration Patterns",
      keyThemes: ["Demographic transition model", "Population pyramids", "Malthus vs Boserup", "Ravenstein's laws", "Push-pull factors"],
      examNotes: "Unit 2 weights 12-17%. Common traps: confusing DTM stages, conflating refugees vs asylum seekers, misreading population pyramids.",
      stimulusGuide: "Population pyramid, DTM-stage table, or migration flow map" },
    { unit: ApUnit.HUGEO_3_CULTURAL_PATTERNS, name: "Unit 3: Cultural Patterns and Processes",
      keyThemes: ["Cultural landscape", "Language families & diffusion", "Religion distribution", "Types of diffusion (relocation, expansion, contagious, hierarchical)", "Globalization vs local identity"],
      examNotes: "Unit 3 weights 12-17%. Test diffusion types with clear examples (Islam expansion = hierarchical/relocation, English = relocation/expansion).",
      stimulusGuide: "Map of language/religion distribution, or excerpt on cultural diffusion" },
    { unit: ApUnit.HUGEO_4_POLITICAL_PATTERNS, name: "Unit 4: Political Patterns and Processes",
      keyThemes: ["State vs nation vs nation-state", "Centripetal & centrifugal forces", "Boundary types", "Devolution & supranationalism", "Geopolitical theories (Mackinder, Spykman)"],
      examNotes: "Unit 4 weights 12-17%. Frequent: choropleth of state fragmentation, boundary disputes, EU/UN supranational role.",
      stimulusGuide: "Political map of boundaries or excerpt on geopolitical theory" },
    { unit: ApUnit.HUGEO_5_AGRICULTURE_RURAL, name: "Unit 5: Agriculture and Rural Land-Use",
      keyThemes: ["Agricultural revolutions (Neolithic, 2nd, Green)", "Von Thunen model", "Intensive vs extensive agriculture", "Agribusiness", "Food insecurity & sustainability"],
      examNotes: "Unit 5 weights 12-17%. Von Thunen ring predictions are a classic test item. GMO/organic tradeoffs common FRQ topic.",
      stimulusGuide: "Von Thunen ring diagram description or agricultural land-use map" },
    { unit: ApUnit.HUGEO_6_URBAN_LAND_USE, name: "Unit 6: Cities and Urban Land-Use",
      keyThemes: ["Christaller's central place theory", "Rank-size rule vs primate city", "Burgess, Hoyt, Harris-Ullman urban models", "Urban sprawl, gentrification", "Smart growth & sustainability"],
      examNotes: "Unit 6 weights 12-17%. Classic MCQ: apply an urban model to a named city. FRQ: compare two urban models with evidence.",
      stimulusGuide: "City map showing zones, or rank-size-rule graph" },
    { unit: ApUnit.HUGEO_7_INDUSTRIAL_ECONOMIC, name: "Unit 7: Industrial and Economic Development",
      keyThemes: ["Weber's least-cost industrial location", "Rostow's stages of development", "Wallerstein's world-systems", "Sectoral shifts (primary→quaternary)", "HDI vs GII indicators"],
      examNotes: "Unit 7 weights 12-17%. Compare Rostow linear vs Wallerstein core-periphery. Test HDI index components.",
      stimulusGuide: "HDI/GII bar chart, Weber locational triangle, or Rostow stages diagram" },
  ],
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
  // CLEP courses — same pipeline, CLEP-specific prompts
  CLEP_COLLEGE_ALGEBRA: [
    { unit: ApUnit.CLEP_ALGEBRA_1_FOUNDATIONS, name: "Algebraic Foundations", keyThemes: ["real numbers", "exponent rules", "radicals", "factoring"],
      examNotes: "CLEP College Algebra: 60 MCQ, 90 min. No calculator on most versions.", stimulusGuide: "algebraic expression or equation to simplify or solve" },
    { unit: ApUnit.CLEP_ALGEBRA_2_EQUATIONS_INEQUALITIES, name: "Equations and Inequalities", keyThemes: ["linear equations", "quadratic equations", "systems", "inequalities"],
      examNotes: "Multi-step solving. Show full work in explanation.", stimulusGuide: "equation or system of equations" },
    { unit: ApUnit.CLEP_ALGEBRA_3_FUNCTIONS_GRAPHS, name: "Functions and Graphs", keyThemes: ["domain", "range", "transformations", "inverse functions"],
      examNotes: "Function notation, domain/range, graph transformations.", stimulusGuide: "function definition f(x) or graph description" },
    { unit: ApUnit.CLEP_ALGEBRA_4_POLYNOMIAL_RATIONAL, name: "Polynomial and Rational Functions", keyThemes: ["polynomial division", "asymptotes", "holes", "end behavior"],
      examNotes: "Rational expressions, asymptotes, factoring polynomials.", stimulusGuide: "rational function expression" },
    { unit: ApUnit.CLEP_ALGEBRA_5_EXPONENTIAL_LOGARITHMIC, name: "Exponential and Logarithmic Functions", keyThemes: ["exponential growth", "log properties", "natural log", "change of base"],
      examNotes: "Log/exp equations, growth/decay models.", stimulusGuide: "exponential or logarithmic equation" },
  ],
  CLEP_COLLEGE_COMPOSITION: [
    { unit: ApUnit.CLEP_COMP_1_ESSAY_STRATEGIES, name: "Essay Organization and Strategies", keyThemes: ["thesis", "paragraph structure", "transitions", "coherence"],
      examNotes: "CLEP Composition: 90 MCQ, 95 min. Revision-focused.", stimulusGuide: "4-6 sentence paragraph with underlined portion to revise" },
    { unit: ApUnit.CLEP_COMP_2_RHETORICAL_ANALYSIS, name: "Rhetorical Analysis and Audience", keyThemes: ["ethos pathos logos", "tone", "purpose", "diction"],
      examNotes: "Identify rhetorical strategies in given passage.", stimulusGuide: "4-6 sentence argumentative or persuasive passage excerpt" },
    { unit: ApUnit.CLEP_COMP_3_RESEARCH_DOCUMENTATION, name: "Research Skills and Documentation", keyThemes: ["MLA citation", "source evaluation", "paraphrase", "plagiarism"],
      examNotes: "Research integration and citation conventions.", stimulusGuide: "source excerpt with attribution question" },
    { unit: ApUnit.CLEP_COMP_4_REVISION_EDITING, name: "Revision, Editing, and Mechanics", keyThemes: ["grammar", "punctuation", "sentence clarity", "passive voice"],
      examNotes: "Grammar, usage, mechanics — select the best revision.", stimulusGuide: "4-6 sentence passage with underlined problematic portion" },
    { unit: ApUnit.CLEP_COMP_5_ARGUMENTATION, name: "Argumentation and Evidence", keyThemes: ["claim", "warrant", "counterargument", "logical fallacies", "evidence"],
      examNotes: "Identify logical fallacies and evaluate argument strength.", stimulusGuide: "3-5 sentence argument excerpt" },
  ],
  CLEP_INTRO_PSYCHOLOGY: [
    { unit: ApUnit.CLEP_PSY_1_BIOLOGICAL_BASES, name: "Biological Bases of Behavior", keyThemes: ["neurons", "neurotransmitters", "brain structures", "nervous system"],
      examNotes: "CLEP Psych: 95 MCQ, 90 min. Scenario-based questions common.", stimulusGuide: "behavioral scenario or neuroscience description" },
    { unit: ApUnit.CLEP_PSY_2_COGNITION_MEMORY, name: "Cognition, Memory, and Learning", keyThemes: ["classical conditioning", "operant conditioning", "memory encoding", "forgetting"],
      examNotes: "Apply learning theories to scenarios.", stimulusGuide: "behavioral scenario demonstrating a learning concept" },
    { unit: ApUnit.CLEP_PSY_3_DEVELOPMENTAL, name: "Developmental Psychology", keyThemes: ["Piaget", "Erikson", "attachment", "moral development"],
      examNotes: "Stage-based theories. Know Piaget and Erikson thoroughly.", stimulusGuide: "child development scenario or age-based behavior description" },
    { unit: ApUnit.CLEP_PSY_4_SOCIAL_PERSONALITY, name: "Social Psychology and Personality", keyThemes: ["attribution", "conformity", "obedience", "Big Five", "psychodynamic"],
      examNotes: "Social influence and personality theories.", stimulusGuide: "social scenario or personality description" },
    { unit: ApUnit.CLEP_PSY_5_CLINICAL_ABNORMAL, name: "Clinical and Abnormal Psychology", keyThemes: ["DSM-5", "anxiety", "mood disorders", "CBT", "psychoanalysis"],
      examNotes: "Disorder identification and treatment approaches.", stimulusGuide: "patient symptom vignette (2-3 sentences)" },
  ],
  CLEP_PRINCIPLES_OF_MARKETING: [
    { unit: ApUnit.CLEP_MARKETING_1_FUNDAMENTALS, name: "Marketing Fundamentals and Environment", keyThemes: ["4Ps", "SWOT", "target markets", "marketing concept"],
      examNotes: "CLEP Marketing: 100 MCQ, 90 min. Scenario-based application.", stimulusGuide: "business scenario or marketing situation description" },
    { unit: ApUnit.CLEP_MARKETING_2_CONSUMER_BEHAVIOR, name: "Consumer Behavior and Market Research", keyThemes: ["buying process", "segmentation", "market research", "psychological factors"],
      examNotes: "Consumer decision-making and segmentation strategies.", stimulusGuide: "consumer purchase scenario or research design vignette" },
    { unit: ApUnit.CLEP_MARKETING_3_PRODUCT_PRICING, name: "Product and Pricing Strategy", keyThemes: ["product life cycle", "branding", "price elasticity", "penetration vs skimming"],
      examNotes: "PLC stages, pricing strategies, new product development.", stimulusGuide: "product launch scenario or pricing decision vignette" },
    { unit: ApUnit.CLEP_MARKETING_4_DISTRIBUTION_PROMOTION, name: "Distribution and Promotion", keyThemes: ["channels", "logistics", "advertising", "personal selling", "IMC"],
      examNotes: "Distribution channel decisions and promotional mix.", stimulusGuide: "distribution or promotional strategy scenario" },
    { unit: ApUnit.CLEP_MARKETING_5_DIGITAL_GLOBAL, name: "Digital and Global Marketing", keyThemes: ["social media", "SEO", "e-commerce", "global adaptation", "cultural marketing"],
      examNotes: "Digital tools and global marketing adaptation.", stimulusGuide: "digital campaign or global market entry scenario" },
  ],
  CLEP_PRINCIPLES_OF_MANAGEMENT: [
    { unit: ApUnit.CLEP_MGMT_1_PLANNING_ORGANIZING, name: "Planning and Organizing", keyThemes: ["strategic planning", "SWOT", "organizational structure", "span of control", "MBO"],
      examNotes: "CLEP Management: 100 MCQ, 90 min. Theory application to scenarios.", stimulusGuide: "organizational decision or planning scenario" },
    { unit: ApUnit.CLEP_MGMT_2_LEADING_MOTIVATION, name: "Leading and Motivation", keyThemes: ["leadership styles", "Maslow", "Herzberg", "expectancy theory", "transformational leadership"],
      examNotes: "Leadership and motivation theories — know all major frameworks.", stimulusGuide: "workplace leadership or motivation scenario" },
    { unit: ApUnit.CLEP_MGMT_3_CONTROLLING_OPERATIONS, name: "Controlling and Operations", keyThemes: ["control process", "benchmarking", "TQM", "balanced scorecard", "supply chain"],
      examNotes: "Control mechanisms and operations management tools.", stimulusGuide: "operations or quality control scenario" },
    { unit: ApUnit.CLEP_MGMT_4_HUMAN_RESOURCES, name: "Human Resources and Organizational Behavior", keyThemes: ["recruitment", "training", "performance appraisal", "group dynamics", "conflict resolution"],
      examNotes: "HR processes and organizational behavior concepts.", stimulusGuide: "HR decision scenario or team dynamics vignette" },
    { unit: ApUnit.CLEP_MGMT_5_STRATEGIC_ETHICS, name: "Strategy, Ethics, and Global Management", keyThemes: ["Porter's five forces", "CSR", "ethical decision-making", "stakeholder theory", "global expansion"],
      examNotes: "Strategic analysis and ethical frameworks.", stimulusGuide: "strategic decision or ethical dilemma scenario" },
  ],
  CLEP_INTRODUCTORY_SOCIOLOGY: [
    { unit: ApUnit.CLEP_SOC_1_SOCIOLOGICAL_PERSPECTIVE, name: "The Sociological Perspective and Research Methods", keyThemes: ["sociological imagination", "conflict theory", "functionalism", "symbolic interactionism", "research methods"],
      examNotes: "CLEP Sociology: 100 MCQ, 90 min. Theory identification from scenarios.", stimulusGuide: "social situation or research study description" },
    { unit: ApUnit.CLEP_SOC_2_SOCIAL_STRUCTURE_GROUPS, name: "Social Structure, Groups, and Culture", keyThemes: ["norms", "values", "socialization", "primary vs secondary groups", "bureaucracy"],
      examNotes: "Social structure and culture concepts.", stimulusGuide: "social group scenario or cultural description" },
    { unit: ApUnit.CLEP_SOC_3_SOCIAL_STRATIFICATION, name: "Social Stratification and Inequality", keyThemes: ["class systems", "social mobility", "racial stratification", "gender inequality", "intersectionality"],
      examNotes: "Stratification systems and forms of inequality.", stimulusGuide: "stratification scenario or inequality data description" },
    { unit: ApUnit.CLEP_SOC_4_SOCIAL_INSTITUTIONS, name: "Social Institutions", keyThemes: ["family structures", "education", "religion", "economic institutions", "political institutions"],
      examNotes: "How social institutions shape behavior and society.", stimulusGuide: "institutional change scenario or policy description" },
    { unit: ApUnit.CLEP_SOC_5_SOCIAL_CHANGE_DEVIANCE, name: "Social Change and Deviance", keyThemes: ["labeling theory", "strain theory", "social movements", "collective behavior", "globalization"],
      examNotes: "Deviance theories and agents of social change.", stimulusGuide: "deviance scenario or social movement description" },
  ],
  // ── New CLEP courses ────────────────────────────────────────────────────────
  CLEP_AMERICAN_GOVERNMENT: [
    { unit: ApUnit.CLEP_GOV_1_FOUNDATIONS, name: "Constitutional Foundations", keyThemes: ["separation of powers", "federalism", "constitutional amendments", "checks and balances"],
      examNotes: "CLEP Am. Gov: 100 MCQ, 120 min. Focus on constitutional structure and governmental powers.", stimulusGuide: "political scenario, court case reference, or policy situation" },
    { unit: ApUnit.CLEP_GOV_2_POLITICAL_BELIEFS, name: "Political Beliefs and Behaviors", keyThemes: ["political socialization", "public opinion polling", "voter turnout", "political ideology spectrum"],
      examNotes: "Political attitudes, participation, and ideology spectrum.", stimulusGuide: "polling data or political behavior scenario" },
    { unit: ApUnit.CLEP_GOV_3_POLITICAL_PARTIES, name: "Political Parties and Interest Groups", keyThemes: ["two-party system", "third parties", "interest group tactics", "PACs and campaign finance"],
      examNotes: "Party systems, interest group influence, and campaign finance.", stimulusGuide: "campaign finance scenario or interest group vignette" },
    { unit: ApUnit.CLEP_GOV_4_INSTITUTIONS, name: "Institutions of Government", keyThemes: ["congressional committees", "presidential powers", "judicial review", "bureaucratic agencies"],
      examNotes: "Structure and function of Congress, presidency, courts, and bureaucracy.", stimulusGuide: "institutional decision scenario or separation of powers case" },
    { unit: ApUnit.CLEP_GOV_5_CIVIL_RIGHTS, name: "Civil Rights and Civil Liberties", keyThemes: ["Bill of Rights incorporation", "equal protection clause", "landmark Supreme Court cases", "due process"],
      examNotes: "Constitutional protections and landmark civil rights cases.", stimulusGuide: "Supreme Court case excerpt or civil liberties scenario" },
  ],
  CLEP_MACROECONOMICS: [
    { unit: ApUnit.CLEP_MACRO_1_BASIC_CONCEPTS, name: "Basic Economic Concepts", keyThemes: ["scarcity and opportunity cost", "production possibilities curve", "comparative advantage", "circular flow model"],
      examNotes: "CLEP Macro: 80 MCQ, 90 min. Foundational economic reasoning and models.", stimulusGuide: "economic scenario or production possibilities data" },
    { unit: ApUnit.CLEP_MACRO_2_GDP_MEASUREMENT, name: "Measuring Economic Performance", keyThemes: ["GDP calculation methods", "inflation and CPI", "unemployment types", "business cycle phases"],
      examNotes: "GDP components, inflation measurement, and business cycle analysis.", stimulusGuide: "economic data table or GDP calculation scenario" },
    { unit: ApUnit.CLEP_MACRO_3_FISCAL_POLICY, name: "Fiscal Policy and the Budget", keyThemes: ["government spending multiplier", "automatic stabilizers", "budget deficits and national debt", "crowding out effect"],
      examNotes: "Fiscal policy tools, multiplier effects, and budget analysis.", stimulusGuide: "government policy scenario or budget data" },
    { unit: ApUnit.CLEP_MACRO_4_MONETARY_POLICY, name: "Money and Monetary Policy", keyThemes: ["money supply M1/M2", "Federal Reserve tools", "money multiplier", "quantity theory of money"],
      examNotes: "Federal Reserve operations and money supply mechanics.", stimulusGuide: "monetary policy scenario or reserve requirement calculation" },
    { unit: ApUnit.CLEP_MACRO_5_INTERNATIONAL, name: "International Economics", keyThemes: ["balance of payments", "exchange rate determination", "trade barriers and tariffs", "capital flows"],
      examNotes: "International trade, exchange rates, and balance of payments.", stimulusGuide: "trade data or exchange rate scenario" },
  ],
  CLEP_MICROECONOMICS: [
    { unit: ApUnit.CLEP_MICRO_1_SUPPLY_DEMAND, name: "Supply and Demand", keyThemes: ["law of demand", "supply shifters", "equilibrium price", "price ceilings and floors"],
      examNotes: "CLEP Micro: 80 MCQ, 90 min. Supply-demand analysis and market equilibrium.", stimulusGuide: "market scenario or supply-demand graph description" },
    { unit: ApUnit.CLEP_MICRO_2_ELASTICITY, name: "Elasticity and Consumer Choice", keyThemes: ["price elasticity of demand", "cross-price elasticity", "income elasticity", "marginal utility"],
      examNotes: "Elasticity calculations and consumer choice theory.", stimulusGuide: "elasticity data or consumer choice scenario" },
    { unit: ApUnit.CLEP_MICRO_3_MARKET_STRUCTURES, name: "Market Structures", keyThemes: ["perfect competition", "monopoly deadweight loss", "monopolistic competition", "oligopoly and game theory"],
      examNotes: "Compare market structures and analyze firm behavior.", stimulusGuide: "cost/revenue table or market structure scenario" },
    { unit: ApUnit.CLEP_MICRO_4_FACTOR_MARKETS, name: "Factor Markets", keyThemes: ["marginal revenue product", "labor demand and supply", "wage determination", "monopsony"],
      examNotes: "Labor markets, MRP, and wage determination.", stimulusGuide: "labor market data or factor market scenario" },
    { unit: ApUnit.CLEP_MICRO_5_MARKET_FAILURE, name: "Market Failure and Government", keyThemes: ["externalities and Pigouvian taxes", "public goods and free riders", "asymmetric information", "antitrust policy"],
      examNotes: "Market failures, externalities, and government intervention.", stimulusGuide: "externality scenario or public goods vignette" },
  ],
  CLEP_BIOLOGY: [
    { unit: ApUnit.CLEP_BIO_1_MOLECULAR_CELL, name: "Molecular and Cellular Biology", keyThemes: ["cell membrane transport", "enzyme kinetics", "cellular respiration", "photosynthesis"],
      examNotes: "CLEP Bio: 115 MCQ, 90 min. Cell structure, transport, and metabolic pathways.", stimulusGuide: "experimental scenario, data table, or biological diagram description" },
    { unit: ApUnit.CLEP_BIO_2_GENETICS, name: "Genetics and Molecular Biology", keyThemes: ["Mendelian inheritance", "DNA replication", "gene expression", "biotechnology techniques"],
      examNotes: "Genetics, central dogma, and biotechnology applications.", stimulusGuide: "genetic cross data or molecular biology scenario" },
    { unit: ApUnit.CLEP_BIO_3_EVOLUTION, name: "Evolution and Diversity", keyThemes: ["natural selection", "speciation", "phylogenetics", "Hardy-Weinberg equilibrium"],
      examNotes: "Evolutionary mechanisms, speciation, and population genetics.", stimulusGuide: "population data or phylogenetic tree description" },
    { unit: ApUnit.CLEP_BIO_4_ORGANISMS, name: "Organismal Biology", keyThemes: ["plant structure/function", "animal organ systems", "homeostasis", "nervous/endocrine systems"],
      examNotes: "Plant and animal physiology, organ systems, and homeostasis.", stimulusGuide: "organism structure diagram or physiological scenario" },
    { unit: ApUnit.CLEP_BIO_5_ECOLOGY, name: "Ecology and Population Biology", keyThemes: ["energy flow and trophic levels", "biogeochemical cycles", "population growth models", "community interactions"],
      examNotes: "Ecosystems, population dynamics, and ecological interactions.", stimulusGuide: "population growth graph or food web diagram" },
  ],
  CLEP_US_HISTORY_1: [
    { unit: ApUnit.CLEP_USH1_1_COLONIAL, name: "Colonial Period (1491-1763)", keyThemes: ["Columbian Exchange", "colonial economies", "indentured servitude and slavery", "French and Indian War"],
      examNotes: "CLEP US Hist I: 120 MCQ, 90 min. Colonial era through Reconstruction.", stimulusGuide: "primary source excerpt or colonial-era scenario" },
    { unit: ApUnit.CLEP_USH1_2_REVOLUTION, name: "American Revolution (1763-1783)", keyThemes: ["taxation without representation", "Declaration of Independence", "Revolutionary War strategy", "Loyalists vs Patriots"],
      examNotes: "Causes, conduct, and outcomes of the American Revolution.", stimulusGuide: "revolutionary document excerpt or political scenario" },
    { unit: ApUnit.CLEP_USH1_3_EARLY_REPUBLIC, name: "Early Republic (1783-1820)", keyThemes: ["Articles of Confederation", "Constitutional Convention", "Federalist vs Anti-Federalist", "Marbury v. Madison"],
      examNotes: "Constitution formation, early political debates, and judicial review.", stimulusGuide: "Federalist Paper quotation or early republic scenario" },
    { unit: ApUnit.CLEP_USH1_4_EXPANSION_REFORM, name: "Expansion and Reform (1820-1860)", keyThemes: ["Manifest Destiny", "Jacksonian democracy", "abolitionism and women's suffrage", "Missouri Compromise"],
      examNotes: "Westward expansion, reform movements, and sectional tensions.", stimulusGuide: "reform movement document or political speech excerpt" },
    { unit: ApUnit.CLEP_USH1_5_CIVIL_WAR, name: "Civil War and Reconstruction (1860-1877)", keyThemes: ["secession", "Emancipation Proclamation", "total war strategy", "Reconstruction amendments"],
      examNotes: "Civil War causes and conduct, Reconstruction successes and failures.", stimulusGuide: "Reconstruction-era document or political cartoon description" },
  ],
  CLEP_US_HISTORY_2: [
    { unit: ApUnit.CLEP_USH2_1_RECONSTRUCTION, name: "Reconstruction and Gilded Age (1877-1900)", keyThemes: ["Jim Crow laws", "industrialization", "Populist movement", "urbanization and immigration"],
      examNotes: "CLEP US Hist II: 120 MCQ, 90 min. Reconstruction through present.", stimulusGuide: "primary source or Gilded Age scenario" },
    { unit: ApUnit.CLEP_USH2_2_INDUSTRIALIZATION, name: "Progressive Era and Imperialism (1890-1920)", keyThemes: ["muckrakers and reform", "Spanish-American War", "Roosevelt progressivism", "women's suffrage"],
      examNotes: "Progressive reforms, American imperialism, and social change.", stimulusGuide: "muckraker article excerpt or reform scenario" },
    { unit: ApUnit.CLEP_USH2_3_WORLD_WARS, name: "World Wars and Interwar (1914-1945)", keyThemes: ["US entry into WWI", "Great Depression", "New Deal programs", "WWII home front"],
      examNotes: "World Wars, Depression-era policy, and wartime mobilization.", stimulusGuide: "New Deal document or wartime speech excerpt" },
    { unit: ApUnit.CLEP_USH2_4_COLD_WAR, name: "Cold War Era (1945-1980)", keyThemes: ["containment doctrine", "McCarthyism", "civil rights movement", "Vietnam War"],
      examNotes: "Cold War foreign policy, domestic politics, and social movements.", stimulusGuide: "presidential speech or civil rights document" },
    { unit: ApUnit.CLEP_USH2_5_MODERN_ERA, name: "Modern America (1980-Present)", keyThemes: ["Reagan conservatism", "end of Cold War", "globalization", "War on Terror"],
      examNotes: "Modern conservatism, post-Cold War era, and contemporary issues.", stimulusGuide: "political speech excerpt or policy scenario" },
  ],
  CLEP_HUMAN_GROWTH_DEV: [
    { unit: ApUnit.CLEP_HGD_1_PRENATAL_INFANCY, name: "Prenatal Development and Infancy", keyThemes: ["teratogens and prenatal stages", "Piaget's sensorimotor stage", "attachment theory (Bowlby/Ainsworth)", "motor development"],
      examNotes: "CLEP Human Dev: 90 MCQ, 90 min. Lifespan development theories.", stimulusGuide: "developmental scenario or behavioral observation" },
    { unit: ApUnit.CLEP_HGD_2_CHILDHOOD, name: "Early and Middle Childhood", keyThemes: ["preoperational/concrete operational stages", "Vygotsky's ZPD", "language acquisition theories", "Erikson's psychosocial stages"],
      examNotes: "Cognitive and social development in childhood.", stimulusGuide: "child behavior scenario or developmental vignette" },
    { unit: ApUnit.CLEP_HGD_3_ADOLESCENCE, name: "Adolescence", keyThemes: ["puberty and brain development", "formal operational stage", "identity formation (Erikson/Marcia)", "Kohlberg's moral development"],
      examNotes: "Adolescent physical, cognitive, and identity development.", stimulusGuide: "adolescent behavior scenario or moral reasoning vignette" },
    { unit: ApUnit.CLEP_HGD_4_ADULTHOOD, name: "Adulthood", keyThemes: ["Erikson's intimacy vs isolation", "cognitive changes in midlife", "career development theories", "generativity"],
      examNotes: "Adult development, career, and psychosocial transitions.", stimulusGuide: "adult life transition scenario" },
    { unit: ApUnit.CLEP_HGD_5_AGING_DEATH, name: "Aging, Death, and Dying", keyThemes: ["cognitive aging and dementia", "Kubler-Ross stages of grief", "social-emotional selectivity theory", "successful aging"],
      examNotes: "Late adulthood, cognitive aging, and end-of-life issues.", stimulusGuide: "aging scenario or grief counseling vignette" },
  ],
  CLEP_CALCULUS: [
    { unit: ApUnit.CLEP_CALC_1_LIMITS, name: "Limits and Continuity", keyThemes: ["limit evaluation techniques", "one-sided limits", "continuity and IVT", "limits at infinity"],
      examNotes: "CLEP Calculus: ~44 MCQ, 90 min. Calculator and non-calculator sections.", stimulusGuide: "function definition or graph description" },
    { unit: ApUnit.CLEP_CALC_2_DERIVATIVES, name: "Derivatives", keyThemes: ["derivative definition", "power/product/quotient/chain rules", "implicit differentiation", "trig/exponential/log derivatives"],
      examNotes: "Differentiation rules and applications.", stimulusGuide: "function for differentiation or rate-of-change scenario" },
    { unit: ApUnit.CLEP_CALC_3_INTEGRALS, name: "Integrals", keyThemes: ["Riemann sums", "Fundamental Theorem of Calculus", "u-substitution", "definite integral properties"],
      examNotes: "Integration techniques and the Fundamental Theorem.", stimulusGuide: "integral expression or Riemann sum table" },
    { unit: ApUnit.CLEP_CALC_4_APPLICATIONS, name: "Applications", keyThemes: ["related rates", "optimization", "area between curves", "volumes of revolution"],
      examNotes: "Applied calculus: related rates, optimization, area, and volume.", stimulusGuide: "geometric or physical scenario with changing quantities" },
    { unit: ApUnit.CLEP_CALC_5_SEQUENCES_SERIES, name: "Differential Equations and Series", keyThemes: ["separable DEs", "slope fields", "Taylor/Maclaurin series", "convergence tests"],
      examNotes: "Differential equations and series convergence.", stimulusGuide: "initial value problem or series expression" },
  ],
  CLEP_CHEMISTRY: [
    { unit: ApUnit.CLEP_CHEM_1_ATOMIC_STRUCTURE, name: "Atomic Structure and Periodicity", keyThemes: ["electron configuration", "periodic trends", "quantum numbers", "atomic orbitals"],
      examNotes: "CLEP Chemistry: 75 MCQ, 90 min. General college chemistry.", stimulusGuide: "periodic table data or electron configuration problem" },
    { unit: ApUnit.CLEP_CHEM_2_BONDING, name: "Chemical Bonding", keyThemes: ["ionic vs covalent bonds", "Lewis structures and VSEPR", "molecular polarity", "intermolecular forces"],
      examNotes: "Bonding types, molecular geometry, and IMFs.", stimulusGuide: "molecular formula or structural diagram" },
    { unit: ApUnit.CLEP_CHEM_3_REACTIONS, name: "Reactions and Stoichiometry", keyThemes: ["balancing equations", "limiting reagents", "mole conversions", "reaction types"],
      examNotes: "Stoichiometric calculations and reaction classification.", stimulusGuide: "chemical equation and mass/mole data" },
    { unit: ApUnit.CLEP_CHEM_4_STATES_SOLUTIONS, name: "States of Matter and Solutions", keyThemes: ["gas laws", "colligative properties", "solution concentration", "phase diagrams"],
      examNotes: "Gas law calculations, solution chemistry, and phase transitions.", stimulusGuide: "gas law problem or solution preparation scenario" },
    { unit: ApUnit.CLEP_CHEM_5_THERMODYNAMICS, name: "Thermodynamics and Kinetics", keyThemes: ["enthalpy and Hess's law", "entropy and Gibbs free energy", "rate laws", "equilibrium and Le Chatelier's"],
      examNotes: "Thermodynamic calculations, kinetics, and equilibrium analysis.", stimulusGuide: "thermochemical equations or reaction rate data" },
  ],
  CLEP_FINANCIAL_ACCOUNTING: [
    { unit: ApUnit.CLEP_FINACCT_1_ACCOUNTING_CYCLE, name: "The Accounting Cycle", keyThemes: ["double-entry bookkeeping", "journal entries and T-accounts", "adjusting entries", "closing entries and trial balance"],
      examNotes: "CLEP Financial Accounting: 75 MCQ, 90 min. Journal entries and calculations common.", stimulusGuide: "transaction scenario or journal entry" },
    { unit: ApUnit.CLEP_FINACCT_2_ASSETS, name: "Assets", keyThemes: ["accounts receivable and bad debts", "inventory valuation (FIFO, LIFO)", "depreciation methods", "intangible assets"],
      examNotes: "Asset valuation, depreciation, and inventory methods.", stimulusGuide: "inventory data or depreciation calculation scenario" },
    { unit: ApUnit.CLEP_FINACCT_3_LIABILITIES_EQUITY, name: "Liabilities and Equity", keyThemes: ["current vs long-term liabilities", "bonds payable", "stockholders' equity", "retained earnings and dividends"],
      examNotes: "Liability classification, bond accounting, and equity transactions.", stimulusGuide: "bond issuance scenario or equity transaction" },
    { unit: ApUnit.CLEP_FINACCT_4_INCOME_STATEMENT, name: "Income Statement", keyThemes: ["revenue recognition", "cost of goods sold", "multi-step income statement", "earnings per share"],
      examNotes: "Revenue recognition and income statement preparation.", stimulusGuide: "revenue/expense data or income statement excerpt" },
    { unit: ApUnit.CLEP_FINACCT_5_FINANCIAL_ANALYSIS, name: "Financial Statement Analysis", keyThemes: ["ratio analysis", "horizontal/vertical analysis", "statement of cash flows", "GAAP principles"],
      examNotes: "Financial ratio calculations and statement analysis.", stimulusGuide: "financial statement data or ratio calculation scenario" },
  ],
  CLEP_AMERICAN_LITERATURE: [
    { unit: ApUnit.CLEP_AMLIT_1_COLONIAL_EARLY, name: "Colonial and Early National (1620-1830)", keyThemes: ["Puritan literature and plain style", "Enlightenment prose (Franklin, Paine)", "early American poetry (Bradstreet, Wheatley)", "captivity and slave narratives"],
      examNotes: "CLEP Am. Lit: 100 MCQ, 90 min. Passage-based analysis and author identification.", stimulusGuide: "literary passage excerpt, poem stanza, or prose selection" },
    { unit: ApUnit.CLEP_AMLIT_2_ROMANTIC_PERIOD, name: "Romantic Period (1830-1865)", keyThemes: ["Transcendentalism (Emerson, Thoreau)", "Dark Romanticism (Hawthorne, Melville, Poe)", "Walt Whitman and free verse", "slave narratives (Douglass)"],
      examNotes: "Romantic and Transcendentalist literary movements.", stimulusGuide: "Transcendentalist or Dark Romantic passage excerpt" },
    { unit: ApUnit.CLEP_AMLIT_3_REALISM_NATURALISM, name: "Realism and Naturalism (1865-1914)", keyThemes: ["literary realism (Twain, James, Howells)", "naturalism (Crane, Dreiser, London)", "regionalism and local color", "Emily Dickinson's poetry"],
      examNotes: "Realist and naturalist fiction, regional writing.", stimulusGuide: "realist prose excerpt or naturalist passage" },
    { unit: ApUnit.CLEP_AMLIT_4_MODERNISM, name: "Modernism (1914-1945)", keyThemes: ["Harlem Renaissance (Hughes, Hurston)", "Lost Generation (Fitzgerald, Hemingway)", "modernist poetry (Frost, Eliot, Stevens)", "experimental narrative techniques"],
      examNotes: "Modernist experimentation and Harlem Renaissance.", stimulusGuide: "modernist prose or poetry excerpt" },
    { unit: ApUnit.CLEP_AMLIT_5_CONTEMPORARY, name: "Contemporary (1945-Present)", keyThemes: ["Beat Generation (Kerouac, Ginsberg)", "postmodern fiction (Pynchon, Morrison)", "confessional poetry (Plath, Sexton)", "multicultural voices and identity literature"],
      examNotes: "Postmodern, Beat, confessional, and multicultural literature.", stimulusGuide: "contemporary prose or poetry excerpt" },
  ],
  CLEP_ANALYZING_INTERPRETING_LIT: [
    { unit: ApUnit.CLEP_ANLIT_1_PROSE_FICTION, name: "Prose Fiction", keyThemes: ["narrative point of view", "characterization and motivation", "plot structure and conflict", "setting and atmosphere"],
      examNotes: "CLEP Lit Analysis: 80 MCQ, 90 min. Entirely passage-based close reading.", stimulusGuide: "3-6 line prose fiction excerpt" },
    { unit: ApUnit.CLEP_ANLIT_2_POETRY, name: "Poetry", keyThemes: ["meter and rhyme scheme", "figurative language (metaphor, simile, personification)", "imagery and sensory detail", "tone and speaker"],
      examNotes: "Poetry analysis: meter, figurative language, and tone.", stimulusGuide: "4-8 line poetry excerpt" },
    { unit: ApUnit.CLEP_ANLIT_3_DRAMA, name: "Drama", keyThemes: ["dramatic irony and foreshadowing", "soliloquy and aside", "tragedy and comedy conventions", "stage directions and subtext"],
      examNotes: "Dramatic conventions and close reading of dialogue.", stimulusGuide: "3-5 line dramatic dialogue excerpt" },
    { unit: ApUnit.CLEP_ANLIT_4_NONFICTION, name: "Nonfiction and Essays", keyThemes: ["rhetorical strategies", "persuasive techniques", "author's purpose and audience", "essay structure and argument"],
      examNotes: "Nonfiction rhetoric and essay analysis.", stimulusGuide: "nonfiction essay excerpt or rhetorical passage" },
    { unit: ApUnit.CLEP_ANLIT_5_LITERARY_ANALYSIS, name: "Literary Analysis and Interpretation", keyThemes: ["theme identification", "symbolism and allegory", "irony (verbal, situational, dramatic)", "literary criticism approaches"],
      examNotes: "Cross-genre literary analysis skills.", stimulusGuide: "literary passage with symbolic or ironic elements" },
  ],
  CLEP_COLLEGE_COMP_MODULAR: [
    { unit: ApUnit.CLEP_CCM_1_RHETORICAL_ANALYSIS, name: "Rhetorical Analysis", keyThemes: ["ethos, pathos, logos", "audience and purpose", "rhetorical strategies", "tone and diction analysis"],
      examNotes: "CLEP Comp Modular: 90 MCQ, 90 min. No essay. Passage-based revision and rhetoric.", stimulusGuide: "rhetorical passage for analysis" },
    { unit: ApUnit.CLEP_CCM_2_SYNTHESIS, name: "Synthesis and Source Use", keyThemes: ["integrating multiple sources", "paraphrasing vs summarizing", "evaluating source credibility", "synthesizing conflicting viewpoints"],
      examNotes: "Source integration and evaluation.", stimulusGuide: "source excerpt with attribution question" },
    { unit: ApUnit.CLEP_CCM_3_ARGUMENTATION, name: "Argumentation", keyThemes: ["thesis development", "logical fallacies", "counterargument and rebuttal", "evidence evaluation"],
      examNotes: "Argument analysis and logical fallacy identification.", stimulusGuide: "argumentative passage excerpt" },
    { unit: ApUnit.CLEP_CCM_4_RESEARCH_SKILLS, name: "Research Skills", keyThemes: ["MLA and APA citation", "primary vs secondary sources", "research question formulation", "avoiding plagiarism"],
      examNotes: "Research methods, citation, and source use.", stimulusGuide: "citation scenario or source evaluation vignette" },
    { unit: ApUnit.CLEP_CCM_5_CONVENTIONS, name: "Conventions of Standard Written English", keyThemes: ["sentence structure and fragments", "subject-verb agreement", "pronoun reference and case", "comma splices and run-ons"],
      examNotes: "Grammar, mechanics, and sentence structure.", stimulusGuide: "sentence with underlined portion for revision" },
  ],
  CLEP_ENGLISH_LITERATURE: [
    { unit: ApUnit.CLEP_ENGLIT_1_MEDIEVAL_RENAISSANCE, name: "Medieval and Renaissance (to 1660)", keyThemes: ["Chaucer and Middle English", "Shakespearean drama and sonnets", "Spenser and allegory", "metaphysical poets (Donne, Herbert)"],
      examNotes: "CLEP Eng. Lit: 95 MCQ, 90 min. British literature from Beowulf to contemporary.", stimulusGuide: "literary passage excerpt from British prose, poetry, or drama" },
    { unit: ApUnit.CLEP_ENGLIT_2_17TH_18TH_CENTURY, name: "Restoration and 18th Century (1660-1798)", keyThemes: ["Restoration comedy and satire", "Pope and heroic couplets", "Swift's satire", "rise of the novel (Defoe, Fielding, Richardson)"],
      examNotes: "Restoration and Augustan literature.", stimulusGuide: "satirical prose or heroic couplet excerpt" },
    { unit: ApUnit.CLEP_ENGLIT_3_ROMANTIC_PERIOD, name: "Romantic Period (1798-1837)", keyThemes: ["Wordsworth and nature poetry", "Coleridge and supernatural imagination", "Byron, Shelley, and Keats", "Gothic novel (Mary Shelley)"],
      examNotes: "British Romantic poetry and prose.", stimulusGuide: "Romantic poetry excerpt or Gothic prose passage" },
    { unit: ApUnit.CLEP_ENGLIT_4_VICTORIAN, name: "Victorian Period (1837-1901)", keyThemes: ["Dickens and social realism", "Tennyson and dramatic monologue", "Bront\u00eb sisters", "Hardy and late-Victorian pessimism"],
      examNotes: "Victorian fiction and poetry.", stimulusGuide: "Victorian prose or dramatic monologue excerpt" },
    { unit: ApUnit.CLEP_ENGLIT_5_20TH_CENTURY, name: "20th Century and Beyond", keyThemes: ["modernist experimentation (Woolf, Joyce, Eliot)", "post-colonial literature (Achebe, Rushdie)", "dystopian fiction (Orwell, Huxley)", "contemporary British poetry and drama"],
      examNotes: "Modernist and post-colonial British literature.", stimulusGuide: "modernist or post-colonial prose excerpt" },
  ],
  CLEP_HUMANITIES: [
    { unit: ApUnit.CLEP_HUM_1_LITERATURE, name: "Literature", keyThemes: ["major literary genres and forms", "world literature (Greek, Renaissance, modern)", "poetry analysis (meter, imagery, theme)", "drama (tragedy, comedy, absurdist)"],
      examNotes: "CLEP Humanities: 140 MCQ, 90 min. Literature 50%, fine arts 50%.", stimulusGuide: "literary excerpt, artwork description, or musical reference" },
    { unit: ApUnit.CLEP_HUM_2_VISUAL_ARTS, name: "Visual Arts and Architecture", keyThemes: ["art periods (Renaissance, Baroque, Impressionism, Modern)", "sculpture and architecture styles", "elements of visual design", "major artists and movements"],
      examNotes: "Visual arts periods, styles, and major works.", stimulusGuide: "artwork description or architectural style scenario" },
    { unit: ApUnit.CLEP_HUM_3_MUSIC, name: "Music", keyThemes: ["musical periods (Baroque, Classical, Romantic)", "major composers and works", "musical forms (sonata, symphony, opera)", "elements of music (rhythm, harmony, texture)"],
      examNotes: "Music history, forms, and major composers.", stimulusGuide: "musical work reference or period description" },
    { unit: ApUnit.CLEP_HUM_4_PERFORMING_ARTS, name: "Performing Arts and Film", keyThemes: ["theater history and conventions", "dance forms and traditions", "film techniques and genres", "performance art and multimedia"],
      examNotes: "Theater, dance, and film analysis.", stimulusGuide: "theatrical or film scenario description" },
    { unit: ApUnit.CLEP_HUM_5_PHILOSOPHY_RELIGION, name: "Philosophy and Religion", keyThemes: ["major philosophical traditions (Greek, Enlightenment, existentialism)", "world religions and sacred texts", "ethics and moral philosophy", "aesthetics and art theory"],
      examNotes: "Philosophical traditions, world religions, and ethics.", stimulusGuide: "philosophical quotation or ethical scenario" },
  ],
  CLEP_FRENCH: [
    { unit: ApUnit.CLEP_FRENCH_1_LISTENING, name: "Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from context", "distinguishing speakers' attitudes"],
      examNotes: "CLEP French: 120 MCQ, 90 min. Listening adapted to reading-based on platform.", stimulusGuide: "French dialogue or passage excerpt" },
    { unit: ApUnit.CLEP_FRENCH_2_READING, name: "Reading Comprehension", keyThemes: ["passage main idea and details", "vocabulary in context", "author's purpose and tone", "cultural references in text"],
      examNotes: "French reading comprehension and passage analysis.", stimulusGuide: "French prose passage (2-4 sentences)" },
    { unit: ApUnit.CLEP_FRENCH_3_GRAMMAR, name: "Grammar and Structure", keyThemes: ["verb conjugation (present, pass\u00e9 compos\u00e9, imparfait, subjonctif)", "pronoun usage (y, en, direct/indirect objects)", "preposition usage", "relative clauses (qui, que, dont, o\u00f9)"],
      examNotes: "French grammar in context: verb tenses, pronouns, prepositions.", stimulusGuide: "French sentence with grammatical blank" },
    { unit: ApUnit.CLEP_FRENCH_4_VOCABULARY, name: "Vocabulary in Context", keyThemes: ["false cognates (faux amis)", "idiomatic expressions", "word families and derivation", "register and formality (tu vs vous)"],
      examNotes: "French vocabulary, idioms, and register.", stimulusGuide: "French sentence with vocabulary question" },
    { unit: ApUnit.CLEP_FRENCH_5_CULTURE, name: "French Culture and Civilization", keyThemes: ["Francophone world geography", "French customs and daily life", "French history and politics basics", "arts and literature in French-speaking cultures"],
      examNotes: "Francophone culture, customs, and geography.", stimulusGuide: "cultural scenario or Francophone world question" },
  ],
  CLEP_GERMAN: [
    { unit: ApUnit.CLEP_GERMAN_1_LISTENING, name: "Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from conversational context", "distinguishing tone and intent"],
      examNotes: "CLEP German: 120 MCQ, 90 min. Listening adapted to reading-based on platform.", stimulusGuide: "German dialogue or passage excerpt" },
    { unit: ApUnit.CLEP_GERMAN_2_READING, name: "Reading Comprehension", keyThemes: ["passage main idea and supporting details", "vocabulary in context", "author's purpose and perspective", "cultural content in German texts"],
      examNotes: "German reading comprehension and passage analysis.", stimulusGuide: "German prose passage (2-4 sentences)" },
    { unit: ApUnit.CLEP_GERMAN_3_GRAMMAR, name: "Grammar and Structure", keyThemes: ["noun cases (Nominativ, Akkusativ, Dativ, Genitiv)", "verb conjugation and tenses (Pr\u00e4sens, Perfekt, Pr\u00e4teritum)", "word order (V2, subordinate clauses)", "prepositions with case (Wechselpr\u00e4positionen)"],
      examNotes: "German grammar: cases, verb tenses, and word order.", stimulusGuide: "German sentence with grammatical blank" },
    { unit: ApUnit.CLEP_GERMAN_4_VOCABULARY, name: "Vocabulary in Context", keyThemes: ["compound nouns (Komposita)", "false cognates (falsche Freunde)", "idiomatic expressions", "formal vs informal register (Sie vs du)"],
      examNotes: "German vocabulary, compound nouns, and register.", stimulusGuide: "German sentence with vocabulary question" },
    { unit: ApUnit.CLEP_GERMAN_5_CULTURE, name: "German Culture and Civilization", keyThemes: ["German-speaking countries geography", "German customs and traditions", "German reunification and modern society", "arts and literature in German culture"],
      examNotes: "German-speaking world culture and society.", stimulusGuide: "cultural scenario or German history question" },
  ],
  CLEP_SPANISH: [
    { unit: ApUnit.CLEP_SPANISH_1_LISTENING, name: "Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue comprehension", "main idea identification", "inference from context", "distinguishing speakers' attitudes and register"],
      examNotes: "CLEP Spanish: 120 MCQ, 90 min. Listening adapted to reading-based on platform.", stimulusGuide: "Spanish dialogue or passage excerpt" },
    { unit: ApUnit.CLEP_SPANISH_2_READING, name: "Reading Comprehension", keyThemes: ["passage main idea and details", "vocabulary in context", "author's purpose and tone", "cultural references in Hispanic texts"],
      examNotes: "Spanish reading comprehension and passage analysis.", stimulusGuide: "Spanish prose passage (2-4 sentences)" },
    { unit: ApUnit.CLEP_SPANISH_3_GRAMMAR, name: "Grammar and Structure", keyThemes: ["preterite vs imperfect", "subjunctive mood (present and past)", "ser vs estar", "direct/indirect object pronouns"],
      examNotes: "Spanish grammar in context: tenses, subjunctive, ser/estar.", stimulusGuide: "Spanish sentence with grammatical blank" },
    { unit: ApUnit.CLEP_SPANISH_4_VOCABULARY, name: "Vocabulary in Context", keyThemes: ["false cognates (falsos amigos)", "idiomatic expressions (modismos)", "word families and derivation", "regional vocabulary variations"],
      examNotes: "Spanish vocabulary, idioms, and regional variation.", stimulusGuide: "Spanish sentence with vocabulary question" },
    { unit: ApUnit.CLEP_SPANISH_5_CULTURE, name: "Hispanic Culture and Civilization", keyThemes: ["Spanish-speaking world geography", "Hispanic customs and traditions", "major historical events (colonization, independence)", "arts and literature in Hispanic cultures"],
      examNotes: "Hispanic culture, history, and geography.", stimulusGuide: "cultural scenario or Hispanic world question" },
  ],
  CLEP_SPANISH_WRITING: [
    { unit: ApUnit.CLEP_SPANWR_1_LISTENING, name: "Listening Comprehension (Reading Adaptation)", keyThemes: ["dialogue and narrative comprehension", "main idea and supporting details", "inference and implied meaning", "register and tone identification"],
      examNotes: "CLEP Spanish Writing: 120 MCQ + 2 essays. MCQ section covers advanced Spanish.", stimulusGuide: "Spanish dialogue or narrative passage" },
    { unit: ApUnit.CLEP_SPANWR_2_READING, name: "Reading Comprehension", keyThemes: ["literary and journalistic passages", "vocabulary in context", "author's argument and evidence", "cultural and historical references"],
      examNotes: "Advanced Spanish reading: literary and journalistic texts.", stimulusGuide: "Spanish literary or journalistic passage" },
    { unit: ApUnit.CLEP_SPANWR_3_GRAMMAR, name: "Advanced Grammar", keyThemes: ["subjunctive in adverbial clauses", "conditional and future tenses", "passive voice and se constructions", "complex sentence structures"],
      examNotes: "Advanced grammar: subjunctive, conditional, passive se.", stimulusGuide: "complex Spanish sentence with grammatical blank" },
    { unit: ApUnit.CLEP_SPANWR_4_WRITING_SKILLS, name: "Writing Skills (MCQ)", keyThemes: ["sentence completion and cloze", "error identification in paragraphs", "paragraph organization and coherence", "formal writing conventions"],
      examNotes: "Writing skills: error identification and revision.", stimulusGuide: "Spanish paragraph with errors to identify" },
    { unit: ApUnit.CLEP_SPANWR_5_ESSAY, name: "Essay Writing Preparation", keyThemes: ["interpersonal writing (emails, letters)", "presentational writing (essays)", "thesis development in Spanish", "transitional expressions and cohesion"],
      examNotes: "Essay writing skills and formal composition.", stimulusGuide: "essay prompt or writing task scenario" },
  ],
  CLEP_EDUCATIONAL_PSYCHOLOGY: [
    { unit: ApUnit.CLEP_EDPSY_1_LEARNING_THEORIES, name: "Learning Theories", keyThemes: ["Behaviorism and classical/operant conditioning", "Constructivism and Piaget's stages", "Social learning theory and Bandura", "Information processing models"],
      examNotes: "CLEP Ed Psych: 100 MCQ, 90 min. Scenario-based theory application.", stimulusGuide: "classroom scenario or teaching situation" },
    { unit: ApUnit.CLEP_EDPSY_2_COGNITIVE_DEV, name: "Cognitive Development", keyThemes: ["Piaget's stages of cognitive development", "Vygotsky's zone of proximal development", "Language acquisition and development", "Memory, attention, and metacognition"],
      examNotes: "Cognitive development theories and their classroom applications.", stimulusGuide: "student behavior scenario or cognitive development vignette" },
    { unit: ApUnit.CLEP_EDPSY_3_MOTIVATION, name: "Motivation & Learning", keyThemes: ["Intrinsic vs extrinsic motivation", "Self-efficacy and attribution theory", "Maslow's hierarchy and self-determination theory", "Goal orientation and achievement motivation"],
      examNotes: "Motivation theories applied to educational settings.", stimulusGuide: "student motivation scenario or classroom strategy" },
    { unit: ApUnit.CLEP_EDPSY_4_ASSESSMENT, name: "Assessment & Evaluation", keyThemes: ["Formative vs summative assessment", "Reliability, validity, and standardized testing", "Norm-referenced vs criterion-referenced tests", "Rubrics, portfolios, and authentic assessment"],
      examNotes: "Assessment types, psychometric properties, and test design.", stimulusGuide: "assessment design scenario or test data" },
    { unit: ApUnit.CLEP_EDPSY_5_CLASSROOM_MGMT, name: "Classroom Management", keyThemes: ["Proactive classroom management strategies", "Behavioral intervention and reinforcement", "Culturally responsive teaching", "Differentiated instruction and inclusion"],
      examNotes: "Classroom management strategies and inclusive practices.", stimulusGuide: "classroom management scenario or behavioral intervention vignette" },
  ],
  CLEP_SOCIAL_SCIENCES_HISTORY: [
    { unit: ApUnit.CLEP_SSH_1_US_HISTORY, name: "US History", keyThemes: ["Colonial period through independence", "Civil War, Reconstruction, and industrialization", "20th-century domestic policy and civil rights", "US foreign policy and global role"],
      examNotes: "CLEP Soc Sci & History: 120 MCQ, 90 min. Spans 5 social science disciplines.", stimulusGuide: "primary source excerpt, map, or data table" },
    { unit: ApUnit.CLEP_SSH_2_WORLD_HISTORY, name: "World History", keyThemes: ["Ancient civilizations and classical empires", "Medieval and early modern global interactions", "Imperialism, colonialism, and decolonization", "20th-century conflicts and globalization"],
      examNotes: "World history from ancient civilizations to modern era.", stimulusGuide: "historical document excerpt or scenario" },
    { unit: ApUnit.CLEP_SSH_3_ECONOMICS, name: "Economics", keyThemes: ["Supply and demand, market equilibrium", "Macroeconomic indicators: GDP, inflation, unemployment", "Fiscal and monetary policy", "International trade and comparative advantage"],
      examNotes: "Basic economic principles and policy analysis.", stimulusGuide: "economic data or policy scenario" },
    { unit: ApUnit.CLEP_SSH_4_GEOGRAPHY, name: "Geography", keyThemes: ["Physical geography and climate systems", "Human geography and population patterns", "Cultural diffusion and urbanization", "Geopolitics and resource distribution"],
      examNotes: "Physical and human geography concepts.", stimulusGuide: "map description or geographic phenomenon" },
    { unit: ApUnit.CLEP_SSH_5_POLITICAL_SCIENCE, name: "Political Science", keyThemes: ["Democratic theory and political ideologies", "US government structure and Constitution", "Comparative political systems", "International relations and organizations"],
      examNotes: "Political theory, comparative systems, and international relations.", stimulusGuide: "political scenario or comparative government question" },
  ],
  CLEP_WESTERN_CIV_1: [
    { unit: ApUnit.CLEP_WC1_1_ANCIENT_NEAR_EAST, name: "Ancient Near East", keyThemes: ["Mesopotamian civilizations and cuneiform", "Ancient Egypt: pharaohs, religion, and society", "Hebrew traditions and monotheism", "Persian Empire and governance"],
      examNotes: "CLEP Western Civ I: 120 MCQ, 90 min. Ancient Near East through early modern (~1648).", stimulusGuide: "primary source excerpt or historical document" },
    { unit: ApUnit.CLEP_WC1_2_GREECE_ROME, name: "Greece & Rome", keyThemes: ["Athenian democracy and Greek philosophy", "Hellenistic world after Alexander", "Roman Republic institutions and expansion", "Roman Empire: Pax Romana and decline"],
      examNotes: "Greek and Roman political, cultural, and intellectual history.", stimulusGuide: "classical text excerpt or political scenario" },
    { unit: ApUnit.CLEP_WC1_3_MEDIEVAL, name: "Medieval Europe", keyThemes: ["Fall of Rome and early medieval kingdoms", "Feudalism, manorialism, and the Church", "Crusades and East-West cultural exchange", "Byzantine Empire and Islamic civilization"],
      examNotes: "Medieval political, social, and religious structures.", stimulusGuide: "medieval document excerpt or feudal scenario" },
    { unit: ApUnit.CLEP_WC1_4_RENAISSANCE_REFORM, name: "Renaissance & Reformation", keyThemes: ["Italian Renaissance: humanism and art", "Northern Renaissance and printing press", "Protestant Reformation: Luther, Calvin, Zwingli", "Catholic Counter-Reformation and Council of Trent"],
      examNotes: "Renaissance humanism, art, and religious reform movements.", stimulusGuide: "Renaissance artwork description or Reformation document" },
    { unit: ApUnit.CLEP_WC1_5_EARLY_MODERN, name: "Early Modern Europe", keyThemes: ["Age of Exploration and colonial encounters", "Absolutism: Louis XIV, Peter the Great", "Scientific Revolution: Copernicus to Newton", "Early Enlightenment thought"],
      examNotes: "Exploration, absolutism, and Scientific Revolution.", stimulusGuide: "scientific text excerpt or absolutist decree" },
  ],
  CLEP_WESTERN_CIV_2: [
    { unit: ApUnit.CLEP_WC2_1_ENLIGHTENMENT, name: "The Enlightenment", keyThemes: ["Enlightenment philosophy: Locke, Voltaire, Rousseau", "Social contract theory and natural rights", "Enlightened absolutism and reform", "Salon culture and public sphere"],
      examNotes: "CLEP Western Civ II: 120 MCQ, 90 min. Enlightenment (~1648) to present.", stimulusGuide: "Enlightenment text excerpt or philosophical scenario" },
    { unit: ApUnit.CLEP_WC2_2_REVOLUTION_NAPOLEON, name: "Revolution & Napoleon", keyThemes: ["Causes and phases of the French Revolution", "Napoleonic Wars and the Congress of Vienna", "Latin American independence movements", "Nationalism and the 1848 revolutions"],
      examNotes: "French Revolution, Napoleonic era, and nationalist movements.", stimulusGuide: "revolutionary document or political speech" },
    { unit: ApUnit.CLEP_WC2_3_INDUSTRIALIZATION, name: "Industrialization & Society", keyThemes: ["Industrial Revolution: technology and factory system", "Urbanization, labor movements, and socialism", "Imperialism and the scramble for Africa", "Social Darwinism and new ideologies"],
      examNotes: "Industrialization, imperialism, and ideological movements.", stimulusGuide: "factory worker account or imperialist document" },
    { unit: ApUnit.CLEP_WC2_4_WORLD_WARS, name: "World Wars", keyThemes: ["Causes and conduct of World War I", "Interwar period: fascism, communism, depression", "World War II: causes, Holocaust, and total war", "Decolonization and the postwar order"],
      examNotes: "World Wars, totalitarianism, and decolonization.", stimulusGuide: "wartime document or propaganda description" },
    { unit: ApUnit.CLEP_WC2_5_COLD_WAR_PRESENT, name: "Cold War to Present", keyThemes: ["Cold War: containment, NATO, and d\u00e9tente", "Fall of communism and German reunification", "European integration and the EU", "Globalization, terrorism, and contemporary challenges"],
      examNotes: "Cold War, European integration, and contemporary issues.", stimulusGuide: "Cold War speech excerpt or EU policy scenario" },
  ],
  CLEP_COLLEGE_MATH: [
    { unit: ApUnit.CLEP_CMATH_1_SETS_LOGIC, name: "Sets & Logic", keyThemes: ["Set operations: union, intersection, complement", "Venn diagrams and counting principles", "Propositional logic and truth tables", "Conditional statements and logical equivalence"],
      examNotes: "CLEP College Math: 60 MCQ, 90 min. Non-calculus general ed math.", stimulusGuide: "Venn diagram scenario or logic problem" },
    { unit: ApUnit.CLEP_CMATH_2_REAL_NUMBERS, name: "Real Number System", keyThemes: ["Properties of integers and rational numbers", "Absolute value, exponents, and radicals", "Order of operations and algebraic expressions", "Percentages, ratios, and proportions"],
      examNotes: "Number properties, operations, and algebraic reasoning.", stimulusGuide: "arithmetic or algebraic expression problem" },
    { unit: ApUnit.CLEP_CMATH_3_FUNCTIONS, name: "Functions & Their Graphs", keyThemes: ["Domain, range, and function notation", "Linear, quadratic, and polynomial functions", "Exponential and logarithmic functions", "Composition and inverse functions"],
      examNotes: "Function analysis, graphing, and transformations.", stimulusGuide: "function definition or graph description" },
    { unit: ApUnit.CLEP_CMATH_4_PROBABILITY_STATS, name: "Probability & Statistics", keyThemes: ["Basic probability rules and counting", "Conditional probability and independence", "Descriptive statistics: mean, median, standard deviation", "Normal distribution and data interpretation"],
      examNotes: "Probability calculations and statistical reasoning.", stimulusGuide: "data set or probability scenario" },
    { unit: ApUnit.CLEP_CMATH_5_GEOMETRY, name: "Geometry & Measurement", keyThemes: ["Properties of lines, angles, and triangles", "Coordinate geometry and distance formula", "Area, perimeter, and volume calculations", "Transformations and symmetry"],
      examNotes: "Geometric properties, coordinate geometry, and measurement.", stimulusGuide: "geometric figure description or coordinate geometry problem" },
  ],
  CLEP_NATURAL_SCIENCES: [
    { unit: ApUnit.CLEP_NATSCI_1_BIOLOGICAL, name: "Biological Science", keyThemes: ["Cell structure, function, and reproduction", "Genetics, DNA, and heredity", "Evolution and natural selection", "Ecology: ecosystems, populations, and biodiversity"],
      examNotes: "CLEP Natural Sciences: 120 MCQ, 90 min. Biology and physical sciences.", stimulusGuide: "experimental scenario or biological data" },
    { unit: ApUnit.CLEP_NATSCI_2_PHYSICAL, name: "Physical Science", keyThemes: ["Newton's laws and mechanics", "Energy, work, and thermodynamics", "Waves, sound, and light", "Electricity and magnetism fundamentals"],
      examNotes: "Physics fundamentals: mechanics, energy, waves, and EM.", stimulusGuide: "physics scenario or force diagram description" },
    { unit: ApUnit.CLEP_NATSCI_3_EARTH_SPACE, name: "Earth & Space Science", keyThemes: ["Plate tectonics and geological processes", "Atmosphere, weather, and climate", "Solar system and stellar evolution", "Earth's history and fossil record"],
      examNotes: "Earth science, geology, atmosphere, and astronomy.", stimulusGuide: "geological scenario or astronomical observation" },
    { unit: ApUnit.CLEP_NATSCI_4_CHEMISTRY, name: "Chemistry Fundamentals", keyThemes: ["Atomic structure and the periodic table", "Chemical bonding and molecular structure", "Chemical reactions and stoichiometry", "Acids, bases, and solutions"],
      examNotes: "General chemistry: atoms, bonding, reactions, and solutions.", stimulusGuide: "chemical equation or reaction scenario" },
    { unit: ApUnit.CLEP_NATSCI_5_SCIENTIFIC_METHOD, name: "Scientific Method & History", keyThemes: ["Hypothesis testing and experimental design", "Variables, controls, and data analysis", "History of major scientific discoveries", "Ethics and societal impact of science"],
      examNotes: "Scientific method, experimental design, and history of science.", stimulusGuide: "experiment description or scientific discovery scenario" },
  ],
  CLEP_PRECALCULUS: [
    { unit: ApUnit.CLEP_PRECALC_1_ALGEBRAIC, name: "Algebraic Expressions & Equations", keyThemes: ["Polynomial operations and factoring", "Rational expressions and equations", "Systems of equations and inequalities", "Complex numbers and quadratic formula"],
      examNotes: "CLEP Precalculus: 48 MCQ, 90 min. Precalculus topics bridging to calculus.", stimulusGuide: "algebraic expression or equation problem" },
    { unit: ApUnit.CLEP_PRECALC_2_TRIGONOMETRY, name: "Trigonometry", keyThemes: ["Unit circle and radian measure", "Trigonometric functions and identities", "Law of sines and law of cosines", "Inverse trigonometric functions"],
      examNotes: "Trigonometric functions, identities, and applications.", stimulusGuide: "trigonometric equation or triangle problem" },
    { unit: ApUnit.CLEP_PRECALC_3_ANALYTIC_GEOMETRY, name: "Analytic Geometry", keyThemes: ["Conic sections: circles, ellipses, parabolas, hyperbolas", "Parametric equations and polar coordinates", "Vectors in two dimensions", "Transformations and symmetry"],
      examNotes: "Conic sections, parametric/polar, and vectors.", stimulusGuide: "conic section equation or coordinate geometry problem" },
    { unit: ApUnit.CLEP_PRECALC_4_FUNCTIONS, name: "Functions & Modeling", keyThemes: ["Polynomial, rational, and piecewise functions", "Exponential growth and decay models", "Logarithmic functions and equations", "Function transformations and composition"],
      examNotes: "Function analysis, modeling, and transformations.", stimulusGuide: "function definition or real-world modeling scenario" },
    { unit: ApUnit.CLEP_PRECALC_5_LIMITS_INTRO, name: "Sequences, Series & Limits", keyThemes: ["Arithmetic and geometric sequences", "Series and summation notation", "Intuitive concept of limits", "Binomial theorem and counting principles"],
      examNotes: "Sequences, series, and introductory limit concepts.", stimulusGuide: "sequence/series problem or limit scenario" },
  ],
  CLEP_INFORMATION_SYSTEMS: [
    { unit: ApUnit.CLEP_IS_1_FUNDAMENTALS, name: "IS Fundamentals", keyThemes: ["Role of information systems in organizations", "Types of IS: TPS, MIS, DSS, ERP", "Information system components and architecture", "IT governance and strategic alignment"],
      examNotes: "CLEP Info Systems: 100 MCQ, 90 min. Management information systems.", stimulusGuide: "organizational scenario or system architecture description" },
    { unit: ApUnit.CLEP_IS_2_HARDWARE_SOFTWARE, name: "Hardware & Software", keyThemes: ["Computer hardware components and architecture", "Operating systems and system software", "Application software and cloud computing", "Mobile computing and emerging technologies"],
      examNotes: "Hardware, software, cloud, and emerging technology.", stimulusGuide: "technology selection scenario or system specification" },
    { unit: ApUnit.CLEP_IS_3_DATABASES, name: "Databases & Data Management", keyThemes: ["Relational database concepts and SQL basics", "Data modeling and entity-relationship diagrams", "Data warehousing and business intelligence", "Big data, data quality, and data governance"],
      examNotes: "Database design, SQL, and data management.", stimulusGuide: "ER diagram scenario or SQL query problem" },
    { unit: ApUnit.CLEP_IS_4_NETWORKS_SECURITY, name: "Networks & Security", keyThemes: ["Network topologies, protocols, and the internet", "Cybersecurity threats and defense strategies", "Encryption, authentication, and access control", "Privacy, compliance, and ethical considerations"],
      examNotes: "Networking, cybersecurity, and privacy.", stimulusGuide: "security incident scenario or network design problem" },
    { unit: ApUnit.CLEP_IS_5_SYSTEMS_DEVELOPMENT, name: "Systems Development", keyThemes: ["Systems development life cycle (SDLC)", "Agile, Scrum, and iterative methodologies", "Project management and requirements analysis", "Testing, implementation, and maintenance"],
      examNotes: "SDLC, Agile methodologies, and project management.", stimulusGuide: "development methodology scenario or project planning vignette" },
  ],
  CLEP_BUSINESS_LAW: [
    { unit: ApUnit.CLEP_BIZLAW_1_LEGAL_SYSTEM, name: "The Legal System", keyThemes: ["Sources of law: constitutional, statutory, administrative", "Court systems and jurisdiction", "Civil vs criminal procedure", "Alternative dispute resolution: mediation and arbitration"],
      examNotes: "CLEP Business Law: 100 MCQ, 90 min. Legal principles applied to business.", stimulusGuide: "legal scenario or court jurisdiction problem" },
    { unit: ApUnit.CLEP_BIZLAW_2_CONTRACTS, name: "Contracts", keyThemes: ["Elements of a valid contract: offer, acceptance, consideration", "Capacity, legality, and statute of frauds", "Contract performance, breach, and remedies", "Third-party rights and assignment"],
      examNotes: "Contract formation, performance, and remedies.", stimulusGuide: "contract dispute fact pattern" },
    { unit: ApUnit.CLEP_BIZLAW_3_SALES_TORTS, name: "Sales & Torts", keyThemes: ["UCC Article 2: sale of goods", "Warranties: express, implied, and disclaimer", "Intentional torts: battery, fraud, defamation", "Negligence: duty, breach, causation, damages"],
      examNotes: "UCC sales, warranty law, and tort liability.", stimulusGuide: "tort scenario or product liability vignette" },
    { unit: ApUnit.CLEP_BIZLAW_4_BUSINESS_ORG, name: "Business Organizations", keyThemes: ["Sole proprietorships and partnerships", "Corporations: formation, governance, liability", "LLCs and limited partnerships", "Agency law and fiduciary duties"],
      examNotes: "Business entity types, formation, and governance.", stimulusGuide: "business formation scenario or liability question" },
    { unit: ApUnit.CLEP_BIZLAW_5_EMPLOYMENT_ETHICS, name: "Employment Law & Ethics", keyThemes: ["Employment discrimination and Title VII", "Workplace safety: OSHA and workers' compensation", "Intellectual property: patents, trademarks, copyrights", "Business ethics and corporate social responsibility"],
      examNotes: "Employment law, IP, and business ethics.", stimulusGuide: "employment dispute or ethical dilemma scenario" },
  ],

  // ── DSST Courses ──────────────────────────────────────────────────────────
  DSST_PRINCIPLES_OF_SUPERVISION: [
    { unit: ApUnit.DSST_SUPV_1_ROLES_RESPONSIBILITIES, name: "Roles and Responsibilities", keyThemes: ["supervisory roles", "authority and responsibility", "delegation", "span of control"], examNotes: "DSST Supervision: 100 MCQ, 120 min.", stimulusGuide: "workplace scenario" },
    { unit: ApUnit.DSST_SUPV_2_MANAGEMENT_FUNCTIONS, name: "Management Functions", keyThemes: ["planning", "organizing", "leading", "controlling"], examNotes: "POLC framework.", stimulusGuide: "management decision scenario" },
    { unit: ApUnit.DSST_SUPV_3_LEADERSHIP, name: "Leadership and Communication", keyThemes: ["leadership styles", "conflict resolution", "active listening", "team building"], examNotes: "Communication and leadership.", stimulusGuide: "leadership dilemma" },
    { unit: ApUnit.DSST_SUPV_4_LABOR_RELATIONS, name: "Labor Relations", keyThemes: ["labor unions", "collective bargaining", "OSHA", "EEOC"], examNotes: "Labor law and workplace safety.", stimulusGuide: "labor dispute scenario" },
    { unit: ApUnit.DSST_SUPV_5_TRAINING_PERFORMANCE, name: "Training and Performance", keyThemes: ["performance appraisal", "coaching", "progressive discipline", "training methods"], examNotes: "Employee development.", stimulusGuide: "performance review scenario" },
  ],
  DSST_HUMAN_RESOURCE_MANAGEMENT: [
    { unit: ApUnit.DSST_HRM_1_WORKFORCE_PLANNING, name: "Workforce Planning", keyThemes: ["job analysis", "Title VII", "ADA", "FMLA"], examNotes: "DSST HRM: 100 MCQ, 120 min.", stimulusGuide: "HR planning scenario" },
    { unit: ApUnit.DSST_HRM_2_RECRUITMENT_SELECTION, name: "Recruitment and Selection", keyThemes: ["recruiting strategies", "interviewing", "selection tests", "onboarding"], examNotes: "Hiring process.", stimulusGuide: "recruitment scenario" },
    { unit: ApUnit.DSST_HRM_3_TRAINING_DEVELOPMENT, name: "Training and Development", keyThemes: ["needs assessment", "training methods", "career development", "mentoring"], examNotes: "Employee development.", stimulusGuide: "training program scenario" },
    { unit: ApUnit.DSST_HRM_4_COMPENSATION_BENEFITS, name: "Compensation and Benefits", keyThemes: ["pay structures", "incentive plans", "health insurance", "FLSA"], examNotes: "Pay and benefits.", stimulusGuide: "compensation design scenario" },
    { unit: ApUnit.DSST_HRM_5_EMPLOYEE_RELATIONS, name: "Employee Relations", keyThemes: ["employee engagement", "disciplinary procedures", "unions", "NLRA"], examNotes: "Labor relations.", stimulusGuide: "employee dispute scenario" },
  ],
  DSST_ORGANIZATIONAL_BEHAVIOR: [
    { unit: ApUnit.DSST_OB_1_INDIVIDUAL_BEHAVIOR, name: "Individual Behavior", keyThemes: ["personality traits", "perception", "job satisfaction", "Big Five"], examNotes: "DSST OB: 100 MCQ, 120 min.", stimulusGuide: "workplace behavior scenario" },
    { unit: ApUnit.DSST_OB_2_MOTIVATION_THEORIES, name: "Motivation Theories", keyThemes: ["Maslow", "Herzberg", "expectancy theory", "goal-setting"], examNotes: "Motivation frameworks.", stimulusGuide: "employee motivation scenario" },
    { unit: ApUnit.DSST_OB_3_GROUP_DYNAMICS, name: "Group Dynamics", keyThemes: ["group development", "groupthink", "social loafing", "team roles"], examNotes: "Team behavior.", stimulusGuide: "team conflict scenario" },
    { unit: ApUnit.DSST_OB_4_LEADERSHIP_POWER, name: "Leadership and Power", keyThemes: ["transformational leadership", "sources of power", "ethical leadership"], examNotes: "Leadership theories.", stimulusGuide: "leadership style scenario" },
    { unit: ApUnit.DSST_OB_5_ORGANIZATIONAL_CHANGE, name: "Organizational Change", keyThemes: ["change management", "Lewin model", "organizational culture", "resistance"], examNotes: "Org design and change.", stimulusGuide: "change management scenario" },
  ],
  DSST_PERSONAL_FINANCE: [
    { unit: ApUnit.DSST_PF_1_FINANCIAL_PLANNING, name: "Financial Planning", keyThemes: ["budgeting", "financial goals", "time value of money", "net worth"], examNotes: "DSST Personal Finance: 100 MCQ, 120 min.", stimulusGuide: "budget scenario" },
    { unit: ApUnit.DSST_PF_2_CREDIT_DEBT, name: "Credit and Debt", keyThemes: ["credit scores", "interest rates", "debt reduction", "bankruptcy"], examNotes: "Credit management.", stimulusGuide: "credit scenario" },
    { unit: ApUnit.DSST_PF_3_INVESTING, name: "Investing", keyThemes: ["stocks", "bonds", "mutual funds", "diversification", "compound interest"], examNotes: "Investment fundamentals.", stimulusGuide: "investment comparison scenario" },
    { unit: ApUnit.DSST_PF_4_INSURANCE_RISK, name: "Insurance and Risk", keyThemes: ["health insurance", "life insurance", "deductibles", "risk assessment"], examNotes: "Insurance types.", stimulusGuide: "insurance selection scenario" },
    { unit: ApUnit.DSST_PF_5_RETIREMENT_ESTATE, name: "Retirement and Estate", keyThemes: ["Social Security", "401(k)", "Roth IRA", "estate planning"], examNotes: "Retirement planning.", stimulusGuide: "retirement scenario" },
  ],
  DSST_LIFESPAN_DEV_PSYCHOLOGY: [
    { unit: ApUnit.DSST_LDP_1_PRENATAL_INFANCY, name: "Prenatal and Infancy", keyThemes: ["prenatal stages", "teratogens", "attachment theory", "sensorimotor stage"], examNotes: "DSST Lifespan: 100 MCQ, 120 min.", stimulusGuide: "developmental case" },
    { unit: ApUnit.DSST_LDP_2_CHILDHOOD, name: "Childhood", keyThemes: ["Piaget stages", "Vygotsky", "language development", "parenting styles"], examNotes: "Childhood development.", stimulusGuide: "child behavior case" },
    { unit: ApUnit.DSST_LDP_3_ADOLESCENCE, name: "Adolescence", keyThemes: ["identity formation", "Erikson", "peer influence", "formal operations"], examNotes: "Adolescent development.", stimulusGuide: "teen behavior case" },
    { unit: ApUnit.DSST_LDP_4_ADULTHOOD, name: "Adulthood", keyThemes: ["intimacy vs isolation", "generativity", "career development", "midlife"], examNotes: "Adult development.", stimulusGuide: "adult life transition case" },
    { unit: ApUnit.DSST_LDP_5_AGING_DEATH, name: "Aging and Death", keyThemes: ["integrity vs despair", "cognitive decline", "Kubler-Ross", "end-of-life"], examNotes: "Late adulthood.", stimulusGuide: "aging scenario" },
  ],
  DSST_INTRO_TO_BUSINESS: [
    { unit: ApUnit.DSST_BUS_1_ECONOMIC_FOUNDATIONS, name: "Economic Foundations", keyThemes: ["economic systems", "supply and demand", "market structures", "GDP"], examNotes: "DSST Intro Business: 100 MCQ, 120 min.", stimulusGuide: "business scenario" },
    { unit: ApUnit.DSST_BUS_2_BUSINESS_OWNERSHIP, name: "Business Ownership", keyThemes: ["sole proprietorship", "partnerships", "corporations", "franchising"], examNotes: "Business structures.", stimulusGuide: "ownership scenario" },
    { unit: ApUnit.DSST_BUS_3_MANAGEMENT_LEADERSHIP, name: "Management and Leadership", keyThemes: ["management functions", "leadership styles", "motivation theories", "strategic planning"], examNotes: "Management principles.", stimulusGuide: "management scenario" },
    { unit: ApUnit.DSST_BUS_4_MARKETING_FUNDAMENTALS, name: "Marketing Fundamentals", keyThemes: ["marketing mix", "segmentation", "consumer behavior", "branding"], examNotes: "Marketing concepts.", stimulusGuide: "marketing scenario" },
    { unit: ApUnit.DSST_BUS_5_FINANCE_ACCOUNTING, name: "Finance and Accounting", keyThemes: ["financial statements", "balance sheet", "income statement", "financial ratios"], examNotes: "Business finance.", stimulusGuide: "financial data" },
  ],
  DSST_HUMAN_DEVELOPMENT: [
    { unit: ApUnit.DSST_HD_1_THEORIES_RESEARCH, name: "Theories and Research", keyThemes: ["developmental theories", "nature vs nurture", "research methods", "cross-sectional vs longitudinal"], examNotes: "DSST Human Dev: 100 MCQ, 120 min.", stimulusGuide: "research scenario" },
    { unit: ApUnit.DSST_HD_2_PRENATAL_INFANCY, name: "Prenatal and Infancy", keyThemes: ["prenatal stages", "teratogens", "attachment theory", "temperament"], examNotes: "Prenatal/infant development.", stimulusGuide: "developmental case" },
    { unit: ApUnit.DSST_HD_3_CHILDHOOD, name: "Childhood", keyThemes: ["cognitive development", "language acquisition", "moral reasoning", "parenting styles"], examNotes: "Childhood development.", stimulusGuide: "child behavior case" },
    { unit: ApUnit.DSST_HD_4_ADOLESCENCE_ADULTHOOD, name: "Adolescence and Adulthood", keyThemes: ["identity formation", "Erikson stages", "career development", "midlife transition"], examNotes: "Adolescence/adulthood.", stimulusGuide: "life stage case" },
    { unit: ApUnit.DSST_HD_5_AGING_DEATH, name: "Aging and Death", keyThemes: ["physical aging", "cognitive decline", "Kubler-Ross stages", "end-of-life"], examNotes: "Late adulthood.", stimulusGuide: "aging scenario" },
  ],
  DSST_ETHICS_IN_AMERICA: [
    { unit: ApUnit.DSST_EIA_1_ETHICAL_TRADITIONS, name: "Ethical Traditions", keyThemes: ["utilitarianism", "deontology", "virtue ethics", "social contract"], examNotes: "DSST Ethics: 100 MCQ, 120 min.", stimulusGuide: "ethical dilemma" },
    { unit: ApUnit.DSST_EIA_2_CIVIL_LIBERTIES, name: "Civil Liberties", keyThemes: ["freedom of speech", "due process", "equal protection", "privacy rights"], examNotes: "Civil liberties.", stimulusGuide: "rights scenario" },
    { unit: ApUnit.DSST_EIA_3_SOCIAL_JUSTICE, name: "Social Justice", keyThemes: ["distributive justice", "Rawls", "affirmative action", "human rights"], examNotes: "Social justice issues.", stimulusGuide: "justice dilemma" },
    { unit: ApUnit.DSST_EIA_4_BIOETHICS, name: "Bioethics", keyThemes: ["informed consent", "euthanasia", "genetic engineering", "patient autonomy"], examNotes: "Medical ethics.", stimulusGuide: "bioethics case" },
    { unit: ApUnit.DSST_EIA_5_BUSINESS_GOV_ETHICS, name: "Business and Government Ethics", keyThemes: ["corporate responsibility", "whistleblowing", "environmental ethics", "ethical leadership"], examNotes: "Business ethics.", stimulusGuide: "corporate dilemma" },
  ],
  DSST_ENVIRONMENTAL_SCIENCE: [
    { unit: ApUnit.DSST_ENV_1_ECOSYSTEMS, name: "Ecosystems and Biodiversity", keyThemes: ["ecosystem structure", "food webs", "energy flow", "biogeochemical cycles"], examNotes: "DSST Env Science: 100 MCQ, 120 min.", stimulusGuide: "ecosystem scenario" },
    { unit: ApUnit.DSST_ENV_2_POPULATION_RESOURCES, name: "Population and Resources", keyThemes: ["population growth", "carrying capacity", "water resources", "deforestation"], examNotes: "Population/resources.", stimulusGuide: "resource scenario" },
    { unit: ApUnit.DSST_ENV_3_POLLUTION_WASTE, name: "Pollution and Waste", keyThemes: ["air pollution", "water pollution", "solid waste", "ozone depletion"], examNotes: "Pollution management.", stimulusGuide: "pollution scenario" },
    { unit: ApUnit.DSST_ENV_4_ENERGY, name: "Energy", keyThemes: ["fossil fuels", "nuclear energy", "solar energy", "energy conservation"], examNotes: "Energy sources.", stimulusGuide: "energy scenario" },
    { unit: ApUnit.DSST_ENV_5_POLICY_SUSTAINABILITY, name: "Policy and Sustainability", keyThemes: ["Clean Air Act", "EPA", "climate change policy", "sustainable development"], examNotes: "Environmental policy.", stimulusGuide: "policy scenario" },
  ],
  DSST_TECHNICAL_WRITING: [
    { unit: ApUnit.DSST_TW_1_PURPOSE_AUDIENCE, name: "Purpose and Audience", keyThemes: ["audience analysis", "purpose identification", "tone and style", "reader expectations"], examNotes: "DSST Tech Writing: 100 MCQ, 120 min.", stimulusGuide: "writing sample" },
    { unit: ApUnit.DSST_TW_2_DOCUMENT_DESIGN, name: "Document Design", keyThemes: ["document structure", "headings", "visual design", "page layout"], examNotes: "Document design.", stimulusGuide: "document excerpt" },
    { unit: ApUnit.DSST_TW_3_RESEARCH_DOCUMENTATION, name: "Research and Documentation", keyThemes: ["source evaluation", "APA format", "MLA format", "plagiarism"], examNotes: "Research skills.", stimulusGuide: "citation scenario" },
    { unit: ApUnit.DSST_TW_4_REVISION_EDITING, name: "Revision and Editing", keyThemes: ["clarity", "concision", "active voice", "proofreading"], examNotes: "Editing skills.", stimulusGuide: "revision sample" },
    { unit: ApUnit.DSST_TW_5_WORKPLACE_COMM, name: "Workplace Communication", keyThemes: ["memos", "business reports", "proposals", "email etiquette"], examNotes: "Workplace documents.", stimulusGuide: "workplace scenario" },
  ],
  DSST_PRINCIPLES_OF_FINANCE: [
    { unit: ApUnit.DSST_FIN_1_FINANCIAL_STATEMENTS, name: "Financial Statements", keyThemes: ["balance sheet", "income statement", "cash flow", "financial ratios"], examNotes: "DSST Finance: 100 MCQ, 120 min.", stimulusGuide: "financial data" },
    { unit: ApUnit.DSST_FIN_2_TIME_VALUE_MONEY, name: "Time Value of Money", keyThemes: ["present value", "future value", "compounding", "annuities"], examNotes: "TVM calculations.", stimulusGuide: "calculation scenario" },
    { unit: ApUnit.DSST_FIN_3_RISK_RETURN, name: "Risk and Return", keyThemes: ["diversification", "CAPM", "beta", "risk-return tradeoff"], examNotes: "Risk analysis.", stimulusGuide: "investment scenario" },
    { unit: ApUnit.DSST_FIN_4_CAPITAL_MARKETS, name: "Capital Markets", keyThemes: ["stocks", "bonds", "mutual funds", "yield to maturity"], examNotes: "Capital markets.", stimulusGuide: "market scenario" },
    { unit: ApUnit.DSST_FIN_5_CORPORATE_FINANCE, name: "Corporate Finance", keyThemes: ["NPV", "IRR", "cost of capital", "capital structure"], examNotes: "Corporate finance.", stimulusGuide: "budgeting scenario" },
  ],
  DSST_MANAGEMENT_INFO_SYSTEMS: [
    { unit: ApUnit.DSST_MIS_1_IT_FUNDAMENTALS, name: "IT Fundamentals", keyThemes: ["hardware", "software", "operating systems", "cloud computing"], examNotes: "DSST MIS: 100 MCQ, 120 min.", stimulusGuide: "IT scenario" },
    { unit: ApUnit.DSST_MIS_2_DATABASES, name: "Databases", keyThemes: ["relational databases", "SQL", "data modeling", "normalization"], examNotes: "Database management.", stimulusGuide: "database scenario" },
    { unit: ApUnit.DSST_MIS_3_NETWORKS_SECURITY, name: "Networks and Security", keyThemes: ["network topologies", "TCP/IP", "firewalls", "cybersecurity"], examNotes: "Network security.", stimulusGuide: "network scenario" },
    { unit: ApUnit.DSST_MIS_4_SYSTEMS_DEVELOPMENT, name: "Systems Development", keyThemes: ["SDLC", "Agile", "Waterfall", "requirements analysis"], examNotes: "Systems development.", stimulusGuide: "project scenario" },
    { unit: ApUnit.DSST_MIS_5_BUSINESS_INTELLIGENCE, name: "Business Intelligence", keyThemes: ["data analytics", "ERP systems", "CRM", "decision support"], examNotes: "Business intelligence.", stimulusGuide: "BI scenario" },
  ],
  DSST_MONEY_AND_BANKING: [
    { unit: ApUnit.DSST_MB_1_MONEY_FINANCIAL_SYSTEM, name: "Money and Financial System", keyThemes: ["functions of money", "M1/M2", "financial intermediaries", "interest rates"], examNotes: "DSST Money & Banking: 100 MCQ, 120 min.", stimulusGuide: "monetary scenario" },
    { unit: ApUnit.DSST_MB_2_BANKING_INSTITUTIONS, name: "Banking Institutions", keyThemes: ["commercial banks", "credit unions", "FDIC", "bank regulation"], examNotes: "Banking system.", stimulusGuide: "banking scenario" },
    { unit: ApUnit.DSST_MB_3_FEDERAL_RESERVE, name: "Federal Reserve", keyThemes: ["Fed structure", "FOMC", "reserve requirements", "discount rate"], examNotes: "Federal Reserve.", stimulusGuide: "Fed scenario" },
    { unit: ApUnit.DSST_MB_4_MONETARY_POLICY, name: "Monetary Policy", keyThemes: ["open market operations", "federal funds rate", "quantitative easing", "money multiplier"], examNotes: "Monetary policy.", stimulusGuide: "policy scenario" },
    { unit: ApUnit.DSST_MB_5_INTERNATIONAL_FINANCE, name: "International Finance", keyThemes: ["exchange rates", "balance of payments", "currency markets", "trade deficits"], examNotes: "International finance.", stimulusGuide: "forex scenario" },
  ],
  DSST_SUBSTANCE_ABUSE: [
    { unit: ApUnit.DSST_SA_1_PHARMACOLOGY, name: "Pharmacology", keyThemes: ["drug classification", "pharmacokinetics", "depressants", "stimulants"], examNotes: "DSST Substance Abuse: 100 MCQ, 120 min.", stimulusGuide: "pharmacology case" },
    { unit: ApUnit.DSST_SA_2_ALCOHOL, name: "Alcohol", keyThemes: ["alcohol pharmacology", "BAC", "alcoholism", "fetal alcohol syndrome"], examNotes: "Alcohol effects.", stimulusGuide: "alcohol case" },
    { unit: ApUnit.DSST_SA_3_DRUGS_SOCIETY, name: "Drugs and Society", keyThemes: ["addiction mechanisms", "tolerance", "dependence", "social factors"], examNotes: "Drugs and society.", stimulusGuide: "substance use case" },
    { unit: ApUnit.DSST_SA_4_TREATMENT_PREVENTION, name: "Treatment and Prevention", keyThemes: ["12-step programs", "CBT", "harm reduction", "detoxification"], examNotes: "Treatment approaches.", stimulusGuide: "treatment scenario" },
    { unit: ApUnit.DSST_SA_5_POLICY_LAW, name: "Policy and Law", keyThemes: ["Controlled Substances Act", "DEA scheduling", "drug courts", "legalization"], examNotes: "Drug policy.", stimulusGuide: "policy scenario" },
  ],
  DSST_CRIMINAL_JUSTICE: [
    { unit: ApUnit.DSST_CJ_1_CRIME_THEORY, name: "Crime Theory", keyThemes: ["criminological theories", "classical school", "social learning theory", "strain theory"], examNotes: "DSST Criminal Justice: 100 MCQ, 120 min.", stimulusGuide: "crime scenario" },
    { unit: ApUnit.DSST_CJ_2_LAW_ENFORCEMENT, name: "Law Enforcement", keyThemes: ["policing models", "community policing", "use of force", "Fourth Amendment"], examNotes: "Law enforcement.", stimulusGuide: "policing scenario" },
    { unit: ApUnit.DSST_CJ_3_COURTS_ADJUDICATION, name: "Courts and Adjudication", keyThemes: ["court structure", "due process", "plea bargaining", "sentencing"], examNotes: "Court procedures.", stimulusGuide: "trial scenario" },
    { unit: ApUnit.DSST_CJ_4_CORRECTIONS, name: "Corrections", keyThemes: ["incarceration", "probation", "parole", "rehabilitation"], examNotes: "Corrections system.", stimulusGuide: "corrections scenario" },
    { unit: ApUnit.DSST_CJ_5_JUVENILE_JUSTICE, name: "Juvenile Justice", keyThemes: ["juvenile court", "delinquency", "diversion programs", "restorative justice"], examNotes: "Juvenile system.", stimulusGuide: "juvenile case" },
  ],
  DSST_FUNDAMENTALS_OF_COUNSELING: [
    { unit: ApUnit.DSST_COUN_1_THEORIES, name: "Counseling Theories", keyThemes: ["psychodynamic", "CBT", "humanistic", "person-centered"], examNotes: "DSST Counseling: 100 MCQ, 120 min.", stimulusGuide: "therapy case" },
    { unit: ApUnit.DSST_COUN_2_TECHNIQUES, name: "Techniques and Skills", keyThemes: ["active listening", "empathy", "reflection", "goal setting"], examNotes: "Counseling techniques.", stimulusGuide: "counseling scenario" },
    { unit: ApUnit.DSST_COUN_3_GROUP_FAMILY, name: "Group and Family", keyThemes: ["group dynamics", "family systems", "couples therapy", "therapeutic factors"], examNotes: "Group/family therapy.", stimulusGuide: "group scenario" },
    { unit: ApUnit.DSST_COUN_4_ASSESSMENT, name: "Assessment and Diagnosis", keyThemes: ["psychological testing", "DSM-5", "intake interviews", "reliability/validity"], examNotes: "Assessment tools.", stimulusGuide: "assessment case" },
    { unit: ApUnit.DSST_COUN_5_ETHICS_PROFESSIONAL, name: "Ethics and Professional Issues", keyThemes: ["ACA ethics", "confidentiality", "informed consent", "dual relationships"], examNotes: "Professional ethics.", stimulusGuide: "ethics dilemma" },
  ],
  DSST_GENERAL_ANTHROPOLOGY: [
    { unit: ApUnit.DSST_ANTH_1_PHYSICAL, name: "Physical Anthropology", keyThemes: ["human evolution", "primatology", "natural selection", "hominid fossils"], examNotes: "DSST Anthropology: 100 MCQ, 120 min.", stimulusGuide: "fossil/evolution case" },
    { unit: ApUnit.DSST_ANTH_2_ARCHAEOLOGY, name: "Archaeology", keyThemes: ["archaeological methods", "dating techniques", "excavation", "artifact analysis"], examNotes: "Archaeological methods.", stimulusGuide: "dig scenario" },
    { unit: ApUnit.DSST_ANTH_3_CULTURAL, name: "Cultural Anthropology", keyThemes: ["cultural relativism", "kinship systems", "subsistence strategies", "political organization"], examNotes: "Cultural anthropology.", stimulusGuide: "ethnographic case" },
    { unit: ApUnit.DSST_ANTH_4_LINGUISTIC, name: "Linguistic Anthropology", keyThemes: ["Sapir-Whorf hypothesis", "phonology", "sociolinguistics", "language change"], examNotes: "Linguistic anthropology.", stimulusGuide: "language case" },
    { unit: ApUnit.DSST_ANTH_5_APPLIED, name: "Applied Anthropology", keyThemes: ["medical anthropology", "forensic anthropology", "globalization", "ethical issues"], examNotes: "Applied anthropology.", stimulusGuide: "applied case" },
  ],
  DSST_WORLD_RELIGIONS: [
    { unit: ApUnit.DSST_REL_1_HINDUISM_BUDDHISM, name: "Hinduism and Buddhism", keyThemes: ["Vedas", "karma/dharma", "Four Noble Truths", "Eightfold Path"], examNotes: "DSST World Religions: 100 MCQ, 120 min.", stimulusGuide: "religious text excerpt" },
    { unit: ApUnit.DSST_REL_2_JUDAISM, name: "Judaism", keyThemes: ["Torah", "covenant", "prophets", "Jewish holidays"], examNotes: "Judaism.", stimulusGuide: "religious practice case" },
    { unit: ApUnit.DSST_REL_3_CHRISTIANITY, name: "Christianity", keyThemes: ["life of Jesus", "sacraments", "Reformation", "denominations"], examNotes: "Christianity.", stimulusGuide: "theological scenario" },
    { unit: ApUnit.DSST_REL_4_ISLAM, name: "Islam", keyThemes: ["Five Pillars", "Quran", "Sunni vs Shia", "Islamic Golden Age"], examNotes: "Islam.", stimulusGuide: "Islamic practice case" },
    { unit: ApUnit.DSST_REL_5_OTHER_TRADITIONS, name: "Other Traditions", keyThemes: ["Sikhism", "Confucianism", "Taoism", "indigenous religions"], examNotes: "Other religions.", stimulusGuide: "comparative scenario" },
  ],
  DSST_ART_WESTERN_WORLD: [
    { unit: ApUnit.DSST_ART_1_ANCIENT_MEDIEVAL, name: "Ancient and Medieval", keyThemes: ["Greek art", "Roman art", "Byzantine", "Gothic cathedrals"], examNotes: "DSST Western Art: 100 MCQ, 120 min.", stimulusGuide: "artwork description" },
    { unit: ApUnit.DSST_ART_2_RENAISSANCE_BAROQUE, name: "Renaissance and Baroque", keyThemes: ["Leonardo", "Michelangelo", "Baroque drama", "Rembrandt"], examNotes: "Renaissance/Baroque.", stimulusGuide: "artwork description" },
    { unit: ApUnit.DSST_ART_3_NEOCLASSICAL_ROMANTIC, name: "Neoclassical and Romantic", keyThemes: ["Neoclassicism", "Romanticism", "David", "Delacroix"], examNotes: "Neoclassical/Romantic.", stimulusGuide: "artwork description" },
    { unit: ApUnit.DSST_ART_4_MODERN, name: "Modern Art", keyThemes: ["Impressionism", "Cubism", "Surrealism", "Abstract Expressionism"], examNotes: "Modern art movements.", stimulusGuide: "artwork description" },
    { unit: ApUnit.DSST_ART_5_CONTEMPORARY, name: "Contemporary Art", keyThemes: ["Pop Art", "Minimalism", "Conceptual Art", "postmodernism"], examNotes: "Contemporary art.", stimulusGuide: "artwork description" },
  ],
  DSST_ASTRONOMY: [
    { unit: ApUnit.DSST_ASTR_1_SOLAR_SYSTEM, name: "Solar System", keyThemes: ["planets", "solar system formation", "Kepler's laws", "planetary atmospheres"], examNotes: "DSST Astronomy: 100 MCQ, 120 min.", stimulusGuide: "astronomical observation" },
    { unit: ApUnit.DSST_ASTR_2_STARS_STELLAR, name: "Stars and Stellar Evolution", keyThemes: ["HR diagram", "nuclear fusion", "main sequence", "supernovae"], examNotes: "Stellar evolution.", stimulusGuide: "star data" },
    { unit: ApUnit.DSST_ASTR_3_GALAXIES, name: "Galaxies", keyThemes: ["Milky Way", "galaxy types", "active galactic nuclei", "quasars"], examNotes: "Galaxies.", stimulusGuide: "galaxy observation" },
    { unit: ApUnit.DSST_ASTR_4_COSMOLOGY, name: "Cosmology", keyThemes: ["Big Bang", "cosmic microwave background", "dark matter", "dark energy"], examNotes: "Cosmology.", stimulusGuide: "cosmological data" },
    { unit: ApUnit.DSST_ASTR_5_OBSERVATIONAL, name: "Observational Astronomy", keyThemes: ["telescopes", "electromagnetic spectrum", "spectroscopy", "space missions"], examNotes: "Observational techniques.", stimulusGuide: "observation scenario" },
  ],
  DSST_COMPUTING_AND_IT: [
    { unit: ApUnit.DSST_CIT_1_HARDWARE_SOFTWARE, name: "Hardware and Software", keyThemes: ["CPU", "memory", "operating systems", "application software"], examNotes: "DSST Computing: 100 MCQ, 120 min.", stimulusGuide: "computing scenario" },
    { unit: ApUnit.DSST_CIT_2_NETWORKING, name: "Networking", keyThemes: ["TCP/IP", "network topologies", "Wi-Fi", "cloud computing"], examNotes: "Networking.", stimulusGuide: "network scenario" },
    { unit: ApUnit.DSST_CIT_3_PROGRAMMING, name: "Programming", keyThemes: ["programming languages", "algorithms", "control structures", "OOP"], examNotes: "Programming concepts.", stimulusGuide: "code scenario" },
    { unit: ApUnit.DSST_CIT_4_DATABASES_WEB, name: "Databases and Web", keyThemes: ["SQL", "HTML/CSS", "web development", "e-commerce"], examNotes: "Databases/web.", stimulusGuide: "web scenario" },
    { unit: ApUnit.DSST_CIT_5_SECURITY_ETHICS, name: "Security and Ethics", keyThemes: ["cybersecurity", "encryption", "privacy", "IT ethics"], examNotes: "Security/ethics.", stimulusGuide: "security scenario" },
  ],
  DSST_CIVIL_WAR: [
    { unit: ApUnit.DSST_CW_1_ANTEBELLUM, name: "Antebellum America", keyThemes: ["slavery debate", "sectionalism", "Compromise of 1850", "Dred Scott"], examNotes: "DSST Civil War: 100 MCQ, 120 min.", stimulusGuide: "primary source excerpt" },
    { unit: ApUnit.DSST_CW_2_SECESSION_EARLY_WAR, name: "Secession and Early War", keyThemes: ["election of 1860", "Fort Sumter", "border states", "early battles"], examNotes: "Early war.", stimulusGuide: "historical scenario" },
    { unit: ApUnit.DSST_CW_3_MAJOR_CAMPAIGNS, name: "Major Campaigns", keyThemes: ["Gettysburg", "Vicksburg", "Sherman's March", "Grant's strategy"], examNotes: "Major battles.", stimulusGuide: "battle scenario" },
    { unit: ApUnit.DSST_CW_4_HOME_FRONT, name: "Home Front", keyThemes: ["Emancipation Proclamation", "women in war", "draft riots", "African American soldiers"], examNotes: "Home front.", stimulusGuide: "home front scenario" },
    { unit: ApUnit.DSST_CW_5_RECONSTRUCTION, name: "Reconstruction", keyThemes: ["13th-15th Amendments", "Freedmen's Bureau", "Radical Reconstruction", "end of Reconstruction"], examNotes: "Reconstruction era.", stimulusGuide: "Reconstruction scenario" },
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

// Per-course model override — courses where free models underperform (e.g. USH free-response
// style nuance, STATS numerical-reasoning). Uses Anthropic Sonnet direct.
// Set via env PREMIUM_COURSES=AP_US_HISTORY,AP_STATISTICS to override at runtime.
const DEFAULT_PREMIUM_COURSES = new Set(["AP_US_HISTORY", "AP_STATISTICS"]);
const PREMIUM_COURSES: Set<string> = (() => {
  const env = process.env.PREMIUM_COURSES;
  if (!env) return DEFAULT_PREMIUM_COURSES;
  return new Set(env.split(",").map(s => s.trim()).filter(Boolean));
})();

async function callSonnet(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No ANTHROPIC_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: "You are an AP exam question generator. Always respond with valid JSON only.",
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`Anthropic-Sonnet ${res.status}: ${body.slice(0, 140)}`);
  }
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.[0]?.text;
  if (!text?.trim()) throw new Error("Anthropic-Sonnet: empty response");
  return text.trim();
}

async function callAI(prompt: string, course?: string): Promise<string> {
  // Premium-override path: route specific courses to Sonnet direct.
  if (course && PREMIUM_COURSES.has(course) && process.env.ANTHROPIC_API_KEY) {
    try {
      return await callSonnet(prompt);
    } catch (e) {
      console.warn(`  [premium] Sonnet failed for ${course}, falling back to Groq: ${(e as Error).message.slice(0, 100)}`);
      // fall through to Groq cascade
    }
  }
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
          const raw = await callAI(buildPrompt(course, unitData, difficulty, topic), course);
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

#!/usr/bin/env node
/**
 * Seed CB-style FRQ subtypes for every AP course.
 *
 * For each course, the exam page on apcentral.collegeboard.org defines
 * specific FRQ subtypes. Generic "FRQ" or "SAQ" doesn't reflect this.
 * E.g. AP Psych has AAQ (Article Analysis) + EBQ (Evidence-Based);
 * AP US Gov has 4 distinct FRQ types; AP Stats has 5 multipart + 1
 * Investigative Task; etc.
 *
 * This script generates 5 of each subtype per course. Tags via
 * `subtopic` field with the CB-official name so the FRQ Practice UI
 * can group/label them correctly.
 *
 * Usage:
 *   node scripts/seed-cb-frq-subtypes.mjs                     # all 11 courses
 *   node scripts/seed-cb-frq-subtypes.mjs AP_PSYCHOLOGY       # one course
 *   node scripts/seed-cb-frq-subtypes.mjs --per 5             # 5 each (default)
 *   node scripts/seed-cb-frq-subtypes.mjs --dry               # plan only
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const perArg = args.find((a, i) => args[i - 1] === "--per");
const PER = perArg ? parseInt(perArg, 10) : 5;
const courseFilter = args.find((a) => a.startsWith("AP_"));

const PACE_MS = 2500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Per-course subtype config. Each subtype includes:
//   - cbName: official CB label (used as subtopic tag)
//   - qtype: enum value to store
//   - description: what the question demands
//   - example: 1-2 line CB-style example for AI seed
const COURSES = {
  AP_US_GOVERNMENT: {
    units: ["USGOV_1_FOUNDATIONS","USGOV_2_INTERACTIONS_BRANCHES","USGOV_3_CIVIL_LIBERTIES_RIGHTS","USGOV_4_IDEOLOGIES_BELIEFS","USGOV_5_POLITICAL_PARTICIPATION"],
    subtypes: [
      { cbName: "Concept Application", qtype: "FRQ", description: "Brief scenario describing a political situation. (A) Describe a political concept. (B) Explain how a power/principle relates to scenario. (C) Explain how this could be challenged.", example: "Senator's voting against constituent majority — describe trustee model, explain how it relates, identify a way it conflicts with delegate model." },
      { cbName: "Quantitative Analysis", qtype: "FRQ", description: "Given a data table or chart. (A) Identify a trend. (B) Describe what the data show. (C) Draw a conclusion + relate to political principle. (D) Connect to a foundational document.", example: "Voter turnout by demographic 2008-2020 — identify a trend, describe pattern, explain implications, connect to 26th Amendment." },
      { cbName: "SCOTUS Comparison", qtype: "FRQ", description: "Given a non-required Supreme Court case. (A) Identify a clause/principle in common with a required case. (B) Explain the relevance. (C) Describe a political action that could result.", example: "Snyder v. Phelps (2011) — compare to Tinker v. Des Moines, identify First Amendment connection, explain implications." },
      { cbName: "Argument Essay", qtype: "LEQ", description: "Take and defend a position on a political question. Thesis + evidence (one required document + one other) + responsive argument addressing alternative view. ~40 minutes.", example: "Defend or refute: the Senate filibuster strengthens minority rights at the expense of majority rule. Cite Federalist No. 51 + one other document." },
    ],
  },
  AP_HUMAN_GEOGRAPHY: {
    units: ["HUGEO_1_THINKING_GEOGRAPHICALLY","HUGEO_2_POPULATION_MIGRATION","HUGEO_3_CULTURAL_PATTERNS","HUGEO_4_POLITICAL_PATTERNS","HUGEO_5_AGRICULTURE_RURAL","HUGEO_6_URBAN_LAND_USE","HUGEO_7_INDUSTRIAL_ECONOMIC"],
    subtypes: [
      { cbName: "FRQ 1 (No-Stimulus)", qtype: "FRQ", description: "Question without any stimulus material. 7 parts (A-G), each requiring a paragraph response. Tests definitions, descriptions, comparisons, explanations across geographic concepts.", example: "Migration trends 1900-present — define push/pull factors, describe two pull factors driving rural-to-urban migration, explain how globalization affects migration patterns, etc." },
      { cbName: "FRQ 2 (1-Stimulus)", qtype: "FRQ", description: "Question with 1 stimulus (data table, image, or map). 7 parts (A-G) referring to the stimulus. Tests interpretation + application across scales.", example: "Population pyramid for Germany 2020 — describe shape, explain economic implications, compare to a Stage 2 country, propose a policy response, evaluate effectiveness." },
      { cbName: "FRQ 3 (2-Stimulus)", qtype: "FRQ", description: "Question with 2 stimuli (data, images, and/or maps). 7 parts (A-G) requiring synthesis across both. At least one part assesses analysis across geographic scales.", example: "GDP-per-capita map + urbanization rate map — describe spatial pattern in #1, explain relationship to #2, identify a region that doesn't fit, etc." },
    ],
  },
  AP_PSYCHOLOGY: {
    units: ["PSYC_1_BIOLOGICAL_BASES","PSYC_2_COGNITION","PSYC_3_DEVELOPMENT_LEARNING","PSYC_4_SOCIAL_PERSONALITY","PSYC_5_MENTAL_PHYSICAL_HEALTH"],
    subtypes: [
      { cbName: "AAQ (Article Analysis)", qtype: "FRQ", description: "Based on 1 summarized peer-reviewed source. 7 points across 6 parts: (A) Identify research method. (B) Identify variable. (C) Interpret a statistic. (D) Apply ethical guideline. (E) Assess study generalizability. (F) Argument + application.", example: "Study on social media use and adolescent self-esteem — identify the IV, interpret r=0.42, evaluate the ethics of the consent process, etc." },
      { cbName: "EBQ (Evidence-Based)", qtype: "FRQ", description: "Based on 3 summarized peer-reviewed sources on a single topic. 7 points across 3 parts: (A) State a claim. (B) Cite 2 pieces of evidence from sources. (C) Reasoning connecting evidence + AP Psych concept.", example: "Three studies on bilingualism and cognition — state a claim about whether bilingualism enhances executive function, cite specific evidence from 2 of the 3 studies, connect via the cognitive load theory." },
    ],
  },
  AP_ENVIRONMENTAL_SCIENCE: {
    units: ["APES_1_ECOSYSTEMS","APES_2_BIODIVERSITY","APES_3_POPULATIONS","APES_4_EARTH_SYSTEMS","APES_5_LAND_WATER_USE","APES_6_ENERGY","APES_7_ATMOSPHERIC_POLLUTION","APES_8_AQUATIC_TERRESTRIAL_POLLUTION","APES_9_GLOBAL_CHANGE"],
    subtypes: [
      { cbName: "Design Investigation", qtype: "FRQ", description: "Design a scientific investigation. Includes a model/visual or quantitative data. Identify hypothesis, variables, controls, replicates. Propose data analysis approach.", example: "Effect of fertilizer runoff on lake algae blooms — design a controlled experiment with 4 treatment groups + control." },
      { cbName: "Analyze + Propose Solution", qtype: "FRQ", description: "Analyze an environmental problem with model/visual or quantitative data. Identify causes, propose solution, evaluate solution's tradeoffs.", example: "Coal-power plant SO2 emissions exceeding standards — analyze cause, propose 2 mitigation strategies, evaluate cost vs benefit." },
      { cbName: "Analyze + Calculate", qtype: "FRQ", description: "Analyze environmental problem requiring quantitative calculations (carbon flux, watt-hours, ppm dilution, etc.).", example: "Wind farm with 100 turbines × 2 MW × 30% capacity — calculate annual energy output in GWh + CO2 offset vs coal." },
    ],
  },
  AP_BIOLOGY: {
    units: ["BIOL_1_CHEMISTRY_OF_LIFE","BIOL_2_CELL_STRUCTURE","BIOL_3_CELLULAR_ENERGETICS","BIOL_4_CELL_COMMUNICATION","BIOL_5_HEREDITY","BIOL_6_GENE_EXPRESSION","BIOL_7_NATURAL_SELECTION","BIOL_8_ECOLOGY"],
    subtypes: [
      { cbName: "Long FRQ (Interpret Experiment)", qtype: "FRQ", description: "9-point question. Interpret experimental results. Includes data table or graph. Justify claims with evidence + reasoning.", example: "Enzyme rate at varying pH — interpret data table, identify optimum pH, propose biological explanation, predict effect of mutation." },
      { cbName: "Long FRQ (Graphing)", qtype: "FRQ", description: "9-point question. Interpret experimental results AND construct a graph from given data. Specify axes, labels, units.", example: "Population growth data over 20 generations — construct logistic-growth curve, identify carrying capacity, predict effect of disease outbreak." },
      { cbName: "Short FRQ (Investigation)", qtype: "FRQ", description: "4-point. Scientific investigation: state hypothesis, identify variables, propose method.", example: "Bee foraging preference — state testable hypothesis, identify IV/DV, describe experimental procedure with controls." },
      { cbName: "Short FRQ (Conceptual)", qtype: "FRQ", description: "4-point. Conceptual analysis. Apply biological principle to scenario.", example: "Cell signaling cascade fails after kinase mutation — explain expected downstream effects + cellular consequences." },
      { cbName: "Short FRQ (Model/Visual)", qtype: "FRQ", description: "4-point. Analyze a model or visual representation (pathway, graph, anatomical diagram).", example: "Given Krebs cycle diagram with one step blocked — identify which substrate accumulates + what stops being produced." },
      { cbName: "Short FRQ (Data Analysis)", qtype: "FRQ", description: "4-point. Data analysis. Interpret a chart/table + draw conclusion.", example: "Allele frequency over 10 generations — identify whether population is in Hardy-Weinberg equilibrium + cite data." },
    ],
  },
  AP_CHEMISTRY: {
    units: ["CHEM_1_ATOMIC_STRUCTURE","CHEM_2_MOLECULAR_IONIC","CHEM_3_INTERMOLECULAR","CHEM_4_CHEMICAL_REACTIONS","CHEM_5_KINETICS","CHEM_6_THERMODYNAMICS","CHEM_7_EQUILIBRIUM","CHEM_8_ACIDS_BASES","CHEM_9_APPLICATIONS"],
    subtypes: [
      { cbName: "Long FRQ (10pt)", qtype: "FRQ", description: "10-point comprehensive question. Multi-part. Often includes calculation, mechanism explanation, equilibrium analysis. Use KaTeX for equations.", example: "Buffer system at pH 4.74: calculate pKa, write Ka expression, determine equilibrium concentrations after adding strong base, explain LeChatelier shift." },
      { cbName: "Short FRQ (4pt)", qtype: "FRQ", description: "4-point question. Single concept depth: stoichiometry calc, Lewis structure, reaction prediction, etc.", example: "Predict reaction products and balance equation for Fe + dilute HCl. Justify with electrochemistry standard reduction potentials." },
    ],
  },
  AP_PHYSICS_1: {
    units: ["PHY1_1_KINEMATICS","PHY1_2_FORCES_AND_NEWTONS_LAWS","PHY1_3_CIRCULAR_MOTION_GRAVITATION","PHY1_4_ENERGY","PHY1_5_MOMENTUM","PHY1_6_SIMPLE_HARMONIC_MOTION","PHY1_7_TORQUE_AND_ROTATION","PHY1_8_ELECTRIC_CHARGE_AND_FORCE","PHY1_9_DC_CIRCUITS","PHY1_10_WAVES_AND_SOUND"],
    subtypes: [
      { cbName: "Mathematical Routines", qtype: "FRQ", description: "Multi-step calculation using physics formulas. Show full work with KaTeX.", example: "2 kg block on 30° incline (μ=0.2) — calculate acceleration, time to slide 5 m, kinetic energy at bottom." },
      { cbName: "Translation Between Representations", qtype: "FRQ", description: "Convert between graphical, numerical, equation, and verbal descriptions of a physical situation.", example: "Given a v-t graph for projectile — sketch corresponding x-t graph, write x(t) equation, describe motion in 2 sentences." },
      { cbName: "Experimental Design + Analysis", qtype: "FRQ", description: "Design and analyze a lab experiment. Identify variables, controls, sources of error. Propose data-collection method.", example: "Determine spring constant k of unknown spring using only meter stick + masses — describe procedure, list controls, explain how to compute k from data." },
      { cbName: "Qualitative/Quantitative Translation", qtype: "FRQ", description: "Combine quantitative calculation with qualitative reasoning paragraph. Multi-step.", example: "Roller-coaster cart at top of loop (radius R, speed v) — calculate normal force, then explain (in 2-3 sentences) why students often incorrectly believe N = mg + mv²/R at top." },
    ],
  },
  AP_STATISTICS: {
    units: ["STATS_1_EXPLORING_DATA","STATS_2_MODELING_DATA","STATS_3_COLLECTING_DATA","STATS_4_PROBABILITY","STATS_5_SAMPLING_DISTRIBUTIONS","STATS_6_INFERENCE_PROPORTIONS","STATS_7_INFERENCE_MEANS","STATS_8_CHI_SQUARE","STATS_9_INFERENCE_SLOPES"],
    subtypes: [
      { cbName: "Multipart (Collecting Data)", qtype: "FRQ", description: "Multi-part FRQ on study design: identify sampling method, explain bias risks, propose randomization, predict effect of confounders.", example: "Researcher surveys 200 college students about exercise habits via campus volunteer signup — identify sampling bias, propose stratified random sample, etc." },
      { cbName: "Multipart (Exploring Data)", qtype: "FRQ", description: "Multi-part FRQ on summary stats + data display. Compute mean/median/sd, construct boxplot, describe shape/center/spread, compare distributions.", example: "Two soccer leagues' goals-per-game data — construct parallel boxplots, describe shape comparison, identify any outliers." },
      { cbName: "Multipart (Probability + Sampling)", qtype: "FRQ", description: "Multi-part FRQ on probability rules, sampling distributions, normal approximation.", example: "Coin flipped 100 times — find P(X≥60), describe sampling distribution of p̂, identify when CLT applies." },
      { cbName: "Multipart (Inference)", qtype: "FRQ", description: "Multi-part FRQ on hypothesis tests + confidence intervals. State H0/Ha, conditions, test statistic, p-value, conclusion in context.", example: "Two-sample t-test for difference in mean GPA between morning/afternoon classes — full hypothesis test." },
      { cbName: "Multipart (Combined Skills)", qtype: "FRQ", description: "Multi-part FRQ combining multiple skill categories from prior 4. Tests synthesis.", example: "Given a chi-square goodness-of-fit + binomial probability + sampling design components." },
      { cbName: "Investigative Task", qtype: "FRQ", description: "Long extended question (~25 min). Apply concepts in NEW or NON-ROUTINE context. Multi-step open-ended analysis.", example: "Researcher claims a coin is biased. You're given 200 flips data. Design a test, execute analysis, interpret in context, evaluate alternatives." },
    ],
  },
  AP_CALCULUS_AB: {
    units: ["CALC_AB_1_LIMITS","CALC_AB_2_DIFFERENTIATION","CALC_AB_3_DIFF_APPLICATIONS","CALC_AB_4_INTEGRATION","CALC_AB_5_INTEG_APPLICATIONS","CALC_AB_6_DIFF_EQUATIONS"],
    subtypes: [
      { cbName: "FRQ Calculator (Part A)", qtype: "FRQ", description: "Multi-part FRQ requiring graphing calculator. Often involves numerical integration, derivative at point, root-finding. Show calculator output.", example: "f(x) = sin(x²) on [0,3] — find ∫f dx via numerical methods, find x where f'(x)=0, classify critical point." },
      { cbName: "FRQ No-Calculator (Part B)", qtype: "FRQ", description: "Multi-part FRQ requiring exact analytical work. No calculator. Common: Fundamental Theorem of Calc, IVP, related rates, optimization.", example: "Given y' = 2xy, y(0)=1 — find general solution, evaluate y(1), determine whether y is increasing on (0,2)." },
    ],
  },
  AP_CALCULUS_BC: {
    units: ["CALC_BC_1_LIMITS","CALC_BC_2_DIFFERENTIATION","CALC_BC_3_DIFF_APPLICATIONS","CALC_BC_4_INTEGRATION","CALC_BC_5_INTEG_APPLICATIONS","CALC_BC_6_DIFF_EQUATIONS","CALC_BC_7_PARAMETRIC_POLAR","CALC_BC_8_INFINITE_SERIES"],
    subtypes: [
      { cbName: "FRQ Calculator (Part A)", qtype: "FRQ", description: "Multi-part FRQ requiring graphing calculator. May involve series convergence checks, parametric/polar integrals.", example: "Parametric curve x=t²,y=t³-3t — find arc length on [0,2] via numerical integration." },
      { cbName: "FRQ No-Calculator (Part B)", qtype: "FRQ", description: "Multi-part FRQ. No calculator. Often Taylor series, convergence tests, polar/parametric area.", example: "Find Maclaurin series for f(x)=ln(1+x²), determine radius of convergence, evaluate f(1/2) using first 3 terms." },
    ],
  },
  AP_PRECALCULUS: {
    units: ["PRECALC_1_POLYNOMIAL_RATIONAL","PRECALC_2_EXPONENTIAL_LOGARITHMIC","PRECALC_3_TRIGONOMETRIC_POLAR","PRECALC_4_FUNCTIONS_PARAMETERS_VECTORS_MATRICES"],
    subtypes: [
      { cbName: "Function Concepts", qtype: "FRQ", description: "Q1 of CB exam. Tests function notation, transformations, composition, inverse. Calculator-allowed (Part A).", example: "f(x) = (x-2)/(x+1) — find inverse, domain of inverse, where f(g(x))=x for g(x)=(2x+1)/(x-1)." },
      { cbName: "Modeling Non-Periodic", qtype: "FRQ", description: "Q2 of CB exam. Build a model from data using polynomial, rational, exponential, or logarithmic function. Calculator-allowed.", example: "Bacterial population doubles every 3 hrs — build exponential model, predict at 24 hrs, compare with linear model." },
      { cbName: "Modeling Periodic", qtype: "FRQ", description: "Q3 of CB exam. Model periodic phenomena with sinusoidal function. Identify amplitude, period, phase shift, vertical translation. No calculator (Part B).", example: "Tide depth oscillates between 2m and 8m on 12-hr cycle — write h(t), find depth at t=4 hrs, time to reach 7m." },
      { cbName: "Symbolic Manipulations", qtype: "FRQ", description: "Q4 of CB exam. Algebraic manipulation: simplify expressions, solve equations, prove identities. No calculator.", example: "Solve sin(2x) = √3·cos(x) for x ∈ [0, 2π) — exact form. Prove tan²(x)+1 = sec²(x)." },
    ],
  },
  AP_COMPUTER_SCIENCE_PRINCIPLES: {
    units: ["CSP_1_CREATIVE_DEVELOPMENT","CSP_2_DATA","CSP_3_ALGORITHMS_PROGRAMMING","CSP_4_COMPUTING_SYSTEMS","CSP_5_IMPACT_OF_COMPUTING"],
    subtypes: [
      { cbName: "Written Response 1 (Program Design)", qtype: "FRQ", description: "Describe program purpose + function. Identify pre-developed code segment + explain what it does. Reference Personalized Project Reference.", example: "Program tracks user's daily water intake — describe purpose, identify a function, explain how user input flows through the program." },
      { cbName: "Written Response 2 (Algorithm/Errors/Data)", qtype: "FRQ", description: "Three connected parts. (a) Algorithm development with sequencing/selection/iteration. (b) Errors + testing strategy. (c) Procedural/data abstraction.", example: "Given a sorting algorithm — explain algorithm step-by-step (a), identify a logic error if input has duplicates (b), describe how a list abstraction simplifies code (c)." },
    ],
  },
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

async function callGroq(systemPrompt, userPrompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2500,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(75_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

async function genQuestion(course, unit, subtype) {
  const prompt = `Generate one CB-style ${subtype.cbName} for AP ${course.replace('AP_', '').replace(/_/g, ' ')}.

Subtype description: ${subtype.description}
Example: ${subtype.example}
Unit: ${unit}

Return JSON:
{
  "questionText": "the multi-part question stem (use \\n for line breaks; show parts as (A), (B), (C) etc.)",
  "stimulus": "data/source/scenario as needed for this subtype (markdown tables, KaTeX, fenced code blocks as appropriate; or null if none)",
  "explanation": "complete CB-style scoring rubric showing point breakdown + sample high-scoring response per part (200-800 chars).",
  "topic": "brief topic tag (3-5 words)",
  "subtopic": "${subtype.cbName}",
  "difficulty": "MEDIUM" or "HARD",
  "correctAnswer": "Same as explanation"
}

The subtopic field MUST be exactly "${subtype.cbName}" — that's how the FRQ Practice UI labels it.

Output ONLY valid JSON.`;
  return await callGroq(
    `You are an AP exam content writer trained on College Board ${course.replace('AP_', '')} CED + scoring rubric standards. Generate authentic CB-style content.`,
    prompt,
  );
}

async function insert(course, unit, qtype, gen, cbName) {
  if (!gen.questionText || !gen.explanation) return false;
  await sql`
    INSERT INTO questions (
      id, course, unit, topic, subtopic, difficulty, "questionType",
      "questionText", stimulus, "correctAnswer", explanation,
      "isAiGenerated", "isApproved", "modelUsed", "generatedForTier",
      "createdAt", "updatedAt"
    ) VALUES (
      ${"cm" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36).slice(-4)},
      ${course}::"ApCourse",
      ${unit}::"ApUnit",
      ${gen.topic ?? "general"},
      ${cbName},
      ${gen.difficulty ?? "HARD"}::"Difficulty",
      ${qtype}::"QuestionType",
      ${gen.questionText},
      ${gen.stimulus ?? null},
      ${gen.correctAnswer ?? gen.explanation},
      ${gen.explanation},
      true, true, 'llama-3.3-70b-versatile', 'PREMIUM'::"SubTier",
      NOW(), NOW()
    )
  `;
  return true;
}

(async () => {
  console.log(`\n📚 CB FRQ subtype seed — ${PER} per subtype per course\n`);

  const targets = courseFilter ? { [courseFilter]: COURSES[courseFilter] } : COURSES;
  if (!targets[Object.keys(targets)[0]]) {
    console.error(`Unknown course: ${courseFilter}`);
    process.exit(1);
  }

  let totalAdded = 0, totalErr = 0;
  for (const [course, cfg] of Object.entries(targets)) {
    if (!cfg) continue;
    console.log(`\n=== ${course} (${cfg.subtypes.length} subtypes × ${PER} = ${cfg.subtypes.length * PER}) ===\n`);

    for (const sub of cfg.subtypes) {
      console.log(`  -- ${sub.cbName} --`);
      for (let i = 0; i < PER; i++) {
        const unit = cfg.units[i % cfg.units.length];
        try {
          if (dry) {
            console.log(`    [DRY] ${sub.cbName} ${i + 1}/${PER} unit=${unit}`);
            continue;
          }
          const gen = await genQuestion(course, unit, sub);
          if (await insert(course, unit, sub.qtype, gen, sub.cbName)) {
            totalAdded++;
            console.log(`    ✓ ${sub.cbName} ${i + 1}: ${(gen.questionText || '').slice(0, 70)}…`);
          }
        } catch (e) {
          totalErr++;
          console.error(`    ✗ ${sub.cbName} ${i + 1}: ${e.message?.slice(0, 100)}`);
        }
        await sleep(PACE_MS);
      }
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Added: ${totalAdded}`);
  console.log(`  Errors: ${totalErr}`);
})().catch((e) => { console.error("Fatal:", e); process.exit(1); });

#!/usr/bin/env node
/**
 * Fix 2 (P0) per CB audit — USGov/HuGeo/APES MCQs are 99-100% naked recall stems
 * despite real CB exams in those 3 courses being 100% data-grounded
 * (graphs, tables, case studies, founding-doc excerpts).
 *
 * For each approved MCQ in those courses with stimulus IS NULL, ask Groq to
 * generate a CB-style stimulus (course-specific):
 *   - USGov: founding-doc excerpt, Pew/Gallup-style polling table, SCOTUS case summary, scenario
 *   - HuGeo: choropleth-map description, population-pyramid markdown table, von Thünen ring case study
 *   - APES: data table with Mean ± SE, ecosystem case study, environmental-impact figure description
 *
 * The new stimulus must be CONSISTENT with the existing correct answer.
 * Validator gate: LENGTH(stimulus) >= 80 AND stimulus IS NOT NULL.
 *
 * Idempotent — re-running skips MCQs that already have non-null stimulus.
 *
 * Usage:
 *   node scripts/seed-stimulus-naked-mcqs.mjs --dry --limit 5 AP_US_GOVERNMENT
 *   node scripts/seed-stimulus-naked-mcqs.mjs --limit 50           # all 3 courses
 *   node scripts/seed-stimulus-naked-mcqs.mjs                       # full sweep
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const args = process.argv.slice(2);
const dry = args.includes("--dry");
const limitArg = args.find((a, i) => args[i - 1] === "--limit");
const LIMIT = limitArg ? parseInt(limitArg, 10) : Infinity;
const courseFilter = args.find((a) => /^(AP_|SAT_|ACT_|CLEP_)/.test(a));

const PACE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY && !dry) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const TARGET_COURSES = [
  "AP_US_GOVERNMENT", "AP_HUMAN_GEOGRAPHY", "AP_ENVIRONMENTAL_SCIENCE",
  "AP_US_HISTORY", "AP_WORLD_HISTORY", "AP_EUROPEAN_HISTORY",
  "AP_PSYCHOLOGY", "AP_MACROECONOMICS", "AP_MICROECONOMICS",
  "AP_ENGLISH_LANGUAGE", "AP_ENGLISH_LITERATURE",
  "SAT_READING_WRITING", "ACT_READING", "ACT_ENGLISH", "ACT_SCIENCE",
];

const STIMULUS_GUIDANCE = {
  AP_US_GOVERNMENT: `Choose ONE format that fits the question:
- Founding document excerpt (Federalist 10/51, Brutus I, Letter from Birmingham Jail, Declaration of Independence, Constitution clause). Format: "Source: [Author], [Document], [Year]\\n\\n\\"[Quoted excerpt 80-150 words]\\""
- 2-column polling/data table. Format: "Source: [Pew/Gallup/Census], [Year]\\n\\n| Group | Percentage |\\n|---|---|\\n| ... | ... |"
- SCOTUS case summary (e.g., Marbury v. Madison, McCulloch v. Maryland, Brown v. Board). Format: "Case: [Name] ([Year])\\nFacts: [2-3 sentences]\\nHolding: [1-2 sentences]"
- Political scenario (filibuster, executive order, judicial review). 80-200 words, set in current/recent context.`,
  AP_HUMAN_GEOGRAPHY: `Choose ONE format that fits the question:
- Population pyramid description as markdown table. Format: "Country [X] Population Pyramid, [Year]\\n| Age | % Male | % Female |\\n|---|---|---|\\n| 0-14 | 15% | 14% |\\n..."
- Choropleth-map description ("The map shows [variable] by country/region. High values cluster in [region], low values in [region]. Notable outliers: [country].")
- Von Thünen / Burgess / Hoyt model case study (urban land-use rings, sectors)
- Migration/diffusion case study (gentrification, suburbanization, rural-to-urban)
- Economic geography table (GDP by sector, fertility rate by HDI, etc.)`,
  AP_US_HISTORY: `Choose ONE format that fits the question:
- Primary-source excerpt with full source line "Source: [Author], [role], [document type], [year]" then 60-100 words excerpt. Use real historical figures: Jacob Riis (1890s), Frederick Douglass (1840s-60s), Walter LaFeber (post-WWII historian), Sean Wilentz (modern historian), W.E.B. Du Bois (1900s), Booker T. Washington, FDR (1930s), MLK Jr. (1960s).
- Statistical/quantitative table: "Source: [BLS/Census/Historical Statistics], [Year]\\n\\n| Year | Variable | Value |\\n|---|---|---|"
- Political cartoon described in text + brief caption.
- Era-defining law/court-decision excerpt: Kansas-Nebraska Act (1854), Dred Scott (1857), 14th Amendment, Brown v. Board (1954), Voting Rights Act (1965).
- Choose era-appropriate sources matching the question's period.`,
  AP_ENVIRONMENTAL_SCIENCE: `Choose ONE format that fits the question:
- Markdown data table with Mean ± SE. Format: "| Treatment | Mean ± SE |\\n|---|---|\\n| Control | 4.2 ± 0.3 |\\n..."
- Ecosystem case study (eutrophication, succession, food web). 100-200 words.
- Environmental-impact data (CO2 ppm by year, biodiversity index, Simpson's index).
- Figure description: "Figure 1 shows [variable] across [time/space]. Treatment X resulted in [pattern]. Control showed [pattern]."
- Pollution / sampling design scenario.`,
  AP_WORLD_HISTORY: `Choose ONE format that fits the question:
- Primary-source excerpt with full source line "Source: [Author], [role], [document type], [year]" then 60-100 words. Use real world historical figures by era: Ibn Battuta (1300s), Marco Polo (1270s), Ghazi Mustafa Kemal (1920s), Jose Marti (1890s), Mahatma Gandhi (1920s-40s), Mao Zedong (1940s-60s), Nelson Mandela (1960s-90s), Voltaire (1700s).
- Statistical/trade-data table: "Source: [Maddison Project / UN / Historical Statistics], [Year]\\n\\n| Year | Variable | Value |\\n|---|---|---|"
- Map description (Silk Road, trans-Saharan trade, Mongol Empire extent, colonial holdings by year).
- Treaty / law / decree excerpt: Treaty of Tordesillas (1494), Tanzimat reforms, Open Door Notes (1899).
- Era-appropriate source matching the unit (1200-1450, 1450-1750, 1750-1900, 1900-present).`,
  AP_EUROPEAN_HISTORY: `Choose ONE format that fits the question:
- Primary-source excerpt with full source line then 60-100 words. Use real European figures by era: Machiavelli (1500s), Luther (1517), Galileo (1610s), Locke (1689), Voltaire (1750s), Marx (1848), Bismarck (1860s), Hitler (1930s), Churchill (1940s).
- Statistical/economic table: "Source: [Maddison / Eurostat / Historical Statistics], [Year]"
- Map description (Holy Roman Empire, partitions of Poland, alliances 1914, Cold War Europe).
- Treaty / decree excerpt: Westphalia (1648), Versailles (1919), Treaty of Rome (1957).
- Era-appropriate source matching the unit (1450-1648, 1648-1815, 1815-1914, 1914-present).`,
  AP_PSYCHOLOGY: `Choose ONE format that fits the question:
- Research study summary with citation: "Researcher [Name] ([year]) studied [topic]. Method: [design]. Results: [outcome]." Use real psych researchers: Milgram (1963 obedience), Asch (1956 conformity), Bandura (1961 Bobo doll), Loftus (1974 misinformation), Tversky/Kahneman (1974 heuristics).
- Clinical case vignette: 80-150 words describing a client's symptoms/behavior, used as basis for diagnosis or treatment-approach question.
- Brain/anatomy diagram described in text: "The image shows the [structure]. The labeled area is responsible for [function]."
- Experimental data table with N, condition, mean, SE.
- DSM-5 criteria scenario for a disorder.`,
  AP_MACROECONOMICS: `Choose ONE format that fits the question:
- Economic data table: "Source: [BEA / BLS / Federal Reserve / IMF], [Year]\\n\\n| Year | GDP | Inflation | Unemployment |\\n|---|---|---|---|"
- AD/AS or Phillips Curve scenario described in text (shifts, gaps, fiscal/monetary policy responses).
- Real-world policy excerpt: Fed announcement, fiscal-package summary, central-bank rate decision.
- Open-economy scenario (exchange rates, current account, capital flows).
- Multi-country comparison case (developing vs developed economy data).`,
  AP_MICROECONOMICS: `Choose ONE format that fits the question:
- Supply-and-demand graph described in text: "The graph shows market for [good]. Equilibrium at P=$[X], Q=[Y]. A [shift] causes new equilibrium at..."
- Cost/revenue data table: "Firm X output data:\\n| Q | TC | TR |\\n|---|---|---|"
- Market scenario: monopoly, oligopoly, perfect competition with specific firm details.
- Externality / public goods case study (pollution, infrastructure, vaccines).
- Game theory payoff matrix in markdown table.`,
  AP_ENGLISH_LANGUAGE: `Choose ONE format that fits the question:
- Non-fiction prose excerpt 100-200 words, with citation: "Source: [Author], '[essay/speech title],' [year]." Use rhetorical-canon writers: Frederick Douglass, Sojourner Truth, Virginia Woolf, James Baldwin, Joan Didion, Ta-Nehisi Coates, Annie Dillard, Henry David Thoreau.
- Argument-essay excerpt with clear thesis, evidence, rhetorical devices visible.
- Speech excerpt (King 'I Have a Dream', Lincoln 'Gettysburg Address', JFK Inaugural, Obama 'A More Perfect Union').
- The passage MUST be the basis for the rhetorical-analysis question — quote the specific text the question references.`,
  AP_ENGLISH_LITERATURE: `Choose ONE format that fits the question:
- Poem (full or 8-16 lines) with attribution. Use canonical poets: Dickinson, Whitman, Eliot, Frost, Plath, Hughes, Heaney, Bishop, Stevens.
- Prose passage 100-200 words from a novel/short story with attribution. Use canonical authors: Austen, Brontë, Dickens, Hawthorne, Twain, Joyce, Woolf, Hemingway, Faulkner, Toni Morrison.
- Drama excerpt (8-20 lines) with speaker labels. Use Shakespeare, Ibsen, Williams, Miller, Beckett.
- The passage MUST contain the specific imagery/diction/structure the question asks about.`,
  SAT_READING_WRITING: `Choose ONE format that fits the question:
- Short passage 50-150 words, single-paragraph format. Genres: literary fiction, U.S. founding-era document, social science, natural science. Use real sources.
- Paired short passages (50-100 words each) on related topic from different perspectives.
- Passage with underlined phrase that question asks to revise (for Writing/Standard English questions).
- Data graphic described in text: "The chart shows [variable] across [year/group]. Notable trend: [pattern]."
- Passages should match SAT R/W difficulty band (~9th-grade Lexile, college-prep rigor).`,
  ACT_READING: `Choose ONE format that fits the question:
- Passage 100-200 words. Genre matches ACT structure: Prose Fiction, Social Science, Humanities, or Natural Science.
- Paired passages (50-100 words each) — Natural Science section sometimes uses this format.
- Cite author and source year. Use ACT-typical genres (American/world literature, history essays, scientific reporting).
- The passage must contain the specific detail/inference the question targets.`,
  ACT_ENGLISH: `Choose ONE format that fits the question:
- Short passage 80-150 words with grammar/rhetoric errors that the question asks to fix. Mark the relevant span in bold (e.g., **the underlined phrase**) so the student knows what's being revised.
- Passages cover essay-like topics: history, personal narrative, science explanation, biography.
- The error to be fixed must be in the passage and clearly correlate with the answer choices.`,
  ACT_SCIENCE: `Choose ONE format that fits the question:
- Experiment description 80-150 words with data table. Format: "Experiment 1: [hypothesis/setup]. Results:\\n| Trial | Variable A | Result |\\n|---|---|---|\\n..."
- Conflicting Viewpoints: two scientists' summaries (Scientist 1 / Scientist 2 each 60-100 words) with opposing hypotheses.
- Figure description: "Figure 1 shows [variable] across [conditions]. Trend: [pattern]."
- The data/scenario must contain the information needed to answer the question.`,
};

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
      temperature: 0.5,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
}

const where = courseFilter
  ? sql`course = ${courseFilter}::"ApCourse"`
  : sql`course = ANY(${TARGET_COURSES}::"ApCourse"[])`;

const rows = courseFilter
  ? await sql`
      SELECT id, course::text as course, "questionText", options, "correctAnswer", topic, subtopic
      FROM questions
      WHERE course = ${courseFilter}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND (stimulus IS NULL OR LENGTH(stimulus) < 20)
      ORDER BY RANDOM()
    `
  : await sql`
      SELECT id, course::text as course, "questionText", options, "correctAnswer", topic, subtopic
      FROM questions
      WHERE course = ANY(${TARGET_COURSES}::"ApCourse"[])
        AND "isApproved" = true
        AND "questionType" = 'MCQ'
        AND (stimulus IS NULL OR LENGTH(stimulus) < 20)
      ORDER BY RANDOM()
    `;

const target = Math.min(rows.length, LIMIT);
console.log(`Found ${rows.length} naked-stem MCQs in target courses. Will process ${target}.`);

const byCourse = {};
for (const r of rows) byCourse[r.course] = (byCourse[r.course] || 0) + 1;
console.log("By course:");
Object.entries(byCourse).sort(([, a], [, b]) => b - a).forEach(([c, n]) => console.log("  " + c + ": " + n));

let totalDone = 0, totalErr = 0, totalSkipped = 0;

for (let i = 0; i < target; i++) {
  const r = rows[i];
  try {
    if (dry) {
      totalDone++;
      if (i < 3) console.log(`  [DRY] ${r.id.slice(0, 8)} ${r.course}: "${r.questionText.slice(0, 80)}..."`);
      continue;
    }
    const opts = typeof r.options === "string" ? JSON.parse(r.options) : (r.options ?? []);
    const optsList = Array.isArray(opts) ? opts.join("\n") : "";
    const guidance = STIMULUS_GUIDANCE[r.course] || "";
    const prompt = `Generate a CB-style stimulus for this AP ${r.course.replace("AP_", "").replace("_", " ")} MCQ.

The stimulus must be answerable to support the EXISTING correct answer. Do not change the question or options.

Question: ${r.questionText}
${optsList ? "Options:\n" + optsList + "\n" : ""}
Correct answer: ${r.correctAnswer}
Topic: ${r.topic ?? ""}
Subtopic: ${r.subtopic ?? ""}

${guidance}

Constraints:
- 80-400 chars (target ~200)
- Must support the correct answer
- Plain markdown (tables OK, no HTML)
- No "Source: AI" or fictional citations — use real-sounding source names that are plausible

Return JSON: {"stimulus": "..."}`;

    const result = await callGroq(
      `You are an experienced CB exam writer for AP ${r.course.replace("AP_", "").replace("_", " ")}. Match real CB stimulus formats exactly.`,
      prompt,
    );
    const stim = result.stimulus?.trim();
    if (!stim || stim.length < 80) {
      totalSkipped++;
      continue;
    }
    await sql`UPDATE questions SET stimulus = ${stim}, "updatedAt" = NOW() WHERE id = ${r.id}`;
    totalDone++;
    if (totalDone <= 3 || totalDone % 25 === 0) {
      console.log(`  ✓ [${totalDone}/${target}] ${r.id.slice(0, 8)} ${r.course}: ${stim.slice(0, 80)}…`);
    }
  } catch (e) {
    totalErr++;
    if (totalErr <= 5) console.error(`  ✗ ${r.id.slice(0, 8)} ${r.course}: ${e.message?.slice(0, 100)}`);
  }
  await sleep(PACE_MS);
}

console.log(`\n── Summary ──`);
console.log(`  Stimulus added: ${totalDone}`);
console.log(`  Skipped (short/empty result): ${totalSkipped}`);
console.log(`  Errors: ${totalErr}`);

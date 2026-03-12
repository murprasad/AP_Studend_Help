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

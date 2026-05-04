import { readFileSync, writeFileSync } from "node:fs";

/**
 * 2026-05-03 — Sweep "AI" terminology out of user-visible copy.
 *
 * Replaces visible "AI"/"AI-powered"/"AI-generated" references with neutral
 * nouns ("Sage", "exam-aligned", "personalized", "rubric"). Preserves:
 *   - Legal disclosure pages (terms, privacy)
 *   - Code comments / TS jsdoc
 *   - Error/toast messages where precision matters
 *   - Internal API field names and the /ai-tutor route slug
 */

// (path, [from, to])
const EDITS = [
  // ─── src/app/layout.tsx — root meta ───
  ["src/app/layout.tsx", [
    [
      "Raise your AP, SAT, or ACT score with AI that explains why — not just what. Personalized practice, instant feedback, mastery tracking. Free to start.",
      "Raise your AP, SAT, or ACT score with explanations that show you why — not just what. Personalized practice, instant feedback, mastery tracking. Free to start.",
    ],
    ["AI-powered exam prep with personalized practice, instant feedback, and mastery tracking. Free for every student.", "Exam-aligned practice with instant feedback and mastery tracking. Free for every student."],
    ["AI-powered exam prep. Personalized practice. Free to start.", "Exam-aligned practice. Personalized. Free to start."],
    ["AI-powered exam preparation for AP, SAT, and ACT exams", "Exam-aligned preparation for AP, SAT, and ACT"],
  ]],

  // ─── src/app/(marketing)/ap-prep/page.tsx ───
  ["src/app/(marketing)/ap-prep/page.tsx", [
    ["AP Exam Prep — AI Practice & Tutoring | StudentNest Prep", "AP Exam Prep — Practice & Tutoring | StudentNest Prep"],
    ["Score a 5 on your AP exam with AI-powered practice questions, instant feedback, and mastery tracking across 10 AP courses. Free to start.", "Score a 5 on your AP exam with exam-aligned practice questions, instant feedback, and mastery tracking across 10 AP courses. Free to start."],
    ["AI-powered AP exam prep. 10 courses. Instant AI explanations. Mastery tracking. Free to start.", "Exam-aligned AP prep. 10 courses. Instant explanations. Mastery tracking. Free to start."],
    ["AP courses with AI-powered practice and tutoring", "AP courses with exam-aligned practice and Sage tutoring"],
    ["AI-powered ${c.name} prep with ${c.units} units of practice questions, mastery tracking, and instant explanations.", "${c.name} prep with ${c.units} units of practice, mastery tracking, and instant explanations."],
    ["Turn your AP prep into a 5 — with AI that teaches, quizzes, and adapts.", "Turn your AP prep into a 5 — with a tutor that teaches, quizzes, and adapts."],
    ["AI builds your study plan by unit", "Sage builds your study plan by unit"],
    ["Practice FRQs with AI scoring on real AP rubrics", "Practice FRQs with rubric scoring on real AP standards"],
    ["FRQ with AI rubric scoring", "FRQ scored against the official AP rubric"],
    ["Streaming AI", "Streaming Sage responses"],
  ]],

  // ─── src/app/(marketing)/ap-prep/[slug]/page.tsx ───
  ["src/app/(marketing)/ap-prep/[slug]/page.tsx", [
    ["Practice every unit free with AI-generated questions matched to College Board format.", "Practice every unit free with exam-aligned questions matched to College Board format."],
    ["Free AI-powered ${config.name} prep. Real exam format. Per-unit mastery tracking.", "Free ${config.name} prep. Real exam format. Per-unit mastery tracking."],
    ["Practice every unit with AI-generated questions matched to the official College Board exam format. Free to start.", "Practice every unit with exam-aligned questions matched to the official College Board format. Free to start."],
    ["Free unlimited practice. AI explanations on every wrong answer. Per-unit mastery tracking.", "Free unlimited practice. Sage explanations on every wrong answer. Per-unit mastery tracking."],
    ["Every practice question is AI-generated and validated against the College Board ${config.name} exam style — stem patterns, stimulus depth, distractor types, and difficulty. Cross-model validation catches errors before questions reach students. We never reproduce copyrighted exam content.", "Every practice question is generated and validated against the College Board ${config.name} exam style — stem patterns, stimulus depth, distractor types, and difficulty. Cross-model validation catches errors before questions reach students. We never reproduce copyrighted exam content."],
    ["AP&reg; is a registered trademark of the College Board, which is not affiliated with StudentNest. All practice questions are original AI-generated content.", "AP&reg; is a registered trademark of the College Board, which is not affiliated with StudentNest. All practice questions are original content, generated and cross-model validated against published exam standards."],
  ]],

  // ─── src/app/(marketing)/sat-prep/page.tsx ───
  ["src/app/(marketing)/sat-prep/page.tsx", [
    ["SAT Prep — AI Practice & Score Tracking | StudentNest Prep", "SAT Prep — Practice & Score Tracking | StudentNest Prep"],
    ["Raise your SAT score with AI-powered practice for Math and Reading & Writing. Weak area targeting, timed practice, and score tracking. Free to start.", "Raise your SAT score with exam-aligned practice for Math and Reading & Writing. Weak area targeting, timed practice, and score tracking. Free to start."],
    ["AI-powered SAT prep. Math + Reading & Writing. Weak area targeting. Free to start.", "Exam-aligned SAT prep. Math + Reading & Writing. Weak area targeting. Free to start."],
    ["SAT prep with AI-powered practice", "SAT prep with exam-aligned practice"],
    ["AI-powered ${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking.", "${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking."],
    ["Raise your SAT score 100–200 points — with AI that adapts to your weak areas.", "Raise your SAT score 100–200 points — with practice that adapts to your weak areas."],
    ["AI targets your weakest SAT areas", "Sage targets your weakest SAT areas"],
    ["AI-generated questions matching real SAT format. Get instant feedback explaining why each answer is right or wrong — ask Sage for deeper explanations anytime.", "Exam-aligned questions matching real SAT format. Instant feedback explaining why each answer is right or wrong — ask Sage for deeper explanations anytime."],
    ["Streaming AI", "Streaming Sage responses"],
  ]],

  // ─── src/app/(marketing)/act-prep/page.tsx ───
  ["src/app/(marketing)/act-prep/page.tsx", [
    ["ACT Prep — AI Practice for All 4 Sections | StudentNest Prep", "ACT Prep — Practice for All 4 Sections | StudentNest Prep"],
    ["Boost your ACT score with AI-powered practice across Math, English, Science, and Reading. Section-specific tutoring and score tracking. Free to start.", "Boost your ACT score with exam-aligned practice across Math, English, Science, and Reading. Section-specific tutoring and score tracking. Free to start."],
    ["AI-powered ACT prep. All 4 sections. Section-specific Sage Live Tutor. Free to start.", "Exam-aligned ACT prep. All 4 sections. Section-specific Sage Live Tutor. Free to start."],
    ["${visible.length} ACT sections with AI-powered practice", "${visible.length} ACT sections with exam-aligned practice"],
    ["AI-powered ${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking.", "${c.name} prep: ${c.desc}. ${c.units} units with mastery tracking."],
    ["AI builds a section-by-section study plan", "Sage builds a section-by-section study plan"],
    ["Section-specific questions with real ACT format (A–E for Math). Instant AI explanations for every answer, every mistake.", "Section-specific questions with real ACT format (A–E for Math). Instant Sage explanations for every answer, every mistake."],
    ["Streaming AI", "Streaming Sage responses"],
  ]],

  // ─── src/app/(marketing)/wall-of-fame/page.tsx ───
  ["src/app/(marketing)/wall-of-fame/page.tsx", [
    ["Share your result and inspire others. Your success story helps fellow students see that grounded, AI-driven practice works.", "Share your result and inspire others. Your success story helps fellow students see that grounded, exam-aligned practice works."],
  ]],

  // ─── src/app/(marketing)/pricing/layout.tsx — FAQ title ───
  ["src/app/(marketing)/pricing/layout.tsx", [
    ["What happens when I hit the free AI limit?", "What happens when I hit the free Sage limit?"],
  ]],

  // ─── src/app/(dashboard)/study-plan/page.tsx ───
  ["src/app/(dashboard)/study-plan/page.tsx", [
    ["AI-personalized plan based on your performance", "Personalized plan based on your performance"],
  ]],

  // ─── src/app/(dashboard)/practice/page.tsx ───
  ["src/app/(dashboard)/practice/page.tsx", [
    ["title: \"AI questions generated\",", "title: \"Practice questions generated\","],
    ["title: \"✨ AI questions generated\",", "title: \"✨ Practice questions generated\","],
    ["AI-scored rubric feedback", "Sage-scored rubric feedback"],
    ["SAQ, LEQ & DBQ with AI rubric scoring — Premium only", "SAQ, LEQ & DBQ scored against the official rubric — Premium only"],
    [" AI is preparing your question…", " Sage is preparing your question…"],
  ]],

  // ─── src/app/(dashboard)/frq-practice/page.tsx ───
  ["src/app/(dashboard)/frq-practice/page.tsx", [
    ["AI-scored rubric feedback — same difficulty, same scoring style.", "Sage-scored rubric feedback — same difficulty, same scoring style."],
  ]],

  // ─── src/app/(dashboard)/diagnostic/page.tsx ───
  ["src/app/(dashboard)/diagnostic/page.tsx", [
    ["AI recommends what to focus on", "Sage recommends what to focus on"],
    ["AI Recommendation", "Sage's recommendation"],
  ]],

  // ─── src/app/(dashboard)/ai-tutor/page.tsx — toast title ───
  ["src/app/(dashboard)/ai-tutor/page.tsx", [
    ["title: \"AI Unavailable\",", "title: \"Sage Unavailable\","],
  ]],
];

let totalReplacements = 0;
let totalFiles = 0;
const skipped = [];

for (const [path, replacements] of EDITS) {
  let s;
  try { s = readFileSync(path, "utf8"); } catch (e) { skipped.push(`${path} (not found)`); continue; }
  const before = s.length;
  let count = 0;
  for (const [from, to] of replacements) {
    if (s.includes(from)) {
      s = s.split(from).join(to);
      count++;
    }
  }
  if (count > 0) {
    writeFileSync(path, s);
    totalFiles++;
    totalReplacements += count;
    console.log(`✓ ${path} — ${count} replacements (${before} → ${s.length} chars)`);
  } else {
    console.log(`(no change) ${path}`);
  }
}

if (skipped.length) console.log("\nSkipped:", skipped);
console.log(`\nTotal: ${totalReplacements} replacements across ${totalFiles} files.`);

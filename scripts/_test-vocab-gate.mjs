/** Smoke test for domain-vocabulary gate. */
import { runDeterministicGates } from "./lib/_question-gates.mjs";

const cases = [
  // The Ayu bug — should FAIL
  { name: "Ayu meiosis-ploidy (non-canonical options)", expectGate: "options-missing-canonical-ploidy", q: {
    questionText: "Meiosis results in cells with what ploidy?",
    options: ["A) Increased ploidy", "B) Variable ploidy", "C) Zero ploidy", "D) Unchanged ploidy", "E) Decreased ploidy"],
    correctAnswer: "E",
    explanation: "Decreased ploidy is correct because meiosis reduces ploidy from diploid to haploid through halving the chromosome number.",
    course: "CLEP_BIOLOGY",
  }},
  // Same Q with canonical options — should PASS vocab gate (may still fail others)
  { name: "Meiosis-ploidy with canonical options", expectGate: null, q: {
    questionText: "Meiosis results in cells with what ploidy?",
    options: ["A) Diploid", "B) Haploid", "C) Triploid", "D) Tetraploid", "E) Polyploid"],
    correctAnswer: "B",
    explanation: "Haploid is correct because meiosis halves the chromosome number from diploid (2n) to haploid (n) through two rounds of division.",
    course: "CLEP_BIOLOGY",
  }},
  // Selection-type with bad options
  { name: "selection-type with non-canonical options", expectGate: "options-missing-canonical-selection-type", q: {
    questionText: "What type of natural selection favors average traits?",
    options: ["A) Fast", "B) Slow", "C) Strong", "D) Weak", "E) Medium"],
    correctAnswer: "E",
    explanation: "Medium is correct because it favors the middle of the distribution.",
    course: "CLEP_BIOLOGY",
  }},
  // Selection-type with canonical options — pass
  { name: "selection-type with canonical options", expectGate: null, q: {
    questionText: "What type of natural selection favors average traits?",
    options: ["A) Disruptive", "B) Stabilizing", "C) Directional", "D) Sexual", "E) Artificial"],
    correctAnswer: "B",
    explanation: "Stabilizing selection is correct because it favors average traits, eliminating extreme phenotypes from the population.",
    course: "CLEP_BIOLOGY",
  }},
  // Government branches
  { name: "branches-of-government with wrong vocab", expectGate: "options-missing-canonical-gov-branch", q: {
    questionText: "Which of the following is a branch of the U.S. government?",
    options: ["A) Military", "B) Police", "C) Education", "D) Treasury", "E) State Department"],
    correctAnswer: "A",
    explanation: "Military is correct because the armed forces are a branch of the U.S. federal government structure.",
    course: "CLEP_AMERICAN_GOVERNMENT",
  }},
  // Government branches with correct vocab
  { name: "branches-of-government with canonical vocab", expectGate: null, q: {
    questionText: "Which of the following is a branch of the U.S. government?",
    options: ["A) Legislative", "B) Military", "C) Executive", "D) Judicial", "E) Treasury"],
    correctAnswer: "A",
    explanation: "Legislative is correct because it is one of the three branches of the U.S. government, responsible for making laws via Congress.",
    course: "CLEP_AMERICAN_GOVERNMENT",
  }},
  // Different course — vocab gate must NOT fire
  { name: "ploidy stem on non-bio course (gate skipped)", expectGate: null, q: {
    questionText: "Meiosis results in cells with what ploidy?",
    options: ["A) Yes", "B) No", "C) Sometimes", "D) Always", "E) Never"],
    correctAnswer: "A",
    explanation: "Yes is correct because this is not actually a biology question in this course context, used here only for testing.",
    course: "CLEP_AMERICAN_GOVERNMENT",
  }},
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = runDeterministicGates(c.q);
  const actualGate = r.ok ? null : r.gate;
  const ok = actualGate === c.expectGate;
  if (ok) { pass++; console.log(`  PASS  ${c.name}  →  ${actualGate ?? "ok"}`); }
  else {
    fail++;
    console.log(`  FAIL  ${c.name}`);
    console.log(`        expected: ${c.expectGate ?? "ok"}`);
    console.log(`        got:      ${actualGate ?? "ok"}  ${r.reason ?? ""}`);
  }
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail > 0 ? 1 : 0);

/** Smoke test for Sprint A gates: negation + semantic-contract + trend. */
import { runDeterministicGates } from "./lib/_question-gates.mjs";

const cases = [
  // Should PASS: positive question
  { name: "positive control", expectGate: null, q: {
    questionText: "What is the capital of France?",
    options: ["A) Paris", "B) London", "C) Berlin", "D) Madrid"],
    correctAnswer: "A",
    explanation: "Paris is the capital of France because it is the political and administrative center, where the President and the National Assembly are located.",
    course: "AP_HUMAN_GEOGRAPHY",
  }},
  // Negation gate — explanation ignores negation
  { name: "NOT-stem with positive-style explanation", expectGate: "explanation-ignores-negation", q: {
    questionText: "Which of the following is NOT a primary color?",
    options: ["A) Red", "B) Blue", "C) Green", "D) Yellow"],
    correctAnswer: "C",
    explanation: "Green is correct because it is created by combining blue and yellow pigments together using the additive color mixing rules.",
    course: "AP_HUMAN_GEOGRAPHY",
  }},
  // Negation gate — properly acknowledges
  { name: "NOT-stem with proper acknowledgment", expectGate: null, q: {
    questionText: "Which of the following is NOT a primary color?",
    options: ["A) Red", "B) Blue", "C) Green", "D) Yellow"],
    correctAnswer: "C",
    explanation: "Green is the only one that is not a primary color; it is a secondary color formed by mixing blue and yellow together using additive color rules.",
    course: "AP_HUMAN_GEOGRAPHY",
  }},
  // Double-negation in stem
  { name: "double negation in stem", expectGate: "stem-double-negation", q: {
    questionText: "Which statement is NOT incorrect about photosynthesis?",
    options: ["A) Plants use sunlight", "B) Plants emit oxygen", "C) Plants need water", "D) Plants absorb CO2"],
    correctAnswer: "A",
    explanation: "Plants do use sunlight as the energy source for photosynthesis, converting it to chemical energy stored in glucose molecules.",
    course: "AP_BIOLOGY",
  }},
  // Extremum mismatch — stem asks largest but answer not max (AP = 4 options).
  // Explanation includes the wrong-but-stored number "5" so numeric-mismatch passes
  // and extremum gate gets a turn.
  { name: "extremum mismatch — largest", expectGate: "stem-extremum-mismatch", q: {
    questionText: "Which value is the largest?",
    options: ["A) 5", "B) 12", "C) 3", "D) 8"],
    correctAnswer: "A",
    explanation: "Comparing the values, 5 is the answer because it has the greatest magnitude when arranged using the standard ordering on the number line.",
    course: "AP_CALCULUS_AB",
  }},
  // Extremum correct
  { name: "extremum correct — largest=12", expectGate: null, q: {
    questionText: "Which value is the largest?",
    options: ["A) 5", "B) 12", "C) 3", "D) 8"],
    correctAnswer: "B",
    explanation: "Comparing the values, 12 is greater than 5, 3, and 8, so 12 is the largest. The ordering rule applies on the number line.",
    course: "AP_CALCULUS_AB",
  }},
  // Extremum mismatch — min (CLEP_COLLEGE_MATH = 4 options)
  { name: "extremum mismatch — smallest", expectGate: "stem-extremum-mismatch", q: {
    questionText: "Which of the following is the smallest number?",
    options: ["A) 0.5", "B) 0.05", "C) 0.1", "D) 0.005"],
    correctAnswer: "A",
    explanation: "We compare 0.5 against the others and conclude it has the most leading zeros relative to alternatives, by aligning the decimal points.",
    course: "CLEP_COLLEGE_MATH",
  }},
  // Trend ignored — explanation has NO direction word
  { name: "trend stem with no direction in explanation", expectGate: "explanation-ignores-trend", q: {
    questionText: "When the price of a good decreases, what happens to quantity demanded?",
    options: ["A) It stays constant", "B) It changes proportionally", "C) It is unrelated", "D) Cannot be determined"],
    correctAnswer: "B",
    explanation: "The law of demand operates through the substitution effect of consumer behavior, which economists have studied for centuries since Marshall.",
    course: "AP_MICROECONOMICS",
  }},
  // Trend properly addressed
  { name: "trend stem with direction acknowledged", expectGate: null, q: {
    questionText: "When the price of a good decreases, what happens to quantity demanded?",
    options: ["A) It stays constant", "B) Quantity demanded increases", "C) It is unrelated", "D) Cannot be determined"],
    correctAnswer: "B",
    explanation: "By the law of demand, when price falls, quantity demanded rises — they move in opposite directions due to the substitution and income effects.",
    course: "AP_MICROECONOMICS",
  }},
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = runDeterministicGates(c.q);
  const actualGate = r.ok ? null : r.gate;
  const ok = actualGate === c.expectGate;
  if (ok) {
    pass++;
    console.log(`  PASS  ${c.name}  →  ${actualGate ?? "ok"}`);
  } else {
    fail++;
    console.log(`  FAIL  ${c.name}`);
    console.log(`        expected: ${c.expectGate ?? "ok"}`);
    console.log(`        got:      ${actualGate ?? "ok"}  ${r.reason ?? ""}`);
  }
}
console.log(`\n${pass}/${cases.length} passed`);
process.exit(fail > 0 ? 1 : 0);

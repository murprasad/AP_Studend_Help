// Sanity test for src/lib/cb-corpus — verify it loads, scores, and can
// generate few-shot anchors for the generator pipeline.

import { loadCbCorpus, getSectionStats, pickAnchorsForSection, scoreAgainstCb, formatAnchorForPrompt } from "../src/lib/cb-corpus";

const corpus = loadCbCorpus();
console.log("\n═══ CB Corpus Load ═══");
console.log(`Loaded ${corpus.length} questions across all tests.`);
const rwCount = corpus.filter((q) => q.section === "READING_WRITING").length;
const mathCount = corpus.filter((q) => q.section === "MATH").length;
console.log(`  Reading & Writing: ${rwCount}`);
console.log(`  Math: ${mathCount}`);

console.log("\n═══ Section Stats (R&W) ═══");
const rwStats = getSectionStats("READING_WRITING");
console.log(JSON.stringify(rwStats, null, 2));

console.log("\n═══ Section Stats (Math) ═══");
const mathStats = getSectionStats("MATH");
console.log(JSON.stringify(mathStats, null, 2));

console.log("\n═══ Sample anchors (Math, 3) ═══");
const anchors = pickAnchorsForSection("MATH", 3);
for (let i = 0; i < anchors.length; i++) {
  console.log(`\n${formatAnchorForPrompt(anchors[i], i + 1).slice(0, 400)}\n...`);
}

console.log("\n═══ Score a synthetic candidate ═══");
const candidate = {
  stem: "A scatterplot shows the relationship between months and savings. The line of best fit passes through (0, 50) and (10, 250). Which of the following is the best interpretation of the slope of the line of best fit?",
  options: [
    "A) The savings increased by $20 per month.",
    "B) The savings started at $20.",
    "C) The savings increased by $50 per month.",
    "D) After 20 months, the savings were $250.",
  ],
  correctAnswer: "A",
};
const score = scoreAgainstCb(candidate, "MATH");
console.log(JSON.stringify(score, null, 2));

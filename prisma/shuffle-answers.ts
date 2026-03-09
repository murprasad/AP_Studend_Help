/**
 * Shuffles the answer options for all questions so the correct answer is
 * randomly placed at A, B, C, or D — eliminating the "always B" bias.
 * The question content remains 100% accurate; only option order changes.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shuffleOptions(
  options: string[],
  correctLetter: string
): { shuffled: string[]; newCorrect: string } {
  const letters = ["A", "B", "C", "D"];

  // Find the current correct option text
  const correctIndex = letters.indexOf(correctLetter.toUpperCase());
  if (correctIndex === -1 || !options[correctIndex]) {
    return { shuffled: options, newCorrect: correctLetter };
  }

  const correctText = options[correctIndex];

  // Create array of [letter, text] and shuffle
  const pairs = options.map((text, i) => ({ letter: letters[i], text }));

  // Fisher-Yates shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  // Reassign letters A-D to shuffled options
  const shuffled = pairs.map((p, i) => {
    // Replace the old letter prefix with the new one
    const text = p.text.replace(/^[A-D]\)\s*/, "");
    return `${letters[i]}) ${text}`;
  });

  // Find where the correct answer ended up
  const newCorrectIndex = pairs.findIndex((p) => p.text === correctText);
  const newCorrect = letters[newCorrectIndex];

  return { shuffled, newCorrect };
}

async function main() {
  const questions = await prisma.question.findMany({
    select: { id: true, options: true, correctAnswer: true },
  });

  console.log(`Processing ${questions.length} questions...`);

  let updated = 0;
  const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  for (const q of questions) {
    if (!q.options) continue;

    let opts: string[];
    try {
      const raw = q.options as unknown;
      opts = Array.isArray(raw) ? raw : JSON.parse(raw as string);
    } catch {
      continue;
    }

    if (opts.length !== 4) continue;

    const { shuffled, newCorrect } = shuffleOptions(opts, q.correctAnswer);

    if (newCorrect !== q.correctAnswer) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          options: JSON.stringify(shuffled),
          correctAnswer: newCorrect,
        },
      });
      updated++;
    }

    distribution[newCorrect] = (distribution[newCorrect] || 0) + 1;
  }

  console.log(`Updated ${updated} questions`);
  console.log("New answer distribution:", distribution);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

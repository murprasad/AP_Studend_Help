// Seed OfficialSample rows for AP Computer Science Principles.
//
// Source: CB-style reference samples matching AP CSP CED 2024 released
// question formats (pseudocode conventions, unit coverage, topic weights).
// These are NOT verbatim CB questions — they are hand-authored in the
// exact style CB publishes so our generator can use them as RAG exemplars.
//
// licenseNotes on every row documents this clearly.
//
// When real CB PDFs are parsed (future pass), those rows will supersede
// these and be flagged with a distinct sourceName.
//
// Usage: node scripts/seed-official-ap-csp.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const LICENSE_NOTE =
  "CB-style reference sample — hand-authored to match AP CSP CED 2024 " +
  "released-question format, topic weights, and pseudocode conventions. " +
  "Not redistributed from College Board. Used as RAG grounding for " +
  "original question generation, never served verbatim to students.";

const SOURCE_URL = "https://apcentral.collegeboard.org/courses/ap-computer-science-principles/exam";
const SOURCE_NAME = "CB-Style Reference (CED 2024)";

const samples = [
  // ─── UNIT 1: CREATIVE DEVELOPMENT ───────────────────────────────────────
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_1_CREATIVE_DEVELOPMENT",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A student is designing a program that helps users track their daily water intake. " +
      "The student uses an iterative development process. Which of the following best describes " +
      "the benefit of iterative development for this program?",
    stimulus: null,
    options: [
      "A) It guarantees that the program will have no bugs when development is complete.",
      "B) It allows the student to gather user feedback and refine features across multiple versions.",
      "C) It ensures the program will use the smallest possible amount of memory.",
      "D) It eliminates the need for testing during development.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: iterative development explicitly involves building, testing, gathering feedback, " +
      "and refining across multiple cycles. This is especially valuable for user-facing programs like " +
      "a water-intake tracker where real user behavior shapes needed features. " +
      "A is wrong (traps students who conflate iteration with bug-elimination — iteration reduces but " +
      "does not guarantee zero bugs). " +
      "C is wrong (iteration does not target memory efficiency; that's optimization). " +
      "D is wrong (iteration INCLUDES testing at every cycle, does not replace it).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_1_CREATIVE_DEVELOPMENT",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "Two students collaborate on a program using version control. Student A creates the main " +
      "algorithm. Student B writes the user interface. They merge their work daily. Which best " +
      "describes the primary benefit of this collaborative approach?",
    stimulus: null,
    options: [
      "A) It doubles the speed at which the program runs.",
      "B) It allows each student to focus on a specialized area, leveraging distinct expertise.",
      "C) It ensures the program will have no runtime errors.",
      "D) It reduces the total amount of code the program contains.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: collaboration enables specialization — each contributor develops the part they " +
      "know best, which is a core CSP Big Idea (Creative Development). " +
      "A is wrong (collaboration affects development speed, not runtime execution speed). " +
      "C is wrong (collaboration does not eliminate bugs — integration can introduce merge errors). " +
      "D is wrong (collaboration typically doesn't reduce code size).",
  },

  // ─── UNIT 2: DATA ────────────────────────────────────────────────────────
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_2_DATA",
    year: 2024,
    questionType: "MCQ",
    questionText: "What is the decimal value of the binary number 10110?",
    stimulus:
      "Binary place values (left to right for a 5-bit number):\n" +
      "| Position | 2⁴ | 2³ | 2² | 2¹ | 2⁰ |\n" +
      "| Value    | 16 |  8 |  4 |  2 |  1 |\n" +
      "| Digit    |  1 |  0 |  1 |  1 |  0 |",
    options: ["A) 22", "B) 18", "C) 11", "D) 44"],
    correctAnswer: "A",
    explanation:
      "A is correct: 10110 = 1×16 + 0×8 + 1×4 + 1×2 + 0×1 = 16 + 4 + 2 = 22. " +
      "B is wrong (trap: student reads digits right-to-left: 01101 = 13, but still arrives wrong). " +
      "C is wrong (trap: counts the number of 1-bits, not their place values). " +
      "D is wrong (trap: student doubles the correct answer — common misstep with shifting).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_2_DATA",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A researcher has 1 million photographs totaling 500 GB. She compresses the collection using " +
      "a lossy algorithm and the result is 50 GB with only minimal perceptible quality loss. Which " +
      "of the following is a valid reason to prefer lossy compression here?",
    stimulus: null,
    options: [
      "A) Lossy compression allows exact recovery of the original bits, which is required for image archival.",
      "B) Lossy compression reduces storage needs significantly by discarding information that is imperceptible or less important, which is acceptable for many image applications.",
      "C) Lossy compression always produces files that are identical in quality to the originals.",
      "D) Lossy compression is the only compression method that works on image files.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: lossy compression trades quality for size. For perceptual data like photographs, " +
      "small quality loss is often acceptable in exchange for ~10x storage savings. " +
      "A is wrong (lossy CANNOT recover originals exactly — that defines lossless, not lossy). " +
      "C is wrong (lossy reduces quality by definition; the user perceived 'minimal' loss but the bits differ). " +
      "D is wrong (lossless compression also works on images; PNG is lossless).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_2_DATA",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A dataset contains 10,000 customer records with personally identifiable information (PII). " +
      "An analyst wants to publish summary statistics (average age, most-common zip code) while " +
      "protecting individual privacy. Which approach BEST balances these goals?",
    stimulus: null,
    options: [
      "A) Publish the full raw dataset along with the statistics for verification.",
      "B) Remove PII columns before computing and publishing only aggregate statistics.",
      "C) Encrypt each customer's PII and publish the encrypted data alongside the statistics.",
      "D) Publish individual records with names replaced by numeric IDs.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: removing PII entirely and publishing only aggregate results protects individuals " +
      "by design while still delivering the analytic value. This is a core CSP Big Idea 5 concept (data & privacy). " +
      "A is wrong (publishing raw PII violates privacy outright). " +
      "C is wrong (encryption alone doesn't help — if the encrypted data is linked to analyses, re-identification is possible). " +
      "D is wrong (numeric IDs are pseudonymization, not anonymization — records can often still be re-identified by combining non-PII fields).",
  },

  // ─── UNIT 3: ALGORITHMS AND PROGRAMMING ─────────────────────────────────
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_3_ALGORITHMS_AND_PROGRAMMING",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "The procedure below is defined. What is returned by the call countEvens([3, 8, 1, 4, 7, 6])?",
    stimulus:
      "```\nPROCEDURE countEvens(list)\n{\n   count ← 0\n   FOR EACH item IN list\n   {\n      IF (item MOD 2 = 0)\n      {\n         count ← count + 1\n      }\n   }\n   RETURN count\n}\n```",
    options: ["A) 3", "B) 2", "C) 6", "D) 4"],
    correctAnswer: "A",
    explanation:
      "A is correct: the procedure increments count each time it finds an even number. " +
      "The evens in [3, 8, 1, 4, 7, 6] are 8, 4, and 6 — three of them, so RETURN 3. " +
      "B is wrong (trap: student undercounts by missing one of 8, 4, or 6). " +
      "C is wrong (trap: student returns list length instead of count). " +
      "D is wrong (trap: student uses item MOD 2 = 1 to count odds: 3, 1, 7 = 3 odds — coincidentally also 3, but could land here off the wrong predicate).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_3_ALGORITHMS_AND_PROGRAMMING",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A procedure findMax(list) iterates through a list of numbers and returns the largest value. " +
      "If the list has n elements, which of the following best describes the number of comparisons " +
      "the procedure performs in the worst case?",
    stimulus: null,
    options: [
      "A) Approximately 1 comparison regardless of list size",
      "B) Approximately n comparisons (linear in list size)",
      "C) Approximately n² comparisons (quadratic in list size)",
      "D) Approximately 2ⁿ comparisons (exponential in list size)",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: to find the maximum, the procedure compares each element to the running-best, " +
      "making approximately n-1 comparisons — linear growth. This is called a 'reasonable-time' algorithm in CSP. " +
      "A is wrong (a single comparison can't determine the max of an arbitrary list). " +
      "C is wrong (quadratic would mean comparing every pair; findMax only needs one pass). " +
      "D is wrong (exponential is unreasonable time; findMax is reasonable).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_3_ALGORITHMS_AND_PROGRAMMING",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "Trace the procedure below when called as mystery(4). What value is DISPLAYed?",
    stimulus:
      "```\nPROCEDURE mystery(n)\n{\n   result ← 1\n   i ← 1\n   REPEAT UNTIL (i > n)\n   {\n      result ← result * i\n      i ← i + 1\n   }\n   DISPLAY(result)\n}\n```",
    options: ["A) 10", "B) 24", "C) 16", "D) 4"],
    correctAnswer: "B",
    explanation:
      "B is correct: this procedure computes n factorial. For n=4: 1×1=1, 1×2=2, 2×3=6, 6×4=24. " +
      "A is wrong (trap: 1+2+3+4 = 10 — student adds instead of multiplying). " +
      "C is wrong (trap: 4² = 16 — student confuses factorial with squaring). " +
      "D is wrong (trap: student returns n itself, ignoring the loop entirely).",
  },

  // ─── UNIT 4: COMPUTER SYSTEMS AND NETWORKS ──────────────────────────────
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_4_COMPUTER_SYSTEMS_NETWORKS",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A large file is transmitted across the Internet from a server to a client. The file is " +
      "broken into packets that may travel along different paths and arrive out of order. Which " +
      "of the following best describes why this approach is used?",
    stimulus: null,
    options: [
      "A) Packets travel faster than whole files because they are smaller.",
      "B) Packet-switching allows the network to route around congestion and failures, providing fault tolerance.",
      "C) Packet-switching eliminates all errors in network transmission.",
      "D) Packets are necessary because the Internet has a maximum file size of 1 kilobyte.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: packet-switching is a core Internet design principle — packets can take " +
      "independent paths and the network routes around failures, providing fault tolerance. " +
      "A is wrong (smaller packets aren't inherently faster — the total file still takes the same bandwidth). " +
      "C is wrong (packets can still be lost or corrupted; TCP handles retransmission). " +
      "D is wrong (there is no 1 KB Internet file size limit; packet-switching is a design choice, not a constraint).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_4_COMPUTER_SYSTEMS_NETWORKS",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A user visits a website and enters a credit card number. Which security practice BEST " +
      "protects the credit card number as it travels between the user's browser and the server?",
    stimulus: null,
    options: [
      "A) The browser stores the number in a strong hash function before sending.",
      "B) The browser and server establish an HTTPS connection that encrypts all data in transit.",
      "C) The user's operating system firewall blocks all outgoing traffic.",
      "D) The website publishes its public key in plaintext on the homepage.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: HTTPS (SSL/TLS) encrypts data in transit using symmetric keys exchanged via " +
      "asymmetric cryptography, preventing interception as the data travels. " +
      "A is wrong (hashing is one-way; the server could never read the credit card number to process payment). " +
      "C is wrong (blocking all outgoing traffic prevents the purchase entirely). " +
      "D is wrong (publishing a public key is fine — that's how asymmetric crypto works — but a key alone doesn't encrypt traffic; HTTPS does).",
  },

  // ─── UNIT 5: IMPACT OF COMPUTING ────────────────────────────────────────
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_5_IMPACT_OF_COMPUTING",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "A streaming service collects data on what users watch, when they pause, and what they " +
      "search for. It uses this data to train a recommendation algorithm. Which of the following " +
      "is an example of UNINTENDED bias that could arise?",
    stimulus: null,
    options: [
      "A) The recommendation algorithm suggests only content the user has explicitly marked as favorite.",
      "B) The recommendation algorithm suggests more of what similar users have watched, amplifying majority preferences and underrepresenting niche tastes.",
      "C) The algorithm always runs faster during off-peak hours due to server load.",
      "D) The streaming service allows users to rate content from 1 to 5 stars.",
    ],
    correctAnswer: "B",
    explanation:
      "B is correct: filter-bubble / echo-chamber effects are a classic unintended algorithmic bias. " +
      "Content popular with the majority gets amplified, and niche content gets less exposure, " +
      "even when not intentional. This is Big Idea 5 (Impact of Computing). " +
      "A is wrong (that's an INTENDED recommendation behavior, not an unintended bias). " +
      "C is wrong (server load is performance, not bias). " +
      "D is wrong (rating systems are neutral UI, not bias).",
  },
  {
    course: "AP_COMPUTER_SCIENCE_PRINCIPLES",
    unit: "CSP_5_IMPACT_OF_COMPUTING",
    year: 2024,
    questionType: "MCQ",
    questionText:
      "An online collaboration platform allows people around the world to contribute to a shared " +
      "document. Which of the following is a potential benefit AND a potential concern of this " +
      "kind of collaborative software?",
    stimulus: null,
    options: [
      "A) Benefit: anyone can contribute; Concern: misinformation can spread without oversight.",
      "B) Benefit: the platform uses less electricity than physical meetings; Concern: it is only available in one language.",
      "C) Benefit: the document auto-saves; Concern: saves consume disk space.",
      "D) Benefit: users can work offline; Concern: offline users can't submit changes.",
    ],
    correctAnswer: "A",
    explanation:
      "A is correct: open, global collaboration democratizes contribution (benefit) but creates " +
      "oversight challenges — unvetted edits can introduce misinformation (concern). This is a " +
      "canonical CSP Big Idea 5 tradeoff. " +
      "B is wrong (language availability is a separate accessibility concern, not the collaboration trade-off). " +
      "C is wrong (autosave disk use is trivial and not really a 'concern' at the course level). " +
      "D is wrong (offline work is actually a benefit, not a concern, and the stated concern is mild).",
  },
];

async function main() {
  console.log(`Seeding ${samples.length} AP CSP OfficialSample rows...`);

  let created = 0;
  let updated = 0;
  for (const s of samples) {
    // Idempotent: dedupe on (course, unit, year, first 80 chars of questionText)
    const existing = await prisma.officialSample.findFirst({
      where: {
        course: s.course,
        unit: s.unit,
        year: s.year,
        questionText: { startsWith: s.questionText.slice(0, 80) },
      },
    });

    const data = {
      ...s,
      sourceUrl: SOURCE_URL,
      sourceName: SOURCE_NAME,
      licenseNotes: LICENSE_NOTE,
    };

    if (existing) {
      await prisma.officialSample.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.officialSample.create({ data });
      created++;
    }
  }

  const total = await prisma.officialSample.count({ where: { course: "AP_COMPUTER_SCIENCE_PRINCIPLES" } });
  console.log(`Created: ${created}, Updated: ${updated}. Total AP CSP OfficialSamples in DB: ${total}`);

  await prisma.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });

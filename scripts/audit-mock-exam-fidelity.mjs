// Audit: can the Mock Exam endpoint actually serve every section for every
// AP course, and do the CB structure constants match the real exam?
//
// Outputs a per-course matrix:
//   Section | CB target count | Bank available (with subtopic) | Bank without subtopic | Status
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// Mirror of src/lib/cb-exam-structure.ts (server-side import would require
// transpiling ESM; copying the data is fine for an audit).
const AP_EXAM_STRUCTURES = {
  AP_WORLD_HISTORY: { totalMinutes: 195, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 40, minutes: 55 },
    { cbName: "SAQ", questionType: "SAQ", count: 3, percentOfScore: 20, minutes: 40 },
    { cbName: "DBQ", questionType: "DBQ", count: 1, percentOfScore: 25, minutes: 60 },
    { cbName: "LEQ", questionType: "LEQ", count: 1, percentOfScore: 15, minutes: 40 },
  ]},
  AP_US_HISTORY: { totalMinutes: 195, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 40, minutes: 55 },
    { cbName: "SAQ", questionType: "SAQ", count: 3, percentOfScore: 20, minutes: 40 },
    { cbName: "DBQ", questionType: "DBQ", count: 1, percentOfScore: 25, minutes: 60 },
    { cbName: "LEQ", questionType: "LEQ", count: 1, percentOfScore: 15, minutes: 40 },
  ]},
  AP_US_GOVERNMENT: { totalMinutes: 180, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 55, percentOfScore: 50, minutes: 80 },
    { cbName: "Concept Application", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, subtopic: "Concept Application" },
    { cbName: "Quantitative Analysis", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, subtopic: "Quantitative Analysis" },
    { cbName: "SCOTUS Comparison", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 20, subtopic: "SCOTUS Comparison" },
    { cbName: "Argument Essay", questionType: "LEQ", count: 1, percentOfScore: 12.5, minutes: 40, subtopic: "Argument Essay" },
  ]},
  AP_HUMAN_GEOGRAPHY: { totalMinutes: 135, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 60 },
    { cbName: "FRQ 1 (No-Stimulus)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, subtopic: "FRQ 1 (No-Stimulus)" },
    { cbName: "FRQ 2 (1-Stimulus)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, subtopic: "FRQ 2 (1-Stimulus)" },
    { cbName: "FRQ 3 (2-Stimulus)", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 25, subtopic: "FRQ 3 (2-Stimulus)" },
  ]},
  AP_PSYCHOLOGY: { totalMinutes: 160, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 75, percentOfScore: 66.7, minutes: 90 },
    { cbName: "AAQ", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 35, subtopic: "AAQ (Article Analysis)" },
    { cbName: "EBQ", questionType: "FRQ", count: 1, percentOfScore: 16.7, minutes: 35, subtopic: "EBQ (Evidence-Based)" },
  ]},
  AP_ENVIRONMENTAL_SCIENCE: { totalMinutes: 160, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 80, percentOfScore: 60, minutes: 90 },
    { cbName: "Design Investigation", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 23, subtopic: "Design Investigation" },
    { cbName: "Analyze + Solution", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 23, subtopic: "Analyze + Propose Solution" },
    { cbName: "Analyze + Calculate", questionType: "FRQ", count: 1, percentOfScore: 13.3, minutes: 24, subtopic: "Analyze + Calculate" },
  ]},
  AP_BIOLOGY: { totalMinutes: 180, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 90 },
    { cbName: "Long FRQ (Interpret Experiment)", questionType: "FRQ", count: 1, percentOfScore: 11.25, minutes: 22, subtopic: "Long FRQ (Interpret Experiment)" },
    { cbName: "Long FRQ (Graphing)", questionType: "FRQ", count: 1, percentOfScore: 11.25, minutes: 22, subtopic: "Long FRQ (Graphing)" },
    { cbName: "Short FRQ (Investigation)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, subtopic: "Short FRQ (Investigation)" },
    { cbName: "Short FRQ (Conceptual)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, subtopic: "Short FRQ (Conceptual)" },
    { cbName: "Short FRQ (Model/Visual)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 10, subtopic: "Short FRQ (Model/Visual)" },
    { cbName: "Short FRQ (Data Analysis)", questionType: "FRQ", count: 1, percentOfScore: 6.875, minutes: 12, subtopic: "Short FRQ (Data Analysis)" },
  ]},
  AP_CHEMISTRY: { totalMinutes: 195, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 60, percentOfScore: 50, minutes: 90 },
    { cbName: "Long FRQ (10pt)", questionType: "FRQ", count: 3, percentOfScore: 30, minutes: 60, subtopic: "Long FRQ (10pt)" },
    { cbName: "Short FRQ (4pt)", questionType: "FRQ", count: 4, percentOfScore: 20, minutes: 45, subtopic: "Short FRQ (4pt)" },
  ]},
  AP_PHYSICS_1: { totalMinutes: 180, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 40, percentOfScore: 50, minutes: 80 },
    { cbName: "Mathematical Routines", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, subtopic: "Mathematical Routines" },
    { cbName: "Translation Between Representations", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, subtopic: "Translation Between Representations" },
    { cbName: "Experimental Design", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, subtopic: "Experimental Design + Analysis" },
    { cbName: "Qual/Quant Translation", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, subtopic: "Qualitative/Quantitative Translation" },
  ]},
  AP_STATISTICS: { totalMinutes: 180, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 40, percentOfScore: 50, minutes: 90 },
    { cbName: "Multipart FRQs", questionType: "FRQ", count: 5, percentOfScore: 37.5, minutes: 65, subtopic: "Multipart" },
    { cbName: "Investigative Task", questionType: "FRQ", count: 1, percentOfScore: 12.5, minutes: 25, subtopic: "Investigative Task" },
  ]},
  AP_CALCULUS_AB: { totalMinutes: 195, sections: [
    { cbName: "MCQ (No Calc)", questionType: "MCQ", count: 30, percentOfScore: 33.3, minutes: 60 },
    { cbName: "MCQ (Calc)", questionType: "MCQ", count: 15, percentOfScore: 16.7, minutes: 45 },
    { cbName: "FRQ (Calc)", questionType: "FRQ", count: 2, percentOfScore: 16.7, minutes: 30, subtopic: "FRQ Calculator (Part A)" },
    { cbName: "FRQ (No Calc)", questionType: "FRQ", count: 4, percentOfScore: 33.3, minutes: 60, subtopic: "FRQ No-Calculator (Part B)" },
  ]},
  AP_CALCULUS_BC: { totalMinutes: 195, sections: [
    { cbName: "MCQ (No Calc)", questionType: "MCQ", count: 30, percentOfScore: 33.3, minutes: 60 },
    { cbName: "MCQ (Calc)", questionType: "MCQ", count: 15, percentOfScore: 16.7, minutes: 45 },
    { cbName: "FRQ (Calc)", questionType: "FRQ", count: 2, percentOfScore: 16.7, minutes: 30, subtopic: "FRQ Calculator (Part A)" },
    { cbName: "FRQ (No Calc)", questionType: "FRQ", count: 4, percentOfScore: 33.3, minutes: 60, subtopic: "FRQ No-Calculator (Part B)" },
  ]},
  AP_PRECALCULUS: { totalMinutes: 180, sections: [
    { cbName: "MCQ (No Calc)", questionType: "MCQ", count: 28, percentOfScore: 43.75, minutes: 80 },
    { cbName: "MCQ (Calc)", questionType: "MCQ", count: 12, percentOfScore: 18.75, minutes: 40 },
    { cbName: "Function Concepts", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, subtopic: "Function Concepts" },
    { cbName: "Modeling Non-Periodic", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, subtopic: "Modeling Non-Periodic" },
    { cbName: "Modeling Periodic", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, subtopic: "Modeling Periodic" },
    { cbName: "Symbolic Manipulations", questionType: "FRQ", count: 1, percentOfScore: 9.375, minutes: 15, subtopic: "Symbolic Manipulations" },
  ]},
  AP_COMPUTER_SCIENCE_PRINCIPLES: { totalMinutes: 180, sections: [
    { cbName: "Multiple Choice", questionType: "MCQ", count: 70, percentOfScore: 70, minutes: 120 },
    { cbName: "WR1 (Program Design)", questionType: "FRQ", count: 1, percentOfScore: 15, minutes: 30, subtopic: "Written Response 1 (Program Design)" },
    { cbName: "WR2 (Algorithm/Errors/Data)", questionType: "FRQ", count: 1, percentOfScore: 15, minutes: 30, subtopic: "Written Response 2 (Algorithm/Errors/Data)" },
  ]},
};

const courses = Object.keys(AP_EXAM_STRUCTURES);
const overall = { courses: courses.length, fullyServiceable: 0, partial: 0, broken: 0 };
const lines = [];

for (const course of courses) {
  const struct = AP_EXAM_STRUCTURES[course];
  const totalPercent = struct.sections.reduce((a, s) => a + s.percentOfScore, 0);
  const totalMinutes = struct.sections.reduce((a, s) => a + s.minutes, 0);

  lines.push(`\n## ${course}`);
  lines.push(`CB total minutes config: ${struct.totalMinutes}, sum of section minutes: ${totalMinutes}, sum of percent: ${totalPercent.toFixed(1)}%`);
  if (Math.abs(totalPercent - 100) > 0.5) {
    lines.push(`  ⚠ percent total ${totalPercent.toFixed(1)} is not ~100`);
  }
  if (totalMinutes !== struct.totalMinutes) {
    lines.push(`  ⚠ totalMinutes mismatch (sum of sections=${totalMinutes}, structure says ${struct.totalMinutes})`);
  }

  let allSectionsServiceable = true;
  let anyServiceable = false;

  lines.push(`| Section | Type | CB Count | Bank w/ subtopic | Bank w/o subtopic | Status |`);
  lines.push(`|---|---|---:|---:|---:|---|`);
  for (const sec of struct.sections) {
    let withSubtopic = 0;
    let withoutSubtopic = 0;
    if (sec.subtopic) {
      const r = await sql`
        SELECT COUNT(*)::int AS n FROM questions
        WHERE course = ${course}::"ApCourse"
          AND "isApproved" = true
          AND "questionType" = ${sec.questionType}::"QuestionType"
          AND subtopic = ${sec.subtopic}
      `;
      withSubtopic = r[0]?.n ?? 0;
    }
    const r2 = await sql`
      SELECT COUNT(*)::int AS n FROM questions
      WHERE course = ${course}::"ApCourse"
        AND "isApproved" = true
        AND "questionType" = ${sec.questionType}::"QuestionType"
    `;
    withoutSubtopic = r2[0]?.n ?? 0;

    const effective = sec.subtopic ? withSubtopic : withoutSubtopic;
    let status = "✅";
    if (effective === 0) {
      status = "❌ EMPTY";
      allSectionsServiceable = false;
    } else if (effective < sec.count) {
      status = `⚠ thin (${effective} < CB ${sec.count})`;
      anyServiceable = true;
    } else {
      anyServiceable = true;
    }
    lines.push(`| ${sec.cbName} | ${sec.questionType} | ${sec.count} | ${sec.subtopic ? withSubtopic : "—"} | ${withoutSubtopic} | ${status} |`);
  }

  if (allSectionsServiceable) overall.fullyServiceable++;
  else if (anyServiceable) overall.partial++;
  else overall.broken++;
}

console.log("# Mock Exam CB-fidelity audit — 2026-04-27");
console.log("\nOverall:", overall);
for (const l of lines) console.log(l);

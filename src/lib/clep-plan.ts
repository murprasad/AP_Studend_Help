/**
 * Static 7-day CLEP study plan generator.
 *
 * Separated from ai.ts to avoid pulling in Prisma/server-only deps.
 * Safe to import in client components ("use client").
 */
import { COURSE_REGISTRY } from "./courses";
import { ApCourse } from "@prisma/client";

export function staticCLEP7DayPlan(course: ApCourse): object {
  const config = COURSE_REGISTRY[course];
  const unitEntries = Object.entries(config.units);

  return {
    planType: "7day",
    courseName: config.name,
    isStatic: true,
    days: [
      { day: 1, theme: `Foundation: ${unitEntries[0]?.[1]?.name || "Unit 1"}`, units: [unitEntries[0]?.[0]], tasks: ["Take a diagnostic quiz — 15 MCQs across all units (20 min)", `Read overview of ${unitEntries[0]?.[1]?.name || "Unit 1"} (30 min)`, "Complete 15 MCQs on Unit 1 (20 min)"], estimatedMinutes: 70, milestone: "Identify your weak areas" },
      { day: 2, theme: `Core Topics: ${unitEntries[1]?.[1]?.name || "Unit 2"}`, units: [unitEntries[1]?.[0]], tasks: [`Study ${unitEntries[1]?.[1]?.name || "Unit 2"} key themes (30 min)`, "Complete 20 MCQs on Unit 2 (25 min)", "Review wrong answers with Sage (15 min)"], estimatedMinutes: 70, milestone: "50%+ mastery on Units 1-2" },
      { day: 3, theme: `Deep Dive: ${unitEntries[2]?.[1]?.name || "Unit 3"}`, units: [unitEntries[2]?.[0]], tasks: [`Study ${unitEntries[2]?.[1]?.name || "Unit 3"} key themes (30 min)`, "Complete 20 MCQs on Unit 3 (25 min)", "Ask Sage about any confusing concepts (15 min)"], estimatedMinutes: 70, milestone: "50%+ mastery on Units 1-3" },
      { day: 4, theme: `Practice: ${unitEntries[3]?.[1]?.name || "Unit 4"} & ${unitEntries[4]?.[1]?.name || "Unit 5"}`, units: [unitEntries[3]?.[0], unitEntries[4]?.[0]], tasks: ["Study Units 4-5 key themes (30 min)", "Complete 15 MCQs on Unit 4 (20 min)", "Complete 15 MCQs on Unit 5 (20 min)"], estimatedMinutes: 70, milestone: "50%+ mastery across all units" },
      { day: 5, theme: "Weak Area Targeting", units: unitEntries.map(e => e[0]), tasks: ["Review mastery scores — identify units below 70% (10 min)", "Complete 25 targeted MCQs on weakest unit (30 min)", "Complete 15 MCQs on second weakest unit (20 min)", "Re-read key concepts with Sage (15 min)"], estimatedMinutes: 75, milestone: "70%+ mastery on at least 3 units" },
      { day: 6, theme: "Mock Exam + Review", units: unitEntries.map(e => e[0]), tasks: ["Take a full 50-question mock exam (60 min)", "Review every wrong answer explanation (20 min)", "Note common traps and patterns (10 min)"], estimatedMinutes: 90, milestone: "70%+ overall accuracy on mock" },
      { day: 7, theme: "Final Review & Confidence", units: unitEntries.map(e => e[0]), tasks: ["Quick 20-question review quiz (20 min)", "Re-read notes on your 3 weakest topics (20 min)", "Rest and prepare for exam day (logistics check)"], estimatedMinutes: 40, milestone: "Confidence check — 70%+ readiness score" },
    ],
    readinessThreshold: 70,
    examTip: `Remember: CLEP ${config.name} has no penalty for guessing. Answer every question, even if unsure.`,
  };
}

import { describe, it, expect } from "vitest";
import { generateSatStudyPlan } from "@/lib/sat-study-plan";

describe("generateSatStudyPlan — F14 SAT domain-paced study plan (#100)", () => {
  const evenMasteries = [
    { unit: "SAT_MATH_1_ALGEBRA", masteryScore: 50 },
    { unit: "SAT_MATH_2_ADVANCED_MATH", masteryScore: 50 },
    { unit: "SAT_MATH_3_PROBLEM_SOLVING", masteryScore: 50 },
    { unit: "SAT_MATH_4_GEOMETRY_TRIG", masteryScore: 50 },
    { unit: "SAT_RW_1_CRAFT_STRUCTURE", masteryScore: 50 },
    { unit: "SAT_RW_2_INFO_IDEAS", masteryScore: 50 },
    { unit: "SAT_RW_3_STANDARD_ENGLISH", masteryScore: 50 },
    { unit: "SAT_RW_4_EXPRESSION_IDEAS", masteryScore: 50 },
  ];

  it("totalDays matches input", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.totalDays).toBe(7);
  });

  it("reserves last day for mock when daysToExam >= 1", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.mockDays).toContain(6);
  });

  it("reserves last 2 days for mock when daysToExam >= 4", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.mockDays.length).toBe(2);
    expect(r.mockDays).toContain(5);
    expect(r.mockDays).toContain(6);
  });

  it("only 1 mock day when daysToExam < 4", () => {
    const r = generateSatStudyPlan({
      daysToExam: 3,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.mockDays.length).toBe(1);
  });

  it("schedule length equals totalDays", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.schedule.length).toBe(7);
  });

  it("schedule is chronological by dayIndex", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    for (let i = 1; i < r.schedule.length; i += 1) {
      expect(r.schedule[i].dayIndex).toBeGreaterThan(r.schedule[i - 1].dayIndex);
    }
  });

  it("Math 400 / R&W 600 → more days on Math", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 400, readingWriting: 600 },
      domainMasteries: evenMasteries,
    });
    const mathTrainingDays = r.schedule.filter(
      (d) => d.primaryCourse === "SAT_MATH",
    ).length;
    const rwTrainingDays = r.schedule.filter(
      (d) => d.primaryCourse === "SAT_READING_WRITING",
    ).length;
    expect(mathTrainingDays).toBeGreaterThan(rwTrainingDays);
  });

  it("targets the weakest domain on day 0", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 400, readingWriting: 600 },
      domainMasteries: [
        ...evenMasteries.filter((m) => m.unit !== "SAT_MATH_3_PROBLEM_SOLVING"),
        { unit: "SAT_MATH_3_PROBLEM_SOLVING", masteryScore: 10 }, // very weak
      ],
    });
    expect(r.schedule[0].primaryCourse).toBe("SAT_MATH");
    expect(r.schedule[0].primaryDomain).toBe("SAT_MATH_3_PROBLEM_SOLVING");
  });

  it("rotates onto second-weakest domain on a section's repeat day", () => {
    const r = generateSatStudyPlan({
      daysToExam: 7,
      sectionScores: { math: 300, readingWriting: 700 },
      domainMasteries: [
        { unit: "SAT_MATH_1_ALGEBRA", masteryScore: 90 },
        { unit: "SAT_MATH_2_ADVANCED_MATH", masteryScore: 80 },
        { unit: "SAT_MATH_3_PROBLEM_SOLVING", masteryScore: 30 }, // weakest
        { unit: "SAT_MATH_4_GEOMETRY_TRIG", masteryScore: 40 },   // 2nd weakest
        ...evenMasteries.filter((m) => m.unit.startsWith("SAT_RW")),
      ],
    });
    // Find the first two Math days
    const mathDays = r.schedule.filter((d) => d.primaryCourse === "SAT_MATH");
    expect(mathDays.length).toBeGreaterThan(1);
    expect(mathDays[0].primaryDomain).toBe("SAT_MATH_3_PROBLEM_SOLVING");
    expect(mathDays[1].primaryDomain).toBe("SAT_MATH_4_GEOMETRY_TRIG");
  });

  it("works with null section scores (no diagnostic yet)", () => {
    const r = generateSatStudyPlan({
      daysToExam: 5,
      sectionScores: { math: null, readingWriting: null },
      domainMasteries: evenMasteries,
    });
    expect(r.totalDays).toBe(5);
    expect(r.schedule.length).toBe(5);
    // Should split evenly when no scores
    const mathDays = r.schedule.filter((d) => d.primaryCourse === "SAT_MATH").length;
    const rwDays = r.schedule.filter((d) => d.primaryCourse === "SAT_READING_WRITING").length;
    expect(Math.abs(mathDays - rwDays)).toBeLessThanOrEqual(1);
  });

  it("daysToExam = 1 returns just a mock day", () => {
    const r = generateSatStudyPlan({
      daysToExam: 1,
      sectionScores: { math: 500, readingWriting: 500 },
      domainMasteries: evenMasteries,
    });
    expect(r.totalDays).toBe(1);
    expect(r.mockDays).toEqual([0]);
    expect(r.schedule.length).toBe(1);
    expect(r.schedule[0].primaryCourse).toBe("MOCK");
  });
});

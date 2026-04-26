import { describe, expect, it } from "vitest";
import { getScoreActions } from "./weaknesses";

describe("getScoreActions — Phase A weakness recommender", () => {
  it("returns empty array for unknown course", () => {
    // @ts-expect-error - testing defensive return
    const actions = getScoreActions("AP_NOT_A_REAL_COURSE", []);
    expect(actions).toEqual([]);
  });

  it("ranks weakest practiced unit highest when multiple units have signal", () => {
    // AP_BIOLOGY has 8 units. Give one unit 30% mastery, others 80%.
    const masteryRows = [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 80, totalAttempts: 20 },
      { unit: "BIO_2_CELL_STRUCTURE_FUNCTION", masteryScore: 30, totalAttempts: 20 },
      { unit: "BIO_3_CELLULAR_ENERGETICS", masteryScore: 75, totalAttempts: 20 },
    ];
    const actions = getScoreActions("AP_BIOLOGY", masteryRows, 3);
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].unit).toBe("BIO_2_CELL_STRUCTURE_FUNCTION");
    expect(actions[0].reason).toBe("Lowest mastery");
    expect(actions[0].currentMastery).toBe(30);
  });

  it("includes untouched units when fewer than topN have practice signal", () => {
    // Single mastery row → other 7 units should fill the recommendations
    // as untouched.
    const masteryRows = [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 90, totalAttempts: 50 },
    ];
    const actions = getScoreActions("AP_BIOLOGY", masteryRows, 3);
    expect(actions.length).toBe(3);
    // At least one Untouched should appear since student has only practiced 1 unit
    const untouched = actions.filter((a) => a.reason === "Untouched");
    expect(untouched.length).toBeGreaterThan(0);
  });

  it("prefers practiced-but-weak over untouched (real signal beats no signal)", () => {
    // AP_BIO with one weak practiced unit (40% mastery, 10 attempts) and 7 untouched.
    // Weak practiced should rank above untouched because evidence multiplier >> untouched midrank.
    const masteryRows = [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 40, totalAttempts: 10 },
    ];
    const actions = getScoreActions("AP_BIOLOGY", masteryRows, 5);
    expect(actions[0].unit).toBe("BIO_1_CHEMISTRY_OF_LIFE");
    expect(actions[0].reason).toBe("High impact");
  });

  it("href encodes the unit and includes course param", () => {
    const masteryRows = [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 30, totalAttempts: 10 },
    ];
    const actions = getScoreActions("AP_BIOLOGY", masteryRows, 1);
    expect(actions[0].href).toContain("course=AP_BIOLOGY");
    expect(actions[0].href).toContain("unit=BIO_1_CHEMISTRY_OF_LIFE");
  });

  it("estQuestionsToTier is bounded [5, 50]", () => {
    // Mastery 99% → very small gap → should floor at 5.
    const high = getScoreActions("AP_BIOLOGY", [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 99, totalAttempts: 50 },
    ], 1);
    expect(high[0].estQuestionsToTier).toBeGreaterThanOrEqual(5);
    expect(high[0].estQuestionsToTier).toBeLessThanOrEqual(50);

    // Mastery 0% → huge gap → should cap at 50, not be 125.
    const low = getScoreActions("AP_BIOLOGY", [
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 0, totalAttempts: 10 },
    ], 1);
    expect(low[0].estQuestionsToTier).toBeLessThanOrEqual(50);
  });

  it("never returns more than topN actions", () => {
    // AP_BIOLOGY has 8 units. Cap at 3.
    const masteryRows = Array.from({ length: 8 }, (_, i) => ({
      unit: `AP_BIO_UNIT_${i + 1}`,
      masteryScore: 50,
      totalAttempts: 10,
    }));
    expect(getScoreActions("AP_BIOLOGY", masteryRows, 3).length).toBeLessThanOrEqual(3);
    expect(getScoreActions("AP_BIOLOGY", masteryRows, 1).length).toBeLessThanOrEqual(1);
  });

  it("filters out unknown unit enums (defensive against legacy data)", () => {
    // Use topN=10 to test the filter regardless of ranking among AP_BIOLOGY's 8 known units.
    const masteryRows = [
      { unit: "OLD_REMOVED_UNIT_NAME", masteryScore: 30, totalAttempts: 10 },
      { unit: "BIO_1_CHEMISTRY_OF_LIFE", masteryScore: 50, totalAttempts: 10 },
    ];
    const actions = getScoreActions("AP_BIOLOGY", masteryRows, 10);
    expect(actions.find((a) => a.unit === "OLD_REMOVED_UNIT_NAME")).toBeUndefined();
    expect(actions.find((a) => a.unit === "BIO_1_CHEMISTRY_OF_LIFE")).toBeDefined();
  });
});

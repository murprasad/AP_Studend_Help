/**
 * Unit tests for @preplion/generation-loop.
 *
 * Runs with vitest. Uses a temp directory for the data files so tests don't
 * pollute the real data/gate-feedback or data/template-scores trees.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  registerTemplate,
  _resetRegistryForTests,
  generateWithFeedback,
  recordGateOutcome,
  getNegativePromptForTopic,
  getTopicStats,
  scoreTemplate,
  selectTemplate,
  DEFAULT_MCQ_TEMPLATE,
  expectedOptionCount,
  optionLetters,
  courseFamily,
} from "../src/index.js";
import type { Question, Template } from "../src/types.js";

let dataDir: string;

beforeEach(() => {
  dataDir = mkdtempSync(join(tmpdir(), "genloop-test-"));
  _resetRegistryForTests();
  registerTemplate(DEFAULT_MCQ_TEMPLATE);
});
afterEach(() => {
  rmSync(dataDir, { recursive: true, force: true });
});

function makeQ(over: Partial<Question> = {}): Question {
  return {
    questionText: "What is 2+2?",
    options: ["A) 3", "B) 4", "C) 5", "D) 6"],
    correctAnswer: "B",
    explanation: "4 is correct because 2 plus 2 equals 4 by basic addition.",
    course: "CLEP_BIOLOGY",
    topic: "arithmetic",
    difficulty: "EASY",
    ...over,
  };
}

describe("feedback-store", () => {
  it("starts with no negative prompt", () => {
    expect(getNegativePromptForTopic(dataDir, "CLEP_BIOLOGY", "cells")).toBe("");
  });

  it("records a failure and surfaces it in negative prompt", () => {
    recordGateOutcome(dataDir, "CLEP_BIOLOGY", "cells", {
      ok: false, gate: "explanation-no-reasoning", reason: "missing because/since",
    });
    const np = getNegativePromptForTopic(dataDir, "CLEP_BIOLOGY", "cells");
    expect(np).toContain("AVOID THESE PATTERNS");
    expect(np).toContain("explanation-no-reasoning");
    expect(np).toContain("1 prior failure");
  });

  it("counts repeated failures of the same gate", () => {
    for (let i = 0; i < 5; i++) {
      recordGateOutcome(dataDir, "CLEP_BIOLOGY", "cells", {
        ok: false, gate: "explanation-no-reasoning", reason: "x",
      });
    }
    const stats = getTopicStats(dataDir, "CLEP_BIOLOGY", "cells");
    expect(stats?.failures["explanation-no-reasoning"]?.count).toBe(5);
    expect(stats?.totalAttempts).toBe(5);
    expect(stats?.totalPassed).toBe(0);
  });

  it("records passed attempts without polluting failure list", () => {
    recordGateOutcome(dataDir, "CLEP_BIOLOGY", "cells", { ok: true });
    const stats = getTopicStats(dataDir, "CLEP_BIOLOGY", "cells");
    expect(stats?.totalAttempts).toBe(1);
    expect(stats?.totalPassed).toBe(1);
    expect(Object.keys(stats?.failures ?? {})).toEqual([]);
  });

  it("orders negative-prompt failures by count desc, top-5", () => {
    const gates = ["g1", "g2", "g3", "g4", "g5", "g6"];
    // g6 most frequent, g1 least frequent
    gates.forEach((g, i) => {
      const n = i + 1;
      for (let k = 0; k < n; k++) {
        recordGateOutcome(dataDir, "CLEP_BIOLOGY", "cells", { ok: false, gate: g, reason: "x" });
      }
    });
    const np = getNegativePromptForTopic(dataDir, "CLEP_BIOLOGY", "cells");
    // g6 (6 failures) should appear before g5 (5 failures)
    expect(np.indexOf("g6")).toBeLessThan(np.indexOf("g5"));
    // g1 (1 failure) should not appear — only top 5
    expect(np).not.toContain('"g1"');
  });
});

describe("template-registry", () => {
  it("returns the one registered template when only one exists", () => {
    const t = selectTemplate(dataDir, "CLEP_BIOLOGY", "cells");
    expect(t.id).toBe(DEFAULT_MCQ_TEMPLATE.id);
  });

  it("scores templates per (course, topic) and tracks pass rate", () => {
    scoreTemplate(dataDir, "CLEP_BIOLOGY", "cells", "default-mcq-v1", "passed");
    scoreTemplate(dataDir, "CLEP_BIOLOGY", "cells", "default-mcq-v1", "passed");
    scoreTemplate(dataDir, "CLEP_BIOLOGY", "cells", "default-mcq-v1", "failed-after-retries");
    // Read via the file system to verify persistence
    const path = join(dataDir, "template-scores", "CLEP_BIOLOGY.json");
    expect(existsSync(path)).toBe(true);
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    const entry = parsed.topics.cells.templates["default-mcq-v1"];
    expect(entry.attempts).toBe(3);
    expect(entry.passed).toBe(2);
    expect(entry.passRate).toBeCloseTo(2 / 3, 5);
  });

  it("explores equal-weighted before MIN_SAMPLES, then exploits", () => {
    const defaultId = DEFAULT_MCQ_TEMPLATE.id;
    // Register a 2nd template
    registerTemplate({
      id: "alt-template-v1",
      version: "1.0.0",
      systemPrompt: "alt prompt",
    });
    // Only 5 attempts each — should still equal-weight
    for (let i = 0; i < 5; i++) {
      scoreTemplate(dataDir, "CLEP_BIOLOGY", "cells", defaultId, "passed");
      scoreTemplate(dataDir, "CLEP_BIOLOGY", "cells", "alt-template-v1", "failed-after-retries");
    }
    // 1000 picks — should be ~50/50 since we're still in exploration phase
    const picks = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const t = selectTemplate(dataDir, "CLEP_BIOLOGY", "cells");
      picks.set(t.id, (picks.get(t.id) ?? 0) + 1);
    }
    // Each template should be picked between 30% and 70% (loose bounds for flake)
    expect(picks.get(defaultId)!).toBeGreaterThan(300);
    expect(picks.get("alt-template-v1")!).toBeGreaterThan(300);
  });
});

describe("course-info", () => {
  it("returns 5 options for most CLEP courses, 4 for the documented exceptions", () => {
    expect(expectedOptionCount("CLEP_AMERICAN_GOVERNMENT")).toBe(5);
    expect(expectedOptionCount("CLEP_BIOLOGY")).toBe(5);
    expect(expectedOptionCount("CLEP_COLLEGE_MATH")).toBe(4);
    expect(expectedOptionCount("CLEP_SPANISH")).toBe(4);
  });

  it("returns 4 options for AP/SAT/ACT/PSAT/DSST/Accuplacer", () => {
    expect(expectedOptionCount("AP_BIOLOGY")).toBe(4);
    expect(expectedOptionCount("SAT_MATH")).toBe(4);
    expect(expectedOptionCount("ACT_ENGLISH")).toBe(4);
    expect(expectedOptionCount("PSAT_MATH")).toBe(4);
    expect(expectedOptionCount("DSST_ASTRONOMY")).toBe(4);
    expect(expectedOptionCount("ACCUPLACER")).toBe(4);
  });

  it("returns matching option letters", () => {
    expect(optionLetters("CLEP_AMERICAN_GOVERNMENT")).toBe("A-E");
    expect(optionLetters("AP_BIOLOGY")).toBe("A-D");
  });

  it("returns sensible course families", () => {
    expect(courseFamily("CLEP_BIOLOGY")).toBe("CLEP");
    expect(courseFamily("AP_PHYSICS_1")).toBe("AP");
    expect(courseFamily("SAT_MATH")).toBe("digital SAT");
    expect(courseFamily("DSST_ASTRONOMY")).toBe("DSST");
  });
});

describe("course-aware default template", () => {
  it("DEFAULT_MCQ_TEMPLATE is v2 and function-based", () => {
    expect(DEFAULT_MCQ_TEMPLATE.id).toBe("default-mcq-v2");
    expect(typeof DEFAULT_MCQ_TEMPLATE.systemPrompt).toBe("function");
  });

  it("injects EXACTLY 5 options for CLEP courses", () => {
    const fn = DEFAULT_MCQ_TEMPLATE.systemPrompt as (ctx: { course: string; topic: string }) => string;
    const prompt = fn({ course: "CLEP_AMERICAN_GOVERNMENT", topic: "civil rights" });
    expect(prompt).toContain("EXACTLY 5 options");
    expect(prompt).toContain("A-E");
    expect(prompt).toContain("CLEP");
  });

  it("injects EXACTLY 4 options for AP/SAT/ACT courses", () => {
    const fn = DEFAULT_MCQ_TEMPLATE.systemPrompt as (ctx: { course: string; topic: string }) => string;
    const prompt = fn({ course: "AP_PHYSICS_1", topic: "kinematics" });
    expect(prompt).toContain("EXACTLY 4 options");
    expect(prompt).toContain("A-D");
    expect(prompt).toContain("AP");
  });
});

describe("generateWithFeedback resolves function-based systemPrompt", () => {
  it("calls the systemPrompt function with {course, topic} when it's a function", async () => {
    let capturedSystemPrompt = "";
    const funcTemplate: Template = {
      id: "test-func-template",
      version: "1.0.0",
      systemPrompt: ({ course, topic }) => `Custom for ${course}/${topic}`,
    };
    _resetRegistryForTests();
    registerTemplate(funcTemplate);
    const result = await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "cells",
      llm: async ({ systemPrompt }) => {
        capturedSystemPrompt = systemPrompt;
        return JSON.stringify(makeQ());
      },
      gates: () => ({ ok: true }),
      dataDir,
    });
    expect(result.result).toBe("passed");
    expect(capturedSystemPrompt).toContain("Custom for CLEP_BIOLOGY/cells");
  });

  it("still accepts a string-based systemPrompt (backwards-compat)", async () => {
    let capturedSystemPrompt = "";
    const stringTemplate: Template = {
      id: "test-string-template",
      version: "1.0.0",
      systemPrompt: "Static prompt string",
    };
    _resetRegistryForTests();
    registerTemplate(stringTemplate);
    await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "cells",
      llm: async ({ systemPrompt }) => {
        capturedSystemPrompt = systemPrompt;
        return JSON.stringify(makeQ());
      },
      gates: () => ({ ok: true }),
      dataDir,
    });
    expect(capturedSystemPrompt).toContain("Static prompt string");
  });
});

describe("generateWithFeedback (closed loop)", () => {
  it("returns passed on first-attempt gate pass", async () => {
    const q = makeQ();
    const result = await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "arithmetic",
      llm: async () => JSON.stringify(q),
      gates: () => ({ ok: true }),
      dataDir,
    });
    expect(result.result).toBe("passed");
    expect(result.attemptsUsed).toBe(1);
    expect(result.q).not.toBeNull();
  });

  it("retries on gate fail with previous failure in user prompt, then passes", async () => {
    const capturedUserPrompts: string[] = [];
    const llm = async ({ userPrompt }: { systemPrompt: string; userPrompt: string }) => {
      capturedUserPrompts.push(userPrompt);
      return JSON.stringify(makeQ());
    };
    let calls = 0;
    const gates = () => {
      calls++;
      if (calls === 1) return { ok: false, gate: "explanation-no-reasoning", reason: "missing because/since" };
      return { ok: true };
    };
    const result = await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "arithmetic",
      llm, gates, dataDir,
    });
    expect(result.result).toBe("passed");
    expect(result.attemptsUsed).toBe(2);
    // The 2nd user prompt should carry the previous failure feedback
    expect(capturedUserPrompts[1]).toContain("Previous attempt FAILED");
    expect(capturedUserPrompts[1]).toContain("explanation-no-reasoning");
  });

  it("returns failed-after-retries after exhausting maxRetries (policy a — skip)", async () => {
    const result = await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "arithmetic",
      llm: async () => JSON.stringify(makeQ()),
      gates: () => ({ ok: false, gate: "stuck", reason: "never passes" }),
      maxRetries: 2,
      dataDir,
    });
    expect(result.result).toBe("failed-after-retries");
    expect(result.attemptsUsed).toBe(3); // maxRetries + 1 initial
    expect(result.gateHistory).toHaveLength(3);
  });

  it("prepends negative prompt from accumulated memory on subsequent generations", async () => {
    // Seed the memory with a few failures
    for (let i = 0; i < 3; i++) {
      recordGateOutcome(dataDir, "CLEP_BIOLOGY", "cells", {
        ok: false, gate: "phantom-stimulus", reason: "stem references figure but none given",
      });
    }
    const capturedSystemPrompts: string[] = [];
    await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "cells",
      llm: async ({ systemPrompt }) => {
        capturedSystemPrompts.push(systemPrompt);
        return JSON.stringify(makeQ({ topic: "cells" }));
      },
      gates: () => ({ ok: true }),
      dataDir,
    });
    expect(capturedSystemPrompts[0]).toContain("AVOID THESE PATTERNS");
    expect(capturedSystemPrompts[0]).toContain("phantom-stimulus");
    expect(capturedSystemPrompts[0]).toContain("3 prior failures");
  });

  it("uses a custom buildUserPrompt callback when provided", async () => {
    const captured: string[] = [];
    const result = await generateWithFeedback({
      course: "AP_ENGLISH_LITERATURE",
      topic: "passage-001",
      llm: async ({ userPrompt }) => {
        captured.push(userPrompt);
        return JSON.stringify(makeQ({ course: "AP_ENGLISH_LITERATURE" }));
      },
      gates: () => ({ ok: true }),
      buildUserPrompt: ({ course, topic, attempt }) =>
        `OER PASSAGE for ${course}/${topic} on attempt ${attempt}. Write a passage-grounded MCQ.`,
      dataDir,
    });
    expect(result.result).toBe("passed");
    expect(captured[0]).toContain("OER PASSAGE for AP_ENGLISH_LITERATURE/passage-001");
    expect(captured[0]).toContain("attempt 1");
  });

  it("custom buildUserPrompt receives the previous failure on retries", async () => {
    const capturedAttempts: number[] = [];
    const capturedPrevFails: (string | undefined)[] = [];
    let gateCalls = 0;
    const result = await generateWithFeedback({
      course: "AP_ENGLISH_LITERATURE",
      topic: "passage-001",
      llm: async () => JSON.stringify(makeQ({ course: "AP_ENGLISH_LITERATURE" })),
      gates: () => {
        gateCalls++;
        return gateCalls === 1
          ? { ok: false, gate: "explanation-too-short", reason: "32 chars, need ≥80" }
          : { ok: true };
      },
      buildUserPrompt: ({ attempt, previousFailure }) => {
        capturedAttempts.push(attempt);
        capturedPrevFails.push(previousFailure?.gate);
        return `attempt=${attempt}`;
      },
      dataDir,
    });
    expect(result.result).toBe("passed");
    expect(capturedAttempts).toEqual([1, 2]);
    expect(capturedPrevFails).toEqual([undefined, "explanation-too-short"]);
  });

  it("handles unparseable LLM output by treating it as a shape-parse-fail and retrying", async () => {
    let calls = 0;
    const llm = async () => {
      calls++;
      if (calls === 1) return "this is not JSON";
      return JSON.stringify(makeQ());
    };
    const result = await generateWithFeedback({
      course: "CLEP_BIOLOGY",
      topic: "arithmetic",
      llm, gates: () => ({ ok: true }), dataDir,
    });
    expect(result.result).toBe("passed");
    expect(result.attemptsUsed).toBe(2);
    expect(result.gateHistory[0]?.gate).toBe("shape-parse-fail");
  });
});

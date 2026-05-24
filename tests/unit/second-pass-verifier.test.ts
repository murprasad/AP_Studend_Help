/**
 * REQ-141 — Second-pass Haiku verifier parser tests.
 *
 * We don't hit the live Anthropic API in unit tests. Instead we mock
 * `fetch` to return canned Haiku response bodies and assert the parser
 * extracts {verdict, solved_letter, reason} correctly + falls back
 * safely on malformed input.
 *
 * Reference: docs/COMPREHENSIVE_TEST_PLAN.md §L2
 *            scripts/lib/_second-pass-verifier.mjs
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const originalFetch = globalThis.fetch;
const originalKey = process.env.ANTHROPIC_API_KEY;

const importVerifier = async () => {
  // Re-import each test so env state is picked up fresh.
  const url = new URL("../../scripts/lib/_second-pass-verifier.mjs", import.meta.url).href;
  // Cache-bust the dynamic import in vitest.
  return import(`${url}?t=${Date.now()}`);
};

const sampleQ = {
  questionText: "What is 2 + 2?",
  stimulus: null,
  options: ["A) 3", "B) 4", "C) 5", "D) 6"],
  correctAnswer: "B",
  explanation: "Adding two and two gives four.",
};

const mockHaiku = (text: string, status = 200) => {
  globalThis.fetch = vi.fn(async () => {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ content: [{ text }] }),
      text: async () => text,
    } as unknown as Response;
  });
};

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "sk-test-fake-key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  process.env.ANTHROPIC_API_KEY = originalKey;
  vi.restoreAllMocks();
});

describe("REQ-141 — second-pass verifier", () => {
  it("L2-P1: returns PASS for correct-answer Q", async () => {
    mockHaiku("verdict: PASS\nsolved_letter: B\nreason: Adds to four.");
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("PASS");
    expect(r.ok).toBe(true);
  });

  it("L2-P2: SKIP for opinion Q is treated as ok", async () => {
    mockHaiku("verdict: SKIP\nsolved_letter: N/A\nreason: Subjective.");
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("SKIP");
    expect(r.ok).toBe(true);
  });

  it("L2-P3: missing ANTHROPIC_API_KEY returns SKIP without network call", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(spy).not.toHaveBeenCalled();
    expect(r.verdict).toBe("SKIP");
    expect(r.ok).toBe(true);
  });

  it("L2-N1: FAIL verdict makes ok=false", async () => {
    mockHaiku("verdict: FAIL\nsolved_letter: A\nreason: Computed 3, not 4.");
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("FAIL");
    expect(r.ok).toBe(false);
  });

  it("L2-N2: malformed body (no verdict: line) defaults to SKIP", async () => {
    mockHaiku("I am a robot. Beep boop. Nothing structured here.");
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("SKIP");
    expect(r.ok).toBe(true);
  });

  it("L2-N3/N4: Haiku 429 returns SKIP", async () => {
    mockHaiku("rate limit", 429);
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("SKIP");
    expect(r.ok).toBe(true);
  });

  it("L2-N5: fewer than 2 options skips Haiku call", async () => {
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify({ ...sampleQ, options: ["A) only"] });
    expect(spy).not.toHaveBeenCalled();
    expect(r.verdict).toBe("SKIP");
  });

  it("L2-N9: case-insensitive verdict parse ('Verdict: pass')", async () => {
    mockHaiku("Verdict: pass\nsolved_letter: B\nreason: ok");
    const { secondPassVerify } = await importVerifier();
    const r = await secondPassVerify(sampleQ);
    expect(r.verdict).toBe("PASS");
  });
});

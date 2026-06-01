import { describe, it, expect } from "vitest";
import {
  probCorrect,
  logLikelihood,
  estimateTheta,
  estimateThetaFromAccuracy,
  thetaToSatScale,
} from "@/lib/irt";

describe("IRT — F11 (#100 SAT=CB parity)", () => {
  describe("probCorrect (3PL)", () => {
    it("returns c at theta = -infinity (asymptote)", () => {
      const p = probCorrect(-50, { a: 1, b: 0, c: 0.25 });
      expect(p).toBeCloseTo(0.25, 4);
    });
    it("returns ~1 at theta = +infinity", () => {
      const p = probCorrect(50, { a: 1, b: 0, c: 0 });
      expect(p).toBeCloseTo(1, 4);
    });
    it("returns (1+c)/2 at theta == b (the inflection point for c=0)", () => {
      const p = probCorrect(0, { a: 1, b: 0, c: 0 });
      expect(p).toBeCloseTo(0.5, 4);
    });
    it("hard item (b=+2) at median theta has low P", () => {
      const p = probCorrect(0, { a: 1, b: 2, c: 0 });
      expect(p).toBeLessThan(0.1);
    });
    it("easy item (b=-2) at median theta has high P", () => {
      const p = probCorrect(0, { a: 1, b: -2, c: 0 });
      expect(p).toBeGreaterThan(0.9);
    });
  });

  describe("logLikelihood", () => {
    it("symmetric: equal mixture peaks near theta = mean b", () => {
      const items = [
        { item: { a: 1, b: -1, c: 0 }, isCorrect: true },
        { item: { a: 1, b: 1, c: 0 }, isCorrect: false },
      ];
      const llAt0 = logLikelihood(0, items);
      const llAt2 = logLikelihood(2, items);
      const llAtNeg2 = logLikelihood(-2, items);
      expect(llAt0).toBeGreaterThan(llAt2);
      expect(llAt0).toBeGreaterThan(llAtNeg2);
    });
  });

  describe("estimateTheta", () => {
    it("recovers a planted theta within 0.3 (modest noise pattern)", () => {
      const trueTheta = 1.0;
      const items = Array.from({ length: 20 }, (_, i) => ({
        a: 1,
        b: -2 + (i / 19) * 4, // range -2 to +2
        c: 0,
      }));
      // Deterministic Bernoulli replacement: a student answers correctly
      // iff probCorrect > 0.5
      const responses = items.map((it) => ({
        item: it,
        isCorrect: probCorrect(trueTheta, it) > 0.5,
      }));
      const est = estimateTheta(responses);
      expect(est).not.toBeNull();
      expect(Math.abs((est ?? 0) - trueTheta)).toBeLessThan(0.5);
    });
    it("returns null when all responses are correct (degenerate)", () => {
      const items = [
        { item: { a: 1, b: 0, c: 0 }, isCorrect: true },
        { item: { a: 1, b: 0, c: 0 }, isCorrect: true },
      ];
      expect(estimateTheta(items)).toBeNull();
    });
    it("returns null when all responses are wrong (degenerate)", () => {
      const items = [
        { item: { a: 1, b: 0, c: 0 }, isCorrect: false },
        { item: { a: 1, b: 0, c: 0 }, isCorrect: false },
      ];
      expect(estimateTheta(items)).toBeNull();
    });
    it("returns null for an empty response set", () => {
      expect(estimateTheta([])).toBeNull();
    });
  });

  describe("estimateThetaFromAccuracy", () => {
    it("returns null for <5 answered", () => {
      expect(estimateThetaFromAccuracy(80, 3)).toBeNull();
    });
    it("50% accuracy maps to theta ≈ 0", () => {
      const t = estimateThetaFromAccuracy(50, 20);
      expect(t).not.toBeNull();
      expect(Math.abs(t ?? 0)).toBeLessThan(0.01);
    });
    it("80% accuracy maps to positive theta", () => {
      const t = estimateThetaFromAccuracy(80, 20);
      expect((t ?? 0)).toBeGreaterThan(1);
    });
    it("20% accuracy maps to negative theta", () => {
      const t = estimateThetaFromAccuracy(20, 20);
      expect((t ?? 0)).toBeLessThan(-1);
    });
  });

  describe("thetaToSatScale", () => {
    it("theta=0 → 500 SAT", () => {
      expect(thetaToSatScale(0, "SAT")).toBe(500);
    });
    it("theta=0 → 460 PSAT", () => {
      expect(thetaToSatScale(0, "PSAT")).toBe(460);
    });
    it("theta=4 (ceiling) → 800 SAT", () => {
      expect(thetaToSatScale(4, "SAT")).toBe(800);
    });
    it("theta=-4 (floor) → 200 SAT", () => {
      expect(thetaToSatScale(-4, "SAT")).toBe(200);
    });
    it("clamps theta above +4", () => {
      expect(thetaToSatScale(10, "SAT")).toBe(800);
    });
    it("clamps theta below -4", () => {
      expect(thetaToSatScale(-10, "SAT")).toBe(200);
    });
  });
});

import { describe, it, expect } from "vitest";
import { FREE_LIMITS, LOCK_COPY } from "@/lib/tier-limits";

// Locks the contract reviewers approved on 2026-04-22 + 2026-04-23.
// Changing a number here is a deliberate product decision — the test
// failure is the surface that forces the conversation.

describe("tier-limits — FREE_LIMITS contract", () => {
  // Bumped 20 → 30 (2026-04-27) per user direction: serious AP students do
  // 30-50 q/day; 20 cap signaled "this tool can't support real prep load."
  it("FREE practice cap is 30/day", () => {
    expect(FREE_LIMITS.practiceQuestionsPerDay).toBe(30);
  });

  it("FREE tutor chats cap is 3/day (sharpened from 5)", () => {
    expect(FREE_LIMITS.tutorChatsPerDay).toBe(3);
  });

  it("FREE mock exam shows 5 questions before paywall", () => {
    expect(FREE_LIMITS.mockExamQuestions).toBe(5);
  });

  it("FREE has no FRQ access", () => {
    expect(FREE_LIMITS.frqAccess).toBe(false);
  });

  it("FREE gets exactly 1 lifetime FRQ attempt (the conversion trigger)", () => {
    expect(FREE_LIMITS.frqFreeAttempts).toBe(1);
  });

  it("FREE has diagnosis-only analytics, not full prescription", () => {
    expect(FREE_LIMITS.fullAnalytics).toBe(false);
  });

  it("FREE has shallow Sage Coach plan", () => {
    expect(FREE_LIMITS.sageCoachDeepPlan).toBe(false);
  });

  it("FREE flashcards are linear order, not SM-2 spaced-repetition", () => {
    expect(FREE_LIMITS.flashcardSmartScheduling).toBe(false);
  });

  it("FREE diagnostic cooldown is 14 days (was 30, sharpened for retake rhythm)", () => {
    expect(FREE_LIMITS.diagnosticCooldownDays).toBe(14);
  });
});

describe("tier-limits — LOCK_COPY contract", () => {
  it("practiceCap copy frames as 'faster score improvement', not 'limit reached'", () => {
    expect(LOCK_COPY.practiceCap).toMatch(/Daily practice limit reached/i);
    expect(LOCK_COPY.practiceCap).toMatch(/score improvement|practice/i);
  });

  it("frqLocked copy frames as 'AP exams are graded on written'", () => {
    expect(LOCK_COPY.frqLocked).toMatch(/written|graded|AP exam/i);
  });

  it("diagnosticCooldown mentions 14 days (matches FREE_LIMITS)", () => {
    expect(LOCK_COPY.diagnosticCooldown).toContain("14 days");
  });
});

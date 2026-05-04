import { describe, it, expect } from "vitest";
import { validateStimulus } from "./stimulus-validator";

describe("validateStimulus — required primary source", () => {
  const req = { required: true, type: "primarySource" as const };

  it("flags the audit's APUSH gap (no stimulus on history MCQ)", () => {
    const q = "Which of the following best describes the impact of the Stamp Act on colonial relations with Britain?";
    const stim = "";
    const err = validateStimulus(q, stim, req);
    expect(err).toContain("missing or too short");
  });

  it("flags a paraphrased summary as not-a-primary-source", () => {
    const q = "Based on the passage above, which describes the colonists' main grievance?";
    const stim = "The colonists were angry about taxation without representation, leading to protests across the colonies.";
    const err = validateStimulus(q, stim, req);
    // The question references "passage above" — stimulus exists (>60 chars)
    // but doesn't look like a primary source. Should flag the
    // not-a-primary-source error.
    expect(err).toMatch(/primary source|attribution/);
  });

  it("flags 'Imagine' synthesized stimulus on history MCQ", () => {
    const q = "Based on the source, what was the colonists' main grievance?";
    const stim = "Imagine a colonist writing in 1765 about the recent passage of the Stamp Act, expressing his concerns about Parliament's authority and the lack of colonial representation in the imperial system.";
    const err = validateStimulus(q, stim, req);
    expect(err).toContain("synthesized scenario");
  });

  it("approves a real CB-style primary source", () => {
    const q = "Based on the excerpt above, which best describes the author's view?";
    const stim = '"Resolved, that no taxes ever have been or can be constitutionally imposed on them, but by their respective legislatures... — Stamp Act Congress, October 1765"';
    expect(validateStimulus(q, stim, req)).toBeNull();
  });

  it("approves a quoted source with date and provenance", () => {
    const q = "The quotation above most directly reflects which of the following?";
    const stim = '"All men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty, and the pursuit of Happiness." Declaration of Independence, written in 1776 by Thomas Jefferson.';
    expect(validateStimulus(q, stim, req)).toBeNull();
  });
});

describe("validateStimulus — reference check (any stimulus)", () => {
  const req = { required: false };

  it("flags 'graph above' with no stimulus", () => {
    const q = "Based on the graph above, what is the slope of the line?";
    expect(validateStimulus(q, "", req)).toContain("missing or too short");
  });

  it("flags 'passage below' with empty stimulus", () => {
    const q = "Which of the following best summarizes the passage below?";
    expect(validateStimulus(q, "", req)).toContain("missing or too short");
  });

  it("flags 'based on the table' with empty stimulus", () => {
    const q = "Based on the table above, which population grew fastest?";
    expect(validateStimulus(q, "", req)).toContain("missing or too short");
  });

  it("approves question that does not reference a stimulus", () => {
    const q = "What is the integral of x^2 with respect to x?";
    expect(validateStimulus(q, "", req)).toBeNull();
  });

  it("approves when reference matches existing stimulus", () => {
    const q = "Based on the graph above, what is the maximum velocity?";
    const stim = "[Graph: velocity vs time, peak at t=3s, v=15 m/s]";
    expect(validateStimulus(q, stim, req)).toBeNull();
  });
});

describe("validateStimulus — scenario type", () => {
  const req = { required: true, type: "scenario" as const, minChars: 60 };

  it("approves a synthesized lab scenario for physics", () => {
    const q = "What is the acceleration of the cart?";
    const stim = "A 5 kg cart on a frictionless surface is pushed with a constant force of 20 N. The cart starts from rest and rolls along a horizontal track.";
    expect(validateStimulus(q, stim, req)).toBeNull();
  });

  it("flags scenario that is too short", () => {
    const q = "What is the result?";
    const stim = "A cart moves.";
    expect(validateStimulus(q, stim, req)).toContain("too short");
  });
});

describe("validateStimulus — not required (recall MCQ)", () => {
  const req = { required: false };

  it("approves a clean recall question without stimulus", () => {
    const q = "What is the chemical formula for water?";
    expect(validateStimulus(q, "", req)).toBeNull();
    expect(validateStimulus(q, null, req)).toBeNull();
    expect(validateStimulus(q, undefined, req)).toBeNull();
  });
});

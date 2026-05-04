import { describe, it, expect } from "vitest";
import {
  validateStimulusAttribution,
  validateExplanationCitesStimulus,
  validateAttribution,
} from "./source-attribution-validator";

describe("validateStimulusAttribution — imprecise time attribution", () => {
  it("flags 'the 1700s'", () => {
    const stim = '"All men are equal" — anonymous, written in the 1700s';
    expect(validateStimulusAttribution(stim)).toContain("Imprecise time attribution");
  });

  it("flags '18th century'", () => {
    const stim = "From a colonial pamphlet of the 18th century";
    expect(validateStimulusAttribution(stim)).toContain("Imprecise time attribution");
  });

  it("approves a specific year", () => {
    // The text doesn't trigger imprecise-time, but it does trigger
    // generic-document ("from an encyclopedia") — let's use a clean one
    const stim = '"We hold these truths to be self-evident" — Declaration of Independence, July 4, 1776';
    expect(validateStimulusAttribution(stim)).toBeNull();
  });
});

describe("validateStimulusAttribution — generic document attribution", () => {
  it("flags 'from an encyclopedia'", () => {
    const stim = "Excerpt from an encyclopedia of American history, 1820";
    expect(validateStimulusAttribution(stim)).toContain("Generic document");
  });

  it("flags 'in a colonial pamphlet'", () => {
    const stim = "Quoted in a colonial pamphlet";
    expect(validateStimulusAttribution(stim)).toContain("Generic document");
  });

  it("flags 'from a Roman text'", () => {
    const stim = "From a Roman text describing imperial governance";
    expect(validateStimulusAttribution(stim)).toContain("Generic document");
  });

  it("approves a specific named document", () => {
    const stim = '"We the People..." — U.S. Constitution, Preamble, 1787';
    expect(validateStimulusAttribution(stim)).toBeNull();
  });
});

describe("validateStimulusAttribution — fake author detection", () => {
  it("flags an unknown 'First Last, YYYY' with no role", () => {
    const stim = '"Liberty must be defended" — John Smith, 1862';
    expect(validateStimulusAttribution(stim)).toContain("fabricated author");
  });

  it("approves Lincoln (known CB author) with year", () => {
    const stim = '"Four score and seven years ago..." — Abraham Lincoln, 1863';
    expect(validateStimulusAttribution(stim)).toBeNull();
  });

  it("approves an unknown name WITH a role/title", () => {
    const stim = '"This is treason." — Senator Charles Sumner, 1856';
    expect(validateStimulusAttribution(stim)).toBeNull();
  });

  it("approves an unknown name with descriptor", () => {
    const stim = '"Industry must serve the worker" — Eugene Debs, socialist leader, 1912';
    // Debs is in our allowlist, so this passes regardless of role
    expect(validateStimulusAttribution(stim)).toBeNull();
  });
});

describe("validateExplanationCitesStimulus", () => {
  it("flags when explanation cites a document not in stimulus", () => {
    const stim = '"All men are created equal" — Jefferson, 1776';
    const expl = "The Treaty of Paris ended the Revolutionary War in 1783, which is why the colonists won.";
    const result = validateExplanationCitesStimulus(stim, expl);
    expect(result).toContain("Treaty of Paris");
  });

  it("approves when explanation cites a document that IS in stimulus", () => {
    const stim = "Article from the Federalist No. 10 by James Madison, 1787";
    const expl = "Federalist No. 10 argues that a large republic dilutes faction.";
    expect(validateExplanationCitesStimulus(stim, expl)).toBeNull();
  });

  it("approves when explanation makes no specific document claim", () => {
    const stim = '"We the People..." — Constitution, 1787';
    const expl = "The colonists wanted self-governance and protection of property rights.";
    expect(validateExplanationCitesStimulus(stim, expl)).toBeNull();
  });
});

describe("validateAttribution (combined)", () => {
  it("returns null on a clean CB-style citation", () => {
    const stim = '"Resolved, that no taxes ever have been or can be constitutionally imposed... " — Stamp Act Congress, October 19, 1765';
    const expl = "The Stamp Act Congress argued that taxation required colonial representation.";
    expect(validateAttribution(stim, expl)).toBeNull();
  });

  it("flags first-detected error (imprecise time)", () => {
    const stim = "From an encyclopedia of European history, written in the 1500s";
    expect(validateAttribution(stim, "")).toContain("Imprecise time");
  });

  it("returns null on empty stimulus (handled by stimulus-validator, not this gate)", () => {
    expect(validateAttribution("", "")).toBeNull();
    expect(validateAttribution(null, null)).toBeNull();
  });
});

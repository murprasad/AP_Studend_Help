/**
 * src/lib/options.ts — single source of truth for MCQ option rendering
 * and grading. Replaces ad-hoc `option.charAt(0)` letter derivation that
 * silently mis-graded 8.6% of approved MCQs (the unprefixed-options bank
 * subset where charAt(0) returned the actual first letter of the answer
 * text, not the option's index letter).
 *
 * Bug history:
 * - 2026-05-01 morning: journey/step-1-mcq.tsx + step-3-diagnostic.tsx
 *   sent the full option string (e.g. "C) Synthesis...") to the server
 *   for grading. Server compared letter-vs-text, marked everything wrong.
 *   Fixed in commit 28240d0 by extracting `answer.charAt(0).toUpperCase()`.
 * - 2026-05-01 evening: practice/page.tsx + mock-exam/page.tsx +
 *   daily-review-card.tsx used `option.charAt(0)` to derive the letter
 *   for both display AND grading. For unprefixed options stored as
 *   ["Approximately 785 N", "Approximately 392 N", ...], this returned
 *   "A" for ALL options. Every click submitted "A" regardless of choice.
 *   Fixed by switching to index-based derivation.
 *
 * Going forward: every MCQ render site MUST import from this module so
 * the bug class can't be reintroduced silently.
 */

/**
 * Returns the canonical letter ("A", "B", "C", "D", "E") for an option
 * at index `i`. Always derives from POSITION, never from option text.
 *
 * Use this in ALL render sites:
 *   options.map((opt, i) => {
 *     const letter = optionLetter(i);
 *     ...
 *   })
 */
export function optionLetter(i: number): string {
  // Letters A–E cover the 5-choice ACT MATH case; default to numeric for
  // any rare 6+ option question (defensive — no current course uses >5).
  return ["A", "B", "C", "D", "E"][i] ?? String(i + 1);
}

/**
 * Strips a leading letter prefix from an option string for display, so
 * we don't render the letter twice when an option is stored as
 * "A) Answer text".
 *
 * Handles: "A) X", "(A) X", "A. X", "A: X", with optional whitespace.
 * Does NOT modify options that don't start with a letter prefix.
 */
export function cleanOptionText(raw: string): string {
  if (typeof raw !== "string") return String(raw ?? "");
  return raw.replace(/^\s*(?:\(?[A-E]\)?[.):]\s*)/, "");
}

/**
 * Normalizes a raw options array to clean text (no letter prefixes).
 * Use this after fetching options from the API/DB if you want a
 * canonical shape. Render sites typically don't need this — they can
 * call `cleanOptionText(opt)` per-iteration.
 */
export function parseOptions(raw: string[] | null | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((o) => cleanOptionText(String(o ?? "")));
}

/**
 * Strict letter comparison for grading. Use server-side and client-side.
 * Both inputs MUST be A/B/C/D/E (case-insensitive). Comparing the option
 * text or some derived form is a bug.
 *
 * Returns true only when both args match a single A–E letter and equal
 * each other; returns false for any malformed input.
 */
export function lettersEqual(submitted: string, stored: string): boolean {
  if (typeof submitted !== "string" || typeof stored !== "string") return false;
  const a = submitted.trim().toUpperCase();
  const b = stored.trim().toUpperCase();
  if (!/^[A-E]$/.test(a) || !/^[A-E]$/.test(b)) return false;
  return a === b;
}

/**
 * Validates that an MCQ's options + correctAnswer are internally
 * consistent. Returns null if valid; an error string if not.
 *
 * Use this at write-time (in validateQuestion) and at read-time as a
 * defensive check. The audit script audit-content-accuracy.mjs uses
 * the same rules.
 */
export function validateMcqStructure(opts: unknown, correctAnswer: unknown): string | null {
  if (!Array.isArray(opts)) return "options must be an array";
  if (opts.length < 2) return `options must have ≥2 entries (got ${opts.length})`;
  if (opts.length > 5) return `options must have ≤5 entries (got ${opts.length})`;
  for (let i = 0; i < opts.length; i++) {
    const v = opts[i];
    if (typeof v !== "string" || v.trim().length === 0) {
      return `option[${i}] is empty/non-string`;
    }
    if (v.includes("\n") && opts.length === 1) {
      return `option[${i}] looks like all options crammed into one (contains newlines)`;
    }
  }
  const ca = String(correctAnswer ?? "").trim().toUpperCase();
  if (!/^[A-E]$/.test(ca)) return `correctAnswer must be a single letter A-E (got "${ca}")`;
  const idx = ca.charCodeAt(0) - 65;
  if (idx >= opts.length) return `correctAnswer "${ca}" is out of bounds (only ${opts.length} options)`;
  return null;
}

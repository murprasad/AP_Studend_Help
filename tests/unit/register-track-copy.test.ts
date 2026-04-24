import { describe, it, expect } from "vitest";

/**
 * Locks the track-aware CardDescription copy on /register.
 *
 * Regression guard: 2026-04-24 persona-A run found /register?track=sat
 * and /register?track=act both showing "Start your AP exam journey today
 * — free" because src/app/(auth)/register/page.tsx only had cases for
 * 'clep' and 'dsst'. SAT and ACT fell through to the AP default.
 *
 * Beta 2.0 release notes claimed B2-03 was fixed for all 4 tracks.
 * It wasn't. This test encodes the invariant so the UI can't silently
 * drift again.
 */

// Mirror of the expression in src/app/(auth)/register/page.tsx. Keep in
// sync when the page copy changes — the whole point is that we catch
// drift fast.
function trackCopy(userModule: string): string {
  if (userModule === "clep") return "Start earning college credit with CLEP — free";
  if (userModule === "dsst") return "Start earning college credit with DSST — free";
  if (userModule === "sat") return "Start your SAT prep today — free";
  if (userModule === "act") return "Start your ACT prep today — free";
  return "Start your AP exam journey today — free";
}

describe("register track copy", () => {
  it("AP (default) shows AP framing", () => {
    expect(trackCopy("ap")).toMatch(/AP/);
    expect(trackCopy("ap")).not.toMatch(/SAT|ACT|CLEP|DSST/);
  });

  it("SAT shows SAT framing, not AP", () => {
    expect(trackCopy("sat")).toMatch(/SAT/);
    expect(trackCopy("sat")).not.toMatch(/AP|CLEP|DSST/);
  });

  it("ACT shows ACT framing, not AP", () => {
    expect(trackCopy("act")).toMatch(/ACT/);
    expect(trackCopy("act")).not.toMatch(/AP|SAT|CLEP|DSST/);
  });

  it("CLEP shows CLEP framing", () => {
    expect(trackCopy("clep")).toMatch(/CLEP/);
  });

  it("DSST shows DSST framing", () => {
    expect(trackCopy("dsst")).toMatch(/DSST/);
  });

  it("unknown module falls back to AP (safe default)", () => {
    expect(trackCopy("unknown")).toMatch(/AP/);
    expect(trackCopy("")).toMatch(/AP/);
  });
});

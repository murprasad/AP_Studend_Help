import { describe, it, expect } from "vitest";

// Locks the behavior of getPeriodEndDate — the helper we added today
// after Stripe API ≥ 2025-09-30 moved current_period_end onto items.
//
// Pure-function copy (kept in sync with src/app/api/webhooks/stripe/route.ts)
// so the test runs without hitting the DB or imports that pull in
// Prisma WASM. If the source diverges from this copy, refactor:
// extract getPeriodEndDate into src/lib/stripe-webhook.ts and import
// from both places.
type StripeSubLike = {
  current_period_end?: number | null;
  items?: { data?: Array<{ current_period_end?: number | null }> };
};

function getPeriodEndDate(subscription: StripeSubLike): Date | null {
  const root = subscription.current_period_end;
  const itemEnd = subscription.items?.data?.[0]?.current_period_end;
  const ts = root ?? itemEnd;
  if (typeof ts !== "number" || !Number.isFinite(ts)) return null;
  return new Date(ts * 1000);
}

describe("getPeriodEndDate — Stripe API version compatibility", () => {
  const ts = 1735689600; // 2025-01-01
  const expected = new Date(ts * 1000);

  it("reads from root current_period_end (API < 2025-09-30)", () => {
    expect(getPeriodEndDate({ current_period_end: ts })).toEqual(expected);
  });

  it("reads from items.data[0].current_period_end (API ≥ 2025-09-30)", () => {
    expect(
      getPeriodEndDate({
        items: { data: [{ current_period_end: ts }] },
      }),
    ).toEqual(expected);
  });

  it("prefers root over items when BOTH present (root is authoritative)", () => {
    expect(
      getPeriodEndDate({
        current_period_end: ts,
        items: { data: [{ current_period_end: ts + 999 }] },
      }),
    ).toEqual(expected);
  });

  it("returns null when root is undefined and items array is empty", () => {
    expect(getPeriodEndDate({ items: { data: [] } })).toBeNull();
  });

  it("returns null when root is undefined and items missing entirely", () => {
    expect(getPeriodEndDate({})).toBeNull();
  });

  it("returns null when items.data[0].current_period_end is undefined", () => {
    expect(getPeriodEndDate({ items: { data: [{}] } })).toBeNull();
  });

  it("returns null instead of Invalid Date when root is null (regression — caused 500s)", () => {
    expect(getPeriodEndDate({ current_period_end: null })).toBeNull();
  });

  it("returns null when items.data is undefined and root is undefined", () => {
    expect(getPeriodEndDate({ items: {} })).toBeNull();
  });
});

// ── client_reference_id parser tests ─────────────────────────────────
// The webhook supports two formats from Payment Links:
//   "userId::module"  — encoded by /api/checkout
//   "userId"          — plain (no module info)
function parseClientReferenceId(rawRef: string): { userId: string; module: string } {
  if (rawRef.includes("::")) {
    const [userId, module] = rawRef.split("::");
    return { userId, module: module ?? "" };
  }
  return { userId: rawRef, module: "" };
}

describe("client_reference_id parser", () => {
  it("parses userId::module format", () => {
    expect(parseClientReferenceId("user_abc::ap")).toEqual({
      userId: "user_abc",
      module: "ap",
    });
  });

  it("parses userId only (no ::)", () => {
    expect(parseClientReferenceId("user_abc")).toEqual({
      userId: "user_abc",
      module: "",
    });
  });

  it("handles empty string", () => {
    expect(parseClientReferenceId("")).toEqual({ userId: "", module: "" });
  });

  it("handles userId:: with empty module", () => {
    expect(parseClientReferenceId("user_abc::")).toEqual({
      userId: "user_abc",
      module: "",
    });
  });

  it("handles all 5 valid module values", () => {
    for (const m of ["ap", "sat", "act", "clep", "dsst"]) {
      expect(parseClientReferenceId(`user_x::${m}`).module).toBe(m);
    }
  });
});

import { describe, it, expect, vi } from "vitest";
import {
  parseClientReferenceId,
  getPeriodEndDate,
  getUserIdFromSubscription,
  TIER_FOR_MODULE,
  MODULE_DISPLAY_NAME,
} from "@/lib/stripe-webhook";

// Tests against the REAL extracted lib module — not an inline copy.
// If anything in src/lib/stripe-webhook.ts changes incompatibly, these
// fail and the deploy is blocked.

describe("parseClientReferenceId", () => {
  it("parses 'userId::module' format", () => {
    expect(parseClientReferenceId("user_abc::ap")).toEqual({
      userId: "user_abc",
      module: "ap",
    });
  });

  it("parses 'userId' only", () => {
    expect(parseClientReferenceId("user_abc")).toEqual({
      userId: "user_abc",
      module: "",
    });
  });

  it("handles empty string", () => {
    expect(parseClientReferenceId("")).toEqual({ userId: "", module: "" });
  });

  it("handles trailing :: with empty module", () => {
    expect(parseClientReferenceId("user_abc::")).toEqual({
      userId: "user_abc",
      module: "",
    });
  });

  it("handles all valid module slugs", () => {
    for (const m of ["ap", "sat", "act", "clep", "dsst"] as const) {
      expect(parseClientReferenceId(`uid::${m}`).module).toBe(m);
    }
  });
});

describe("getPeriodEndDate — Stripe API version compatibility", () => {
  const ts = 1735689600;
  const expected = new Date(ts * 1000);

  it("reads from root current_period_end (API < 2025-09-30)", () => {
    expect(getPeriodEndDate({ current_period_end: ts } as never)).toEqual(expected);
  });

  it("reads from items.data[0].current_period_end (API ≥ 2025-09-30)", () => {
    expect(
      getPeriodEndDate({
        items: { data: [{ current_period_end: ts }] },
      } as never),
    ).toEqual(expected);
  });

  it("prefers root over items when both present", () => {
    expect(
      getPeriodEndDate({
        current_period_end: ts,
        items: { data: [{ current_period_end: ts + 999 }] },
      } as never),
    ).toEqual(expected);
  });

  it("returns null when neither location present (regression for the 500-bug)", () => {
    expect(getPeriodEndDate({} as never)).toBeNull();
    expect(getPeriodEndDate({ items: { data: [] } } as never)).toBeNull();
    expect(getPeriodEndDate({ items: { data: [{}] } } as never)).toBeNull();
  });

  it("returns null when root is null", () => {
    expect(getPeriodEndDate({ current_period_end: null } as never)).toBeNull();
  });

  it("returns null when items.data missing entirely", () => {
    expect(getPeriodEndDate({ items: {} } as never)).toBeNull();
  });
});

describe("TIER_FOR_MODULE", () => {
  it("maps every valid module to a *_PREMIUM tier", () => {
    expect(TIER_FOR_MODULE.ap).toBe("AP_PREMIUM");
    expect(TIER_FOR_MODULE.sat).toBe("SAT_PREMIUM");
    expect(TIER_FOR_MODULE.act).toBe("ACT_PREMIUM");
    expect(TIER_FOR_MODULE.clep).toBe("CLEP_PREMIUM");
    expect(TIER_FOR_MODULE.dsst).toBe("DSST_PREMIUM");
  });
});

describe("MODULE_DISPLAY_NAME", () => {
  it("maps every valid module to a customer-facing string", () => {
    expect(MODULE_DISPLAY_NAME.ap).toBe("AP Premium");
    expect(MODULE_DISPLAY_NAME.sat).toBe("SAT Premium");
    expect(MODULE_DISPLAY_NAME.act).toBe("ACT Premium");
    expect(MODULE_DISPLAY_NAME.clep).toBe("CLEP Premium");
    expect(MODULE_DISPLAY_NAME.dsst).toBe("DSST Premium");
  });
});

describe("getUserIdFromSubscription", () => {
  it("returns metadata.userId when present (most reliable path)", async () => {
    const subscription = {
      metadata: { userId: "user_meta" },
      customer: "cus_x",
    };
    const stripe = { customers: { retrieve: vi.fn() } };
    const prisma = { user: { findUnique: vi.fn() } };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBe("user_meta");
    // Must NOT have called Stripe or Prisma — short-circuit on metadata
    expect(stripe.customers.retrieve).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("falls back to email lookup when metadata missing", async () => {
    const subscription = { metadata: {}, customer: "cus_x" };
    const stripe = {
      customers: {
        retrieve: vi.fn().mockResolvedValue({ email: "u@example.com" }),
      },
    };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: "user_email" }) },
    };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBe("user_email");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "u@example.com" },
      select: { id: true },
    });
  });

  it("returns null when customer is deleted", async () => {
    const subscription = { metadata: {}, customer: "cus_x" };
    const stripe = {
      customers: {
        retrieve: vi.fn().mockResolvedValue({ deleted: true }),
      },
    };
    const prisma = { user: { findUnique: vi.fn() } };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when customer has no email", async () => {
    const subscription = { metadata: {}, customer: "cus_x" };
    const stripe = {
      customers: { retrieve: vi.fn().mockResolvedValue({ email: null }) },
    };
    const prisma = { user: { findUnique: vi.fn() } };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBeNull();
  });

  it("returns null when no DB user found by email (no orphan creation)", async () => {
    const subscription = { metadata: {}, customer: "cus_x" };
    const stripe = {
      customers: { retrieve: vi.fn().mockResolvedValue({ email: "ghost@x.com" }) },
    };
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBeNull();
  });

  it("returns null and logs warning when Stripe API call fails", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const subscription = { metadata: {}, customer: "cus_x" };
    const stripe = {
      customers: {
        retrieve: vi.fn().mockRejectedValue(new Error("Stripe network failure")),
      },
    };
    const prisma = { user: { findUnique: vi.fn() } };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("handles customer object (not just ID string) input", async () => {
    const subscription = {
      metadata: {},
      customer: { id: "cus_obj", deleted: false } as never,
    };
    const stripe = {
      customers: {
        retrieve: vi.fn().mockResolvedValue({ email: "obj@x.com" }),
      },
    };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: "user_obj" }) },
    };
    const result = await getUserIdFromSubscription(
      stripe as never,
      subscription as never,
      prisma as never,
    );
    expect(result).toBe("user_obj");
    expect(stripe.customers.retrieve).toHaveBeenCalledWith("cus_obj");
  });
});

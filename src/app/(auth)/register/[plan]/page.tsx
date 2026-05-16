/**
 * /register/[plan] — per-plan registration URLs for clean UTM attribution.
 *
 * NurseHub-derived (docs/cross-product-learnings-from-nursehub.md §3 + §11).
 * They use `/register/premium/` and `/register/quarterly/` as separate
 * endpoints so paid-media UTM tracking is clean per plan. We mirror with
 * module-specific URLs (ap, sat, act) so each prep landing page can link
 * to a tracked register URL that pre-fills the correct module.
 *
 * Valid slugs: `ap` | `sat` | `act` — all aliases route to /register with
 * the module query param + UTM source. Anything else → 404.
 *
 * Behavior: server-redirect (308 permanent) to /register?module=X&utm_source=plan-X.
 * No flash, no client-side handoff — preserves bookmark/share semantics.
 */

import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";

const PLAN_TO_MODULE: Record<string, { module: string; label: string; description: string }> = {
  ap: {
    module: "ap",
    label: "AP Premium",
    description: "Sign up for StudentNest AP Premium — all 14 AP courses, unlimited Sage tutoring, personalized study plan.",
  },
  sat: {
    module: "sat",
    label: "SAT Premium",
    description: "Sign up for StudentNest SAT Premium — full Math + Reading & Writing prep, unlimited Sage, score prediction.",
  },
  act: {
    module: "act",
    label: "ACT Premium",
    description: "Sign up for StudentNest ACT Premium — all 4 sections, unlimited Sage, section-by-section composite tracking.",
  },
  psat: {
    module: "psat",
    label: "PSAT Premium",
    description: "Sign up for StudentNest PSAT Premium — Math + Reading & Writing prep, National Merit Selection Index tracking, unlimited Sage.",
  },
};

interface Props {
  params: { plan: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const cfg = PLAN_TO_MODULE[params.plan];
  if (!cfg) return { title: "Register — StudentNest" };
  return {
    title: `${cfg.label} — Register`,
    description: cfg.description,
  };
}

export default function RegisterByPlan({ params }: Props) {
  const cfg = PLAN_TO_MODULE[params.plan];
  if (!cfg) {
    // Unknown slug → fall through to the generic /register page (no 404 —
    // we don't want a broken-link experience for a typo'd marketing URL).
    permanentRedirect("/register");
  }
  // Permanent redirect (308) to the canonical register URL with module +
  // UTM. Search engines treat 308 as "the resource has permanently moved"
  // so the underlying signup URL accrues the link equity from the plan
  // page; marketing analytics see the utm_source for attribution.
  const target = `/register?module=${cfg.module}&utm_source=register-plan-${params.plan}`;
  permanentRedirect(target);
}

// Statically generate the 3 known plan routes at build time. Anything else
// is dynamic + falls through to the generic register page above.
export function generateStaticParams() {
  return Object.keys(PLAN_TO_MODULE).map((plan) => ({ plan }));
}

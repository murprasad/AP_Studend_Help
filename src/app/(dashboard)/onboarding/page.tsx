// Beta 8.13.2 (2026-04-29) — DEPRECATED 4-step wizard.
//
// User feedback critique highlighted everything wrong with the legacy
// onboarding wizard:
//   - Said "3 quick steps" then showed 4 (Pick Plan) — trust-killer
//   - Premature monetization (Pick Plan before user saw any value)
//   - "How It Works" upfront — nobody reads explainers before payoff
//   - Choice paralysis from a 10-course grid
//
// Replaced by `/practice/quickstart` (single screen, single decision,
// straight to Q1). This page now redirects everyone to the new flow so
// the buggy wizard can never be deep-linked into.
//
// Kept as a thin redirect rather than deleted so any in-flight bookmarks
// or stale OAuth callback URLs land somewhere useful instead of 404'ing.
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedOnboardingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/practice/quickstart");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

// Beta 8.13.2 (2026-04-29) — DEPRECATED legacy 4-step wizard.
//
// User feedback critique highlighted everything wrong with the legacy
// onboarding wizard:
//   - "3 quick steps" then 4 (Pick Plan) — trust-killer
//   - Premature monetization (pricing before value)
//   - "How It Works" upfront — nobody reads explainers before payoff
//   - Choice paralysis from a 10-course grid
//
// Replaced by `/practice/quickstart` (single screen, single decision,
// straight to Q1).
//
// Beta 9 (2026-04-29) — fix: was a "use client" page with useEffect
// router.replace() which hung on "Loading…" for some users (likely a
// NextAuth session race in the (dashboard) layout). Switched to a
// server-side `redirect()` so the redirect is HTTP-level and never
// shows a loading screen.
import { redirect } from "next/navigation";

export default function DeprecatedOnboardingPage() {
  redirect("/practice/quickstart");
}

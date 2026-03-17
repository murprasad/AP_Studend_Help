/**
 * Feature flag definitions — pure constants, no server-side imports.
 * Safe to import from both server and client components.
 */
export const FEATURE_FLAG_DEFS = [
  {
    key: "payments_enabled",
    label: "Stripe Payments",
    description:
      "Enable subscription payments via Stripe. When disabled, all users have full access (free).",
    default: "true",
    dangerous: false,
  },
  {
    key: "ai_limit_enabled",
    label: "AI Daily Limits",
    description:
      "Enforce 5 conversations/day for free users. Disable to give all users unlimited access.",
    default: "true",
    dangerous: false,
  },
  {
    key: "registration_enabled",
    label: "New User Registration",
    description:
      "Allow new users to create accounts. Disable to make the platform invite-only.",
    default: "true",
    dangerous: true,
  },
  {
    key: "ai_generation_enabled",
    label: "AI Question Generation",
    description:
      "Allow the practice engine to auto-generate AI questions when the DB bank is low.",
    default: "true",
    dangerous: false,
  },
  {
    key: "premium_feature_restriction",
    label: "Premium Feature Restriction",
    description:
      "When ON, free users are restricted to Free-tier limits (AI conversations, sessions, etc.). When OFF (default), all users enjoy the full feature suite regardless of subscription tier — useful for testing.",
    default: "false",
    dangerous: false,
  },
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_DEFS)[number]["key"];

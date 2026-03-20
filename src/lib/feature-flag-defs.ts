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
  // Auto-populate settings (not boolean flags — managed by AdminAutoPopulateSettings)
  { key: "auto_populate_enabled", label: "Auto-Populate Enabled", description: "Master on/off for scheduled question bank auto-populate.", default: "false", dangerous: false },
  { key: "auto_populate_threshold", label: "Auto-Populate Threshold", description: "Units with fewer questions than this are topped up.", default: "10", dangerous: false },
  { key: "auto_populate_target", label: "Auto-Populate Target", description: "Fill each thin unit up to this many questions.", default: "20", dangerous: false },
  { key: "auto_populate_last_run", label: "Auto-Populate Last Run", description: "ISO timestamp of the last auto-populate run.", default: "", dangerous: false },
  { key: "auto_populate_last_result", label: "Auto-Populate Last Result", description: "JSON summary of the last auto-populate run.", default: "", dangerous: false },
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_DEFS)[number]["key"];

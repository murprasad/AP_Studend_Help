// Pure TypeScript — no imports. Safe for client + server components.
// Central helpers for module-based premium checks.

// ── Module subscription types (matches DB ModuleSubscription) ──
export type ModuleSub = { module: string; status: string };
export type Module = "ap" | "sat" | "act" | "clep";

export const ALL_MODULES: Module[] = ["ap", "sat", "act", "clep"];

/** Check if user has premium for a specific module. */
export function hasModulePremium(subs: ModuleSub[], module: string): boolean {
  return subs.some(s => s.module === module && (s.status === "active" || s.status === "canceling"));
}

/** Check if user has premium for ANY module (used for shared features like unlimited AI). */
export function hasAnyPremium(subs: ModuleSub[]): boolean {
  return subs.some(s => s.status === "active" || s.status === "canceling");
}

/** Human-readable premium name for a module. */
export function modulePremiumName(module: string): string {
  const names: Record<string, string> = {
    ap: "AP Premium",
    sat: "SAT Premium",
    act: "ACT Premium",
    clep: "CLEP Premium",
  };
  return names[module] ?? "Premium";
}

/** Tailwind color name per module (for dynamic theming). */
export function moduleColor(module: string): "indigo" | "blue" | "violet" | "emerald" {
  const colors: Record<string, "indigo" | "blue" | "violet" | "emerald"> = {
    ap: "indigo",
    sat: "blue",
    act: "violet",
    clep: "emerald",
  };
  return colors[module] ?? "indigo";
}

/** Module display label (not premium name, just the module). */
export function moduleLabel(module: string): string {
  const labels: Record<string, string> = {
    ap: "AP",
    sat: "SAT",
    act: "ACT",
    clep: "CLEP",
  };
  return labels[module] ?? module.toUpperCase();
}

// ── Legacy compat (keep existing code working during migration) ──

export function isApPremium(tier: string): boolean {
  return tier === "AP_PREMIUM" || tier === "PREMIUM";
}

export function isClepPremium(tier: string): boolean {
  return tier === "CLEP_PREMIUM";
}

export function isAnyPremiumLegacy(tier: string): boolean {
  return isApPremium(tier) || isClepPremium(tier) || tier === "SAT_PREMIUM" || tier === "ACT_PREMIUM";
}

/** @deprecated Use hasModulePremium instead. */
export function isPremiumForTrack(tier: string, track: string): boolean {
  if (track === "clep") return isClepPremium(tier);
  return isApPremium(tier);
}

export function tierLabel(tier: string): string {
  if (tier === "CLEP_PREMIUM") return "CLEP Premium";
  if (tier === "SAT_PREMIUM") return "SAT Premium";
  if (tier === "ACT_PREMIUM") return "ACT Premium";
  if (isApPremium(tier)) return "AP Premium";
  return "Free";
}

/** @deprecated Use modulePremiumName instead. */
export function trackPremiumName(track: string): string {
  return modulePremiumName(track);
}

// Re-export old name for backward compat
export const isAnyPremium = isAnyPremiumLegacy;

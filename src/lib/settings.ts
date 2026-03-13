/**
 * Site-wide feature flags and settings stored in the database.
 * Values are cached in-process for 30 seconds to minimize DB reads.
 */
import { prisma } from "./prisma";

const CACHE = new Map<string, { value: string; exp: number }>();
const TTL_MS = 30_000;

export async function getSetting(key: string, fallback = ""): Promise<string> {
  const cached = CACHE.get(key);
  if (cached && cached.exp > Date.now()) return cached.value;

  try {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    const value = row?.value ?? fallback;
    CACHE.set(key, { value, exp: Date.now() + TTL_MS });
    return value;
  } catch {
    return fallback;
  }
}

export async function setSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  CACHE.delete(key);
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, updatedBy },
    update: { value, updatedBy },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Returns true if the payments/Stripe feature is enabled. Defaults to true. */
export async function isPaymentsEnabled(): Promise<boolean> {
  const val = await getSetting("payments_enabled", "true");
  return val === "true";
}

/** Returns true if the daily AI limit feature is enabled. Defaults to true. */
export async function isAiLimitEnabled(): Promise<boolean> {
  const val = await getSetting("ai_limit_enabled", "true");
  return val === "true";
}

// Re-export from the pure-constants file so server code can use one import
export { FEATURE_FLAG_DEFS, type FeatureFlagKey } from "./feature-flag-defs";

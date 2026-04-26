import { isClepEnabled, isDsstEnabled } from "@/lib/settings";
import PricingClient from "./pricing-client";

// Cold-start defense (Beta 8.0 hotfix #3, 2026-04-26): Promise.all of
// settings calls was 500-ing the entire pricing page on Prisma WASM
// cold-start. RSC payload prefetch from other pages then surfaced as
// console errors on /sat-prep, /act-prep, /am-i-ready. Defaults are
// safe: clepEnabled=false hides the CLEP module, dsstEnabled=false
// hides DSST. Better than a 500 on a marketing page.
async function safeFlag(p: () => Promise<boolean>, fallback: boolean): Promise<boolean> {
  try { return await p(); } catch { return fallback; }
}

export default async function PricingPage() {
  const [clepOn, dsstOn] = await Promise.all([
    safeFlag(isClepEnabled, false),
    safeFlag(isDsstEnabled, false),
  ]);

  return <PricingClient clepEnabled={clepOn} dsstEnabled={dsstOn} />;
}

/**
 * /warmup — redirect shim.
 *
 * The dashboard's "Warm up. See your level." CTA used to href /warmup
 * before the page was ever built. Hotfix on 2026-04-22 pointed the
 * CTA at /practice?mode=focused&count=3 directly, but any existing
 * bookmark / old link / browser-history entry still 404'd. This
 * page catches those direct hits and forwards to the same target
 * the CTA now uses.
 *
 * Server-side redirect so it's a clean 307 at the edge, not a flash
 * of loading UI.
 */
import { redirect } from "next/navigation";

export const dynamic = "force-static";

export default function WarmupRedirectPage() {
  redirect("/practice?mode=focused&count=3&src=warmup");
}

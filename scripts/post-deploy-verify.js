#!/usr/bin/env node
/**
 * post-deploy-verify.js
 * Hits /api/ai/status after wrangler deploy to confirm at least one AI provider is live.
 * Always exits 0 (warns but does not block CI — provider key misconfiguration is an ops issue).
 */

const STATUS_URL = "https://studentnest.ai/api/ai/status";
const PROPAGATION_DELAY_MS = 8000;

async function verify() {
  console.log(`\n⏳ Waiting ${PROPAGATION_DELAY_MS / 1000}s for CF propagation...`);
  await new Promise((resolve) => setTimeout(resolve, PROPAGATION_DELAY_MS));

  console.log(`🔍 Checking AI provider status at ${STATUS_URL} ...`);

  try {
    const res = await fetch(STATUS_URL, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`⚠️  WARNING: /api/ai/status returned HTTP ${res.status}`);
      return;
    }

    const data = await res.json();

    if (data.status === "ok") {
      const provider = data.activeProvider || data.provider || "unknown";
      console.log(`✅ AI working via ${provider}`);
    } else {
      console.warn(`\n⚠️  WARNING: No AI provider is working in production!`);
      console.warn(`   Status: ${data.status}`);
      if (data.providers) {
        console.warn(`\n   Provider breakdown:`);
        for (const [name, info] of Object.entries(data.providers)) {
          const status = info.ok ? "✅" : "❌";
          const detail = info.error ? ` (${info.error})` : "";
          console.warn(`     ${status} ${name}${detail}`);
        }
      }
      console.warn(`\n   Check that AI provider API keys are set in Cloudflare Pages env vars.`);
    }
  } catch (err) {
    console.warn(`⚠️  WARNING: Could not reach ${STATUS_URL}: ${err.message}`);
    console.warn(`   The deploy may still be propagating, or the status endpoint may be down.`);
  }
}

verify().then(() => process.exit(0));

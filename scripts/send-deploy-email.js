/**
 * Sends a deployment notification email after every successful deploy.
 * Runs as the final step in the pages:deploy pipeline.
 *
 * Requires: RESEND_API_KEY env var (loaded from .env if not set)
 * Sends to: contact@studentnest.ai
 */

// Load .env if RESEND_API_KEY not already in environment
if (!process.env.RESEND_API_KEY) {
  try {
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "..", ".env");
    const envContent = fs.readFileSync(envPath, "utf8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^RESEND_API_KEY=(.+)$/);
      if (match) process.env.RESEND_API_KEY = match[1].trim();
    }
  } catch { /* ignore */ }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = "contact@studentnest.ai";
const FROM_EMAIL = "noreply@studentnest.ai";
// Read deploy status from --status=success|failed CLI arg. Cross-platform
// (inline env-var syntax `DEPLOY_STATUS=xxx node ...` fails on Windows cmd).
// Default: "success" for backward-compat with manual invocations.
function getDeployStatus() {
  const arg = process.argv.find((a) => a.startsWith("--status="));
  if (arg) return arg.slice("--status=".length).trim();
  return process.env.DEPLOY_STATUS || "success";
}
const DEPLOY_STATUS = getDeployStatus();
const IS_SUCCESS = DEPLOY_STATUS === "success";

async function main() {
  if (!RESEND_API_KEY) {
    console.log("⚠️  RESEND_API_KEY not set — skipping deploy email");
    return;
  }

  // Read version from package.json
  const pkg = require("../package.json");
  const version = pkg.version;
  const betaLabel = `Beta ${version.replace(/\.0$/, "").replace(/^(\d+)\.(\d+)/, "$1.$2")}`;

  // Get recent git log for changelog
  let changelog = "";
  try {
    const { execSync } = require("child_process");
    const log = execSync("git log --oneline -5", { encoding: "utf8" }).trim();
    changelog = log
      .split("\n")
      .map((line) => `<li style="color: #475569; font-size: 13px;">${line.substring(8)}</li>`)
      .join("\n");
  } catch {
    changelog = "<li>See git log for details</li>";
  }

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/New_York",
  });

  const statusLabel = IS_SUCCESS ? "Deployed" : "FAILED";
  const statusEmoji = IS_SUCCESS ? "✅" : "❌";
  const headerColor = IS_SUCCESS ? "#1865F2" : "#dc2626";
  const statusBanner = IS_SUCCESS
    ? ""
    : `<div style="background: #fef2f2; border: 1px solid #dc2626; color: #991b1b; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px;">
         <strong>⚠️ Pipeline failed.</strong> One or more test gates blocked the deploy (typecheck, smoke, functional, integration, or Playwright). Code may or may not be live on prod — check <a href="https://dash.cloudflare.com" style="color: #991b1b;">CF Pages</a> to verify and rollback if needed.
       </div>`;

  const subject = `${statusEmoji} StudentNest Prep — ${betaLabel} ${statusLabel}`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${statusBanner}
      <h1 style="color: ${headerColor}; font-size: 24px;">StudentNest Prep — ${betaLabel} ${statusLabel}</h1>
      <p style="color: #64748b; font-size: 14px;">${timestamp}</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <h2 style="font-size: 16px; color: #1e293b;">Recent Changes</h2>
      <ul style="line-height: 1.8; padding-left: 20px;">
        ${changelog}
      </ul>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
      <p style="color: #64748b; font-size: 12px;">
        Live at <a href="https://studentnest.ai" style="color: ${headerColor};">studentnest.ai</a> ·
        Version: ${version}
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject,
        html,
      }),
    });

    if (res.ok) {
      console.log(`✅ Deploy notification (${DEPLOY_STATUS}) sent to ${TO_EMAIL}`);
    } else {
      const err = await res.text();
      console.log(`⚠️  Deploy email failed (${res.status}): ${err}`);
    }
  } catch (err) {
    console.log(`⚠️  Deploy email error: ${err.message}`);
  }
}

main();

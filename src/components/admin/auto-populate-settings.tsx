"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw, Zap, Info } from "lucide-react";

interface LastResult {
  generated?: number;
  failed?: number;
  processed?: number;
  details?: Array<{ course: string; unit: string; added: number }>;
}

export function AdminAutoPopulateSettings() {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState("10");
  const [target, setTarget] = useState("20");
  const [lastRun, setLastRun] = useState("");
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: { settings?: Record<string, string> }) => {
        const s = d.settings ?? {};
        setEnabled(s["auto_populate_enabled"] === "true");
        setThreshold(s["auto_populate_threshold"] || "10");
        setTarget(s["auto_populate_target"] || "20");
        setLastRun(s["auto_populate_last_run"] || "");
        try {
          setLastResult(s["auto_populate_last_result"] ? JSON.parse(s["auto_populate_last_result"]) : null);
        } catch {
          setLastResult(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveSetting(key: string, value: string) {
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  }

  async function toggleEnabled() {
    const next = !enabled;
    setSaving(true);
    try {
      await saveSetting("auto_populate_enabled", next ? "true" : "false");
      setEnabled(next);
    } finally {
      setSaving(false);
    }
  }

  async function saveThresholdTarget() {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("auto_populate_threshold", threshold),
        saveSetting("auto_populate_target", target),
      ]);
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setRunStatus(null);
    try {
      // Temporarily enable for this run even if toggle is off
      const res = await fetch("/api/cron/auto-populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json() as { status?: string; generated?: number; failed?: number; processed?: number; details?: LastResult["details"] };
      if (data.status === "disabled") {
        setRunStatus({ type: "error", text: "Auto-populate is disabled. Toggle it ON first." });
      } else {
        const now = new Date().toISOString();
        setLastRun(now);
        setLastResult({ generated: data.generated, failed: data.failed, processed: data.processed, details: data.details });
        setRunStatus({
          type: "success",
          text: `Done — +${data.generated ?? 0} questions across ${data.processed ?? 0} units (${data.failed ?? 0} failed)`,
        });
      }
    } catch {
      setRunStatus({ type: "error", text: "Request failed. Check server logs." });
    } finally {
      setRunning(false);
    }
  }

  function formatLastRun(iso: string): string {
    if (!iso) return "Never";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZoneName: "short",
      });
    } catch {
      return iso;
    }
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          Auto-Populate Settings
        </CardTitle>
        <CardDescription>
          Automatically top up units that fall below the critical threshold. Schedule via cron-job.org or GitHub Actions
          by calling <code className="text-xs bg-secondary px-1 rounded">POST /api/cron/auto-populate</code> with{" "}
          <code className="text-xs bg-secondary px-1 rounded">Authorization: Bearer CRON_SECRET</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <>
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/40 bg-secondary/30">
              <div>
                <p className="text-sm font-medium">Auto-Populate Enabled</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When ON, scheduled cron calls will run the top-up job automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`text-xs ${enabled ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-muted-foreground"}`}
                >
                  {enabled ? "ON" : "OFF"}
                </Badge>
                <button
                  onClick={toggleEnabled}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                    enabled ? "bg-indigo-600" : "bg-secondary"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin absolute left-1/2 -translate-x-1/2 text-white" />
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Threshold + target inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Critical Threshold</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-muted-foreground">Units with fewer questions get topped up</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Fill Target Per Unit</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-muted-foreground">Fill each thin unit up to this many</p>
              </div>
            </div>
            <button
              onClick={saveThresholdTarget}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 text-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Save Thresholds
            </button>

            {/* Last run status */}
            <div className="p-3 rounded-lg border border-border/40 bg-secondary/20 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Last Run</p>
              <p className="text-sm">{formatLastRun(lastRun)}</p>
              {lastResult && (
                <p className="text-xs text-muted-foreground">
                  +{lastResult.generated ?? 0} questions across {lastResult.processed ?? 0} units
                  {(lastResult.failed ?? 0) > 0 && ` · ${lastResult.failed} failed`}
                </p>
              )}
            </div>

            {/* Run status feedback */}
            {runStatus && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  runStatus.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {runStatus.text}
              </div>
            )}

            {/* Run Now button */}
            <button
              onClick={runNow}
              disabled={running || !enabled}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Running…" : "Run Now"}
            </button>
            {!enabled && (
              <p className="text-xs text-muted-foreground -mt-3">Toggle auto-populate ON to enable manual runs.</p>
            )}

            {/* GitHub Actions setup instructions */}
            <div className="mt-2 p-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 space-y-3">
              <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                GitHub Actions Scheduler — One-Time Setup
              </p>
              <p className="text-xs text-muted-foreground">
                A workflow at <code className="bg-secondary px-1 rounded">.github/workflows/auto-populate.yml</code> calls
                this endpoint every 6 hours automatically. Complete these steps once:
              </p>
              <ol className="text-xs text-muted-foreground space-y-2 list-none">
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">1.</span>
                  <span>
                    Generate a secret:{" "}
                    <code className="bg-secondary px-1 rounded">openssl rand -hex 32</code>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">2.</span>
                  <span>
                    Add it to Cloudflare Pages:{" "}
                    <code className="bg-secondary px-1 rounded">wrangler pages secret put CRON_SECRET</code>
                    {" "}(or via CF dashboard → Settings → Environment Variables)
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">3.</span>
                  <span>
                    Add the same value to GitHub: repo →{" "}
                    <strong className="text-foreground/80">Settings → Secrets and variables → Actions → New secret</strong>{" "}
                    named <code className="bg-secondary px-1 rounded">CRON_SECRET</code>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-400 font-bold shrink-0">4.</span>
                  <span>Toggle <strong className="text-foreground/80">Auto-Populate Enabled</strong> ON above.</span>
                </li>
              </ol>
              <p className="text-xs text-muted-foreground">
                After setup, GitHub Actions runs every 6 hours. The{" "}
                <strong className="text-foreground/80">Last Run</strong> timestamp above will update after each successful execution.
                A failed run (wrong secret, endpoint error) will trigger a GitHub notification email.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { FEATURE_FLAG_DEFS } from "@/lib/feature-flag-defs";

interface SettingsMap {
  [key: string]: string;
}

export function AdminFeatureFlags() {
  const [settings, setSettings] = useState<SettingsMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d: { settings?: SettingsMap }) => setSettings(d.settings ?? {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(key: string, currentValue: string) {
    const newValue = currentValue === "true" ? "false" : "true";
    setSaving(key);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (!res.ok) throw new Error("Failed");
      setSettings((prev) => ({ ...(prev ?? {}), [key]: newValue }));
      setMessage({ type: "success", text: `Updated "${key}" → ${newValue}` });
    } catch {
      setMessage({ type: "error", text: `Failed to update ${key}` });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          Feature Flags
        </CardTitle>
        <CardDescription>
          Toggle platform features on/off in real-time. Changes take effect within 30 seconds (cache TTL).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading settings…</span>
          </div>
        ) : (
          FEATURE_FLAG_DEFS.map((flag) => {
            const value = settings?.[flag.key] ?? flag.default;
            const isEnabled = value === "true";
            const isSaving = saving === flag.key;

            return (
              <div
                key={flag.key}
                className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/40 bg-secondary/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{flag.label}</p>
                    {flag.dangerous && (
                      <Badge variant="outline" className="text-xs text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                        caution
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        isEnabled
                          ? "text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {flag.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">{flag.key}</p>
                </div>

                <button
                  onClick={() => toggle(flag.key, value)}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
                    isEnabled ? "bg-blue-600" : "bg-secondary"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin absolute left-1/2 -translate-x-1/2 text-white" />
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  )}
                </button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

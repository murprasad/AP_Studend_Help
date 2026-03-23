"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";

interface PaymentConfigResponse {
  paymentsEnabled: boolean;
  stripeConfig: { secretKey: boolean; webhookSecret: boolean; priceId: boolean; annualPriceId: boolean; publishableKey: boolean };
  masked: { secretKey: string; webhookSecret: string; priceId: string; annualPriceId: string; publishableKey: string };
  pricing: { premiumPriceDisplay: string; premiumAnnualPriceDisplay: string; premiumName: string };
  paymentLinks: { monthly: string; annual: string };
  fromEnv: { secretKey: boolean; webhookSecret: boolean; priceId: boolean; annualPriceId: boolean; publishableKey: boolean; paymentLinkMonthly: boolean; paymentLinkAnnual: boolean };
}

interface FormState {
  secretKey: string;
  webhookSecret: string;
  priceId: string;
  annualPriceId: string;
  publishableKey: string;
  premiumPriceDisplay: string;
  premiumAnnualPriceDisplay: string;
  premiumName: string;
  paymentLinkMonthly: string;
  paymentLinkAnnual: string;
}

export function AdminPaymentSetup() {
  const [config, setConfig] = useState<PaymentConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<FormState>({
    secretKey: "",
    webhookSecret: "",
    priceId: "",
    annualPriceId: "",
    publishableKey: "",
    premiumPriceDisplay: "9.99",
    premiumAnnualPriceDisplay: "79.99",
    premiumName: "Premium",
    paymentLinkMonthly: "",
    paymentLinkAnnual: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/payment-config")
      .then((r) => r.json())
      .then((d: PaymentConfigResponse) => {
        setConfig(d);
        setForm((prev) => ({
          ...prev,
          premiumPriceDisplay: d.pricing.premiumPriceDisplay,
          premiumAnnualPriceDisplay: d.pricing.premiumAnnualPriceDisplay,
          premiumName: d.pricing.premiumName,
          paymentLinkMonthly: d.paymentLinks?.monthly || "",
          paymentLinkAnnual: d.paymentLinks?.annual || "",
        }));
      })
      .catch(() => setConfig(null))
      .finally(() => setLoading(false));
  }, []);

  async function togglePayments() {
    if (!config) return;
    setToggling(true);
    setMessage(null);
    const newValue = config.paymentsEnabled ? "false" : "true";
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payments_enabled", value: newValue }),
      });
      if (!res.ok) throw new Error("Failed");
      setConfig((prev) => prev && { ...prev, paymentsEnabled: newValue === "true" });
      setMessage({
        type: "success",
        text: `Payments ${newValue === "true" ? "enabled" : "disabled"}.`,
      });
    } catch {
      setMessage({ type: "error", text: "Failed to update payments toggle." });
    } finally {
      setToggling(false);
    }
  }

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/payment-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      // Refresh config status after save
      const updated = await fetch("/api/admin/payment-config").then((r) => r.json());
      setConfig(updated);
      setForm((prev) => ({
        ...prev,
        secretKey: "",
        webhookSecret: "",
        priceId: "",
        annualPriceId: "",
        publishableKey: "",
        premiumPriceDisplay: updated.pricing.premiumPriceDisplay,
        premiumAnnualPriceDisplay: updated.pricing.premiumAnnualPriceDisplay,
        premiumName: updated.pricing.premiumName,
        paymentLinkMonthly: updated.paymentLinks?.monthly || "",
        paymentLinkAnnual: updated.paymentLinks?.annual || "",
      }));
      setMessage({ type: "success", text: "Payment configuration saved successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to save configuration." });
    } finally {
      setSaving(false);
    }
  }

  const allConfigured = config
    ? Object.values(config.stripeConfig).every(Boolean)
    : false;

  const secretFields: {
    key: keyof FormState;
    configKey: keyof PaymentConfigResponse["stripeConfig"];
    label: string;
    placeholder: string;
    hint: string;
    envKey: string;
  }[] = [
    {
      key: "secretKey",
      configKey: "secretKey",
      label: "Stripe Secret Key",
      placeholder: "sk_live_...",
      hint: "Stripe Dashboard → Developers → API keys",
      envKey: "STRIPE_SECRET_KEY",
    },
    {
      key: "webhookSecret",
      configKey: "webhookSecret",
      label: "Webhook Signing Secret",
      placeholder: "whsec_...",
      hint: "Stripe Dashboard → Webhooks → endpoint signing secret",
      envKey: "STRIPE_WEBHOOK_SECRET",
    },
    {
      key: "priceId",
      configKey: "priceId",
      label: "Monthly Price ID ($9.99/mo)",
      placeholder: "price_...",
      hint: "Stripe Dashboard → Products → Premium → monthly price ID",
      envKey: "STRIPE_PREMIUM_PRICE_ID",
    },
    {
      key: "annualPriceId",
      configKey: "annualPriceId",
      label: "Annual Price ID ($79.99/yr)",
      placeholder: "price_...",
      hint: "Stripe Dashboard → Products → Premium → yearly price ID (create if missing)",
      envKey: "STRIPE_ANNUAL_PRICE_ID",
    },
    {
      key: "publishableKey",
      configKey: "publishableKey",
      label: "Publishable Key",
      placeholder: "pk_live_...",
      hint: "Stripe Dashboard → Developers → API keys (publishable)",
      envKey: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    },
  ];

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          Payment Setup
        </CardTitle>
        <CardDescription>
          Configure Stripe keys, pricing, and toggle payments on/off.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {message && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
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
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <form onSubmit={saveConfig} className="space-y-6">
            {/* Enable / Disable toggle */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/40 bg-secondary/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">Stripe Payments</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      config?.paymentsEnabled
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-muted-foreground"
                    }`}
                  >
                    {config?.paymentsEnabled ? "ENABLED" : "DISABLED"}
                  </Badge>
                  {!allConfigured && (
                    <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                      incomplete setup
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  When disabled, all users have full access. Enable once keys are configured.
                </p>
              </div>
              <button
                type="button"
                onClick={togglePayments}
                disabled={toggling}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                  config?.paymentsEnabled ? "bg-blue-600" : "bg-secondary"
                } ${toggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {toggling ? (
                  <Loader2 className="h-3 w-3 animate-spin absolute left-1/2 -translate-x-1/2 text-white" />
                ) : (
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      config?.paymentsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                )}
              </button>
            </div>

            {/* Stripe Keys */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Stripe API Keys</p>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400"
                >
                  Open Stripe Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {secretFields.map((field) => {
                const isSet = config?.stripeConfig[field.configKey] ?? false;
                const fromEnv = config?.fromEnv[field.configKey] ?? false;
                const maskedVal = config?.masked[field.configKey as keyof PaymentConfigResponse["masked"]] ?? "";
                const visible = showSecrets[field.key] ?? false;

                return (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {isSet ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      )}
                      <label className="text-xs font-medium">
                        {field.label}
                      </label>
                      <code className="text-xs text-muted-foreground/70 font-mono">{field.envKey}</code>
                      {fromEnv && (
                        <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                          from env
                        </Badge>
                      )}
                      {isSet && !fromEnv && (
                        <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">
                          configured
                        </Badge>
                      )}
                    </div>

                    {fromEnv ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <span className="text-xs text-blue-400 font-mono">{maskedVal || "set via environment variable"}</span>
                        <span className="text-xs text-muted-foreground ml-auto">Override not needed</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={visible ? "text" : "password"}
                          value={form[field.key]}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={isSet ? maskedVal || "••••••••" : field.placeholder}
                          className="w-full px-3 py-2 pr-10 text-xs font-mono rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecrets((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                    {!isSet && (
                      <p className="text-xs text-muted-foreground/60 pl-5">{field.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Payment Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Stripe Payment Links</p>
                <a
                  href="https://dashboard.stripe.com/payment-links"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400"
                >
                  Open Payment Links <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs text-muted-foreground">
                Payment Links bypass server-side checkout session creation, fixing the &ldquo;Country ZZ&rdquo; error on Cloudflare edge.
                Create one link per price in the Stripe Dashboard, then paste the URLs here.
              </p>

              {/* Monthly Payment Link */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {form.paymentLinkMonthly || config?.fromEnv.paymentLinkMonthly ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                  )}
                  <label className="text-xs font-medium">Monthly Payment Link</label>
                  <code className="text-xs text-muted-foreground/70 font-mono">STRIPE_PAYMENT_LINK_MONTHLY</code>
                  {config?.fromEnv.paymentLinkMonthly && (
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">from env</Badge>
                  )}
                </div>
                {config?.fromEnv.paymentLinkMonthly ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <span className="text-xs text-blue-400">set via environment variable</span>
                    <span className="text-xs text-muted-foreground ml-auto">Override not needed</span>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={form.paymentLinkMonthly}
                    onChange={(e) => setForm((prev) => ({ ...prev, paymentLinkMonthly: e.target.value }))}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
                <p className="text-xs text-muted-foreground/60 pl-5">Stripe Dashboard → Payment Links → create for monthly Premium price</p>
              </div>

              {/* Annual Payment Link */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  {form.paymentLinkAnnual || config?.fromEnv.paymentLinkAnnual ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                  )}
                  <label className="text-xs font-medium">Annual Payment Link</label>
                  <code className="text-xs text-muted-foreground/70 font-mono">STRIPE_PAYMENT_LINK_ANNUAL</code>
                  {config?.fromEnv.paymentLinkAnnual && (
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">from env</Badge>
                  )}
                </div>
                {config?.fromEnv.paymentLinkAnnual ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <span className="text-xs text-blue-400">set via environment variable</span>
                    <span className="text-xs text-muted-foreground ml-auto">Override not needed</span>
                  </div>
                ) : (
                  <input
                    type="url"
                    value={form.paymentLinkAnnual}
                    onChange={(e) => setForm((prev) => ({ ...prev, paymentLinkAnnual: e.target.value }))}
                    placeholder="https://buy.stripe.com/..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
                <p className="text-xs text-muted-foreground/60 pl-5">Stripe Dashboard → Payment Links → create for annual Premium price</p>
              </div>
            </div>

            {/* Pricing Display Config */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Pricing Display</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Premium Plan Name</label>
                  <input
                    type="text"
                    value={form.premiumName}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiumName: e.target.value }))}
                    placeholder="Premium"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Monthly Price ($)</label>
                  <input
                    type="text"
                    value={form.premiumPriceDisplay}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiumPriceDisplay: e.target.value }))}
                    placeholder="9.99"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Annual Price ($) — shown as /yr on billing page</label>
                  <input
                    type="text"
                    value={form.premiumAnnualPriceDisplay}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiumAnnualPriceDisplay: e.target.value }))}
                    placeholder="79.99"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border/40 bg-secondary/30 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                These values appear on the public <code className="font-mono">/pricing</code> page and billing page.
              </p>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save Configuration"}
            </button>

            {allConfigured && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <p className="text-xs text-emerald-400">
                  All Stripe keys are configured. You can enable payments above.
                </p>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

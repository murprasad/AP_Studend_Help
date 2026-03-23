import type { Metadata } from "next";
import { Mail, Clock, MessageSquare, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — StudentNest Prep",
  description: "Get in touch with the StudentNest Prep team. We typically respond within 24 hours.",
  openGraph: {
    title: "Contact | StudentNest Prep",
    description: "Questions, feedback, or partnership inquiries — we'd love to hear from you.",
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto">
          <Mail className="h-7 w-7 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold">Get in Touch</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Have a question, feedback, or suggestion? We&apos;d love to hear from you.
        </p>
      </div>

      {/* Contact methods */}
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href="mailto:contact@studentnest.ai"
          className="p-6 rounded-xl border border-border/40 bg-card/50 hover:bg-accent transition-colors space-y-3"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="font-semibold">Email Us</p>
          <p className="text-sm text-indigo-400">contact@studentnest.ai</p>
          <p className="text-xs text-muted-foreground">Best for questions, feedback, and support requests.</p>
        </a>

        <div className="p-6 rounded-xl border border-border/40 bg-card/50 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="font-semibold">Chat with Sage</p>
          <p className="text-sm text-emerald-400">Click the purple button below</p>
          <p className="text-xs text-muted-foreground">Sage can answer product questions instantly, 24/7.</p>
        </div>
      </div>

      {/* Response time + trust */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-5 rounded-xl border border-border/40 bg-card/50">
          <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Response Time</p>
            <p className="text-xs text-muted-foreground mt-1">We typically respond within 24 hours on business days. For urgent issues, include &ldquo;URGENT&rdquo; in your subject line.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-5 rounded-xl border border-border/40 bg-card/50">
          <Shield className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold">Privacy</p>
            <p className="text-xs text-muted-foreground mt-1">Your information is never shared with third parties. See our <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a> for details.</p>
          </div>
        </div>
      </div>

      {/* Common topics */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-center">Common Topics</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Billing & Subscriptions", desc: "Payment issues, refunds, plan changes", link: "/faq" },
            { label: "Technical Support", desc: "Bugs, login issues, account problems", link: "mailto:contact@studentnest.ai?subject=Technical%20Support" },
            { label: "Partnerships", desc: "Schools, educators, bulk licensing", link: "mailto:contact@studentnest.ai?subject=Partnership%20Inquiry" },
          ].map((t) => (
            <a key={t.label} href={t.link} className="p-4 rounded-xl border border-border/40 bg-card/50 hover:bg-accent transition-colors text-center space-y-1">
              <p className="text-sm font-semibold">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

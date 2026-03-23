import type { Metadata } from "next";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | StudentNest Prep",
  description: "How StudentNest Prep collects, uses, and protects your data. GDPR and COPPA compliant.",
};

export default function PrivacyPage() {
  const sections = [
    {
      id: "overview",
      title: "1. Overview",
      body: `StudentNest ("we", "us", "our") operates studentnest.ai. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using StudentNest, you consent to the practices described below.`,
    },
    {
      id: "data-collected",
      title: "2. Information We Collect",
      body: `We collect information you provide directly: your name, email address, school (optional), and grade level when you create an account. If you sign in with Google, we receive your name, email, and profile picture from Google. We also collect usage data: practice session results, AI tutor conversations, mastery scores, and study plan progress. We do NOT collect or store credit card numbers — all payment processing is handled by Stripe.`,
    },
    {
      id: "how-used",
      title: "3. How We Use Your Information",
      body: `We use your data to: (1) provide personalized practice questions and AI tutoring based on your performance, (2) track your progress and generate study plans, (3) send you account-related emails (verification, password reset), (4) improve our AI question quality and platform experience, and (5) process subscription payments via Stripe. We never sell your personal information to third parties.`,
    },
    {
      id: "third-parties",
      title: "4. Third-Party Services",
      body: `We use the following third-party services: Stripe (payment processing — they receive your email and payment details under their own privacy policy), Google OAuth (if you choose to sign in with Google), Groq and other AI providers (your questions and conversations are sent to AI providers for response generation — no personally identifiable information is included in AI requests), and Neon (database hosting). Each service has its own privacy policy governing data they process.`,
    },
    {
      id: "cookies",
      title: "5. Cookies & Local Storage",
      body: `We use essential cookies for authentication (session tokens via NextAuth) and localStorage for preferences (selected course, theme, onboarding status). We do not use advertising cookies or third-party tracking pixels. No data is shared with advertisers.`,
    },
    {
      id: "data-retention",
      title: "6. Data Retention",
      body: `Your account data, practice history, and AI tutor conversations are retained as long as your account is active. If you delete your account, your personal data will be removed within 30 days. Anonymized, aggregated usage data (e.g., question difficulty statistics) may be retained indefinitely to improve the platform.`,
    },
    {
      id: "children",
      title: "7. Children's Privacy",
      body: `StudentNest is designed for high school and college students. We do not knowingly collect personal information from children under 13 without parental consent. If you are under 13, please have a parent or guardian create an account on your behalf. If we learn that we have collected personal information from a child under 13 without parental consent, we will delete that information promptly. Contact us at contact@studentnest.ai if you believe a child under 13 has provided us with personal data.`,
    },
    {
      id: "security",
      title: "8. Data Security",
      body: `We use industry-standard security measures to protect your data: encrypted connections (HTTPS/TLS), secure password hashing (bcrypt), JWT-based authentication, and access controls on our database. While no system is 100% secure, we take reasonable precautions to protect your information.`,
    },
    {
      id: "rights",
      title: "9. Your Rights",
      body: `You have the right to: access the personal data we hold about you, correct inaccurate information, delete your account and associated data, and export your practice history. To exercise any of these rights, email contact@studentnest.ai. We will respond within 14 business days.`,
    },
    {
      id: "changes",
      title: "10. Changes to This Policy",
      body: `We may update this Privacy Policy from time to time. If we make material changes, we will notify you by posting a notice on the platform. Continued use of StudentNest after changes constitutes acceptance of the updated policy.`,
    },
    {
      id: "contact",
      title: "11. Contact Us",
      body: `For privacy-related questions or requests, contact us at contact@studentnest.ai. We aim to respond to all inquiries within 2 business days.`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground">
          Last updated: March 21, 2026
        </p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Your privacy matters to us. This policy explains what data we collect, how we use it,
          and the choices you have.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-xl border border-border/40 bg-card p-6 space-y-3"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* Footer nav */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          {" · "}
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          {" · "}
          <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </p>
        <p>Questions? Email <a href="mailto:contact@studentnest.ai" className="text-blue-500 hover:underline">contact@studentnest.ai</a></p>
      </div>
    </div>
  );
}

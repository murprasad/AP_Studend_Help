import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Free & Premium Plans | StudentNest Prep",
  description:
    "Free forever with all courses. Premium upgrades for AP, SAT, ACT and more at $9.99/mo or $79.99/yr (save 33%). 7-day money-back guarantee.",
  openGraph: {
    title: "Pricing | StudentNest Prep",
    description:
      "Free forever. Premium from $9.99/mo per module. 7-day money-back guarantee.",
    url: "https://studentnest.ai/pricing",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I subscribe to multiple modules?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Each module (AP, SAT, ACT) is an independent $9.99/mo subscription. Subscribe to as many as you need.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Cancel from your billing page and you'll keep Premium access until the end of your billing period.",
      },
    },
    {
      "@type": "Question",
      name: "Can I pay annually?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — $79.99/year per module saves you 33% compared to monthly billing ($6.67/mo).",
      },
    },
    {
      "@type": "Question",
      name: "What is your refund policy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We offer a 7-day money-back guarantee on new Premium subscriptions. If you're not satisfied within 7 days of your first payment, email contact@studentnest.ai and we'll issue a full refund — no questions asked. After 7 days, subscriptions are non-refundable but you can cancel anytime and keep access until the end of your billing period.",
      },
    },
    {
      "@type": "Question",
      name: "What happens when I hit the free AI limit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free users can start 5 new AI Tutor conversations per day. Your existing conversations are never deleted.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a student discount?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We keep the free tier generous so every student can prepare for their exams. Premium is $9.99/month per module — or $79.99/year.",
      },
    },
    {
      "@type": "Question",
      name: "Which payment methods are accepted?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All major credit and debit cards via Stripe. Your payment info is never stored on our servers.",
      },
    },
  ],
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter, Roboto, Roboto_Slab } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { SentryInit } from "@/components/sentry-init";

const inter = Inter({ subsets: ["latin"] });
// 2026-05-31 — Roboto + Roboto Slab loaded for the CB-style marketing
// landing. Exposed as CSS variables so the new landing can opt-in via
// `font-roboto` / `font-roboto-slab` Tailwind utilities. Other surfaces
// keep Inter via the default body className.
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});
const robotoSlab = Roboto_Slab({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudentNest Prep — AP, SAT & ACT Exam Prep",
  description:
    "Raise your AP, SAT, or ACT score with explanations that show you why — not just what. Personalized practice, instant feedback, mastery tracking. Free to start.",
  metadataBase: new URL("https://studentnest.ai"),
  openGraph: {
    title: "StudentNest Prep — Score Higher on AP, SAT & ACT",
    description: "Exam-aligned practice with instant feedback and mastery tracking. Free for every student.",
    url: "https://studentnest.ai",
    siteName: "StudentNest Prep",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.svg?v=2", width: 1200, height: 630, alt: "StudentNest Prep — AP, SAT & ACT Exam Prep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudentNest Prep — Score Higher on AP, SAT & ACT",
    description: "Exam-aligned practice. Personalized. Free to start.",
    images: ["/og-image.svg?v=2"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "OIdAKp12XS0pym-ockZ-8QFg2zraUxTxnNIv2s_WiLA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#1865F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${roboto.variable} ${robotoSlab.variable}`}>
      <head>
        {/* JSON-LD Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": ["Organization", "EducationalOrganization"],
                "@id": "https://studentnest.ai/#org",
                name: "StudentNest Prep",
                alternateName: "StudentNest",
                url: "https://studentnest.ai",
                logo: "https://studentnest.ai/icons/icon-512.png",
                // Precise, keyword-rich description so search engines distinguish this
                // online AP/SAT/ACT exam-prep software from similarly-named in-person
                // K-12 tutoring businesses. (2026-06-08 reach/disambiguation pass.)
                description:
                  "StudentNest Prep is an online exam-preparation platform for the AP, SAT, and ACT exams. Students practice exam-aligned multiple-choice questions, take full-length timed mock exams, track mastery by topic, and get AI tutoring. Not affiliated with any in-person K-12 tutoring company.",
                knowsAbout: ["AP exams", "SAT", "ACT", "Digital SAT", "PSAT", "college admissions test prep"],
                contactPoint: { "@type": "ContactPoint", email: "contact@studentnest.ai", contactType: "customer support" },
                // sameAs intentionally omitted until official social profiles exist —
                // listing nonexistent/placeholder URLs hurts entity trust. Add the real
                // TikTok/Instagram/YouTube/X URLs here once the accounts are live.
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://studentnest.ai/#website",
                name: "StudentNest Prep",
                url: "https://studentnest.ai",
                publisher: { "@id": "https://studentnest.ai/#org" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: { "@type": "EntryPoint", urlTemplate: "https://studentnest.ai/blog?q={search_term_string}" },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        {/* Prevent flash of wrong theme — runs before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'light';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
          }}
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="StudentNest" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Microsoft Clarity — free session recording + heatmaps. Wired 2026-04-24
            per user strategy request. Clarity ID is public (read-only); safe to
            inline. To disable, remove NEXT_PUBLIC_CLARITY_ID from env. */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_ID}");`,
            }}
          />
        )}
        {/* GA4 — env-gated (2026-06-05). Set NEXT_PUBLIC_GA_ID to activate
            page-view tracking. Complements Clarity (replay/heatmaps/friction)
            with funnels/path analysis. No-op until the ID is set. */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`,
              }}
            />
          </>
        )}
        {/* SW disabled 2026-04-20. Previous pass-through SW was returning 503
            via its .catch when the origin fetch hung on CF Workers, masking
            real backend errors as a service-worker fallback. This script
            unregisters any existing SW and purges caches so returning users
            escape the bad state. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});if('caches' in self){caches.keys().then(ks=>ks.forEach(k=>caches.delete(k))).catch(()=>{});}}`,
          }}
        />
      </head>
      <body className={inter.className}>
        <SentryInit />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

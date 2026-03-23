import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudentNest Prep — AP, SAT, ACT & CLEP Exam Prep",
  description:
    "Raise your exam score with AI that explains why, not just what. Personalized practice, instant feedback, and mastery tracking for AP, SAT, ACT & CLEP. Free for every student.",
  metadataBase: new URL("https://studentnest.ai"),
  openGraph: {
    title: "StudentNest Prep — Score Higher on AP, SAT, ACT & CLEP",
    description: "AI-powered exam prep with personalized practice, instant feedback, and mastery tracking. Free for every student.",
    url: "https://studentnest.ai",
    siteName: "StudentNest Prep",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.svg?v=2", width: 1200, height: 630, alt: "StudentNest Prep — AP, SAT, ACT & CLEP Exam Prep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudentNest Prep — Score Higher on AP, SAT, ACT & CLEP",
    description: "AI-powered exam prep. Personalized practice. Free to start.",
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
  viewportFit: "cover",
  themeColor: "#1865F2",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "StudentNest Prep",
              url: "https://studentnest.ai",
              description: "AI-powered exam preparation for AP, SAT, ACT, and CLEP exams",
              contactPoint: { "@type": "ContactPoint", email: "contact@studentnest.ai", contactType: "customer support" },
            }),
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
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

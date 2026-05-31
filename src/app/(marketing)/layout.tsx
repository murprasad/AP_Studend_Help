import { SageChat } from "@/components/layout/sage-chat";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { APSeasonBanner } from "@/components/marketing/ap-season-banner";

// 2026-05-31 — Marketing surface adopts the CB design system to match
// the homepage (commit 56fa107) and the PL marketing chrome migration.
// White body, Roboto default, cb-indigo text, cb-muted footer links with
// cobalt hover.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-cb-indigo font-roboto flex flex-col">
      <APSeasonBanner />
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-cb-cardBorder bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-cb-muted">
            <a href="mailto:contact@studentnest.ai" className="hover:text-cb-cobalt transition-colors">Contact</a>
            <span className="text-cb-cardBorder hidden sm:inline">·</span>
            <a href="/about" className="hover:text-cb-cobalt transition-colors">About</a>
            <span className="text-cb-cardBorder hidden sm:inline">·</span>
            <a href="/pricing" className="hover:text-cb-cobalt transition-colors">Pricing</a>
            <span className="text-cb-cardBorder hidden sm:inline">·</span>
            <a href="/terms" className="hover:text-cb-cobalt transition-colors">Terms</a>
            <span className="text-cb-cardBorder hidden sm:inline">·</span>
            <a href="/privacy" className="hover:text-cb-cobalt transition-colors">Privacy</a>
          </div>
          <p className="text-[11px] text-cb-muted/70 max-w-3xl mx-auto leading-relaxed">
            AP® and SAT® are trademarks of the College Board. ACT® is a registered trademark of ACT, Inc.
            StudentNest is not affiliated with or endorsed by the College Board or ACT, Inc.
            Studying for CLEP or DSST? Visit our sister site{" "}
            <a
              href="https://preplion.ai/?utm_source=studentnest&utm_medium=footer&utm_campaign=cross_product"
              className="underline hover:text-cb-cobalt"
              rel="noopener"
            >
              preplion.ai
            </a>.
            © {new Date().getFullYear()} StudentNest Prep — independent educational platform.
          </p>
        </div>
      </footer>
      <SageChat />
    </div>
  );
}

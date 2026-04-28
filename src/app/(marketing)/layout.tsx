import { SageChat } from "@/components/layout/sage-chat";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { APSeasonBanner } from "@/components/marketing/ap-season-banner";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <APSeasonBanner />
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border/40 py-8 px-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a href="mailto:contact@studentnest.ai" className="hover:text-foreground transition-colors">Contact</a>
          <span className="text-border">|</span>
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
          <span className="text-border">|</span>
          <a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <span className="text-border">|</span>
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          <span className="text-border">|</span>
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
        </div>
        <p className="text-[11px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AP® and SAT® are trademarks of the College Board. ACT® is a registered trademark of ACT, Inc.
          StudentNest is not affiliated with or endorsed by the College Board or ACT, Inc.
          Studying for CLEP or DSST? Visit our sister site <a href="https://preplion.ai/?utm_source=studentnest&utm_medium=footer&utm_campaign=cross_product" className="underline hover:text-foreground" rel="noopener">preplion.ai</a>.
          © {new Date().getFullYear()} StudentNest Prep — independent educational platform.
        </p>
      </footer>
      <SageChat />
    </div>
  );
}

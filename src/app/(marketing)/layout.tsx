import Link from "next/link";
import { Sparkles } from "lucide-react";
import { SageChat } from "@/components/layout/sage-chat";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-blue-500/60 font-normal text-[0.6em] ml-1">Prep</span>
            </span>
            <p className="text-xs text-muted-foreground leading-none hidden sm:block">Study Smarter. Score Higher.</p>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/login" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Get started </span>free
          </Link>
        </div>
      </nav>
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
        <p className="text-[11px] text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
          AP®, SAT®, and CLEP® are trademarks of the College Board. ACT® is a registered trademark of ACT, Inc.
          StudentNest is not affiliated with or endorsed by the College Board or ACT, Inc.
          © {new Date().getFullYear()} StudentNest Prep — independent educational platform.
        </p>
      </footer>
      <SageChat />
    </div>
  );
}

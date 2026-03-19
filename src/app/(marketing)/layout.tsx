import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span>
            </span>
            <p className="text-xs text-muted-foreground leading-none hidden sm:block">Your AI Study Partner</p>
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
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors"
          >
            <span className="hidden sm:inline">Get started </span>free
          </Link>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border/40 py-6 px-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          AP® and SAT® are trademarks of the College Board, which is not affiliated with, and does not endorse, this site.
          ACT® is a registered trademark of ACT, Inc., which is not affiliated with, and does not endorse, this site.
        </p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} StudentNest. Independent educational platform. Not affiliated with College Board or ACT, Inc.</p>
      </footer>
    </div>
  );
}

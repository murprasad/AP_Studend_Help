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
            <p className="text-xs text-muted-foreground leading-none">Your AI Study Partner</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border/40 p-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} StudentNest. Built for AP students.
      </footer>
    </div>
  );
}

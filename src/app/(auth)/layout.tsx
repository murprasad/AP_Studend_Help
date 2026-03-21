import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Sparkles className="h-6 w-6 text-indigo-400" />
          <div>
            <span className="text-lg font-bold">
              <span className="gradient-text">Student</span><span className="text-foreground/80 font-medium">Nest</span><span className="text-indigo-400/60 font-normal text-[0.6em] ml-1">AI</span>
            </span>
            <p className="text-xs text-muted-foreground leading-none">Your AI Study Partner</p>
          </div>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";

// 2026-05-31 — Auth pages adopt the CB design system to match the
// marketing surface. Cobalt SN initials mark replaces Sparkles +
// gradient wordmark. White body, Roboto default.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-cb-indigo font-roboto flex flex-col">
      <header className="border-b border-cb-cardBorder bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-cb-cobalt text-white text-xs font-bold">
              SN
            </span>
            <span className="text-base font-medium text-cb-indigo">
              StudentNest <span className="text-cb-muted font-normal">Prep</span>
            </span>
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}

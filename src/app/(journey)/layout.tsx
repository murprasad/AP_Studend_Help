/**
 * /journey route group — Beta 9.5 (2026-04-30).
 *
 * Minimal full-screen layout. NO sidebar, NO global nav, NO dashboard
 * chrome. Per the locked spec, the journey owns the screen end-to-end —
 * users don't see escape options between steps (only a small "Exit" in
 * the corner for safety). Mirrors the Duolingo lesson model.
 */

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {children}
    </div>
  );
}

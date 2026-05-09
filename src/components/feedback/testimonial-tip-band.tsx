/**
 * TestimonialTipBand — Phase 4 user-feedback loop, landing-page surface.
 *
 * Renders 3-5 random "Real Student Tips" from across courses as social
 * proof on the marketing landing pages. No auth required.
 *
 * Reads via static accessor (src/lib/feedback-profiles.ts) — works at
 * build time on CF Workers (fs.readFileSync at runtime does not).
 */
import { getAllPopupTips } from "@/lib/feedback-profiles";

interface PopupTip {
  tip_id: string;
  text: string;
  source_attribution: string;
}

interface Props {
  count?: number;
}

export function TestimonialTipBand({ count = 4 }: Props) {
  const all = getAllPopupTips();
  if (all.length === 0) return null;

  const seen = new Set<string>();
  const picked: PopupTip[] = [];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  for (const t of shuffled) {
    if (seen.has(t.tip_id)) continue;
    seen.add(t.tip_id);
    picked.push(t);
    if (picked.length >= count) break;
  }

  return (
    <section className="py-12 px-6 bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium mb-3">
            <span>★</span> Trained on real test-taker reports
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">What real students who passed are saying</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Our questions evolve weekly based on what actual test-takers report from their exams.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {picked.map((tip) => (
            <div key={tip.tip_id} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
              <p className="text-sm text-foreground mb-3 leading-relaxed">&ldquo;{tip.text}&rdquo;</p>
              <p className="text-xs text-muted-foreground italic">— {tip.source_attribution}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

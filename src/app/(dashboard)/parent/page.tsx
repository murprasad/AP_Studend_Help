"use client";

/**
 * Parent / learning-coach progress view (ADHD Wave 2 #44).
 *
 * A warm, parent-friendly summary of the logged-in student's OWN progress
 * (no cross-account access — reuses /api/analytics for the session user).
 * Encouraging tone + concrete, non-clinical "ways to support" tips.
 *
 * Framing: for parents and learning coaches of students who learn
 * differently. No medical/diagnostic claims. Part of existing Premium.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCourse } from "@/hooks/use-course";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Flame, Target, TrendingUp, Loader2 } from "lucide-react";

interface AnalyticsStats {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  totalSessions: number;
  streakDays: number;
}
interface PredictedScore {
  score: number | string;
  confidence: "low" | "medium" | "high" | string;
  improving: boolean;
}
interface AnalyticsResponse {
  stats?: AnalyticsStats;
  predictedScore?: PredictedScore;
  accuracyTimeline?: Array<{ accuracy: number; questions: number }>;
}

export default function ParentViewPage() {
  const [course] = useCourse();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/analytics?course=${course}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => { if (!cancelled) { setData(j); setLoading(false); } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [course]);

  const stats = data?.stats;
  const recentSessions = data?.accuracyTimeline?.length ?? 0;
  const recentQuestions = data?.accuracyTimeline?.reduce((a, s) => a + (s.questions ?? 0), 0) ?? 0;
  const lowData = (stats?.totalAnswered ?? 0) < 25;

  // Support tips — concrete, study-habit oriented, non-clinical.
  const tips: string[] = [
    "Celebrate consistency over scores — ask 'did you practice today?' rather than 'what did you get?'. Short daily sessions build more than occasional long ones.",
    "When a session goes badly, treat it as information, not failure — a low day is normal and the next session resets the streak-forgiveness clock.",
    "Help them protect a distraction-free 15 minutes: phone in another room, one tab open. The in-app Focus tools (Settings) support this too.",
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Dashboard</Button>
          </Link>
          <Badge variant="secondary" className="gap-1"><Heart className="h-3.5 w-3.5" />For parents &amp; coaches</Badge>
        </div>

        <div>
          <h1 className="text-2xl font-bold">How your student is doing</h1>
          <p className="text-sm text-muted-foreground">A friendly snapshot of progress — and a few ways you can help.</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading progress…
          </div>
        ) : error || !stats ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No progress to show yet. Once your student completes a few practice sessions, their summary will appear here.
              <div className="pt-3">
                <Link href="/practice"><Button size="sm">Start a session</Button></Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={<Flame className="h-4 w-4 text-orange-500" />} label="Day streak" value={String(stats.streakDays)} />
              <StatCard icon={<Target className="h-4 w-4 text-blue-500" />} label="Questions answered" value={String(stats.totalAnswered)} />
              <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-500" />} label="Accuracy" value={`${stats.overallAccuracy}%`} />
              <StatCard icon={<Heart className="h-4 w-4 text-rose-500" />} label="Recent sessions" value={String(recentSessions)} />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">This stretch of practice</CardTitle>
                <CardDescription>
                  Your student has answered <strong>{recentQuestions}</strong> questions across their {recentSessions} most
                  recent sessions{stats.overallAccuracy > 0 ? <>, at about <strong>{stats.overallAccuracy}% accuracy</strong></> : null}.
                  {stats.streakDays > 0 ? <> They're on a <strong>{stats.streakDays}-day</strong> streak — that consistency is the real win.</> : <> Getting a daily rhythm going is the next milestone.</>}
                </CardDescription>
              </CardHeader>
              {data?.predictedScore && (
                <CardContent className="pt-0">
                  {lowData ? (
                    <p className="text-sm text-muted-foreground">
                      It's still early — we're calibrating an estimate as they practice more. Early numbers bounce around, so focus on the habit, not the score.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      We&apos;re tracking a readiness estimate that sharpens the more they practice
                      {data.predictedScore.improving ? " — and it&apos;s trending up right now." : "."}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Ways you can help</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tips.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span><span>{t}</span>
                  </div>
                ))}
                <div className="pt-1">
                  <Link href="/settings" className="text-sm text-primary underline">Explore the Focus tools in Settings →</Link>
                </div>
              </CardContent>
            </Card>

            <p className="text-[11px] text-muted-foreground/70">
              This is a study-progress summary, not a medical or diagnostic report.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">{icon}{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Medal, Loader2 } from "lucide-react";
import { ApCourse } from "@prisma/client";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  xp: number;
}

interface Props {
  course: ApCourse;
}

export function LeaderboardWidget({ course }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?course=${course}`)
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard || []);
        setUserRank(d.userRank ?? null);
        setUserXp(d.userXp || 0);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [course]);

  const rankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-400";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-amber-600";
    return "text-muted-foreground";
  };

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Medal className="h-4 w-4 text-yellow-400" />
          Weekly Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <p className="text-sm text-red-400 text-center py-4">Couldn&apos;t load leaderboard.</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity this week yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40"
              >
                <span className={`text-sm font-bold w-7 flex-shrink-0 ${rankColor(entry.rank)}`}>
                  {rankEmoji(entry.rank)}
                </span>
                <span className="text-sm flex-1 truncate">{entry.displayName}</span>
                <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-500/30 flex-shrink-0">
                  {entry.xp} XP
                </Badge>
              </div>
            ))}
            {userRank && userRank > leaderboard.length && (
              <div className="flex items-center gap-2 p-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 mt-2">
                <span className="text-sm font-bold w-7 flex-shrink-0 text-indigo-400">#{userRank}</span>
                <span className="text-sm flex-1 text-indigo-300">You</span>
                <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-500/30">
                  {userXp} XP
                </Badge>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground text-center pt-1">Resets every Monday</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

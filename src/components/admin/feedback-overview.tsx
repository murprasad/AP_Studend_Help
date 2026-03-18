"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackEntry {
  id: string;
  rating: number;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  session: { course: string; sessionType: string; correctAnswers: number; totalQuestions: number };
}

export function AdminFeedbackOverview() {
  const [data, setData] = useState<{ feedbacks: FeedbackEntry[]; thumbsUp: number; thumbsDown: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/feedback").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  const total = data.thumbsUp + data.thumbsDown;
  const pct = total > 0 ? Math.round((data.thumbsUp / total) * 100) : 0;

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-3">
          Session Feedback
          <div className="flex items-center gap-3 ml-auto text-sm font-normal">
            <span className="flex items-center gap-1 text-emerald-400"><ThumbsUp className="h-4 w-4" />{data.thumbsUp}</span>
            <span className="flex items-center gap-1 text-red-400"><ThumbsDown className="h-4 w-4" />{data.thumbsDown}</span>
            {total > 0 && <Badge variant="outline">{pct}% positive</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
        ) : (
          <div className="space-y-2">
            {data.feedbacks.map((fb) => (
              <div key={fb.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                {fb.rating === 1 ? (
                  <ThumbsUp className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <ThumbsDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fb.user.firstName} {fb.user.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{fb.user.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">{fb.session.course.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{fb.session.correctAnswers}/{fb.session.totalQuestions} correct</p>
                </div>
                <p className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

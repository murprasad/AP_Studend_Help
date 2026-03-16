import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardMasteryChart } from "@/components/dashboard/mastery-chart";
import { AP_UNITS, COURSE_UNITS, AP_COURSES, getMasteryLabel, getMasteryColor, getMasteryBg, getXpProgressInLevel } from "@/lib/utils";
import { ApCourse, ApUnit } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import {
  Zap,
  Flame,
  Target,
  BarChart3,
  BookOpen,
  Trophy,
  Star,
  ArrowRight,
  Clock,
  Crown,
} from "lucide-react";
import { format, subDays } from "date-fns";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Read selected course from cookie (written by useCourse hook client-side)
  const cookieStore = cookies();
  const courseCookie = cookieStore.get("ap_selected_course")?.value as ApCourse | undefined;
  const selectedCourse: ApCourse =
    courseCookie && VALID_AP_COURSES.includes(courseCookie)
      ? courseCookie
      : "AP_WORLD_HISTORY";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      totalXp: true,
      level: true,
      streakDays: true,
      subscriptionTier: true,
    },
  });

  const masteryScores = await prisma.masteryScore.findMany({
    where: { userId: session.user.id },
    orderBy: { masteryScore: "asc" },
  });

  // Filter units to only those belonging to the selected course
  const courseUnitMap = COURSE_UNITS[selectedCourse] as Record<string, string>;
  const courseUnitKeys = Object.keys(courseUnitMap) as ApUnit[];
  const masteryMap = new Map(masteryScores.map((m) => [m.unit, m]));

  const fullMastery = courseUnitKeys.map((unit) => ({
    unit,
    unitName: courseUnitMap[unit],
    masteryScore: masteryMap.get(unit)?.masteryScore || 0,
    accuracy: masteryMap.get(unit)?.accuracy || 0,
  }));

  const weakUnits = fullMastery.filter((u) => u.masteryScore < 70).sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 3);
  const avgMastery = fullMastery.length > 0
    ? fullMastery.reduce((sum, u) => sum + u.masteryScore, 0) / fullMastery.length
    : 0;

  const recentSessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id, status: "COMPLETED", course: selectedCourse },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  const totalAnswered = await prisma.studentResponse.count({
    where: { userId: session.user.id, session: { course: selectedCourse } },
  });
  const totalCorrect = await prisma.studentResponse.count({
    where: { userId: session.user.id, isCorrect: true, session: { course: selectedCourse } },
  });

  const xpProgress = getXpProgressInLevel(user?.totalXp || 0);

  const earnedAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { earnedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <Badge variant="outline" className="text-indigo-400 border-indigo-500/40 bg-indigo-500/10 text-xs">
              {AP_COURSES[selectedCourse]}
            </Badge>
          </div>
        </div>
        <Link href="/practice">
          <Button size="lg" className="gap-2">
            <Zap className="h-5 w-5" />
            Start Practice
          </Button>
        </Link>
      </div>

      {/* Free user upgrade nudge */}
      {user?.subscriptionTier !== "PREMIUM" && (
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Unlock Premium</p>
              <p className="text-xs text-muted-foreground">
                Unlimited AI tutoring · Personalized study plan · Streaming AI · Advanced analytics
              </p>
            </div>
          </div>
          <Link href="/pricing" className="flex-shrink-0">
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
              <Crown className="h-3.5 w-3.5" />
              Upgrade — $9.99/mo
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user?.streakDays || 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">Lv.{user?.level || 1}</p>
                <p className="text-xs text-muted-foreground">{user?.totalXp || 0} XP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(avgMastery)}%</p>
                <p className="text-xs text-muted-foreground">Avg Mastery</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* XP Progress */}
      <Card className="card-glow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {user?.level || 1} Progress</span>
            <span className="text-xs text-muted-foreground">
              {xpProgress.current} / {xpProgress.needed} XP
            </span>
          </div>
          <Progress
            value={(xpProgress.current / xpProgress.needed) * 100}
            className="h-2"
            indicatorClassName="bg-indigo-500"
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mastery Chart */}
        <div className="lg:col-span-2">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="text-lg">Unit Mastery Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardMasteryChart data={fullMastery} />
            </CardContent>
          </Card>
        </div>

        {/* Focus Areas */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-400" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakUnits.length > 0 ? (
              weakUnits.map((unit) => (
                <div key={unit.unit} className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium line-clamp-1">{unit.unitName}</p>
                    <Badge variant="outline" className={`text-xs ${getMasteryColor(unit.masteryScore)}`}>
                      {getMasteryLabel(unit.masteryScore)}
                    </Badge>
                  </div>
                  <Progress
                    value={unit.masteryScore}
                    className="h-1.5"
                    indicatorClassName={getMasteryBg(unit.masteryScore)}
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Great job! All units are at 70%+ mastery.</p>
            )}
            <Link href="/practice">
              <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
                Practice Weak Areas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/practice?mode=quick">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-accent cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Quick Practice</p>
                  <p className="text-xs text-muted-foreground">10 questions · untimed</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/practice?mode=focused">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-accent cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Focused Study</p>
                  <p className="text-xs text-muted-foreground">Choose unit & difficulty</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/mock-exam">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-accent cursor-pointer transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Mock Exam</p>
                  <p className="text-xs text-muted-foreground">10 questions · timed at AP pace</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {s.sessionType === "QUICK_PRACTICE"
                          ? "Quick Practice"
                          : s.sessionType === "FOCUSED_STUDY"
                          ? "Focused Study"
                          : "Mock Exam"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.completedAt ? format(s.completedAt, "MMM d, h:mm a") : "In Progress"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        {Math.round(s.score || 0)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.correctAnswers}/{s.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">No sessions yet.</p>
                <Link href="/practice">
                  <Button size="sm" className="mt-3">Start Practicing</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Achievements
              <Badge variant="outline" className="text-xs font-normal ml-1">{earnedAchievements.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {earnedAchievements.map((ua) => (
                <div key={ua.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/20">
                  <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-lg">
                    🏆
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{ua.achievement.name}</p>
                    <p className="text-xs text-muted-foreground">+{ua.achievement.xpReward} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

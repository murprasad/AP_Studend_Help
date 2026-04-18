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
import { GoalCard } from "@/components/dashboard/goal-card";
import { COURSE_UNITS, AP_COURSES, getMasteryLabel, getMasteryColor, getMasteryBg, getXpProgressInLevel } from "@/lib/utils";
import { ApCourse, ApUnit } from "@prisma/client";
import { VALID_AP_COURSES } from "@/lib/courses";
import {
  Zap,
  Flame,
  Target,
  BookOpen,
  Trophy,
  Star,
  ArrowRight,
  Clock,
  Crown,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ExamCountdownSetter } from "@/components/dashboard/exam-countdown-setter";
import { DailyReviewCard } from "@/components/dashboard/daily-review-card";
import { CLEPDayCard } from "@/components/dashboard/clep-day-card";
import { CLEPGeneratePlan } from "@/components/dashboard/clep-generate-plan";

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
  // Defensive: the user row may have been deleted between the auth check and
  // this query. Without this guard, subsequent `user!.firstName` access would
  // throw a cryptic server error for the client.
  if (!user) redirect("/login");

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
    take: 3,
  });

  const totalAnswered = await prisma.studentResponse.count({
    where: { userId: session.user.id, session: { course: selectedCourse } },
  });
  const totalCorrect = await prisma.studentResponse.count({
    where: { userId: session.user.id, isCorrect: true, session: { course: selectedCourse } },
  });

  const xpProgress = getXpProgressInLevel(user?.totalXp || 0);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayQuestionCount = await prisma.studentResponse.count({
    where: { userId: session.user.id, answeredAt: { gte: todayStart }, session: { course: selectedCourse } },
  });

  const earnedAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: { achievement: true },
    orderBy: { earnedAt: "desc" },
  });

  // Fetch 7-day CLEP study plan if applicable
  const isCLEP = selectedCourse.startsWith("CLEP_");
  let clepPlan: { planData: any; generatedAt: string } | null = null;
  if (isCLEP) {
    const plan = await prisma.studyPlan.findFirst({
      where: { userId: session.user.id, course: selectedCourse, isActive: true },
      orderBy: { generatedAt: "desc" },
      select: { planData: true, generatedAt: true },
    });
    if (plan && (plan.planData as any)?.planType === "7day") {
      clepPlan = { planData: plan.planData, generatedAt: plan.generatedAt.toISOString() };
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-muted-foreground text-sm">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <Badge variant="outline" className="text-blue-500 border-blue-500/40 bg-blue-500/10 text-xs">
              {AP_COURSES[selectedCourse]}
            </Badge>
            <ExamCountdownSetter course={selectedCourse} inline />
          </div>
        </div>
        <Link href="/practice" className="flex-shrink-0">
          <Button size="lg" className="btn-lift gap-2">
            <Zap className="h-5 w-5" />
            Start Practice
          </Button>
        </Link>
      </div>

      {/* CLEP 7-Day Plan Card */}
      {isCLEP && clepPlan && (
        <CLEPDayCard
          planData={clepPlan.planData}
          generatedAt={clepPlan.generatedAt}
          course={selectedCourse}
        />
      )}

      {/* CLEP empty state — no plan yet */}
      {isCLEP && !clepPlan && (
        <CLEPGeneratePlan course={selectedCourse} />
      )}

      {/* Stats Row — 3 cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={`card-glow ${(user?.streakDays || 0) >= 7 ? "border-orange-500/30" : ""}`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user?.streakDays || 0}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
                {(user?.streakDays || 0) >= 100 && <p className="text-[10px] font-semibold text-yellow-400 mt-0.5">Legend! 100 days!</p>}
                {(user?.streakDays || 0) >= 30 && (user?.streakDays || 0) < 100 && <p className="text-[10px] font-semibold text-orange-400 mt-0.5">1 month strong!</p>}
                {(user?.streakDays || 0) >= 14 && (user?.streakDays || 0) < 30 && <p className="text-[10px] font-semibold text-orange-400/80 mt-0.5">2 weeks!</p>}
                {(user?.streakDays || 0) >= 7 && (user?.streakDays || 0) < 14 && <p className="text-[10px] font-semibold text-orange-400/70 mt-0.5">1 week strong!</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-500" />
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
                <p className="text-xs text-muted-foreground">Accuracy</p>
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
            indicatorClassName="bg-blue-500"
          />
        </CardContent>
      </Card>

      {/* Goal card */}
      <GoalCard course={selectedCourse} track={session.user.track ?? "ap"} todayQuestions={todayQuestionCount} />

      {/* Quick Actions + Daily Review */}
      <div className="grid lg:grid-cols-2 gap-6">
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

        <DailyReviewCard course={selectedCourse} />
      </div>

      {/* Focus Areas */}
      <Card className="card-glow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-400" />
              Focus Areas
            </CardTitle>
            <Link href="/analytics" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Full analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
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
            <div className="text-center py-4 space-y-1">
              <p className="text-sm font-semibold text-emerald-400">All units at 70%+ mastery!</p>
              <p className="text-xs text-muted-foreground">Keep practicing to push toward 90%+ and exam-day confidence.</p>
            </div>
          )}
          <Link href="/practice">
            <Button variant="outline" size="sm" className="w-full gap-2 mt-2">
              Practice Weak Areas <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
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
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Ready to start your first session?</p>
                <p className="text-xs text-muted-foreground mt-1">Answer 10 questions and see how Sage tracks your progress.</p>
              </div>
              <Link href="/practice">
                <Button size="sm" className="btn-lift gap-2 mt-1">
                  <Zap className="h-4 w-4" /> Start Practicing
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements link */}
      {earnedAchievements.length > 0 && (
        <Link href="/analytics">
          <div className="flex items-center gap-3 p-4 rounded-xl border border-border/40 hover:bg-accent transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0 text-lg">
              🏆
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {earnedAchievements.length} achievement{earnedAchievements.length !== 1 ? "s" : ""} earned
              </p>
              <p className="text-xs text-muted-foreground">View all on Analytics page</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Premium upsell — bottom */}
      {user?.subscriptionTier === "FREE" && (
        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Unlock Premium Modules</p>
              <p className="text-xs text-muted-foreground">
                Unlimited AI tutoring · Personalized study plans · Advanced analytics · $9.99/mo per module
              </p>
            </div>
          </div>
          <Link href="/pricing" className="flex-shrink-0">
            <Button size="sm" className="gap-1.5 w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Crown className="h-3.5 w-3.5" />
              See Pricing
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

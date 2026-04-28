"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { COURSE_UNITS, AP_COURSES } from "@/lib/utils";
import { ApUnit, ApCourse } from "@prisma/client";
import { Rocket, Loader2, CheckCircle, AlertTriangle, Clock, Pause, Play } from "lucide-react";

interface UnitProgress {
  unit: ApUnit;
  name: string;
  status: "pending" | "running" | "done" | "skipped" | "failed";
  generated: number;
  failed: number;
  difficulty?: { EASY: number; MEDIUM: number; HARD: number };
}

const COURSES = Object.keys(AP_COURSES) as ApCourse[];

export function AdminMegaPopulate() {
  const { toast } = useToast();

  const [course, setCourse] = useState<ApCourse>("AP_WORLD_HISTORY");
  const [targetPerUnit, setTargetPerUnit] = useState<string>("30");
  const [isRunning, setIsRunning] = useState(false);
  const [pauseRequested, setPauseRequested] = useState(false);
  const [unitProgress, setUnitProgress] = useState<UnitProgress[]>([]);
  const [totalAdded, setTotalAdded] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const unitKeys = Object.keys(COURSE_UNITS[course]) as ApUnit[];
  const unitNames = COURSE_UNITS[course];
  const target = parseInt(targetPerUnit);

  // Estimated time: ~1.5s/question × targetPerUnit + 0.6s delay per q
  const estimatedSecs = unitKeys.length * target * 2.1;
  const estimatedMins = Math.ceil(estimatedSecs / 60);

  async function handleStart() {
    setIsRunning(true);
    setPauseRequested(false);
    setTotalAdded(0);
    setDoneCount(0);

    const initial: UnitProgress[] = unitKeys.map((u) => ({
      unit: u,
      name: unitNames[u] ?? u,
      status: "pending",
      generated: 0,
      failed: 0,
    }));
    setUnitProgress(initial);

    let added = 0;
    let done = 0;

    for (let i = 0; i < unitKeys.length; i++) {
      const unit = unitKeys[i];

      // Check pause between units
      if (pauseRequested) {
        toast({ title: "Mega-Populate paused", description: `Stopped after ${done} units.` });
        break;
      }

      // Mark as running
      setUnitProgress((prev) =>
        prev.map((u) => (u.unit === unit ? { ...u, status: "running" } : u))
      );

      try {
        const res = await fetch("/api/admin/mega-populate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course, unit, targetPerUnit: target }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error ?? "Request failed");

        if (data.skipped) {
          setUnitProgress((prev) =>
            prev.map((u) => (u.unit === unit ? { ...u, status: "skipped", generated: 0 } : u))
          );
        } else {
          added += data.generated ?? 0;
          setTotalAdded(added);
          setUnitProgress((prev) =>
            prev.map((u) =>
              u.unit === unit
                ? { ...u, status: "done", generated: data.generated, failed: data.failed, difficulty: data.difficulty }
                : u
            )
          );
        }
      } catch (err) {
        setUnitProgress((prev) =>
          prev.map((u) => (u.unit === unit ? { ...u, status: "failed" } : u))
        );
      }

      done++;
      setDoneCount(done);
    }

    setIsRunning(false);
    setPauseRequested(false);
    if (done === unitKeys.length) {
      toast({
        title: `Mega-Populate complete!`,
        description: `+${added} questions added across ${done} units.`,
      });
    }
  }

  const progressPct = unitKeys.length > 0 ? (doneCount / unitKeys.length) * 100 : 0;

  return (
    <Card className="card-glow border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Rocket className="h-5 w-5 text-purple-700 dark:text-purple-400" />
          Mega-Populate Question Bank
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generates questions for every unit in a course sequentially, one unit per request.
          Uses enhanced AP-quality prompts with difficulty rubrics and distractor taxonomy.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Course</label>
            <Select value={course} onValueChange={(v) => { setCourse(v as ApCourse); setUnitProgress([]); }} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COURSES.map((c) => (
                  <SelectItem key={c} value={c}>{AP_COURSES[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Target per unit</label>
            <Select value={targetPerUnit} onValueChange={setTargetPerUnit} disabled={isRunning}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
                <SelectItem value="30">30 questions</SelectItem>
                <SelectItem value="50">50 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isRunning && unitProgress.length === 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Estimated time: ~{estimatedMins} minutes for {unitKeys.length} units × {target} questions
          </p>
        )}

        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Rocket className="h-4 w-4" />
              Start Mega-Populate — {AP_COURSES[course]}
            </Button>
          ) : (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setPauseRequested(true)} disabled={pauseRequested}>
                {pauseRequested ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Pausing after current unit...</>
                ) : (
                  <><Pause className="h-4 w-4" /> Pause after current unit</>
                )}
              </Button>
            </>
          )}
        </div>

        {(isRunning || unitProgress.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isRunning ? (
                  <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running...</span>
                ) : (
                  "Complete"
                )}
              </span>
              <span className="text-purple-700 dark:text-purple-400 font-medium">
                {doneCount}/{unitKeys.length} units · +{totalAdded} questions
              </span>
            </div>
            <Progress value={progressPct} className="h-2" indicatorClassName="bg-purple-500" />

            <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
              {unitProgress.map((u) => (
                <div key={u.unit} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
                  u.status === "running" ? "bg-purple-500/10 border border-purple-500/20" :
                  u.status === "done" ? "bg-emerald-500/10 border border-emerald-500/10" :
                  u.status === "failed" ? "bg-red-500/10 border border-red-500/10" :
                  u.status === "skipped" ? "bg-blue-500/10 border border-blue-500/10" :
                  "bg-secondary/30"
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {u.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-700 dark:text-purple-400" />}
                    {u.status === "done" && <CheckCircle className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />}
                    {u.status === "failed" && <AlertTriangle className="h-3.5 w-3.5 text-red-700 dark:text-red-400" />}
                    {u.status === "skipped" && <span className="text-blue-700 dark:text-blue-400 font-bold">–</span>}
                    {u.status === "pending" && <span className="h-3.5 w-3.5 block rounded-full border border-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="truncate text-muted-foreground">{u.name}</span>
                    {u.status === "done" && u.difficulty && (
                      <div className="flex gap-1 mt-1">
                        <span className="px-1 rounded bg-blue-500/20 text-blue-300">E:{u.difficulty.EASY}</span>
                        <span className="px-1 rounded bg-yellow-500/20 text-yellow-300">M:{u.difficulty.MEDIUM}</span>
                        <span className="px-1 rounded bg-red-500/20 text-red-300">H:{u.difficulty.HARD}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {u.status === "running" && <span className="text-purple-300">Generating...</span>}
                    {u.status === "done" && <span className="text-emerald-700 dark:text-emerald-400">+{u.generated}</span>}
                    {u.status === "skipped" && <span className="text-blue-700 dark:text-blue-400">already full</span>}
                    {u.status === "failed" && <span className="text-red-700 dark:text-red-400">failed</span>}
                    {u.status === "pending" && <span className="text-muted-foreground/50">pending</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

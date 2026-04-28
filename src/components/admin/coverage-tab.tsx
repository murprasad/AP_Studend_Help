"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Wrench } from "lucide-react";
import { AP_COURSES, COURSE_UNITS } from "@/lib/utils";
import { VALID_AP_COURSES } from "@/lib/courses";
import { ApUnit, ApCourse } from "@prisma/client";

interface UnitCount {
  course: string;
  unit: string;
  _count: { id: number };
}

interface Props {
  questionsByUnit: UnitCount[];
}

export function AdminCoverageTab({ questionsByUnit }: Props) {
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixResults, setFixResults] = useState<Record<string, number>>({});
  const [fixingAll, setFixingAll] = useState(false);

  // Compute critical units (< 10)
  const criticalUnits: Array<{ course: ApCourse; unit: ApUnit }> = [];
  for (const course of VALID_AP_COURSES) {
    const courseUnitMap = COURSE_UNITS[course as ApCourse];
    for (const unit of Object.keys(courseUnitMap) as ApUnit[]) {
      const count = questionsByUnit.find((q) => q.unit === unit && q.course === course)?._count.id ?? 0;
      if (count < 10) criticalUnits.push({ course: course as ApCourse, unit });
    }
  }

  async function fixUnit(course: ApCourse, unit: ApUnit) {
    const key = `${course}::${unit}`;
    setFixing(key);
    try {
      const res = await fetch("/api/admin/mega-populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, unit, targetPerUnit: 20 }),
      });
      const data = await res.json() as { generated?: number };
      setFixResults((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + (data.generated ?? 0) }));
    } catch {
      // silently ignore — admin can retry
    } finally {
      setFixing(null);
    }
  }

  async function fixAllCritical() {
    setFixingAll(true);
    try {
      await fetch("/api/admin/populate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minPerUnit: 20 }),
      });
    } finally {
      setFixingAll(false);
    }
  }

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="text-lg">Question Coverage by Course</CardTitle>
        <p className="text-xs text-muted-foreground">
          Red &lt;10 (critical) · Yellow 10–19 (low) · Green ≥20 (good)
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Critical banner */}
        {criticalUnits.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{criticalUnits.length}</strong> unit{criticalUnits.length !== 1 ? "s are" : " is"} Critical (&lt;10 questions).
                Click <strong>Generate</strong> on a row or fix all at once.
              </span>
            </div>
            <button
              onClick={fixAllCritical}
              disabled={fixingAll}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fixingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
              Fix All Critical Now
            </button>
          </div>
        )}

        {VALID_AP_COURSES.map((course) => {
          const courseUnitMap = COURSE_UNITS[course as ApCourse];
          const courseTotal = questionsByUnit
            .filter((q) => q.course === course)
            .reduce((s, q) => s + q._count.id, 0);
          return (
            <div key={course}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{AP_COURSES[course as ApCourse]}</p>
                <Badge variant="outline" className="text-xs">{courseTotal} total</Badge>
              </div>
              <div className="space-y-1">
                {(Object.keys(courseUnitMap) as ApUnit[]).map((unit) => {
                  const key = `${course}::${unit}`;
                  const base = questionsByUnit.find((q) => q.unit === unit && q.course === course)?._count.id ?? 0;
                  const added = fixResults[key] ?? 0;
                  const count = base + added;
                  const isCritical = count < 10;
                  const isFixing = fixing === key;
                  return (
                    <div key={unit} className="flex items-center justify-between py-1 gap-2">
                      <span className="text-xs text-muted-foreground flex-1">{courseUnitMap[unit]}</span>
                      <div className="flex items-center gap-2">
                        {isCritical && (
                          <button
                            onClick={() => fixUnit(course as ApCourse, unit)}
                            disabled={isFixing || fixingAll}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-600/80 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFixing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
                            Generate
                          </button>
                        )}
                        <Badge
                          variant={count < 10 ? "destructive" : "secondary"}
                          className={count >= 20 ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-500/30" :
                                     count >= 10 ? "bg-yellow-500/20 text-yellow-800 dark:text-yellow-400 border-yellow-500/30" : ""}
                        >
                          {count}
                          {added > 0 && <span className="ml-1 text-emerald-300">(+{added})</span>}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

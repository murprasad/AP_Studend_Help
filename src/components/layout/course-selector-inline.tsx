"use client";

import { useRouter } from "next/navigation";
import { useCourse } from "@/hooks/use-course";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApCourse } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GraduationCap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const COURSE_OPTIONS = (
  Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string }][]
).map(([value, cfg]) => ({ value, label: cfg.name }));

export function CourseSelectorInline() {
  const router = useRouter();
  const [course, setCourse] = useCourse();

  function handleChange(newCourse: ApCourse) {
    setCourse(newCourse);
    router.refresh();
  }

  const currentLabel = COURSE_REGISTRY[course]?.name ?? course;

  return (
    <Card className="card-glow border-indigo-500/20 bg-indigo-500/5">
      <CardContent className="p-4 flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-indigo-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-sm font-medium hover:bg-transparent justify-start gap-1.5 max-w-full"
              >
                <span className="truncate">{currentLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {COURSE_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleChange(opt.value)}
                  className={cn(
                    "cursor-pointer text-sm",
                    course === opt.value && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-muted-foreground">Click to switch course</p>
        </div>
      </CardContent>
    </Card>
  );
}

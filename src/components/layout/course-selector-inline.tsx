"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCourse } from "@/hooks/use-course";
import { COURSE_REGISTRY, getCourseTrack } from "@/lib/courses";
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

const ALL_COURSE_OPTIONS = (
  Object.entries(COURSE_REGISTRY) as [ApCourse, { name: string }][]
).map(([value, cfg]) => ({ value, label: cfg.name }));

export function CourseSelectorInline() {
  const router = useRouter();
  const { data: session } = useSession();
  const [course, setCourse] = useCourse();

  const userTrack = (session?.user?.track as "ap" | "clep") === "clep" ? "clep" : "ap";
  const courseOptions = ALL_COURSE_OPTIONS.filter(
    (opt) => getCourseTrack(opt.value) === userTrack
  );

  function handleChange(newCourse: ApCourse) {
    setCourse(newCourse);
    router.refresh();
  }

  const currentLabel = COURSE_REGISTRY[course]?.name ?? course;

  return (
    <Card className={cn(
      "card-glow",
      userTrack === "clep" ? "border-emerald-500/20 bg-emerald-500/5" : "border-blue-500/20 bg-blue-500/5"
    )}>
      <CardContent className="p-4 flex items-center gap-3">
        <GraduationCap className={cn("h-5 w-5 flex-shrink-0", userTrack === "clep" ? "text-emerald-700 dark:text-emerald-400" : "text-blue-500")} />
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
              {courseOptions.map((opt) => (
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

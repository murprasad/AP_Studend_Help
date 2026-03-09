"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GLOBAL_RESOURCES,
  EXAM_SKILLS,
} from "@/data/resources";
import { COURSE_REGISTRY } from "@/lib/courses";
import { ApUnit } from "@prisma/client";

// Build unit resource list from the registry (currently World History only on this page).
// To make this course-aware, wire up useCourse() and swap AP_WORLD_HISTORY below.
const UNIT_ITEMS = (
  Object.entries(COURSE_REGISTRY.AP_WORLD_HISTORY.units) as [ApUnit, NonNullable<(typeof COURSE_REGISTRY.AP_WORLD_HISTORY.units)[ApUnit]>][]
).map(([unit, meta]) => ({ unit, ...meta }));
import {
  ExternalLink,
  Play,
  BookOpen,
  Globe,
  Youtube,
  GraduationCap,
  FileText,
  ClipboardCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Video,
  Library,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Zap,
  Globe,
  FileText,
  Youtube,
  Play,
};

const TYPE_LABELS: Record<string, string> = {
  video_channel: "Video",
  practice: "Practice",
  reading: "Reading",
  primary_source: "Primary Sources",
  curriculum: "Official",
};

const TYPE_COLORS: Record<string, string> = {
  video_channel: "bg-red-500/20 text-red-400 border-red-500/30",
  practice: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  reading: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  primary_source: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  curriculum: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function ResourcesPage() {
  const [selectedUnit, setSelectedUnit] = useState<ApUnit | "ALL">("ALL");
  const [expandedUnit, setExpandedUnit] = useState<ApUnit | null>(null);
  const [activeTab, setActiveTab] = useState<"resources" | "videos" | "skills">("resources");

  const unitResource = expandedUnit
    ? UNIT_ITEMS.find((r) => r.unit === expandedUnit)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Study Resources</h1>
        <p className="text-muted-foreground mt-1">
          Curated AP World History resources from the best educational platforms
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        {[
          { id: "resources", label: "All Resources", icon: Library },
          { id: "videos", label: "Video Library", icon: Video },
          { id: "skills", label: "Exam Skills", icon: GraduationCap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ALL RESOURCES TAB ── */}
      {activeTab === "resources" && (
        <div className="space-y-6">
          {/* Resource cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GLOBAL_RESOURCES.map((resource) => {
              const Icon = ICON_MAP[resource.icon] || Globe;
              return (
                <Card key={resource.id} className="card-glow hover:border-indigo-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Icon className={`h-5 w-5 ${resource.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight">{resource.name}</p>
                        <Badge className={`text-xs mt-1 ${TYPE_COLORS[resource.type]}`}>
                          {TYPE_LABELS[resource.type]}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 flex-shrink-0">
                        Free
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {resource.description}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Resource
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Unit-by-unit resource breakdown */}
          <div>
            <h2 className="text-xl font-bold mb-4">Resources by Unit</h2>
            <div className="space-y-3">
              {UNIT_ITEMS.map((ur) => (
                <Card key={ur.unit} className="card-glow">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedUnit(expandedUnit === ur.unit ? null : ur.unit)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {ur.unit.replace("UNIT_", "U").split("_")[0].replace("U", "")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{ur.name}</p>
                          <p className="text-xs text-muted-foreground">{ur.timePeriod}</p>
                        </div>
                      </div>
                      {expandedUnit === ur.unit ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {expandedUnit === ur.unit && (
                      <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4">
                        {/* Key themes */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">KEY THEMES</p>
                          <div className="flex flex-wrap gap-2">
                            {(ur.keyThemes || []).map((theme) => (
                              <Badge key={theme} variant="secondary" className="text-xs">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Video embed - Heimler's History */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Youtube className="h-3.5 w-3.5 text-red-400" />
                            HEIMLER&apos;S HISTORY REVIEW
                          </p>
                          <div className="rounded-lg overflow-hidden aspect-video bg-black">
                            <iframe
                              src={`https://www.youtube.com/embed/${ur.heimlerVideoId}?rel=0&modestbranding=1`}
                              title={`Heimler's History - ${ur.name}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          </div>
                        </div>

                        {/* Resource links */}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">STUDY LINKS</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(
                              [
                                ur.oerUrl ? { label: "OER Project", url: ur.oerUrl, icon: BookOpen, color: "text-emerald-400" } : null,
                                ur.fiveableUrl ? { label: "Fiveable", url: ur.fiveableUrl, icon: Zap, color: "text-yellow-400" } : null,
                                ur.zinnUrl ? { label: "Zinn Project", url: ur.zinnUrl, icon: FileText, color: "text-orange-400" } : null,
                                ur.worldHistoryUrl ? { label: "World History", url: ur.worldHistoryUrl, icon: Globe, color: "text-cyan-400" } : null,
                                { label: "PracticeQuiz", url: "https://www.practicequiz.com/ap-world-history-practice-test", icon: ClipboardCheck, color: "text-purple-400" },
                                { label: "Khan Academy", url: "https://www.khanacademy.org/humanities/ap-world-history", icon: Play, color: "text-green-400" },
                              ] as { label: string; url: string; icon: React.ElementType; color: string }[]
                            ).filter((x): x is NonNullable<typeof x> => x !== null).map((link) => (
                              <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:bg-accent text-xs transition-colors"
                              >
                                <link.icon className={`h-3.5 w-3.5 ${link.color}`} />
                                {link.label}
                                <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO LIBRARY TAB ── */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <a href="https://www.youtube.com/@heimlershistory" target="_blank" rel="noopener noreferrer">
              <Card className="card-glow border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <Youtube className="h-10 w-10 text-red-400" />
                  <div>
                    <p className="font-bold">Heimler&apos;s History</p>
                    <p className="text-xs text-muted-foreground">Best AP World History YouTube channel — unit reviews, exam skills, DBQ practice</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </a>
            <a href="https://www.youtube.com/c/khanacademy" target="_blank" rel="noopener noreferrer">
              <Card className="card-glow border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <Play className="h-10 w-10 text-green-400" />
                  <div>
                    <p className="font-bold">Khan Academy</p>
                    <p className="text-xs text-muted-foreground">Free AP World History video lessons and articles for every unit</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                </CardContent>
              </Card>
            </a>
          </div>

          <h2 className="text-xl font-bold">Unit Video Reviews</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UNIT_ITEMS.filter((ur) => ur.heimlerVideoId).map((ur) => (
              <div key={ur.unit} className="space-y-2">
                <p className="text-sm font-medium">{ur.name}</p>
                <p className="text-xs text-muted-foreground">{ur.timePeriod}</p>
                <div className="rounded-lg overflow-hidden aspect-video bg-black border border-border/40">
                  <iframe
                    src={`https://www.youtube.com/embed/${ur.heimlerVideoId}?rel=0&modestbranding=1`}
                    title={`Heimler's History - ${ur.name}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${ur.heimlerVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                      <Youtube className="h-3 w-3 text-red-400" /> Heimler
                    </Button>
                  </a>
                  <a
                    href={`https://www.khanacademy.org/humanities/ap-world-history`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                      <Play className="h-3 w-3 text-green-400" /> Khan
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXAM SKILLS TAB ── */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Master AP exam writing skills with these targeted resources from Heimler&apos;s History, Fiveable, and College Board.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {EXAM_SKILLS.map((skill) => (
              <Card key={skill.skill} className="card-glow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-400" />
                    {skill.skill}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{skill.description}</p>
                  <div className="rounded-lg overflow-hidden aspect-video bg-black border border-border/40">
                    <iframe
                      src={`https://www.youtube.com/embed/${skill.heimlerVideoId}?rel=0&modestbranding=1`}
                      title={skill.skill}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://www.youtube.com/watch?v=${skill.heimlerVideoId}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                        <Youtube className="h-3 w-3 text-red-400" /> Watch on YouTube
                      </Button>
                    </a>
                    <a href={skill.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> Study Guide
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* College Board official links */}
          <Card className="card-glow border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-400" />
                Official College Board Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: "AP World History Course Overview", url: "https://apcentral.collegeboard.org/courses/ap-world-history" },
                  { label: "Course & Exam Description (CED)", url: "https://apcentral.collegeboard.org/media/pdf/ap-world-history-modern-course-and-exam-description.pdf" },
                  { label: "Sample Exam Questions", url: "https://apcentral.collegeboard.org/courses/ap-world-history/exam/past-exam-questions" },
                  { label: "Scoring Guidelines", url: "https://apcentral.collegeboard.org/courses/ap-world-history/exam/past-exam-questions" },
                ].map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border border-border/40 hover:bg-accent text-sm transition-colors">
                    <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    {link.label}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

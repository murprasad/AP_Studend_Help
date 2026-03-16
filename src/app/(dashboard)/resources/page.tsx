"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GLOBAL_RESOURCES,
  EXAM_SKILLS,
  COURSE_TEXTBOOKS,
} from "@/data/resources";
import { COURSE_REGISTRY } from "@/lib/courses";
import { useCourse } from "@/hooks/use-course";
import { AP_COURSES } from "@/lib/utils";
import { ApCourse, ApUnit } from "@prisma/client";
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
  BookMarked,
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

function getCourseUnits(course: ApCourse) {
  const registry = COURSE_REGISTRY[course];
  if (!registry) return [];
  return (Object.entries(registry.units) as [ApUnit, NonNullable<(typeof registry.units)[ApUnit]>][])
    .map(([unit, meta]) => ({ unit, ...meta }));
}

export default function ResourcesPage() {
  const [course] = useCourse();
  const [selectedUnit, setSelectedUnit] = useState<ApUnit | "ALL">("ALL");
  const [expandedUnit, setExpandedUnit] = useState<ApUnit | null>(null);
  const [activeTab, setActiveTab] = useState<"resources" | "videos" | "skills" | "textbooks">("resources");

  const UNIT_ITEMS = getCourseUnits(course);

  const unitResource = expandedUnit
    ? UNIT_ITEMS.find((r) => r.unit === expandedUnit)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Study Resources</h1>
        <p className="text-muted-foreground mt-1">
          Curated {AP_COURSES[course]} resources from the best educational platforms
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/40">
        {[
          { id: "resources", label: "All Resources", icon: Library },
          { id: "textbooks", label: "Textbooks", icon: BookMarked },
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

                        {/* Video embed - Heimler's History (World History only) */}
                        {ur.heimlerVideoId && (
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
                        )}

                        {/* PhET simulation card (Physics only) */}
                        {ur.phetUrl && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Zap className="h-3.5 w-3.5 text-orange-400" />
                              PHET INTERACTIVE SIMULATION
                            </p>
                            <a
                              href={ur.phetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-4 w-4 text-orange-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">Launch PhET Simulation</p>
                                <p className="text-xs text-muted-foreground">
                                  Interactive — explore {ur.name.replace(/^Unit \d+: /, "")} visually
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </div>
                        )}

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
                                ur.mitocwUrl ? { label: "MIT OCW", url: ur.mitocwUrl, icon: GraduationCap, color: "text-blue-400" } : null,
                                ur.khanUrl ? { label: "Khan Academy", url: ur.khanUrl, icon: Play, color: "text-green-400" } : null,
                                ur.ck12Url ? { label: "CK-12", url: ur.ck12Url, icon: BookOpen, color: "text-cyan-400" } : null,
                                ur.openStaxUrl ? { label: "OpenStax", url: ur.openStaxUrl, icon: FileText, color: "text-indigo-400" } : null,
                                // Generic fallback links when no unit-level links are present
                                !ur.khanUrl ? { label: "Khan Academy", url: "https://www.khanacademy.org", icon: Play, color: "text-green-400" } : null,
                                !ur.oerUrl && !ur.ck12Url ? { label: "PracticeQuiz", url: "https://www.practicequiz.com/ap", icon: ClipboardCheck, color: "text-purple-400" } : null,
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

      {/* ── TEXTBOOKS TAB ── */}
      {activeTab === "textbooks" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Recommended textbooks and study guides for {AP_COURSES[course]}. Free resources are highlighted.
          </p>

          {/* Free resources first */}
          {COURSE_TEXTBOOKS.filter((b) => b.course === course && b.free).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                <BookOpen className="h-5 w-5" />
                Free Resources
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {COURSE_TEXTBOOKS.filter((b) => b.course === course && b.free).map((book) => (
                  <Card key={book.name} className="card-glow border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{book.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{book.authors}</p>
                        </div>
                        <Badge className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex-shrink-0">
                          Free
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{book.description}</p>
                      {book.url ? (
                        <a href={book.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="w-full gap-2 text-xs border-emerald-500/30 hover:border-emerald-500/60">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Free Resource
                          </Button>
                        </a>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full gap-2 text-xs" disabled>
                          Search at your library
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Textbooks */}
          {COURSE_TEXTBOOKS.filter((b) => b.course === course && !b.free && b.type === "textbook").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-indigo-400" />
                Recommended Textbooks
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {COURSE_TEXTBOOKS.filter((b) => b.course === course && !b.free && b.type === "textbook").map((book) => (
                  <Card key={book.name} className="card-glow hover:border-indigo-500/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                          <BookMarked className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{book.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{book.authors} · {book.publisher}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{book.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Study Guides */}
          {COURSE_TEXTBOOKS.filter((b) => b.course === course && b.type === "study_guide").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-400" />
                Exam Prep & Study Guides
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {COURSE_TEXTBOOKS.filter((b) => b.course === course && b.type === "study_guide").map((book) => (
                  <Card key={book.name} className="card-glow hover:border-purple-500/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                          <ClipboardCheck className="h-5 w-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-tight">{book.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{book.authors} · {book.publisher}</p>
                        </div>
                        <Badge className="text-xs text-purple-400 border-purple-500/30 bg-purple-500/10 flex-shrink-0">
                          Prep
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{book.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VIDEO LIBRARY TAB ── */}
      {activeTab === "videos" && (
        <div className="space-y-6">
          {course === "AP_PHYSICS_1" ? (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <a href="https://www.youtube.com/@FlippingPhysics" target="_blank" rel="noopener noreferrer">
                  <Card className="card-glow border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Youtube className="h-10 w-10 text-red-400" />
                      <div>
                        <p className="font-bold">Flipping Physics</p>
                        <p className="text-xs text-muted-foreground">Conceptual and worked-example videos — top AP Physics 1 channel</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                </a>
                <a href="https://www.khanacademy.org/science/ap-physics-1" target="_blank" rel="noopener noreferrer">
                  <Card className="card-glow border-green-500/20 hover:border-green-500/40 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Play className="h-10 w-10 text-green-400" />
                      <div>
                        <p className="font-bold">Khan Academy AP Physics 1</p>
                        <p className="text-xs text-muted-foreground">Free videos and articles for every unit</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                    </CardContent>
                  </Card>
                </a>
              </div>
              <h2 className="text-xl font-bold">Unit Video Resources</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {UNIT_ITEMS.map((ur) => (
                  <Card key={ur.unit} className="card-glow">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm font-medium">{ur.name}</p>
                      <div className="flex flex-col gap-2">
                        {ur.mitocwUrl && (
                          <a href={ur.mitocwUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:bg-accent text-xs transition-colors">
                            <GraduationCap className="h-3.5 w-3.5 text-blue-400" />
                            MIT OCW Lecture
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                          </a>
                        )}
                        {ur.khanUrl && (
                          <a href={ur.khanUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-border/40 hover:bg-accent text-xs transition-colors">
                            <Play className="h-3.5 w-3.5 text-green-400" />
                            Khan Academy Videos
                            <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <a href="https://www.youtube.com/@heimlershistory" target="_blank" rel="noopener noreferrer">
                  <Card className="card-glow border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Youtube className="h-10 w-10 text-red-400" />
                      <div>
                        <p className="font-bold">Heimler&apos;s History</p>
                        <p className="text-xs text-muted-foreground">Best AP YouTube channel — unit reviews, exam skills, and essay practice</p>
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
                        <p className="text-xs text-muted-foreground">Free AP video lessons and articles for every unit</p>
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
            </>
          )}
        </div>
      )}

      {/* ── EXAM SKILLS TAB ── */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Master AP exam writing skills with these targeted resources from Heimler&apos;s History, Fiveable, and College Board.
          </p>

          {course === "AP_PHYSICS_1" && (
            <Card className="card-glow border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-400" />
                  Physics Essentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "AP Physics 1 Formula Sheet", url: "https://apcentral.collegeboard.org/media/pdf/ap-physics-1-formulas-tables.pdf" },
                    { label: "Past FRQ Exams (College Board)", url: "https://apcentral.collegeboard.org/courses/ap-physics-1/exam/past-exam-questions" },
                    { label: "PhET Physics Simulations", url: "https://phet.colorado.edu/en/simulations/filter?subjects=physics" },
                    { label: "OpenStax University Physics", url: "https://openstax.org/subjects/science" },
                  ].map((link) => (
                    <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border border-border/40 hover:bg-accent text-sm transition-colors">
                      <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      {link.label}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                {(COURSE_REGISTRY[course]?.collegeBoardLinks ?? [
                  { label: `${AP_COURSES[course]} Course Overview`, url: "https://apcentral.collegeboard.org" },
                ]).map((link: { label: string; url: string }) => (
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

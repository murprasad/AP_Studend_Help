"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AP_UNITS } from "@/lib/utils";
import { ApUnit } from "@prisma/client";
import { Brain, Loader2, CheckCircle, Zap } from "lucide-react";

interface GeneratedResult {
  id: string;
  topic: string;
  unit: string;
  difficulty: string;
}

export function AdminBulkGenerate() {
  const { toast } = useToast();
  const [unit, setUnit] = useState<string>("ALL");
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [count, setCount] = useState<string>("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);

  async function handleGenerate() {
    setIsGenerating(true);
    setResults([]);
    try {
      const response = await fetch("/api/ai/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: parseInt(count),
          unit: unit === "ALL" ? undefined : unit,
          difficulty: difficulty === "ALL" ? undefined : difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setResults(data.questions);
      toast({
        title: `Generated ${data.generated} questions!`,
        description: "Questions added to the question bank.",
        variant: "default",
      });
    } catch {
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Card className="card-glow border-indigo-500/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-400" />
          AI Question Bank Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate new AP-style questions using Claude AI, aligned with College Board curriculum and informed by OER Project, Fiveable, and other resources.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Unit</label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                {(Object.keys(AP_UNITS) as ApUnit[]).map((u) => (
                  <SelectItem key={u} value={u}>{AP_UNITS[u]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Mixed</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Count</label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 questions</SelectItem>
                <SelectItem value="5">5 questions</SelectItem>
                <SelectItem value="10">10 questions</SelectItem>
                <SelectItem value="20">20 questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating {count} questions...</>
          ) : (
            <><Zap className="h-4 w-4" /> Generate Questions</>
          )}
        </Button>

        {isGenerating && (
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-sm text-indigo-300 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Claude AI is generating questions aligned with College Board AP curriculum...
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {results.length} questions added to question bank
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 text-xs">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="flex-1">{r.topic}</span>
                  <Badge variant="outline" className="text-xs">{r.difficulty}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

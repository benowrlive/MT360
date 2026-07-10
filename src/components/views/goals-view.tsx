"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useActiveStudent } from "@/lib/use-active-student";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

import { Target, Plus, Wand2 } from "lucide-react";

import type { Goal } from "./goals/types";
import { GoalCard } from "./goals/goal-card";
import { GenerateGoalsDialog } from "./goals/generate-goals-dialog";
import { ManualGoalDialog } from "./goals/manual-goal-dialog";
import { ProgressUpdateDialog } from "./goals/progress-update-dialog";
import { GoalSuggestionsSheet } from "./goals/goal-suggestions-sheet";

export function GoalsView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();
  const queryKey = ["goals", studentId];

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [suggestionsGoal, setSuggestionsGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/goals?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load goals");
      const data = await res.json();
      return data.goals as Goal[];
    },
    enabled: !!studentId,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const g of goals) {
      const arr = map.get(g.domain) ?? [];
      arr.push(g);
      map.set(g.domain, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [goals]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Goal deleted");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Target className="h-6 w-6 text-primary" />
            Goals
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">{student.name}</span>{" "}
                · SMART IEP goals grouped by domain
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Generate AI Goals
              </Button>
            </DialogTrigger>
            <GenerateGoalsDialog
              studentId={studentId ?? ""}
              onClose={() => setAiDialogOpen(false)}
              onSaved={() => queryClient.invalidateQueries({ queryKey })}
            />
          </Dialog>
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <ManualGoalDialog
              studentId={studentId ?? ""}
              onClose={() => setManualOpen(false)}
              onSaved={() => queryClient.invalidateQueries({ queryKey })}
            />
          </Dialog>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <GlassCard key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </GlassCard>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState onGenerate={() => setAiDialogOpen(true)} onManual={() => setManualOpen(true)} />
      ) : (
        <Accordion type="multiple" defaultValue={grouped.length > 0 ? [grouped[0][0]] : []}>
          {grouped.map(([domain, list]) => (
            <AccordionItem key={domain} value={domain} className="rounded-lg border bg-card px-4 mb-3">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center gap-3 pr-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {list.length} {list.length === 1 ? "goal" : "goals"}
                  </Badge>
                  <span className="font-semibold">{domain}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  {list.map((g) => (
                    <GoalCard
                      key={g.id}
                      goal={g}
                      onEdit={() => setEditGoal(g)}
                      onProgress={() => setProgressGoal(g)}
                      onSuggestions={() => setSuggestionsGoal(g)}
                      onDelete={() => deleteMutation.mutate(g.id)}
                      deleting={deleteMutation.isPending && deleteMutation.variables === g.id}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        {editGoal && (
          <ManualGoalDialog
            studentId={studentId ?? ""}
            goal={editGoal}
            onClose={() => setEditGoal(null)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey });
              setEditGoal(null);
            }}
          />
        )}
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={!!progressGoal} onOpenChange={(o) => !o && setProgressGoal(null)}>
        {progressGoal && (
          <ProgressUpdateDialog
            goal={progressGoal}
            onClose={() => setProgressGoal(null)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey });
              setProgressGoal(null);
            }}
          />
        )}
      </Dialog>

      {/* Suggestions Sheet */}
      <GoalSuggestionsSheet
        goal={suggestionsGoal}
        open={!!suggestionsGoal}
        onOpenChange={(o) => !o && setSuggestionsGoal(null)}
      />
    </div>
  );
}

function EmptyState({
  onGenerate,
  onManual,
}: {
  onGenerate: () => void;
  onManual: () => void;
}) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No goals yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Generate SMART IEP goals with AI across one or more domains, or add a goal manually.
            Every AI goal stays fully editable.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onGenerate} className="gap-2">
            <Wand2 className="h-4 w-4" />
            Generate AI Goals
          </Button>
          <Button onClick={onManual} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Goal Manually
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  );
}

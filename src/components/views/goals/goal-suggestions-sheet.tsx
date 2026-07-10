"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import type { GoalSuggestion } from "@/lib/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Loader2,
  Lightbulb,
  Target,
  TrendingUp,
  CircleDot,
  ListChecks,
  Sparkles,
} from "lucide-react";

import type { Goal } from "./types";

const SUGGESTION_SECTIONS: {
  key: keyof GoalSuggestion;
  label: string;
  ordered?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "shortTermGoals", label: "Short-Term Goals", icon: Target },
  { key: "longTermGoals", label: "Long-Term Goals", icon: TrendingUp },
  { key: "replacementBehaviours", label: "Replacement Behaviours", icon: CircleDot },
  { key: "interventions", label: "Interventions", icon: ListChecks },
  { key: "teachingTechniques", label: "Teaching Techniques", icon: Lightbulb },
  { key: "reinforcementSchedules", label: "Reinforcement Schedules", icon: Sparkles },
  { key: "promptHierarchy", label: "Prompt Hierarchy", ordered: true, icon: ListChecks },
  { key: "taskAnalysis", label: "Task Analysis", ordered: true, icon: ListChecks },
  { key: "visualSupports", label: "Visual Supports", icon: ListChecks },
  { key: "socialStories", label: "Social Stories", icon: ListChecks },
  { key: "behaviourStrategies", label: "Behaviour Strategies", icon: ListChecks },
  { key: "sensoryStrategies", label: "Sensory Strategies", icon: ListChecks },
  { key: "homeActivities", label: "Home Activities", icon: ListChecks },
  { key: "parentStrategies", label: "Parent Strategies", icon: ListChecks },
  { key: "teacherStrategies", label: "Teacher Strategies", icon: ListChecks },
];

export function GoalSuggestionsSheet({
  goal,
  open,
  onOpenChange,
}: {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const goalId = goal?.id;
  const { data: suggestions, isPending, isError } = useQuery<GoalSuggestion>({
    queryKey: ["goal-suggestions", goalId],
    queryFn: async () => {
      const res = await fetch("/api/ai/goal-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI suggestion failed");
      }
      const data = (await res.json()) as { suggestions: GoalSuggestion };
      return data.suggestions;
    },
    enabled: open && !!goalId,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError) toast.error("Failed to generate suggestions");
  }, [isError]);
  useEffect(() => {
    if (suggestions && open) toast.success("Suggestions generated");
  }, [suggestions, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            AI Goal Suggestions
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {goal?.annualGoal}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 iep-scroll">
          <div className="p-6">
            {isPending && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generating evidence-based suggestions…
                </p>
              </div>
            )}
            {isError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to generate suggestions. Please try again.
              </div>
            )}
            {suggestions && (
              <div className="grid gap-3 sm:grid-cols-2">
                {SUGGESTION_SECTIONS.map(({ key, label, ordered, icon: Icon }) => {
                  const items = suggestions[key] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <Card key={key} className="overflow-hidden">
                      <CardHeader className="bg-muted/40 p-3 pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-primary" />
                          {label}
                          <Badge variant="secondary" className="ml-auto text-[10px]">
                            {items.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        {ordered ? (
                          <ol className="ml-4 list-decimal space-y-1 text-sm text-foreground/80">
                            {items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ol>
                        ) : (
                          <ul className="space-y-1.5 text-sm text-foreground/80">
                            {items.map((item, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

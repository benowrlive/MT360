"use client";

import { format } from "date-fns";

import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Sparkles,
  Loader2,
  Trash2,
  Pencil,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  Clock,
  CircleDot,
} from "lucide-react";

import type { Goal, GoalStatus } from "./types";

const STATUS_META: Record<
  GoalStatus,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  active: {
    label: "Active",
    className: "bg-primary/10 text-primary border-primary/30",
    icon: CircleDot,
  },
  achieved: {
    label: "Achieved",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  "on-hold": {
    label: "On Hold",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Clock,
  },
};

export function GoalCard({
  goal,
  onEdit,
  onProgress,
  onSuggestions,
  onDelete,
  deleting,
}: {
  goal: Goal;
  onEdit: () => void;
  onProgress: () => void;
  onSuggestions: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const status = STATUS_META[goal.status] ?? STATUS_META.active;
  const StatusIcon = status.icon;
  return (
    <GlassCard className="flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("gap-1", status.className)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
          {goal.isAiGenerated && (
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
          )}
          {goal.responsibleProfessional && (
            <Badge variant="secondary" className="text-[10px]">
              {goal.responsibleProfessional}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base leading-snug">{goal.annualGoal}</CardTitle>
        {goal.reviewDate && (
          <CardDescription className="text-xs">
            Review: {format(new Date(goal.reviewDate), "MMM d, yyyy")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        {goal.baseline && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Baseline
            </div>
            <p className="text-foreground/80">{goal.baseline}</p>
          </div>
        )}
        {goal.objective && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Objective
            </div>
            <p className="text-foreground/80">{goal.objective}</p>
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-1.5" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-1.5 border-t bg-muted/30 px-4 py-2.5">
        <Button size="sm" variant="default" className="gap-1.5" onClick={onSuggestions}>
          <Lightbulb className="h-3.5 w-3.5" />
          AI Suggestions
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onProgress}>
          <TrendingUp className="h-3.5 w-3.5" />
          Update Progress
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </CardFooter>
    </GlassCard>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingUp, Plus, Sparkles } from "lucide-react";

import { useActiveStudent } from "@/lib/use-active-student";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { ProgressRecord, Goal } from "./progress/types";
import { ProgressCharts } from "./progress/progress-charts";
import { RatingStatCards } from "./progress/rating-stat-cards";
import { ProgressLog } from "./progress/progress-log";
import { AddEntryDialog } from "./progress/add-entry-dialog";
import { AISummaryDialog } from "./progress/ai-summary-dialog";

/* ------------------------------------------------------------------ */
/* ProgressView (orchestrator)                                         */
/* ------------------------------------------------------------------ */

/**
 * Progress Monitoring view.
 *
 * This file is the orchestrator: it owns the React Query data layer
 * (records + goals + delete mutation), the dialog open-state, and the
 * page-level loading / empty states. All UI surface is delegated to
 * focused subcomponents under `./progress/`.
 *
 * Query keys preserved verbatim from the pre-split file:
 *   - `["progress", studentId]`  — records list
 *   - `["goals", studentId]`     — active goals list
 *   - `["dashboard"]`            — invalidated on add / delete
 */
export function ProgressView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();
  const recordsKey = ["progress", studentId];
  const goalsKey = ["goals", studentId];

  const [addOpen, setAddOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: records = [], isLoading: recordsLoading } = useQuery<
    ProgressRecord[]
  >({
    queryKey: recordsKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/progress?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load progress records");
      const data = await res.json();
      return data.records as ProgressRecord[];
    },
    enabled: !!studentId,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: goalsKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/goals?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load goals");
      const data = await res.json();
      return (data.goals as Goal[]).filter((g) => g.status !== "achieved");
    },
    enabled: !!studentId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/progress/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete progress record");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Progress entry deleted");
      queryClient.invalidateQueries({ queryKey: recordsKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hasRecords = records.length > 0;

  if (recordsLoading) return <ProgressSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <TrendingUp className="h-6 w-6 text-primary" />
            Progress Monitoring
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">
                  {student.name}
                </span>{" "}
                · ratings, trends and AI summaries
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Progress Entry
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setSummaryOpen(true)}
            disabled={!hasRecords}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Progress Summary
          </Button>
        </div>
      </div>

      {hasRecords ? (
        <>
          <ProgressCharts records={records} goals={goals}>
            <RatingStatCards records={records} />
          </ProgressCharts>

          <ProgressLog
            records={records}
            onDelete={(id) => deleteMutation.mutate(id)}
            deletingId={deleteMutation.variables ?? null}
            deleting={deleteMutation.isPending}
          />
        </>
      ) : (
        <EmptyProgress
          onAdd={() => setAddOpen(true)}
          studentName={student?.name}
        />
      )}

      {/* Dialogs */}
      <AddEntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        studentId={studentId ?? ""}
        goals={goals}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: recordsKey });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }}
      />
      <AISummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        studentId={studentId ?? ""}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty + skeleton                                                    */
/* ------------------------------------------------------------------ */

function EmptyProgress({
  onAdd,
  studentName,
}: {
  onAdd: () => void;
  studentName?: string;
}) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <TrendingUp className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            No progress records yet
            {studentName ? ` for ${studentName}` : ""}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Start tracking observations, ratings and notes. Charts, role averages
            and AI summaries will appear here once you add your first entry.
          </p>
        </div>
        <Button className="mt-2 gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add first progress entry
        </Button>
      </CardContent>
    </GlassCard>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-72 rounded-lg bg-muted animate-pulse" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="lg:col-span-2 h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-72" />
    </div>
  );
}

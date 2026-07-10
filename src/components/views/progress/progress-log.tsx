"use client";

import { format, parseISO } from "date-fns";
import { Star, Trash2, Loader2, ClipboardList } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type {
  ProgressLogProps,
  ProgressRecord,
} from "./types";

/* ------------------------------------------------------------------ */
/* ProgressLog                                                         */
/* ------------------------------------------------------------------ */

/**
 * Scrollable list of the most recent progress records (max 50). Each
 * row shows stars, domain, recordedBy badge, date, note and a delete
 * button. The delete mutation lives in the orchestrator — this list
 * just calls `onDelete(id)` and shows a spinner for the in-flight row.
 */
export function ProgressLog({
  records,
  onDelete,
  deletingId,
  deleting,
}: ProgressLogProps) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" /> Progress Log
        </CardTitle>
        <CardDescription>
          Most recent {Math.min(records.length, 50)} of {records.length} entries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[28rem] space-y-2 overflow-y-auto iep-scroll pr-1">
          {records.slice(0, 50).map((r) => (
            <ProgressLogItem
              key={r.id}
              record={r}
              onDelete={() => onDelete(r.id)}
              deleting={deleting && deletingId === r.id}
            />
          ))}
        </div>
      </CardContent>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressLogItem                                                     */
/* ------------------------------------------------------------------ */

function ProgressLogItem({
  record,
  onDelete,
  deleting,
}: {
  record: ProgressRecord;
  onDelete: () => void;
  deleting: boolean;
}) {
  const date = safeFormat(record.date, "d MMM yyyy");
  const domain = record.domain || record.goalDomain || "General";
  const recordedByLabel = roleLabel(record.recordedBy);

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30">
      <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "h-3.5 w-3.5",
                n <= record.rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30",
              )}
            />
          ))}
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {record.rating}/5
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{domain}</span>
          <Badge variant="outline" className="text-[10px] gap-1">
            {recordedByLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">· {date}</span>
        </div>
        {record.note ? (
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">
            {record.note}
          </p>
        ) : (
          <p className="mt-1 text-xs italic text-muted-foreground">No note recorded</p>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground opacity-60 hover:text-destructive hover:opacity-100"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete progress entry"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function roleLabel(recordedBy: string): string {
  const v = (recordedBy || "").toLowerCase();
  if (v.includes("parent")) return "Parent";
  if (v.includes("teach")) return "Teacher";
  if (v.includes("therap")) return "Therapist";
  return recordedBy || "Unknown";
}

function safeFormat(dateStr: string, fmt: string): string {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    try {
      return format(new Date(dateStr), fmt);
    } catch {
      return dateStr;
    }
  }
}

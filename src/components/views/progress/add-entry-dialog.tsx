"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Star, Plus, Loader2 } from "lucide-react";

import type { AddEntryDialogProps } from "./types";

/* ------------------------------------------------------------------ */
/* AddEntryDialog                                                      */
/* ------------------------------------------------------------------ */

/**
 * "Add Progress Entry" dialog. Self-contained — owns its `<Dialog>`
 * wrapper so the orchestrator just renders `<AddEntryDialog open … />`
 * next to the trigger button.
 *
 * On successful POST: fires `onSaved()` (so the orchestrator can
 * invalidate the records + dashboard queries), then `onOpenChange(false)`
 * to close. Form state is reset to defaults for the next open.
 */
export function AddEntryDialog({
  open,
  onOpenChange,
  studentId,
  goals,
  onSaved,
}: AddEntryDialogProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [goalId, setGoalId] = useState<string>("__general__");
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(3);
  const [recordedBy, setRecordedBy] = useState("Therapist");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;
    setSubmitting(true);
    try {
      const selectedGoal = goals.find((g) => g.id === goalId);
      const domain = selectedGoal?.domain ?? "";
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          goalId: goalId === "__general__" ? null : goalId,
          date,
          rating,
          note: note.trim(),
          recordedBy,
          domain,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save entry");
      }
      toast.success("Progress entry added");
      onSaved();
      onOpenChange(false);
      // reset
      setGoalId("__general__");
      setDate(today);
      setRating(3);
      setRecordedBy("Therapist");
      setNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Progress Entry
          </DialogTitle>
          <DialogDescription>
            Record a new observation, rating and note for the student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="progress-goal">Linked Goal</Label>
            <Select value={goalId} onValueChange={setGoalId}>
              <SelectTrigger id="progress-goal">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__general__">General (no goal)</SelectItem>
                {goals.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.domain} — {g.annualGoal.slice(0, 50)}
                    {g.annualGoal.length > 50 ? "…" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="progress-date">Date</Label>
              <Input
                id="progress-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="progress-role">Recorded By</Label>
              <Select value={recordedBy} onValueChange={setRecordedBy}>
                <SelectTrigger id="progress-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Therapist">Therapist</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Rating</Label>
              <span className="text-sm font-medium tabular-nums text-primary">
                {rating} / 5
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[rating]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setRating(v[0] ?? 3)}
                className="flex-1"
                aria-label="Progress rating"
              />
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-4 w-4 transition-colors",
                      n <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="progress-note">Note</Label>
            <Textarea
              id="progress-note"
              placeholder="Observation, context, what worked, what didn't…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

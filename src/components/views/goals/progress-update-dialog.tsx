"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2, TrendingUp } from "lucide-react";

import type { Goal, GoalStatus } from "./types";

export function ProgressUpdateDialog({
  goal,
  onClose,
  onSaved,
}: {
  goal: Goal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [progress, setProgress] = useState<number[]>([goal.progress]);
  const [status, setStatus] = useState<GoalStatus>(goal.status);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: progress[0], status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update progress");
      }
      toast.success("Progress updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update progress");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Update Progress
        </DialogTitle>
        <DialogDescription>Adjust the progress slider and goal status.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="progress-slider">Progress</Label>
            <span className="text-2xl font-bold text-primary">{progress[0]}%</span>
          </div>
          <Slider
            id="progress-slider"
            value={progress}
            onValueChange={setProgress}
            min={0}
            max={100}
            step={5}
          />
          <Progress value={progress[0]} className="h-1.5" />
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="status-select">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
            <SelectTrigger id="status-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="achieved">Achieved</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Update"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

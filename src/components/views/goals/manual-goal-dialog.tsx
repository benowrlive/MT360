"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format, addMonths } from "date-fns";

import { GOAL_DOMAINS } from "@/lib/constants";
import type { SmartGoal } from "@/lib/types";

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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2 } from "lucide-react";

import type { Goal } from "./types";

const GOAL_FORM_FIELDS: {
  key: keyof SmartGoal;
  label: string;
  textarea?: boolean;
}[] = [
  { key: "annualGoal", label: "Annual Goal *", textarea: true },
  { key: "baseline", label: "Baseline", textarea: true },
  { key: "objective", label: "Objective", textarea: true },
  { key: "teachingStrategy", label: "Teaching Strategy", textarea: true },
  { key: "accommodation", label: "Accommodation", textarea: true },
  { key: "modification", label: "Modification", textarea: true },
  { key: "resources", label: "Resources", textarea: true },
  { key: "measurementMethod", label: "Measurement Method", textarea: true },
  { key: "progressIndicators", label: "Progress Indicators", textarea: true },
  { key: "responsibleProfessional", label: "Responsible Professional" },
];

export function ManualGoalDialog({
  studentId,
  goal,
  onClose,
  onSaved,
}: {
  studentId: string;
  goal?: Goal;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [domain, setDomain] = useState<string>(goal?.domain ?? GOAL_DOMAINS[0]);
  const [fields, setFields] = useState<Record<keyof SmartGoal, string>>({
    domain: goal?.domain ?? GOAL_DOMAINS[0],
    annualGoal: goal?.annualGoal ?? "",
    baseline: goal?.baseline ?? "",
    objective: goal?.objective ?? "",
    teachingStrategy: goal?.teachingStrategy ?? "",
    accommodation: goal?.accommodation ?? "",
    modification: goal?.modification ?? "",
    resources: goal?.resources ?? "",
    measurementMethod: goal?.measurementMethod ?? "",
    progressIndicators: goal?.progressIndicators ?? "",
    responsibleProfessional: goal?.responsibleProfessional ?? "",
  });
  const [reviewDate, setReviewDate] = useState<string>(
    goal?.reviewDate ? format(new Date(goal.reviewDate), "yyyy-MM-dd") : format(addMonths(new Date(), 6), "yyyy-MM-dd"),
  );
  const [saving, setSaving] = useState(false);

  const isEdit = !!goal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.annualGoal.trim()) return;
    setSaving(true);
    try {
      const payload = {
        studentId,
        ...fields,
        domain,
        reviewDate: reviewDate ? new Date(reviewDate).toISOString() : null,
      };
      const url = isEdit ? `/api/goals/${goal!.id}` : "/api/goals";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save goal");
      }
      toast.success(isEdit ? "Goal updated" : "Goal created");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Goal" : "Add Goal"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the goal details. All fields remain editable."
            : "Create a SMART goal manually. All fields below are editable."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-domain">Domain *</Label>
          <Select value={domain} onValueChange={(v) => setDomain(v)}>
            <SelectTrigger id="goal-domain" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid max-h-[55vh] gap-3 overflow-y-auto iep-scroll pr-1">
          {GOAL_FORM_FIELDS.map(({ key, label, textarea }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`gf-${key}`} className="text-xs">
                {label}
              </Label>
              {textarea ? (
                <Textarea
                  id={`gf-${key}`}
                  value={fields[key]}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  rows={2}
                  className="text-sm"
                />
              ) : (
                <Input
                  id={`gf-${key}`}
                  value={fields[key]}
                  onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  className="text-sm"
                />
              )}
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="goal-review" className="text-xs">
              Review Date
            </Label>
            <Input
              id="goal-review"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving || !fields.annualGoal.trim()} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

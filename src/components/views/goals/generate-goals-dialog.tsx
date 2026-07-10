"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { addMonths } from "date-fns";

import { GOAL_DOMAINS } from "@/lib/constants";
import type { SmartGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2, Sparkles, Wand2 } from "lucide-react";

export function GenerateGoalsDialog({
  studentId,
  onClose,
  onSaved,
}: {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<SmartGoal[] | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (domains: string[]) => {
      const res = await fetch("/api/ai/goal-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, domains }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI generation failed");
      }
      return res.json() as Promise<{ goals: SmartGoal[] }>;
    },
    onSuccess: (data) => {
      setGenerated(data.goals ?? []);
      setAccepted(new Set(data.goals.map((_, i) => i)));
      toast.success(`${data.goals?.length ?? 0} goals generated`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (selected.size === 0) {
      toast.error("Select at least one domain");
      return;
    }
    setGenerated(null);
    generateMutation.mutate(Array.from(selected));
  };

  const handleToggleDomain = (d: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const handleSave = async () => {
    if (!generated) return;
    const toSave = generated.filter((_, i) => accepted.has(i));
    if (toSave.length === 0) {
      toast.error("Select at least one goal to save");
      return;
    }
    setSaving(true);
    try {
      const results = await Promise.all(
        toSave.map((g) =>
          fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId,
              ...g,
              isAiGenerated: true,
              reviewDate: addMonths(new Date(), 6).toISOString(),
            }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length) throw new Error(`${failed.length} goal(s) failed to save`);
      toast.success(`${toSave.length} goal${toSave.length > 1 ? "s" : ""} saved`);
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save goals");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generate AI Goals
        </DialogTitle>
        <DialogDescription>
          Choose one or more domains. The AI will draft a SMART goal for each — you can review and
          accept the ones that fit before saving.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {!generated && (
          <>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Select Domains</span>
                <span className="text-xs text-muted-foreground">{selected.size} selected</span>
              </div>
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto iep-scroll sm:grid-cols-2">
                {GOAL_DOMAINS.map((d) => (
                  <label
                    key={d}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm transition-colors",
                      selected.has(d)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <Checkbox
                      checked={selected.has(d)}
                      onCheckedChange={() => handleToggleDomain(d)}
                      className="mt-0.5"
                    />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || selected.size === 0}
                className="gap-2"
              >
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generateMutation.isPending ? "Generating…" : `Generate ${selected.size || ""} Goal${selected.size === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {generated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {generated.length} goal{generated.length === 1 ? "" : "s"} drafted · {accepted.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGenerated(null);
                    setAccepted(new Set());
                  }}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || accepted.size === 0}
                  className="gap-1.5"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {saving ? "Saving…" : `Save ${accepted.size} Selected`}
                </Button>
              </div>
            </div>
            <ScrollArea className="max-h-[55vh] iep-scroll pr-2">
              <div className="space-y-3">
                {generated.map((g, i) => {
                  const checked = accepted.has(i);
                  return (
                    <Card
                      key={i}
                      className={cn(
                        "border-l-4 transition-colors",
                        checked ? "border-l-primary" : "border-l-transparent opacity-70",
                      )}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setAccepted((prev) => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i);
                                else next.add(i);
                                return next;
                              })
                            }
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <Badge variant="secondary" className="mb-1 bg-primary/10 text-primary">
                              {g.domain}
                            </Badge>
                            <CardTitle className="text-sm leading-snug">{g.annualGoal}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-0 text-xs text-muted-foreground">
                        {g.baseline && (
                          <p>
                            <span className="font-semibold text-foreground/70">Baseline:</span> {g.baseline}
                          </p>
                        )}
                        {g.objective && (
                          <p>
                            <span className="font-semibold text-foreground/70">Objective:</span> {g.objective}
                          </p>
                        )}
                        {g.teachingStrategy && (
                          <p>
                            <span className="font-semibold text-foreground/70">Strategy:</span> {g.teachingStrategy}
                          </p>
                        )}
                        {g.responsibleProfessional && (
                          <p>
                            <span className="font-semibold text-foreground/70">Professional:</span> {g.responsibleProfessional}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

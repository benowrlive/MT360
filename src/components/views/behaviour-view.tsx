"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { useActiveStudent } from "@/lib/use-active-student";
import type { BehaviourPlanData } from "@/lib/types";
import { cn } from "@/lib/utils";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Brain,
  ShieldAlert,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightFromLine,
  ArrowLeftRight,
  Shield,
  Flame,
  Gift,
  ListChecks,
  Sparkles,
  Wand2,
  Loader2,
  Trash2,
  Plus,
  Target,
  Zap,
  Eye,
  Clock3,
} from "lucide-react";

interface BehaviourPlan {
  id: string;
  studentId: string;
  behaviourOfConcern: string;
  abcAntecedent: string;
  abcBehaviour: string;
  abcConsequence: string;
  behaviourFunction: string;
  triggers: string;
  maintainingFactors: string;
  replacementBehaviours: string;
  preventiveStrategies: string;
  reactiveStrategies: string;
  rewardSystems: string;
  isAiGenerated: boolean;
  createdAt: string;
}

/** Split a newline-separated string into a clean list of items. */
function splitList(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter(Boolean);
}

/** Lowercased function keyword -> color + icon. */
const FUNCTION_META: Record<
  string,
  { className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  access: {
    className: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    icon: ArrowDownToLine,
  },
  escape: {
    className: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
    icon: ArrowRightFromLine,
  },
  attention: {
    className: "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300",
    icon: Eye,
  },
  sensory: {
    className: "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300",
    icon: Zap,
  },
  automatic: {
    className: "border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300",
    icon: Zap,
  },
};

function functionMeta(raw: string) {
  const lower = (raw || "").toLowerCase();
  for (const key of Object.keys(FUNCTION_META)) {
    if (lower.includes(key)) return FUNCTION_META[key];
  }
  return {
    className: "border-primary/40 bg-primary/15 text-primary",
    icon: Target,
  } as const;
}

export function BehaviourView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();
  const queryKey = ["behaviour", studentId];

  const [genOpen, setGenOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery<BehaviourPlan[]>({
    queryKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/behaviour?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load behaviour plans");
      const data = await res.json();
      return data.plans as BehaviourPlan[];
    },
    enabled: !!studentId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/behaviour/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete plan");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Behaviour plan deleted");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 iep-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Brain className="h-6 w-6 text-primary" />
            Behaviour Support Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">{student.name}</span>{" "}
                · Function-based support plans (ABC + ABA-informed)
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <Dialog open={genOpen} onOpenChange={setGenOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate Plan
            </Button>
          </DialogTrigger>
          <GenerateBehaviourDialog
            studentId={studentId ?? ""}
            onClose={() => setGenOpen(false)}
            onSaved={() => queryClient.invalidateQueries({ queryKey })}
          />
        </Dialog>
      </div>

      {/* Body */}
      {isLoading ? (
        <BehaviourLoadingSkeleton />
      ) : plans.length === 0 ? (
        <EmptyBehaviourState onGenerate={() => setGenOpen(true)} />
      ) : (
        <div className="space-y-5">
          {plans.map((p) => (
            <BehaviourPlanCard
              key={p.id}
              plan={p}
              onDelete={() => deleteMutation.mutate(p.id)}
              deleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BehaviourPlanCard({
  plan,
  onDelete,
  deleting,
}: {
  plan: BehaviourPlan;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fn = functionMeta(plan.behaviourFunction);

  return (
    <GlassCard className="overflow-hidden">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {plan.isAiGenerated && (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
              <CardDescription className="text-xs">
                Added {format(new Date(plan.createdAt), "d MMM yyyy")}
              </CardDescription>
            </div>
            <CardTitle className="flex items-center gap-2 text-base leading-snug">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Behaviour of Concern
            </CardTitle>
          </div>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              aria-label="Delete behaviour plan"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this behaviour plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the plan for “{plan.behaviourOfConcern.slice(0, 80)}{plan.behaviourOfConcern.length > 80 ? "…" : ""}”. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Behaviour of Concern — prominent alert */}
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <p className="text-sm font-medium text-rose-900 dark:text-rose-100">
            {plan.behaviourOfConcern}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Behaviour Function callout */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Behaviour Function
          </div>
          {plan.behaviourFunction ? (
            <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 text-sm font-semibold", fn.className)}>
              <fn.icon className="h-3.5 w-3.5" />
              {plan.behaviourFunction}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Not specified</span>
          )}
        </div>

        {/* ABC Analysis */}
        <div>
          <SectionLabel icon={ArrowLeftRight} label="ABC Analysis" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <AbcColumn
              icon={Clock3}
              title="Antecedent"
              tone="amber"
              text={plan.abcAntecedent}
            />
            <AbcColumn
              icon={Flame}
              title="Behaviour"
              tone="rose"
              text={plan.abcBehaviour}
            />
            <AbcColumn
              icon={ArrowDownToLine}
              title="Consequence"
              tone="teal"
              text={plan.abcConsequence}
            />
          </div>
        </div>

        <Separator />

        {/* Triggers + Maintaining Factors */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListBlock
            icon={Zap}
            title="Triggers"
            tone="amber"
            items={splitList(plan.triggers)}
            fallback={plan.triggers}
          />
          <ListBlock
            icon={Clock3}
            title="Maintaining Factors"
            tone="rose"
            items={splitList(plan.maintainingFactors)}
            fallback={plan.maintainingFactors}
          />
        </div>

        {/* Replacement Behaviours */}
        <ListBlock
          icon={ListChecks}
          title="Replacement Behaviours"
          tone="primary"
          items={splitList(plan.replacementBehaviours)}
          fallback={plan.replacementBehaviours}
        />

        {/* Preventive + Reactive */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListBlock
            icon={Shield}
            title="Preventive Strategies"
            tone="teal"
            items={splitList(plan.preventiveStrategies)}
            fallback={plan.preventiveStrategies}
          />
          <ListBlock
            icon={ShieldAlert}
            title="Reactive Strategies"
            tone="amber"
            items={splitList(plan.reactiveStrategies)}
            fallback={plan.reactiveStrategies}
          />
        </div>

        {/* Reward Systems */}
        <ListBlock
          icon={Gift}
          title="Reward Systems"
          tone="emerald"
          items={splitList(plan.rewardSystems)}
          fallback={plan.rewardSystems}
        />
      </CardContent>

      <CardFooter className="border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Brain className="h-3 w-3" />
          Function-based support plan
        </span>
      </CardFooter>
    </GlassCard>
  );
}

const TONE_STYLES: Record<
  string,
  { header: string; border: string; bg: string; dot: string }
> = {
  amber: {
    header: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    dot: "bg-amber-500",
  },
  rose: {
    header: "text-rose-700 dark:text-rose-300",
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    dot: "bg-rose-500",
  },
  teal: {
    header: "text-teal-700 dark:text-teal-300",
    border: "border-teal-500/30",
    bg: "bg-teal-500/5",
    dot: "bg-teal-500",
  },
  emerald: {
    header: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    dot: "bg-emerald-500",
  },
  primary: {
    header: "text-primary",
    border: "border-primary/30",
    bg: "bg-primary/5",
    dot: "bg-primary",
  },
};

function AbcColumn({
  icon: Icon,
  title,
  tone,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: keyof typeof TONE_STYLES | string;
  text: string;
}) {
  const s = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  return (
    <div className={cn("rounded-lg border p-3", s.border, s.bg)}>
      <div className={cn("mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", s.header)}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {text ? (
        <p className="text-sm text-foreground/85">{text}</p>
      ) : (
        <p className="text-xs italic text-muted-foreground">Not specified</p>
      )}
    </div>
  );
}

function ListBlock({
  icon: Icon,
  title,
  tone,
  items,
  fallback,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: keyof typeof TONE_STYLES | string;
  items: string[];
  fallback?: string;
}) {
  const s = TONE_STYLES[tone] ?? TONE_STYLES.primary;
  const hasItems = items.length > 0;
  return (
    <div className={cn("rounded-lg border p-3", s.border, s.bg)}>
      <div className={cn("mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", s.header)}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {hasItems ? (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/85">
              <span className={cn("mt-2 h-1 w-1 flex-shrink-0 rounded-full", s.dot)} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : fallback ? (
        <p className="text-sm text-foreground/85">{fallback}</p>
      ) : (
        <p className="text-xs italic text-muted-foreground">Not specified</p>
      )}
    </div>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function GenerateBehaviourDialog({
  studentId,
  onClose,
  onSaved,
}: {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [behaviourOfConcern, setBehaviourOfConcern] = useState("");
  const [preview, setPreview] = useState<BehaviourPlanData | null>(null);
  const [saving, setSaving] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/behaviour-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, behaviourOfConcern }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI generation failed");
      }
      return res.json() as Promise<{ plan: BehaviourPlanData }>;
    },
    onSuccess: (data) => {
      setPreview(data.plan);
      toast.success("Behaviour plan drafted — review and edit before saving");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!behaviourOfConcern.trim()) {
      toast.error("Please describe the behaviour of concern");
      return;
    }
    setPreview(null);
    generateMutation.mutate();
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const res = await fetch("/api/behaviour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          ...preview,
          isAiGenerated: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save plan");
      }
      toast.success("Behaviour plan saved");
      onSaved();
      onClose();
      setPreview(null);
      setBehaviourOfConcern("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = <K extends keyof BehaviourPlanData>(
    key: K,
    value: BehaviourPlanData[K],
  ) => {
    setPreview((p) => (p ? { ...p, [key]: value } : p));
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generate Behaviour Support Plan
        </DialogTitle>
        <DialogDescription>
          Describe the behaviour of concern — the AI will draft an ABA-informed, function-based plan you
          can review and edit before saving.
        </DialogDescription>
      </DialogHeader>

      {!preview ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="boc-input">Behaviour of Concern</Label>
            <Textarea
              id="boc-input"
              value={behaviourOfConcern}
              onChange={(e) => setBehaviourOfConcern(e.target.value)}
              rows={3}
              placeholder="e.g. Hits peers when asked to transition from play to work"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and observable. The AI will infer antecedents, consequences and likely function.
            </p>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
            <div className="flex items-start gap-2">
              <Brain className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                The plan will include ABC analysis, hypothesised function, triggers, replacement
                behaviours, preventive + reactive strategies and reward systems — tailored to the
                student&apos;s diagnosis, strengths and current therapies.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !behaviourOfConcern.trim()}
              className="gap-2"
            >
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generateMutation.isPending ? "Drafting plan…" : "Generate Plan"}
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                AI Draft
              </Badge>
              <span className="text-sm text-muted-foreground">
                Edit any field before saving
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreview(null)}
                disabled={saving}
              >
                Back
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {saving ? "Saving…" : "Save Plan"}
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[62vh] iep-scroll pr-2">
            <div className="space-y-3">
              <EditableField
                label="Behaviour of Concern"
                value={preview.behaviourOfConcern}
                onChange={(v) => handleFieldChange("behaviourOfConcern", v)}
                textarea
                rows={2}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <EditableField
                  label="Antecedent (A)"
                  value={preview.abcAntecedent}
                  onChange={(v) => handleFieldChange("abcAntecedent", v)}
                  textarea
                  rows={3}
                />
                <EditableField
                  label="Behaviour (B)"
                  value={preview.abcBehaviour}
                  onChange={(v) => handleFieldChange("abcBehaviour", v)}
                  textarea
                  rows={3}
                />
                <EditableField
                  label="Consequence (C)"
                  value={preview.abcConsequence}
                  onChange={(v) => handleFieldChange("abcConsequence", v)}
                  textarea
                  rows={3}
                />
              </div>
              <EditableField
                label="Behaviour Function"
                value={preview.behaviourFunction}
                onChange={(v) => handleFieldChange("behaviourFunction", v)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Triggers (one per line)"
                  value={preview.triggers}
                  onChange={(v) => handleFieldChange("triggers", v)}
                  textarea
                  rows={4}
                />
                <EditableField
                  label="Maintaining Factors (one per line)"
                  value={preview.maintainingFactors}
                  onChange={(v) => handleFieldChange("maintainingFactors", v)}
                  textarea
                  rows={4}
                />
              </div>
              <EditableField
                label="Replacement Behaviours (one per line)"
                value={preview.replacementBehaviours}
                onChange={(v) => handleFieldChange("replacementBehaviours", v)}
                textarea
                rows={3}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Preventive Strategies (one per line)"
                  value={preview.preventiveStrategies}
                  onChange={(v) => handleFieldChange("preventiveStrategies", v)}
                  textarea
                  rows={4}
                />
                <EditableField
                  label="Reactive Strategies (one per line)"
                  value={preview.reactiveStrategies}
                  onChange={(v) => handleFieldChange("reactiveStrategies", v)}
                  textarea
                  rows={4}
                />
              </div>
              <EditableField
                label="Reward Systems (one per line)"
                value={preview.rewardSystems}
                onChange={(v) => handleFieldChange("rewardSystems", v)}
                textarea
                rows={3}
              />
            </div>
          </ScrollArea>
        </div>
      )}
    </DialogContent>
  );
}

function EditableField({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="text-sm"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        />
      )}
    </div>
  );
}

function BehaviourLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <GlassCard key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-12 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyBehaviourState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Brain className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">No behaviour plans yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Describe a behaviour of concern — the AI will draft a function-based support plan with ABC
            analysis, hypothesised function, triggers, replacement behaviours, preventive and reactive
            strategies, and reward systems.
          </p>
        </div>
        <Button onClick={onGenerate} className="mt-2 gap-2">
          <Plus className="h-4 w-4" />
          Generate Plan
        </Button>
      </CardContent>
    </GlassCard>
  );
}

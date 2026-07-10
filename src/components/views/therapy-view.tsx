"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { useActiveStudent } from "@/lib/use-active-student";
import { THERAPY_TYPES, PROMPT_HIERARCHY } from "@/lib/constants";
import type { TherapyPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

import {
  Activity,
  CalendarDays,
  ClipboardList,
  ListChecks,
  Boxes,
  GraduationCap,
  Trophy,
  ClipboardCheck,
  House,
  Sparkles,
  Wand2,
  Loader2,
  Trash2,
  Plus,
  CircleHelp,
} from "lucide-react";

interface TherapySession {
  id: string;
  studentId: string;
  therapyType: string;
  week: string;
  sessionTitle: string;
  objectives: string;
  activities: string;
  materials: string;
  promptingLevel: string;
  reinforcement: string;
  dataCollection: string;
  homework: string;
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

const PROMPT_BADGE: Record<string, string> = {
  Independent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Gesture Prompt": "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  "Verbal Prompt": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "Visual Prompt": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "Model Prompt": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Partial Physical Prompt": "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "Full Physical Prompt": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

function promptBadgeClass(level: string): string {
  return PROMPT_BADGE[level] ?? "bg-primary/10 text-primary border-primary/30";
}

function defaultWeekLabel(): string {
  const today = new Date();
  const monday = new Date(today);
  const day = today.getDay(); // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(today.getDate() + diff);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return `Week of ${format(monday, "d MMM")} – ${format(friday, "d MMM")}`;
}

export function TherapyView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();
  const queryKey = ["therapy", studentId];

  const [genOpen, setGenOpen] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<TherapySession[]>({
    queryKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/therapy?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load therapy sessions");
      const data = await res.json();
      return data.sessions as TherapySession[];
    },
    enabled: !!studentId,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, TherapySession[]>();
    for (const s of sessions) {
      const arr = map.get(s.therapyType) ?? [];
      arr.push(s);
      map.set(s.therapyType, arr);
    }
    // Preserve THERAPY_TYPES order; append unknowns at the end.
    const ordered: string[] = THERAPY_TYPES.filter((t) => map.has(t));
    const known = new Set<string>(THERAPY_TYPES as readonly string[]);
    for (const k of map.keys()) {
      if (!known.has(k)) ordered.push(k);
    }
    return ordered.map((t) => ({ type: t, items: map.get(t)! }));
  }, [sessions]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/therapy/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete session");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Therapy session deleted");
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
            <Activity className="h-6 w-6 text-primary" />
            Therapy Planner
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">{student.name}</span>{" "}
                · Weekly therapy session plans grouped by discipline
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
              Generate Weekly Plan
            </Button>
          </DialogTrigger>
          <GenerateTherapyDialog
            studentId={studentId ?? ""}
            onClose={() => setGenOpen(false)}
            onSaved={() => queryClient.invalidateQueries({ queryKey })}
          />
        </Dialog>
      </div>

      {/* Body */}
      {isLoading ? (
        <TherapyLoadingSkeleton />
      ) : sessions.length === 0 ? (
        <EmptyTherapyState onGenerate={() => setGenOpen(true)} />
      ) : (
        <Tabs defaultValue={grouped[0]?.type ?? ""} className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto py-1.5">
            {grouped.map(({ type, items }) => (
              <TabsTrigger key={type} value={type} className="gap-1.5">
                {type}
                <Badge
                  variant="secondary"
                  className="ml-1 rounded-full px-1.5 py-0 text-[10px] font-semibold"
                >
                  {items.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {grouped.map(({ type, items }) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {items.map((s) => (
                  <TherapySessionCard
                    key={s.id}
                    session={s}
                    onDelete={() => deleteMutation.mutate(s.id)}
                    deleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

function TherapySessionCard({
  session,
  onDelete,
  deleting,
}: {
  session: TherapySession;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const objectives = splitList(session.objectives);
  const activities = splitList(session.activities);
  const materials = splitList(session.materials);

  return (
    <GlassCard className="flex flex-col overflow-hidden border-l-4 border-l-primary/60 transition-shadow hover:shadow-md">
      <CardHeader className="gap-1.5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
                <CalendarDays className="h-3 w-3" />
                {session.week}
              </Badge>
              {session.isAiGenerated && (
                <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-snug">{session.sessionTitle}</CardTitle>
            <CardDescription className="text-xs">
              Added {format(new Date(session.createdAt), "d MMM yyyy")}
            </CardDescription>
          </div>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
              aria-label="Delete session"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this session plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove “{session.sessionTitle}”. This action cannot be undone.
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
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {objectives.length > 0 && (
          <SectionList icon={ListChecks} title="Objectives" items={objectives} accent="text-primary" />
        )}
        {activities.length > 0 && (
          <SectionList icon={ClipboardList} title="Activities" items={activities} />
        )}
        {materials.length > 0 && (
          <SectionList icon={Boxes} title="Materials" items={materials} />
        )}

        <Separator />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {session.promptingLevel && (
            <InfoBlock icon={GraduationCap} label="Prompting Level">
              <Badge variant="outline" className={cn("gap-1", promptBadgeClass(session.promptingLevel))}>
                {session.promptingLevel}
              </Badge>
            </InfoBlock>
          )}
          {session.dataCollection && (
            <InfoBlock icon={ClipboardCheck} label="Data Collection">
              <p className="text-sm text-foreground/80">{session.dataCollection}</p>
            </InfoBlock>
          )}
        </div>

        {session.reinforcement && (
          <InfoBlock icon={Trophy} label="Reinforcement">
            <p className="text-sm text-foreground/80">{session.reinforcement}</p>
          </InfoBlock>
        )}

        {session.homework && (
          <InfoBlock icon={House} label="Homework / Home Carry-over" accent="text-primary">
            <p className="text-sm text-foreground/80">{session.homework}</p>
          </InfoBlock>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Activity className="h-3 w-3" />
          {session.therapyType}
        </span>
      </CardFooter>
    </GlassCard>
  );
}

function SectionList({
  icon: Icon,
  title,
  items,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  accent?: string;
}) {
  return (
    <div>
      <div className={cn("mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", accent ?? "text-muted-foreground")}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <ul className="ml-1 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/85">
            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-primary/60" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  accent,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className={cn("flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", accent ?? "text-muted-foreground")}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {children}
    </div>
  );
}

function GenerateTherapyDialog({
  studentId,
  onClose,
  onSaved,
}: {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [therapyType, setTherapyType] = useState<string>(THERAPY_TYPES[0]);
  const [week, setWeek] = useState<string>(defaultWeekLabel());
  const [preview, setPreview] = useState<TherapyPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/therapy-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, therapyType, week }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI generation failed");
      }
      return res.json() as Promise<{ plan: TherapyPlan }>;
    },
    onSuccess: (data) => {
      setPreview(data.plan);
      toast.success("Therapy plan drafted — review and edit before saving");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!week.trim()) {
      toast.error("Please enter a week label");
      return;
    }
    setPreview(null);
    generateMutation.mutate();
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const res = await fetch("/api/therapy", {
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
      toast.success("Therapy plan saved");
      onSaved();
      onClose();
      // Reset for next time
      setPreview(null);
      setTherapyType(THERAPY_TYPES[0]);
      setWeek(defaultWeekLabel());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = <K extends keyof TherapyPlan>(key: K, value: TherapyPlan[K]) => {
    setPreview((p) => (p ? { ...p, [key]: value } : p));
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generate Weekly Therapy Plan
        </DialogTitle>
        <DialogDescription>
          Pick a discipline and a week — the AI drafts a full session plan you can review and edit before saving.
        </DialogDescription>
      </DialogHeader>

      {!preview ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="therapy-type">Therapy Type</Label>
              <Select value={therapyType} onValueChange={(v) => setTherapyType(v)}>
                <SelectTrigger id="therapy-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THERAPY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="therapy-week">Week Label</Label>
              <Input
                id="therapy-week"
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                placeholder="e.g. Week 3 · Mar 10–14"
              />
              <p className="text-xs text-muted-foreground">
                Used as the session header. You can customise the format.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-foreground/80">
            <div className="flex items-start gap-2">
              <CircleHelp className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                The plan will be tailored to the student&apos;s diagnosis, age and current therapies. The
                prompt hierarchy, reinforcement and data collection methods will follow ABA best practices.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !week.trim()}
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
                {preview.therapyType}
              </Badge>
              <span className="text-sm text-muted-foreground">{preview.week}</span>
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

          <div className="max-h-[60vh] space-y-3 overflow-y-auto iep-scroll pr-1">
            <EditableField
              label="Session Title"
              value={preview.sessionTitle}
              onChange={(v) => handleFieldChange("sessionTitle", v)}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Prompting Level</Label>
                <Select
                  value={preview.promptingLevel}
                  onValueChange={(v) => handleFieldChange("promptingLevel", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMPT_HIERARCHY.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <EditableField
              label="Objectives (one per line)"
              value={preview.objectives}
              onChange={(v) => handleFieldChange("objectives", v)}
              textarea
              rows={4}
            />
            <EditableField
              label="Activities (one per line)"
              value={preview.activities}
              onChange={(v) => handleFieldChange("activities", v)}
              textarea
              rows={4}
            />
            <EditableField
              label="Materials (one per line)"
              value={preview.materials}
              onChange={(v) => handleFieldChange("materials", v)}
              textarea
              rows={3}
            />
            <EditableField
              label="Reinforcement"
              value={preview.reinforcement}
              onChange={(v) => handleFieldChange("reinforcement", v)}
              textarea
              rows={2}
            />
            <EditableField
              label="Data Collection"
              value={preview.dataCollection}
              onChange={(v) => handleFieldChange("dataCollection", v)}
              textarea
              rows={2}
            />
            <EditableField
              label="Homework / Home Carry-over"
              value={preview.homework}
              onChange={(v) => handleFieldChange("homework", v)}
              textarea
              rows={2}
            />
          </div>
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

function TherapyLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-5 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function EmptyTherapyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Activity className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">No therapy plans yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Generate a weekly therapy session plan with AI — pick a discipline, the week, and review the
            tailored objectives, activities, materials, prompting level and reinforcement before saving.
          </p>
        </div>
        <Button onClick={onGenerate} className="mt-2 gap-2">
          <Plus className="h-4 w-4" />
          Generate Weekly Plan
        </Button>
      </CardContent>
    </GlassCard>
  );
}

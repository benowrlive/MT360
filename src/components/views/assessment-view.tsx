"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { useActiveStudent } from "@/lib/use-active-student";
import { ASSESSMENT_TYPES } from "@/lib/constants";
import type { AssessmentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

import {
  Card,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ClipboardList,
  Plus,
  Sparkles,
  Loader2,
  Trash2,
  Eye,
  FileText,
  Brain,
  HeartPulse,
  MessageSquare,
  Activity,
  Hand,
  Ear,
  Gauge,
  Smile,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Assessment {
  id: string;
  studentId: string;
  type: string;
  title: string;
  rawContent: string;
  summary: string | null;
  aiSummary: string | null;
  uploadedBy: string;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ASSESSMENT_TYPES.map((t) => [t.value, t.label]),
);

const SUMMARY_FIELDS: {
  key: keyof AssessmentSummary;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "presentLevels", label: "Present Levels", icon: Gauge },
  { key: "strengths", label: "Strengths", icon: CheckCircle2 },
  { key: "areasOfNeed", label: "Areas of Need", icon: AlertCircle },
  { key: "functionalSkills", label: "Functional Skills", icon: Activity },
  { key: "academicSkills", label: "Academic Skills", icon: Brain },
  { key: "socialSkills", label: "Social Skills", icon: Smile },
  { key: "behaviour", label: "Behaviour", icon: Activity },
  { key: "communication", label: "Communication", icon: MessageSquare },
  { key: "motorSkills", label: "Motor Skills", icon: Hand },
  { key: "sensoryProfile", label: "Sensory Profile", icon: Ear },
  { key: "executiveFunctioning", label: "Executive Functioning", icon: Gauge },
  { key: "emotionalRegulation", label: "Emotional Regulation", icon: HeartPulse },
  { key: "learningPreferences", label: "Learning Preferences", icon: Lightbulb },
];

export function AssessmentView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [summarySheet, setSummarySheet] = useState<Assessment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const queryKey = ["assessments", studentId];

  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/assessments?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load assessments");
      const data = await res.json();
      return data.assessments as Assessment[];
    },
    enabled: !!studentId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      type: string;
      title: string;
      rawContent: string;
      uploadedBy: string;
    }) => {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create assessment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Assessment added");
      queryClient.invalidateQueries({ queryKey });
      setAddOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const aiSummaryMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const res = await fetch("/api/ai/assessment-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI summary failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("AI summary generated");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assessment");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Assessment deleted");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const summaryFor = (a: Assessment): AssessmentSummary | null => {
    if (!a.aiSummary) return null;
    try {
      return JSON.parse(a.aiSummary) as AssessmentSummary;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ClipboardList className="h-6 w-6 text-primary" />
            Assessments
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">{student.name}</span>{" "}
                · Upload reports and generate AI-structured summaries
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Assessment
            </Button>
          </DialogTrigger>
          <AddAssessmentDialog
            onSubmit={(v) => createMutation.mutate(v)}
            loading={createMutation.isPending}
          />
        </Dialog>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((i) => (
            <GlassCard key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </GlassCard>
          ))}
        </div>
      ) : assessments.length === 0 ? (
        <EmptyState onAdd={() => setAddOpen(true)} />
      ) : (
        <div className="grid gap-4">
          {assessments.map((a) => {
            const summary = summaryFor(a);
            const expanded = expandedId === a.id;
            return (
              <GlassCard key={a.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          {TYPE_LABEL[a.type] ?? a.type}
                        </Badge>
                        {summary && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-primary/40 text-primary"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Summary
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="truncate text-lg">{a.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                        <span>By {a.uploadedBy}</span>
                        <span aria-hidden>·</span>
                        <span>{format(new Date(a.createdAt), "MMM d, yyyy")}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {a.rawContent ? (
                    <Collapsible open={expanded} onOpenChange={(o) => setExpandedId(o ? a.id : null)}>
                      <div
                        className={cn(
                          "text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap",
                          !expanded && "line-clamp-3",
                        )}
                      >
                        {a.rawContent}
                      </div>
                      {a.rawContent.length > 280 && (
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-0 text-primary"
                          >
                            {expanded ? "Show less" : "Show full report"}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </Collapsible>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      No raw content uploaded.
                    </p>
                  )}

                  {summary && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Plain-Language Summary
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-3">
                        {a.summary || summary.presentLevels}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-6 py-3">
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5"
                    onClick={() => aiSummaryMutation.mutate(a.id)}
                    disabled={aiSummaryMutation.isPending && aiSummaryMutation.variables === a.id}
                  >
                    {aiSummaryMutation.isPending && aiSummaryMutation.variables === a.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {summary ? "Regenerate AI Summary" : "Generate AI Summary"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setSummarySheet(a)}
                    disabled={!summary}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Summary
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(a.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </CardFooter>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Summary Sheet */}
      <SummarySheet
        assessment={summarySheet}
        open={!!summarySheet}
        onOpenChange={(o) => !o && setSummarySheet(null)}
      />
    </div>
  );
}

function AddAssessmentDialog({
  onSubmit,
  loading,
}: {
  onSubmit: (v: {
    type: string;
    title: string;
    rawContent: string;
    uploadedBy: string;
  }) => void;
  loading: boolean;
}) {
  const [type, setType] = useState<string>("psychological");
  const [title, setTitle] = useState("");
  const [uploadedBy, setUploadedBy] = useState("Therapist");
  const [rawContent, setRawContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ type, title: title.trim(), uploadedBy: uploadedBy.trim() || "Therapist", rawContent });
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add Assessment</DialogTitle>
        <DialogDescription>
          Upload or paste an assessment report. You can generate a structured AI summary after saving.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assess-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="assess-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assess-uploaded">Uploaded By</Label>
            <Input
              id="assess-uploaded"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder="Therapist name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assess-title">Title</Label>
          <Input
            id="assess-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Psychological Evaluation 2024"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assess-raw">Report Content</Label>
          <Textarea
            id="assess-raw"
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            placeholder="Paste the full assessment report text here…"
            className="min-h-[200px] iep-scroll"
          />
          <p className="text-xs text-muted-foreground">
            Tip: paste narrative notes, observations, test scores, or recommendation text from the original report.
          </p>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading || !title.trim()} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving…" : "Save Assessment"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function SummarySheet({
  assessment,
  open,
  onOpenChange,
}: {
  assessment: Assessment | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const summary: AssessmentSummary | null = assessment?.aiSummary
    ? (() => {
        try {
          return JSON.parse(assessment.aiSummary) as AssessmentSummary;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Assessment Summary
          </SheetTitle>
          <SheetDescription>
            {assessment?.title} · {assessment ? format(new Date(assessment.createdAt), "MMM d, yyyy") : ""}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 iep-scroll">
          <div className="space-y-4 p-6">
            {summary ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {SUMMARY_FIELDS.map(({ key, label, icon: Icon }) => {
                  const text = summary[key] || "—";
                  return (
                    <Card key={key} className="overflow-hidden">
                      <CardHeader className="bg-muted/40 p-3 pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className="h-4 w-4 text-primary" />
                          {label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                          {text}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No structured summary yet. Generate one with the AI button on the assessment card.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">No assessments yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add a psychological, speech, OT, teacher or parent assessment. Paste the report text and
            let AI generate a structured, editable summary.
          </p>
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add your first assessment
        </Button>
      </CardContent>
    </GlassCard>
  );
}

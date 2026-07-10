"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { useActiveStudent } from "@/lib/use-active-student";
import { REPORT_TYPES } from "@/lib/constants";
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
import { MarkdownView } from "@/components/markdown-view";
import {
  FileText,
  Sparkles,
  Wand2,
  Copy,
  Download,
  Trash2,
  Eye,
  Loader2,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types + meta                                                         */
/* ------------------------------------------------------------------ */

interface Report {
  id: string;
  studentId: string;
  type: string;
  title: string;
  content: string;
  isAiGenerated: boolean;
  createdAt: string;
}

// Color-coded badge classes per report type — teal/emerald family
const TYPE_BADGE: Record<string, string> = {
  iep: "bg-primary/15 text-primary border-primary/30",
  progress: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "annual-review": "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30",
  "parent-meeting": "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  "teacher-report": "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-600/30",
  transition: "bg-teal-600/15 text-teal-600 dark:text-teal-400 border-teal-600/30",
  behaviour: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  "therapy-notes": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  psychological: "bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 border-cyan-600/30",
  accommodation: "bg-primary/15 text-primary border-primary/30",
};

function typeLabel(value: string): string {
  return REPORT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function typeBadgeClass(value: string): string {
  return TYPE_BADGE[value] ?? "bg-muted text-muted-foreground border-border";
}

/* ------------------------------------------------------------------ */
/* Main view                                                            */
/* ------------------------------------------------------------------ */

export function ReportsView() {
  const { studentId, student } = useActiveStudent();
  const queryClient = useQueryClient();
  const reportsKey = ["reports", studentId];

  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);
  const [deleteReport, setDeleteReport] = useState<Report | null>(null);

  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: reportsKey,
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/reports?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      return data.reports as Report[];
    },
    enabled: !!studentId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete report");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Report deleted");
      queryClient.invalidateQueries({ queryKey: reportsKey });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileText className="h-6 w-6 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">{student.name}</span>{" "}
                · generate, store and export professional documents
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate AI Report
            </Button>
          </DialogTrigger>
          <GenerateReportDialog
            studentId={studentId ?? ""}
            studentName={student?.name ?? "Student"}
            onClose={() => setGenerateOpen(false)}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: reportsKey });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <ReportsSkeleton />
      ) : reports.length === 0 ? (
        <EmptyReports onGenerate={() => setGenerateOpen(true)} studentName={student?.name} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onView={() => setViewReport(r)}
              onDelete={() => setDeleteReport(r)}
            />
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(v) => !v && setViewReport(null)}>
        <DialogContent className="max-w-3xl sm:max-w-3xl">
          {viewReport && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("border", typeBadgeClass(viewReport.type))}>
                    {typeLabel(viewReport.type)}
                  </Badge>
                  {viewReport.isAiGenerated && (
                    <Badge variant="outline" className="gap-1 text-primary border-primary/40">
                      <Sparkles className="h-3 w-3" />
                      AI Generated
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-lg">{viewReport.title}</DialogTitle>
                <DialogDescription>
                  Created {format(new Date(viewReport.createdAt), "d MMM yyyy · h:mm a")}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto iep-scroll rounded-lg border border-border bg-muted/20 p-4">
                <MarkdownView content={viewReport.content} className="text-sm leading-relaxed" />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => copyToClipboard(viewReport.content, viewReport.title)}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => downloadMarkdown(viewReport)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteReport}
        onOpenChange={(v) => !v && setDeleteReport(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{deleteReport?.title}”. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteReport) {
                  deleteMutation.mutate(deleteReport.id);
                  setDeleteReport(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report card                                                          */
/* ------------------------------------------------------------------ */

function ReportCard({
  report,
  onView,
  onDelete,
}: {
  report: Report;
  onView: () => void;
  onDelete: () => void;
}) {
  const preview = useMemo(() => buildPreview(report.content), [report.content]);
  const wordCount = useMemo(
    () => report.content.trim().split(/\s+/).filter(Boolean).length,
    [report.content],
  );

  return (
    <GlassCard className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn("border", typeBadgeClass(report.type))}>
              {typeLabel(report.type)}
            </Badge>
            {report.isAiGenerated && (
              <Badge variant="outline" className="gap-1 text-primary border-primary/40">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
            )}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {format(new Date(report.createdAt), "d MMM yyyy")}
          </span>
        </div>
        <CardTitle className="mt-2 line-clamp-2 text-base leading-snug">
          {report.title}
        </CardTitle>
        <CardDescription className="text-xs">
          {wordCount} words
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          {preview}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-1 border-t border-border pt-3">
        <Button size="sm" variant="ghost" className="gap-1.5" onClick={onView}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => copyToClipboard(report.content, report.title)}
            aria-label="Copy report"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => downloadMarkdown(report)}
            aria-label="Download report"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete report"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Generate AI report dialog                                            */
/* ------------------------------------------------------------------ */

function GenerateReportDialog({
  studentId,
  studentName,
  onClose,
  onSaved,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultTitle = `${typeLabel("iep")} — ${studentName} — ${format(new Date(), "d MMM yyyy")}`;
  const [reportType, setReportType] = useState("iep");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState(defaultTitle);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset title when report type changes (only if user hasn't customised heavily)
  React.useEffect(() => {
    setTitle(`${typeLabel(reportType)} — ${studentName} — ${format(new Date(), "d MMM yyyy")}`);
  }, [reportType, studentName]);

  async function handleGenerate() {
    if (!studentId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/report-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, reportType }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to generate report");
      }
      const data = await res.json();
      setContent(data.content ?? "");
      toast.success("Report generated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!studentId || !content) return;
    if (!title.trim()) {
      toast.error("Please provide a title");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          type: reportType,
          title: title.trim(),
          content,
          isAiGenerated: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save report");
      }
      toast.success("Report saved");
      onSaved();
      onClose();
      setContent("");
      setTitle(defaultTitle);
      setReportType("iep");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DialogContent className="max-h-[92vh] sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Generate AI Report
        </DialogTitle>
        <DialogDescription>
          Choose a report type, generate a draft from {studentName}&apos;s data, then save it to the library.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Type selector */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="report-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType} disabled={generating}>
              <SelectTrigger id="report-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-title">Title</Label>
            <Input
              id="report-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={generating}
              placeholder="Report title"
            />
          </div>
        </div>

        {/* Generate button */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {content ? "Regenerate" : "Generate Report"}
          </Button>
          {content && !generating && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copyToClipboard(content, title)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          )}
          {content && (
            <span className="ml-auto text-xs text-muted-foreground">
              {content.trim().split(/\s+/).filter(Boolean).length} words · preview below
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Preview */}
        <div className="max-h-[48vh] overflow-y-auto iep-scroll rounded-lg border border-border bg-muted/20 p-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">
                Generating {typeLabel(reportType).toLowerCase()} from student data…
              </p>
            </div>
          ) : content ? (
            <MarkdownView content={content} className="text-sm leading-relaxed" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 opacity-50" />
              <p className="text-sm">
                Pick a report type and click “Generate Report” to draft a Markdown document.
              </p>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!content || saving || generating} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save Report
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ------------------------------------------------------------------ */
/* Empty + skeleton                                                     */
/* ------------------------------------------------------------------ */

function EmptyReports({
  onGenerate,
  studentName,
}: {
  onGenerate: () => void;
  studentName?: string;
}) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            No reports yet{studentName ? ` for ${studentName}` : ""}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            Generate a professional IEP, progress, transition or accommodation report from
            the student&apos;s profile, goals and assessments. Save drafts to the library to
            view, copy or download later.
          </p>
        </div>
        <Button className="mt-2 gap-2" onClick={onGenerate}>
          <Wand2 className="h-4 w-4" />
          Generate your first AI report
        </Button>
      </CardContent>
    </GlassCard>
  );
}

function ReportsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-56" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function buildPreview(content: string): string {
  // Strip markdown markers and return a flat preview string.
  const lines = content.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (/^(#{1,6})\s+/.test(t)) {
      out.push(t.replace(/^#{1,6}\s+/, "") + ".");
    } else if (/^[-*+]\s+/.test(t)) {
      out.push(t.replace(/^[-*+]\s+/, ""));
    } else if (/^\d+\.\s+/.test(t)) {
      out.push(t.replace(/^\d+\.\s+/, ""));
    } else if (/^>\s?/.test(t)) {
      out.push(t.replace(/^>\s?/, ""));
    } else if (/^\|.*\|\s*$/.test(t)) {
      // skip table rows for preview readability
      continue;
    } else if (/^---+\s*$/.test(t)) {
      continue;
    } else {
      out.push(t);
    }
  }
  const flat = out.join(" ").replace(/[*`_>]/g, "");
  return flat.length > 240 ? flat.slice(0, 240) + "…" : flat;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`Copied “${label}” to clipboard`),
    () => toast.error("Could not copy to clipboard"),
  );
}

function downloadMarkdown(report: Report) {
  const safeName = report.title
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80) || "report";
  const blob = new Blob([report.content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Report downloaded");
}

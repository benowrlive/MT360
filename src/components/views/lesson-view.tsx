"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useActiveStudent } from "@/lib/use-active-student";
import { GOAL_DOMAINS } from "@/lib/constants";
import type { LessonPlan } from "@/lib/types";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  BookOpen,
  Wand2,
  Sparkles,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  Clock,
  Target,
  ListChecks,
  Palette,
  Lightbulb,
  PlayCircle,
  CheckCircle2,
  ClipboardCheck,
  Home,
  AlertCircle,
} from "lucide-react";

interface GoalOption {
  id: string;
  domain: string;
  annualGoal: string;
}

const DURATION_OPTIONS = ["20 min", "30 min", "45 min", "60 min"] as const;

const NONE_GOAL = "__none__";

function splitLines(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n|\u2022|[-*]\s+/) // split on newlines, bullets, dashes
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function lessonToMarkdown(lesson: LessonPlan, studentName?: string): string {
  const materials = splitLines(lesson.materials);
  const aids = splitLines(lesson.teachingAids);
  const visuals = splitLines(lesson.visualSupports);

  const block = [
    `# ${lesson.title || "Lesson Plan"}`,
    "",
    studentName ? `**Student:** ${studentName}` : null,
    `**Duration:** ${lesson.duration || "30 min"}`,
    "",
    "## Objective",
    lesson.objective || "—",
    "",
    materials.length
      ? `## Materials\n${materials.map((m) => `- ${m}`).join("\n")}\n`
      : null,
    aids.length
      ? `## Teaching Aids\n${aids.map((m) => `- ${m}`).join("\n")}\n`
      : null,
    visuals.length
      ? `## Visual Supports\n${visuals.map((m) => `- ${m}`).join("\n")}\n`
      : null,
    "## Introduction",
    lesson.introduction || "—",
    "",
    "## Main Activity",
    lesson.mainActivity || "—",
    "",
    "## Differentiation",
    lesson.differentiation || "—",
    "",
    "## Assessment",
    lesson.assessment || "—",
    "",
    "## Homework",
    lesson.homework || "—",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return block;
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function LessonView() {
  const { studentId, student } = useActiveStudent();

  const [topic, setTopic] = useState("");
  const [goalId, setGoalId] = useState<string>(NONE_GOAL);
  const [domain, setDomain] = useState<string>(GOAL_DOMAINS[0]);
  const [duration, setDuration] =
    useState<(typeof DURATION_OPTIONS)[number]>("30 min");
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  const goalsQuery = useQuery<GoalOption[]>({
    queryKey: ["goals", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/goals?studentId=${studentId}`);
      if (!res.ok) throw new Error("Failed to load goals");
      const data = await res.json();
      return (data.goals as GoalOption[]).map((g) => ({
        id: g.id,
        domain: g.domain,
        annualGoal: g.annualGoal,
      }));
    },
    enabled: !!studentId,
  });

  const goalSelected = goalId !== NONE_GOAL;

  const handleGenerate = async () => {
    if (!studentId || !student) return;
    setGenerating(true);
    setLesson(null);
    try {
      const res = await fetch("/api/ai/lesson-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          goalId: goalSelected ? goalId : undefined,
          domain: goalSelected ? undefined : domain,
          topic: topic.trim() || undefined,
          duration,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate lesson");
      }
      const data = (await res.json()) as { lesson: LessonPlan };
      setLesson(data.lesson);
      toast.success("Lesson plan generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lesson generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setLesson(null);
    setTopic("");
    setGoalId(NONE_GOAL);
    setDomain(GOAL_DOMAINS[0]);
    setDuration("30 min");
  };

  const handleCopy = async () => {
    if (!lesson) return;
    try {
      await navigator.clipboard.writeText(
        lessonToMarkdown(lesson, student?.name),
      );
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleDownload = () => {
    if (!lesson) return;
    const slug =
      (lesson.title || "lesson")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "lesson";
    downloadMarkdown(
      `${slug}.md`,
      lessonToMarkdown(lesson, student?.name),
    );
    toast.success("Downloaded lesson plan");
  };

  const materials = useMemo(() => splitLines(lesson?.materials), [lesson]);
  const teachingAids = useMemo(
    () => splitLines(lesson?.teachingAids),
    [lesson],
  );
  const visualSupports = useMemo(
    () => splitLines(lesson?.visualSupports),
    [lesson],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BookOpen className="h-6 w-6 text-primary" />
          Lesson Planner
        </h1>
        <p className="text-sm text-muted-foreground">
          {student ? (
            <>
              <span className="font-medium text-foreground">{student.name}</span>{" "}
              · AI-differentiated lessons aligned to goals &amp; curriculum
            </>
          ) : (
            "Loading student…"
          )}
        </p>
      </div>

      {/* Generation form */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wand2 className="h-4 w-4 text-primary" />
            Generate a Lesson
          </CardTitle>
          <CardDescription>
            Pick a goal or domain, optionally add a topic, and the AI will draft
            a differentiated, multisensory lesson plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="lesson-topic">Topic / Subject (optional)</Label>
            <Input
              id="lesson-topic"
              placeholder='e.g. "Addition with regrouping"'
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={generating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-goal">Goal</Label>
            <Select
              value={goalId}
              onValueChange={(v) => setGoalId(v)}
              disabled={generating}
            >
              <SelectTrigger id="lesson-goal" className="w-full">
                <SelectValue placeholder="Select a goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_GOAL}>
                  None / Custom domain
                </SelectItem>
                {goalsQuery.isLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Loading goals…
                  </SelectItem>
                ) : goalsQuery.data && goalsQuery.data.length > 0 ? (
                  goalsQuery.data.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="mr-2 inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {g.domain}
                      </span>
                      <span className="line-clamp-1">
                        {g.annualGoal}
                      </span>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__empty__" disabled>
                    No goals yet — use custom domain
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lesson-domain">Domain</Label>
            <Select
              value={domain}
              onValueChange={setDomain}
              disabled={generating || goalSelected}
            >
              <SelectTrigger id="lesson-domain" className="w-full">
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_DOMAINS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {goalSelected
                ? "Using the selected goal's domain."
                : "Used when no specific goal is selected."}
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="lesson-duration">Duration</Label>
            <Select
              value={duration}
              onValueChange={(v) =>
                setDuration(v as (typeof DURATION_OPTIONS)[number])
              }
              disabled={generating}
            >
              <SelectTrigger id="lesson-duration" className="w-full sm:w-48">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/30">
          <Button
            onClick={handleGenerate}
            disabled={generating || !studentId}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Generating…" : "Generate Lesson"}
          </Button>
          {lesson && !generating && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate Another
            </Button>
          )}
        </CardFooter>
      </GlassCard>

      {/* Output */}
      {generating ? (
        <LessonSkeleton />
      ) : lesson ? (
        <LessonCard
          lesson={lesson}
          materials={materials}
          teachingAids={teachingAids}
          visualSupports={visualSupports}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onAnother={handleReset}
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function LessonSkeleton() {
  return (
    <GlassCard>
      <CardHeader>
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </GlassCard>
  );
}

function EmptyState() {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">No lesson generated yet</h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Configure your lesson above and click <strong>Generate Lesson</strong>{" "}
            to produce a differentiated, multisensory plan tailored to the
            student&apos;s grade, curriculum and learning style.
          </p>
        </div>
      </CardContent>
    </GlassCard>
  );
}

function LessonCard({
  lesson,
  materials,
  teachingAids,
  visualSupports,
  onCopy,
  onDownload,
  onAnother,
}: {
  lesson: LessonPlan;
  materials: string[];
  teachingAids: string[];
  visualSupports: string[];
  onCopy: () => void;
  onDownload: () => void;
  onAnother: () => void;
}) {
  return (
    <GlassCard className="iep-fade-in overflow-hidden">
      <CardHeader className="gap-3 border-b bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-primary/40 text-primary"
              >
                <Sparkles className="h-3 w-3" />
                AI-Generated
              </Badge>
              {lesson.duration && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-primary/10 text-primary"
                >
                  <Clock className="h-3 w-3" />
                  {lesson.duration}
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl leading-snug sm:text-2xl">
              {lesson.title || "Untitled Lesson"}
            </CardTitle>
            {lesson.objective && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <span className="font-semibold text-foreground">
                    Objective:{" "}
                  </span>
                  {lesson.objective}
                </span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Lists: materials / teaching aids / visual supports */}
        <div className="grid gap-4 md:grid-cols-3">
          <ListBlock
            icon={ListChecks}
            label="Materials"
            items={materials}
            emptyText="No materials specified"
          />
          <ListBlock
            icon={Palette}
            label="Teaching Aids"
            items={teachingAids}
            emptyText="No teaching aids specified"
          />
          <ListBlock
            icon={Lightbulb}
            label="Visual Supports"
            items={visualSupports}
            emptyText="No visual supports specified"
          />
        </div>

        <Separator />

        {/* Prose sections */}
        <ProseBlock
          icon={PlayCircle}
          label="Introduction"
          text={lesson.introduction}
        />
        <ProseBlock
          icon={BookOpen}
          label="Main Activity"
          text={lesson.mainActivity}
        />
        <ProseBlock
          icon={Wand2}
          label="Differentiation"
          text={lesson.differentiation}
          accent
        />
        <ProseBlock
          icon={ClipboardCheck}
          label="Assessment"
          text={lesson.assessment}
        />
        <ProseBlock icon={Home} label="Homework" text={lesson.homework} />
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2 border-t bg-muted/30">
        <Button onClick={onCopy} variant="default" className="gap-2">
          <Copy className="h-4 w-4" />
          Copy Lesson
        </Button>
        <Button onClick={onDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download .md
        </Button>
        <Button onClick={onAnother} variant="ghost" className="ml-auto gap-2">
          <RefreshCw className="h-4 w-4" />
          Generate Another
        </Button>
      </CardFooter>
    </GlassCard>
  );
}

function ListBlock({
  icon: Icon,
  label,
  items,
  emptyText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1.5 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
              <span className="text-foreground/90">{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs italic text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function ProseBlock({
  icon: Icon,
  label,
  text,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border p-4",
        accent && "border-primary/30 bg-primary/5",
      )}
    >
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </h3>
      {text && text.trim() ? (
        <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 iep-scroll">
          {text.trim()}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          Not specified for this lesson.
        </p>
      )}
    </section>
  );
}

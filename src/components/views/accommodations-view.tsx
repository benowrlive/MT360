"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useActiveStudent } from "@/lib/use-active-student";
import { ACCOMMODATION_CATEGORIES } from "@/lib/constants";
import type { AccommodationSet } from "@/lib/types";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import {
  School,
  FileCheck,
  MessageSquare,
  Building2,
  Laptop,
  Ear,
  Hand,
  Heart,
  Sparkles,
  Loader2,
  Copy,
  ClipboardList,
  ListChecks,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

type CategoryIcon = React.ComponentType<{ className?: string }>;

const CATEGORY_META: Record<
  string,
  { icon: CategoryIcon; accent: string }
> = {
  "Classroom Accommodations": {
    icon: School,
    accent: "bg-teal-500/15 text-teal-600 dark:text-teal-300",
  },
  "Exam Accommodations": {
    icon: FileCheck,
    accent: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  "Communication Supports": {
    icon: MessageSquare,
    accent: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-300",
  },
  "Environmental Modifications": {
    icon: Building2,
    accent: "bg-green-500/15 text-green-600 dark:text-green-300",
  },
  "Technology Supports": {
    icon: Laptop,
    accent: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
  },
  "Sensory Accommodations": {
    icon: Ear,
    accent: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
  },
  "Behaviour Supports": {
    icon: Heart,
    accent: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
  },
};

function metaFor(category: string) {
  return (
    CATEGORY_META[category] ?? {
      icon: ShieldCheck,
      accent: "bg-primary/15 text-primary",
    }
  );
}

export function AccommodationsView() {
  const { studentId, student } = useActiveStudent();

  const [accommodations, setAccommodations] = useState<AccommodationSet[]>(
    [],
  );
  const [generating, setGenerating] = useState(false);
  // checkedMap: category -> Set<number> of selected item indexes
  const [checkedMap, setCheckedMap] = useState<
    Record<string, Set<number>>
  >({});

  const handleGenerate = async () => {
    if (!studentId || !student) return;
    setGenerating(true);
    setAccommodations([]);
    setCheckedMap({});
    try {
      const res = await fetch("/api/ai/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate accommodations");
      }
      const data = (await res.json()) as { accommodations: AccommodationSet[] };
      setAccommodations(data.accommodations ?? []);
      toast.success("Accommodations generated");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Accommodations generation failed",
      );
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = (category: string, idx: number) => {
    setCheckedMap((prev) => {
      const next: Record<string, Set<number>> = {};
      for (const k of Object.keys(prev)) {
        next[k] = new Set(prev[k]);
      }
      const set = next[category] ?? new Set<number>();
      if (set.has(idx)) set.delete(idx);
      else set.add(idx);
      next[category] = set;
      return next;
    });
  };

  const toggleAll = (category: string, items: string[]) => {
    setCheckedMap((prev) => {
      const next: Record<string, Set<number>> = {};
      for (const k of Object.keys(prev)) {
        next[k] = new Set(prev[k]);
      }
      const allSelected =
        (next[category]?.size ?? 0) === items.length && items.length > 0;
      next[category] = allSelected
        ? new Set<number>()
        : new Set(items.map((_, i) => i));
      return next;
    });
  };

  const totalItems = useMemo(
    () => accommodations.reduce((sum, c) => sum + c.items.length, 0),
    [accommodations],
  );

  const selectedCount = useMemo(
    () =>
      Object.values(checkedMap).reduce((sum, s) => sum + s.size, 0),
    [checkedMap],
  );

  const selectionProgress =
    totalItems > 0 ? Math.round((selectedCount / totalItems) * 100) : 0;

  const handleCopyCategory = async (
    category: string,
    items: string[],
    selected: Set<number>,
  ) => {
    const list =
      selected.size > 0
        ? items.filter((_, i) => selected.has(i))
        : items;
    if (list.length === 0) {
      toast.error("Nothing to copy");
      return;
    }
    const text = `${category}\n${list.map((it) => `• ${it}`).join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(
        `Copied ${list.length} ${list.length === 1 ? "item" : "items"}`,
      );
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyAllSelected = async () => {
    if (selectedCount === 0) {
      toast.error("No accommodations selected");
      return;
    }
    const lines: string[] = [];
    for (const cat of accommodations) {
      const selected = checkedMap[cat.category];
      if (!selected || selected.size === 0) continue;
      lines.push(cat.category);
      for (const item of cat.items.filter((_, i) => selected.has(i))) {
        lines.push(`• ${item}`);
      }
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      toast.success(`Copied ${selectedCount} accommodations`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyAll = async () => {
    if (totalItems === 0) {
      toast.error("Nothing to copy");
      return;
    }
    const lines: string[] = [];
    for (const cat of accommodations) {
      lines.push(cat.category);
      for (const item of cat.items) {
        lines.push(`• ${item}`);
      }
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
      toast.success(`Copied all ${totalItems} accommodations`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Accommodations
          </h1>
          <p className="text-sm text-muted-foreground">
            {student ? (
              <>
                <span className="font-medium text-foreground">
                  {student.name}
                </span>{" "}
                · AI-suggested supports across 7 categories
              </>
            ) : (
              "Loading student…"
            )}
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating || !studentId}
          className="gap-2"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : accommodations.length === 0 ? (
            <Sparkles className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating
            ? "Generating…"
            : accommodations.length === 0
              ? "Generate Accommodations"
              : "Regenerate"}
        </Button>
      </div>

      {/* Output */}
      {generating ? (
        <AccommodationsSkeleton />
      ) : accommodations.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Summary bar */}
          <GlassCard className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {selectedCount} of {totalItems} accommodations selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tick the items you want to include in the IEP, then copy.
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
                <Progress value={selectionProgress} className="h-2" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{selectionProgress}% selected</span>
                  <span>{ACCOMMODATION_CATEGORIES.length} categories</span>
                </div>
              </div>
            </CardContent>
          </GlassCard>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleCopyAllSelected}
              variant="default"
              className="gap-2"
              disabled={selectedCount === 0}
            >
              <ClipboardList className="h-4 w-4" />
              Copy All Selected
              {selectedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-primary-foreground/20 text-primary-foreground"
                >
                  {selectedCount}
                </Badge>
              )}
            </Button>
            <Button
              onClick={handleCopyAll}
              variant="outline"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy All
            </Button>
          </div>

          {/* Category grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {accommodations.map((cat) => {
              const selected = checkedMap[cat.category] ?? new Set<number>();
              return (
                <CategoryCard
                  key={cat.category}
                  category={cat.category}
                  items={cat.items}
                  selected={selected}
                  onToggle={(idx) => toggleItem(cat.category, idx)}
                  onToggleAll={() => toggleAll(cat.category, cat.items)}
                  onCopy={() =>
                    handleCopyCategory(cat.category, cat.items, selected)
                  }
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function AccommodationsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ACCOMMODATION_CATEGORIES.map((c) => (
        <GlassCard key={c}>
          <CardHeader>
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            No accommodations generated yet
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Click <strong>Generate Accommodations</strong> to produce a
            comprehensive set of supports across{" "}
            {ACCOMMODATION_CATEGORIES.length} categories, tailored to the
            student&apos;s diagnosis, learning style and needs.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {ACCOMMODATION_CATEGORIES.map((c) => {
            const Icon = metaFor(c).icon;
            return (
              <Badge
                key={c}
                variant="outline"
                className="gap-1 border-primary/30 text-primary"
              >
                <Icon className="h-3 w-3" />
                {c}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}

function CategoryCard({
  category,
  items,
  selected,
  onToggle,
  onToggleAll,
  onCopy,
}: {
  category: string;
  items: string[];
  selected: Set<number>;
  onToggle: (idx: number) => void;
  onToggleAll: () => void;
  onCopy: () => void;
}) {
  const meta = metaFor(category);
  const Icon = meta.icon;
  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <GlassCard className="iep-fade-in flex flex-col">
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                meta.accent,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{category}</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary"
            title={`${selected.size} of ${items.length} selected`}
          >
            {selected.size}/{items.length}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {items.length === 0
            ? "No items generated for this category."
            : `${items.length} ${items.length === 1 ? "item" : "items"} · ${selected.size} selected`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {items.length === 0 ? (
          <p className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
            <AlertCircle className="h-3 w-3" />
            No accommodations returned for this category.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, idx) => {
              const checked = selected.has(idx);
              return (
                <li key={idx}>
                  <label
                    htmlFor={`acc-${category}-${idx}`}
                    className={cn(
                      "group flex cursor-pointer items-start gap-2.5 rounded-md border border-transparent p-2 transition-colors hover:bg-muted/60",
                      checked && "border-primary/30 bg-primary/5",
                    )}
                  >
                    <Checkbox
                      id={`acc-${category}-${idx}`}
                      checked={checked}
                      onCheckedChange={() => onToggle(idx)}
                      className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary"
                      aria-label={item}
                    />
                    <span
                      className={cn(
                        "text-sm leading-snug text-foreground/90",
                        checked && "text-foreground",
                      )}
                    >
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-2 border-t bg-muted/30 py-2.5">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleAll}
          disabled={items.length === 0}
          className="gap-1.5 text-xs"
        >
          {allSelected ? "Clear all" : "Select all"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopy}
          disabled={items.length === 0}
          className="ml-auto gap-1.5 text-xs"
        >
          <Copy className="h-3 w-3" />
          {selected.size > 0 ? "Copy selected" : "Copy category"}
        </Button>
      </CardFooter>
    </GlassCard>
  );
}

"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  CURRICULA,
  DIAGNOSES,
  ageFromDob,
  avatarColorFor,
  initials,
} from "@/lib/constants";
import { StudentFormDialog } from "@/components/student-form-dialog";
import type { ActiveStudent } from "@/lib/use-active-student";
import {
  Search,
  Plus,
  Users,
  Trash2,
  Pencil,
  X,
  Filter,
  GraduationCap,
  Target,
  School,
  User as UserIcon,
  ChevronRight,
  Inbox,
} from "lucide-react";

interface StudentListItem extends ActiveStudent {
  _count?: { goals?: number; assessments?: number; reports?: number };
}

async function fetchStudents(): Promise<StudentListItem[]> {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error("Failed to load students");
  const data = await res.json();
  return (data.students ?? []) as StudentListItem[];
}

export function StudentsView({ initialMode }: { initialMode?: "search" }) {
  const isSearchMode = initialMode === "search";
  const openStudent = useAppStore((s) => s.openStudent);

  const [search, setSearch] = React.useState("");
  const [curriculum, setCurriculum] = React.useState<string>("all");
  const [diagnosesFilter, setDiagnosesFilter] = React.useState<string[]>([]);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] =
    React.useState<ActiveStudent | null>(null);

  const [deleteTarget, setDeleteTarget] =
    React.useState<StudentListItem | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });

  const students = data ?? [];

  // Filter logic
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (curriculum !== "all" && s.curriculum !== curriculum) return false;
      if (diagnosesFilter.length > 0) {
        const has = diagnosesFilter.every((d) => s.diagnosis?.includes(d));
        if (!has) return false;
      }
      if (!q) return true;
      const haystack = [
        s.name,
        s.school,
        s.grade,
        s.parentName,
        s.learningStyle,
        s.languages,
        ...(s.diagnosis ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [students, search, curriculum, diagnosesFilter]);

  const handleAdd = () => {
    setEditingStudent(null);
    setFormOpen(true);
  };

  const handleEdit = (s: StudentListItem) => {
    setEditingStudent(s as ActiveStudent);
    setFormOpen(true);
  };

  const handleOpen = (s: StudentListItem) => {
    openStudent(s.id, "profile");
  };

  const hasActiveFilters =
    search.trim() !== "" || curriculum !== "all" || diagnosesFilter.length > 0;

  const clearFilters = () => {
    setSearch("");
    setCurriculum("all");
    setDiagnosesFilter([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="h-6 w-6 text-primary" />
            {isSearchMode ? "Search Students" : "Students"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSearchMode
              ? "Find students across your caseload by name, diagnosis, school or learning style."
              : "Manage your student roster. Open a student to access their full IEP workspace."}
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Search & filters */}
      {isSearchMode ? (
        <GlassCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, diagnosis, school, grade, parent, learning style…"
                className="h-14 pl-12 pr-4 text-base shadow-sm"
                aria-label="Search students"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <FilterRow
              curriculum={curriculum}
              onCurriculumChange={setCurriculum}
              diagnosesFilter={diagnosesFilter}
              onDiagnosesChange={setDiagnosesFilter}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>
                {isLoading
                  ? "Loading…"
                  : `${filtered.length} of ${students.length} student${
                      students.length === 1 ? "" : "s"
                    } match`}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students…"
              className="pl-9"
              aria-label="Search students"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <FilterRow
            curriculum={curriculum}
            onCurriculumChange={setCurriculum}
            diagnosesFilter={diagnosesFilter}
            onDiagnosesChange={setDiagnosesFilter}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <GlassCard className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load students.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </GlassCard>
      )}

      {/* Loading state */}
      {isLoading && <StudentGridSkeleton />}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} onAdd={handleAdd} totalStudents={students.length} />
      )}

      {/* Grid */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label="Students"
        >
          {filtered.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              onOpen={() => handleOpen(s)}
              onEdit={() => handleEdit(s)}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editingStudent}
      />

      {/* Delete confirmation */}
      <DeleteStudentDialog
        student={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      />
    </div>
  );
}

/* ---------- Filter Row ---------- */

function FilterRow({
  curriculum,
  onCurriculumChange,
  diagnosesFilter,
  onDiagnosesChange,
  onClear,
  hasActiveFilters,
}: {
  curriculum: string;
  onCurriculumChange: (v: string) => void;
  diagnosesFilter: string[];
  onDiagnosesChange: (v: string[]) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={curriculum} onValueChange={onCurriculumChange}>
        <SelectTrigger className="h-9 w-[170px]" aria-label="Filter by curriculum">
          <School className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <SelectValue placeholder="Curriculum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All curricula</SelectItem>
          {CURRICULA.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DiagnosisFilter
        value={diagnosesFilter}
        onChange={onDiagnosesChange}
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 gap-1.5 text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

function DiagnosisFilter({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const toggle = (d: string) => {
    if (value.includes(d)) onChange(value.filter((x) => x !== d));
    else onChange([...value, d]);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className="h-9 gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          Diagnosis
          {value.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 px-1.5 text-[10px] bg-primary/15 text-primary"
            >
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <ScrollArea className="h-72">
          <div className="p-1">
            {DIAGNOSES.map((d) => {
              const checked = value.includes(d);
              return (
                <label
                  key={d}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                    checked && "bg-accent/60",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(d)}
                    className="mt-0.5"
                  />
                  <span className="leading-snug">{d}</span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
        {value.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => onChange([])}
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ---------- Student Card ---------- */

function StudentCard({
  student,
  onOpen,
  onEdit,
  onDelete,
}: {
  student: StudentListItem;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const age = student.dob ? ageFromDob(student.dob) : null;
  const goalCount = student._count?.goals ?? 0;
  const diag = student.diagnosis ?? [];
  const visibleDiag = diag.slice(0, 2);
  const extraDiag = Math.max(0, diag.length - visibleDiag.length);
  const color = student.avatarColor || avatarColorFor(student.id);

  return (
    <GlassCard
      className="group relative gap-0 py-0 transition-all hover:shadow-md hover:border-primary/40"
    >
      {/* Top color stripe */}
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <CardContent className="p-4 pt-4 space-y-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={`Open ${student.name}'s profile`}
          >
            <Avatar className="h-12 w-12 border">
              <AvatarFallback
                style={{ backgroundColor: color, color: "white" }}
                className="text-sm font-semibold"
              >
                {initials(student.name)}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onOpen}
              className="block text-left w-full group-hover:text-primary transition-colors"
            >
              <h3 className="truncate font-semibold leading-tight">
                {student.name}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {age !== null && <span>{age}y</span>}
                {age !== null && student.grade && <span>·</span>}
                {student.grade && <span>{student.grade}</span>}
                {student.gender && (
                  <>
                    <span>·</span>
                    <span>{student.gender}</span>
                  </>
                )}
              </div>
            </button>
          </div>

          <CardActions onEdit={onEdit} onDelete={onDelete} />
        </div>

        {/* School + curriculum */}
        <div className="space-y-1 text-sm">
          {student.school ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <School className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{student.school}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/70 italic text-xs">
              <School className="h-3.5 w-3.5 shrink-0" />
              <span>No school listed</span>
            </div>
          )}
          {student.parentName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{student.parentName}</span>
            </div>
          )}
        </div>

        {/* Diagnosis badges */}
        {diag.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {visibleDiag.map((d) => (
              <Tooltip key={d}>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 max-w-[180px]"
                  >
                    <span className="truncate">{shortDiagnosis(d)}</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{d}</TooltipContent>
              </Tooltip>
            ))}
            {extraDiag > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-muted-foreground">
                    +{extraDiag}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {diag.slice(visibleDiag.length).join(", ")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="text-muted-foreground/70">
            No diagnosis on file
          </Badge>
        )}

        <Separator />

        {/* Footer stats */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1" title="Goals">
              <Target className="h-3.5 w-3.5 text-primary/70" />
              {goalCount} {goalCount === 1 ? "goal" : "goals"}
            </span>
            {student.curriculum && (
              <Badge
                variant="outline"
                className="text-[10px] font-normal gap-1 px-1.5"
              >
                <GraduationCap className="h-3 w-3" />
                {student.curriculum}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpen}
            className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10"
          >
            Open
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </GlassCard>
  );
}

function CardActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit student"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete student"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}

/* ---------- Delete Dialog ---------- */

function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
}: {
  student: StudentListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!open) setDeleting(false);
  }, [open]);

  const handleConfirm = async () => {
    if (!student) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete student");
      }
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // remove from cache if present
      queryClient.removeQueries({ queryKey: ["student", student.id] });
      toast.success(`${student.name} deleted`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete student</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {student?.name}
                </span>
                ? This will also remove all associated assessments, goals,
                therapy sessions, behaviour plans, progress records and reports.
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90 gap-2"
          >
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ---------- Empty State ---------- */

function EmptyState({
  hasActiveFilters,
  onClear,
  onAdd,
  totalStudents,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
  onAdd: () => void;
  totalStudents: number;
}) {
  return (
    <GlassCard className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Inbox className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold">
          {hasActiveFilters
            ? "No students match your filters"
            : totalStudents === 0
              ? "No students yet"
              : "No students found"}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasActiveFilters
            ? "Try adjusting your search terms or clearing filters to see more students."
            : totalStudents === 0
              ? "Get started by adding your first student to the caseload."
              : "Try a different search term."}
        </p>
        <div className="mt-2 flex gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
          {totalStudents === 0 && (
            <Button size="sm" onClick={onAdd} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Student
            </Button>
          )}
        </div>
      </CardContent>
    </GlassCard>
  );
}

/* ---------- Skeleton ---------- */

function StudentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <GlassCard key={i} className="gap-0 py-0">
          <Skeleton className="h-1.5 w-full rounded-t-xl rounded-b-none" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </GlassCard>
      ))}
    </div>
  );
}

/* ---------- helpers ---------- */

function shortDiagnosis(d: string): string {
  // acronym-style shortening for compact display
  const known: Record<string, string> = {
    "Autism Spectrum Disorder (ASD)": "ASD",
    ADHD: "ADHD",
    "Intellectual Disability": "Intellectual Disability",
    "Down Syndrome": "Down Syndrome",
    "Cerebral Palsy": "Cerebral Palsy",
    "Global Developmental Delay": "GDD",
    "Learning Disability": "Learning Disability",
    "Emotional Behaviour Disorder": "EBD",
    "Hearing Impairment": "Hearing",
    "Visual Impairment": "Visual",
    "Multiple Disabilities": "Multiple",
    "Gifted with Learning Needs (Twice Exceptional)": "2e",
  };
  return known[d] ?? d;
}

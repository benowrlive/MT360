"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useActiveStudent } from "@/lib/use-active-student";
import { ageFromDob, initials } from "@/lib/constants";
import { StudentFormDialog } from "@/components/student-form-dialog";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  CalendarDays,
  School,
  GraduationCap,
  Languages,
  Sparkles,
  Stethoscope,
  AlertTriangle,
  Pill,
  Activity,
  Heart,
  Users,
  ShieldAlert,
  BookOpen,
  Star,
  User as UserIcon,
  Cake,
} from "lucide-react";

export function ProfileView() {
  const { student, studentId, isLoading, isError, setView } = useActiveStudent();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !student) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Student not available</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t load this student&apos;s profile. They may have been
            removed or there was a network error.
          </p>
        </div>
        <Button variant="outline" onClick={() => setView("students")}>
          Back to Students
        </Button>
      </div>
    );
  }

  const age = student.dob ? ageFromDob(student.dob) : null;
  const dobFormatted = student.dob
    ? safeFormat(student.dob, "d MMM yyyy")
    : "—";
  const color = student.avatarColor || "#0d9488";

  const handleDelete = async () => {
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
      queryClient.removeQueries({ queryKey: ["student", student.id] });
      toast.success(`${student.name} deleted`);
      setView("students");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete student");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <GlassCard className="overflow-hidden">
        {/* gradient banner */}
        <div
          className="h-24 w-full"
          style={{
            background: `linear-gradient(135deg, ${color}40 0%, ${color}15 50%, transparent 100%)`,
          }}
          aria-hidden
        />
        <CardContent className="-mt-12 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <Avatar
                className="h-24 w-24 border-4 border-background shadow-md"
                style={{ backgroundColor: color }}
              >
                <AvatarFallback
                  style={{ backgroundColor: color, color: "white" }}
                  className="text-2xl font-bold"
                >
                  {initials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {student.name}
                  </h1>
                  {student.curriculum && (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary border-primary/20 gap-1"
                    >
                      <GraduationCap className="h-3 w-3" />
                      {student.curriculum}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {age !== null && (
                    <span className="flex items-center gap-1">
                      <Cake className="h-3.5 w-3.5" />
                      {age} years old
                    </span>
                  )}
                  {student.grade && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {student.grade}
                    </span>
                  )}
                  {student.gender && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-3.5 w-3.5" />
                      {student.gender}
                    </span>
                  )}
                  {student.school && (
                    <span className="flex items-center gap-1">
                      <School className="h-3.5 w-3.5" />
                      {student.school}
                    </span>
                  )}
                </div>
                {student.diagnosis && student.diagnosis.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {student.diagnosis.map((d) => (
                      <Tooltip key={d}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-primary/20 max-w-[220px]"
                          >
                            <span className="truncate">{d}</span>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{d}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setFormOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Info grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Student Information */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-primary" />
              Student Information
            </CardTitle>
            <CardDescription>
              Demographic and academic details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoItem
                label="Date of Birth"
                value={dobFormatted}
                icon={<CalendarDays className="h-3.5 w-3.5" />}
              />
              <InfoItem
                label="Age"
                value={age !== null ? `${age} years` : "—"}
              />
              <InfoItem label="Gender" value={student.gender || "—"} />
              <InfoItem label="Grade" value={student.grade || "—"} />
              <InfoItem
                label="School"
                value={student.school || "—"}
                icon={<School className="h-3.5 w-3.5" />}
                fullWidth
              />
              <InfoItem
                label="Languages"
                value={student.languages || "—"}
                icon={<Languages className="h-3.5 w-3.5" />}
                fullWidth
              />
              <InfoItem
                label="Curriculum"
                value={student.curriculum || "—"}
                icon={<GraduationCap className="h-3.5 w-3.5" />}
              />
              <InfoItem
                label="Learning Style"
                value={student.learningStyle || "—"}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              />
            </dl>
          </CardContent>
        </GlassCard>

        {/* Medical Profile */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-primary" />
              Medical Profile
            </CardTitle>
            <CardDescription>
              Conditions, allergies, therapies and medications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AllergyCallout allergies={student.allergies} />
            <InfoBlock
              label="Medical Conditions"
              value={student.medicalConditions}
              icon={<Stethoscope className="h-3.5 w-3.5" />}
            />
            <Separator />
            <InfoBlock
              label="Current Therapies"
              value={student.currentTherapies}
              icon={<Activity className="h-3.5 w-3.5" />}
            />
            <Separator />
            <InfoBlock
              label="Medications"
              value={student.medications}
              icon={<Pill className="h-3.5 w-3.5" />}
            />
          </CardContent>
        </GlassCard>

        {/* Family & Contacts */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="h-4 w-4 text-primary" />
              Family & Contacts
            </CardTitle>
            <CardDescription>
              Parent or guardian contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <InfoItem
                label="Parent / Guardian"
                value={student.parentName || "—"}
                icon={<Users className="h-3.5 w-3.5" />}
                fullWidth
              />
              <InfoItem
                label="Email"
                value={
                  student.parentEmail ? (
                    <a
                      href={`mailto:${student.parentEmail}`}
                      className="text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {student.parentEmail}
                    </a>
                  ) : (
                    "—"
                  )
                }
                fullWidth
              />
              <InfoItem
                label="Phone"
                value={
                  student.parentPhone ? (
                    <a
                      href={`tel:${student.parentPhone.replace(/\s+/g, "")}`}
                      className="text-primary hover:underline inline-flex items-center gap-1.5"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {student.parentPhone}
                    </a>
                  ) : (
                    "—"
                  )
                }
                fullWidth
              />
            </dl>
          </CardContent>
        </GlassCard>

        {/* Strengths & Interests */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-primary" />
              Strengths & Interests
            </CardTitle>
            <CardDescription>
              Leverage these in planning and instruction.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoBlock
              label="Strengths"
              value={student.strengths}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              accent
            />
            <Separator />
            <InfoBlock
              label="Interests"
              value={student.interests}
              icon={<Heart className="h-3.5 w-3.5" />}
              accent
            />
          </CardContent>
        </GlassCard>
      </div>

      {/* Edit dialog */}
      <StudentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        student={student}
        onSaved={(s) => {
          // Force refetch of active-student detail
          queryClient.invalidateQueries({ queryKey: ["student", s.id] });
          queryClient.invalidateQueries({ queryKey: ["students"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }}
      />

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Are you sure you want to permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    {student.name}
                  </span>
                  ? This will also remove all associated assessments, goals,
                  therapy sessions, behaviour plans, progress records and
                  reports.
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
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 gap-2"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- helpers ---------- */

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    try {
      return format(new Date(iso), pattern);
    } catch {
      return iso;
    }
  }
}

function InfoItem({
  label,
  value,
  icon,
  fullWidth,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground break-words">
        {value === "" || value === null || value === undefined ? "—" : value}
      </dd>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  const text =
    value && value.trim() ? (
      value.split("\n").map((line, i) => (
        <p key={i} className="leading-relaxed">
          {line}
        </p>
      ))
    ) : (
      <span className="text-muted-foreground/70 italic">Not specified</span>
    );
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={
          accent
            ? "mt-1.5 text-sm text-foreground space-y-1 rounded-md bg-primary/5 border border-primary/10 p-3"
            : "mt-1.5 text-sm text-foreground space-y-1"
        }
      >
        {text}
      </div>
    </div>
  );
}

function AllergyCallout({ allergies }: { allergies: string }) {
  if (!allergies || !allergies.trim()) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
    >
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Allergies — Use Caution
        </div>
        <div className="mt-0.5 text-sm text-foreground whitespace-pre-wrap break-words">
          {allergies}
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <GlassCard className="overflow-hidden">
        <Skeleton className="h-24 w-full rounded-none" />
        <CardContent className="-mt-12 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AVATAR_COLORS,
  CURRICULA,
  DIAGNOSES,
  LEARNING_STYLES,
  avatarColorFor,
} from "@/lib/constants";
import type { ActiveStudent } from "@/lib/use-active-student";
import {
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Stethoscope,
  Users,
  Heart,
  Sparkles,
} from "lucide-react";

export interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: ActiveStudent | null;
  onSaved?: (student: ActiveStudent) => void;
}

const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;

interface FormState {
  name: string;
  dob: string; // yyyy-mm-dd for date input value
  gender: string;
  grade: string;
  school: string;
  curriculum: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  diagnosis: string[];
  languages: string;
  medicalConditions: string;
  allergies: string;
  currentTherapies: string;
  medications: string;
  strengths: string;
  interests: string;
  learningStyle: string;
  avatarColor: string;
}

function emptyState(): FormState {
  return {
    name: "",
    dob: "",
    gender: "",
    grade: "",
    school: "",
    curriculum: CURRICULA[0],
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    diagnosis: [],
    languages: "",
    medicalConditions: "",
    allergies: "",
    currentTherapies: "",
    medications: "",
    strengths: "",
    interests: "",
    learningStyle: "",
    avatarColor: AVATAR_COLORS[0],
  };
}

function fromStudent(s: ActiveStudent): FormState {
  let dob = "";
  try {
    dob = s.dob ? format(parseISO(s.dob), "yyyy-MM-dd") : "";
  } catch {
    dob = "";
  }
  return {
    name: s.name ?? "",
    dob,
    gender: s.gender ?? "",
    grade: s.grade ?? "",
    school: s.school ?? "",
    curriculum: s.curriculum ?? CURRICULA[0],
    parentName: s.parentName ?? "",
    parentEmail: s.parentEmail ?? "",
    parentPhone: s.parentPhone ?? "",
    diagnosis: Array.isArray(s.diagnosis) ? s.diagnosis : [],
    languages: s.languages ?? "",
    medicalConditions: s.medicalConditions ?? "",
    allergies: s.allergies ?? "",
    currentTherapies: s.currentTherapies ?? "",
    medications: s.medications ?? "",
    strengths: s.strengths ?? "",
    interests: s.interests ?? "",
    learningStyle: s.learningStyle ?? "",
    avatarColor: s.avatarColor || AVATAR_COLORS[0],
  };
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSaved,
}: StudentFormDialogProps) {
  const isEdit = !!student;
  const queryClient = useQueryClient();
  const [state, setState] = React.useState<FormState>(() =>
    student ? fromStudent(student) : emptyState(),
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [diagOpen, setDiagOpen] = React.useState(false);

  // Reset form whenever dialog opens or student changes
  React.useEffect(() => {
    if (open) {
      setState(student ? fromStudent(student) : emptyState());
      setNameError(null);
      setDiagOpen(false);
    }
  }, [open, student]);

  const update = React.useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const toggleDiagnosis = (d: string) => {
    setState((prev) => {
      const exists = prev.diagnosis.includes(d);
      return {
        ...prev,
        diagnosis: exists
          ? prev.diagnosis.filter((x) => x !== d)
          : [...prev.diagnosis, d],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) {
      setNameError("Name is required");
      toast.error("Name is required");
      return;
    }
    setNameError(null);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      name: state.name.trim(),
      dob: state.dob ? new Date(state.dob).toISOString() : new Date().toISOString(),
      gender: state.gender,
      grade: state.grade,
      school: state.school,
      curriculum: state.curriculum,
      parentName: state.parentName,
      parentEmail: state.parentEmail,
      parentPhone: state.parentPhone,
      diagnosis: state.diagnosis,
      languages: state.languages,
      medicalConditions: state.medicalConditions,
      allergies: state.allergies,
      currentTherapies: state.currentTherapies,
      medications: state.medications,
      strengths: state.strengths,
      interests: state.interests,
      learningStyle: state.learningStyle,
      avatarColor: state.avatarColor,
    };

    try {
      const url = isEdit ? `/api/students/${student!.id}` : "/api/students";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to ${isEdit ? "update" : "create"} student`);
      }
      const data = (await res.json()) as { student: ActiveStudent };

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (isEdit && student) {
        await queryClient.invalidateQueries({ queryKey: ["student", student.id] });
      }

      toast.success(
        isEdit ? "Student updated successfully" : "Student created successfully",
      );
      onSaved?.(data.student);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] gap-0 p-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isEdit ? (
              <>
                <Save className="h-5 w-5 text-primary" />
                Edit Student
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Add New Student
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the student's profile information. All fields can be edited."
              : "Create a new student profile. Fields marked with * are required."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col"
          aria-label={isEdit ? "Edit student form" : "Create student form"}
        >
          <div className="max-h-[70vh] overflow-y-auto iep-scroll px-6 py-5">
            <div className="space-y-6">
              {/* Basic Information */}
              <FormSection
                title="Basic Information"
                icon={<Users className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required error={nameError}>
                    <Input
                      value={state.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      aria-invalid={!!nameError}
                      autoFocus
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <Input
                      type="date"
                      value={state.dob}
                      onChange={(e) => update("dob", e.target.value)}
                    />
                  </Field>
                  <Field label="Gender">
                    <Select
                      value={state.gender}
                      onValueChange={(v) => update("gender", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Grade">
                    <Input
                      value={state.grade}
                      onChange={(e) => update("grade", e.target.value)}
                      placeholder="e.g. Grade 3"
                    />
                  </Field>
                  <Field label="School">
                    <Input
                      value={state.school}
                      onChange={(e) => update("school", e.target.value)}
                      placeholder="e.g. Sunrise Public School"
                    />
                  </Field>
                  <Field label="Curriculum">
                    <Select
                      value={state.curriculum}
                      onValueChange={(v) => update("curriculum", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select curriculum" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRICULA.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Avatar Color" className="mt-4">
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar color">
                    {AVATAR_COLORS.map((c) => {
                      const selected = state.avatarColor === c;
                      return (
                        <Tooltip key={c}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={`Color ${c}`}
                              onClick={() => update("avatarColor", c)}
                              className={cn(
                                "h-9 w-9 rounded-full border-2 transition-all flex items-center justify-center",
                                selected
                                  ? "border-foreground ring-2 ring-offset-2 ring-offset-background ring-primary scale-105"
                                  : "border-transparent hover:scale-105",
                              )}
                              style={{ backgroundColor: c }}
                            >
                              {selected && (
                                <Check className="h-4 w-4 text-white drop-shadow" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{c}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </Field>
              </FormSection>

              <Separator />

              {/* Diagnosis & Learning Profile */}
              <FormSection
                title="Diagnosis & Learning Profile"
                icon={<Sparkles className="h-4 w-4" />}
              >
                <Field label="Diagnosis" hint="Select all that apply">
                  <Popover open={diagOpen} onOpenChange={setDiagOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal"
                        aria-expanded={diagOpen}
                      >
                        <span className="truncate text-muted-foreground">
                          {state.diagnosis.length > 0
                            ? `${state.diagnosis.length} selected`
                            : "Select diagnoses…"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <ScrollArea className="h-64">
                        <div className="p-1">
                          {DIAGNOSES.map((d) => {
                            const checked = state.diagnosis.includes(d);
                            return (
                              <label
                                key={d}
                                htmlFor={`diag-${d}`}
                                className={cn(
                                  "flex w-full cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                                  checked && "bg-accent/60",
                                )}
                              >
                                <Checkbox
                                  id={`diag-${d}`}
                                  checked={checked}
                                  onCheckedChange={() => toggleDiagnosis(d)}
                                  className="mt-0.5"
                                />
                                <span className="leading-snug">{d}</span>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </Field>

                {state.diagnosis.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2" aria-live="polite">
                    {state.diagnosis.map((d) => (
                      <Badge
                        key={d}
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 gap-1 pr-1"
                      >
                        <span className="truncate max-w-[220px]">{d}</span>
                        <button
                          type="button"
                          onClick={() => toggleDiagnosis(d)}
                          className="ml-0.5 rounded-full hover:bg-primary/20 px-1"
                          aria-label={`Remove ${d}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field label="Learning Style">
                    <Select
                      value={state.learningStyle}
                      onValueChange={(v) => update("learningStyle", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select learning style" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEARNING_STYLES.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Languages">
                    <Input
                      value={state.languages}
                      onChange={(e) => update("languages", e.target.value)}
                      placeholder="e.g. English, Hindi"
                    />
                  </Field>
                </div>
              </FormSection>

              <Separator />

              {/* Family & Contacts */}
              <FormSection
                title="Family & Contacts"
                icon={<Heart className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Parent / Guardian Name">
                    <Input
                      value={state.parentName}
                      onChange={(e) => update("parentName", e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                    />
                  </Field>
                  <Field label="Parent Phone">
                    <Input
                      type="tel"
                      value={state.parentPhone}
                      onChange={(e) => update("parentPhone", e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </Field>
                  <Field label="Parent Email" className="sm:col-span-2">
                    <Input
                      type="email"
                      value={state.parentEmail}
                      onChange={(e) => update("parentEmail", e.target.value)}
                      placeholder="e.g. parent@example.com"
                    />
                  </Field>
                </div>
              </FormSection>

              <Separator />

              {/* Medical Profile */}
              <FormSection
                title="Medical Profile"
                icon={<Stethoscope className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Medical Conditions">
                    <Textarea
                      value={state.medicalConditions}
                      onChange={(e) => update("medicalConditions", e.target.value)}
                      placeholder="e.g. Seizure disorder, hypothyroidism"
                      className="min-h-20"
                    />
                  </Field>
                  <Field
                    label="Allergies"
                    hint="Use caution — review carefully"
                  >
                    <Textarea
                      value={state.allergies}
                      onChange={(e) => update("allergies", e.target.value)}
                      placeholder="e.g. Peanuts, latex, dairy"
                      className="min-h-20 border-amber-500/40 focus-visible:border-amber-500/60 focus-visible:ring-amber-500/20"
                    />
                  </Field>
                  <Field label="Current Therapies">
                    <Textarea
                      value={state.currentTherapies}
                      onChange={(e) => update("currentTherapies", e.target.value)}
                      placeholder="e.g. Speech therapy 2x/week, OT weekly"
                      className="min-h-20"
                    />
                  </Field>
                  <Field label="Medications">
                    <Textarea
                      value={state.medications}
                      onChange={(e) => update("medications", e.target.value)}
                      placeholder="e.g. Methylphenidate 5mg AM"
                      className="min-h-20"
                    />
                  </Field>
                </div>
              </FormSection>

              <Separator />

              {/* Strengths & Interests */}
              <FormSection
                title="Strengths & Interests"
                icon={<Sparkles className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Strengths">
                    <Textarea
                      value={state.strengths}
                      onChange={(e) => update("strengths", e.target.value)}
                      placeholder="e.g. Strong visual memory, loves puzzles"
                      className="min-h-20"
                    />
                  </Field>
                  <Field label="Interests">
                    <Textarea
                      value={state.interests}
                      onChange={(e) => update("interests", e.target.value)}
                      placeholder="e.g. Trains, dinosaurs, drawing"
                      className="min-h-20"
                    />
                  </Field>
                </div>
              </FormSection>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : (
                <>
                  {isEdit ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isEdit ? "Save Changes" : "Create Student"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- helpers ---------- */

function FormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {hint && (
          <span className="text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// default export convenience (used in dynamic imports if needed)
export default StudentFormDialog;

// expose helper for parents that want a default color
export { avatarColorFor };

/**
 * Shared types for the Progress Monitoring view subcomponents.
 *
 * Extracted from `progress-view.tsx` during the Phase-2 split (Task 18-c).
 * The `ProgressRecord` and `Goal` interfaces were previously declared
 * inline at the top of `progress-view.tsx`; they live here so every
 * subcomponent in `src/components/views/progress/` can share them
 * without re-declaring or importing from the orchestrator.
 */

export interface ProgressRecord {
  id: string;
  studentId: string;
  goalId: string | null;
  date: string;
  rating: number;
  note: string;
  recordedBy: string;
  domain: string;
  goalDomain: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  domain: string;
  annualGoal: string;
  status: "active" | "achieved" | "on-hold";
  progress: number;
}

export interface ProgressChartsProps {
  records: ProgressRecord[];
  goals: Goal[];
}

export interface RatingStatCardsProps {
  records: ProgressRecord[];
}

export interface ProgressLogProps {
  records: ProgressRecord[];
  onDelete: (id: string) => void;
  /** id of the record currently in-flight (deleteMutation.variables), or null. */
  deletingId: string | null;
  deleting: boolean;
}

export interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  goals: Goal[];
  /** Called after a successful POST so the parent can invalidate queries. */
  onSaved: () => void;
}

export interface AISummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

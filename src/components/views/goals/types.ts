// Shared types for the goals-view subcomponents.
// The `Goal` interface mirrors the row shape returned by GET /api/goals and
// stored in the React Query cache under the key ["goals", studentId].

export type GoalStatus = "active" | "achieved" | "on-hold";

export interface Goal {
  id: string;
  studentId: string;
  domain: string;
  annualGoal: string;
  baseline: string;
  objective: string;
  teachingStrategy: string;
  accommodation: string;
  modification: string;
  resources: string;
  measurementMethod: string;
  progressIndicators: string;
  responsibleProfessional: string;
  reviewDate: string | null;
  status: GoalStatus;
  progress: number;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

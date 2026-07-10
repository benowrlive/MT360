// Shared TypeScript types for Mindful Therapy 360

export type ViewId =
  | "dashboard"
  | "students"
  | "search"
  | "profile"
  | "assessment"
  | "goals"
  | "therapy"
  | "behaviour"
  | "progress"
  | "reports"
  | "lessons"
  | "accommodations";

export interface Student {
  id: string;
  name: string;
  dob: string;
  grade: string;
  gender: string;
  school: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  diagnosis: string[]; // parsed from JSON
  languages: string;
  medicalConditions: string;
  allergies: string;
  currentTherapies: string;
  medications: string;
  strengths: string;
  interests: string;
  learningStyle: string;
  curriculum: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSummary {
  presentLevels: string;
  strengths: string;
  areasOfNeed: string;
  functionalSkills: string;
  academicSkills: string;
  socialSkills: string;
  behaviour: string;
  communication: string;
  motorSkills: string;
  sensoryProfile: string;
  executiveFunctioning: string;
  emotionalRegulation: string;
  learningPreferences: string;
}

export interface SmartGoal {
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
}

export interface GoalSuggestion {
  shortTermGoals: string[];
  longTermGoals: string[];
  replacementBehaviours: string[];
  interventions: string[];
  teachingTechniques: string[];
  reinforcementSchedules: string[];
  promptHierarchy: string[];
  taskAnalysis: string[];
  visualSupports: string[];
  socialStories: string[];
  behaviourStrategies: string[];
  sensoryStrategies: string[];
  homeActivities: string[];
  parentStrategies: string[];
  teacherStrategies: string[];
}

export interface TherapyPlan {
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
}

export interface BehaviourPlanData {
  behaviourOfConcern: string;
  abcAntecedent: string;
  abcBehaviour: string;
  abcConsequence: string;
  behaviourFunction: string;
  triggers: string;
  maintainingFactors: string;
  replacementBehaviours: string;
  preventiveStrategies: string;
  reactiveStrategies: string;
  rewardSystems: string;
}

export interface LessonPlan {
  title: string;
  objective: string;
  duration: string;
  materials: string;
  teachingAids: string;
  visualSupports: string;
  introduction: string;
  mainActivity: string;
  differentiation: string;
  assessment: string;
  homework: string;
}

export interface AccommodationSet {
  category: string;
  items: string[];
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  goalId: string | null;
  date: string;
  rating: number;
  note: string;
  recordedBy: string;
  domain: string;
}

// ─── API response wrappers ─────────────────────────────────────────
// Typed shapes for fetch().json() results so views can drop `as any`.

/** Standard error response from any /api route. */
export interface ApiError {
  error: string;
}

/** Student as returned by GET /api/students and /api/students/[id]. */
export interface StudentListItem extends Student {
  _count?: { goals: number; assessments: number; reports: number };
}

export interface StudentsListResponse {
  students: StudentListItem[];
}

export interface StudentResponse {
  student: Student;
}

/** Goal row (from GET /api/goals?studentId=). */
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
  reviewDate: string | null;
  responsibleProfessional: string;
  status: "active" | "achieved" | "on-hold";
  progress: number;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface GoalsByDomain {
  domain: string;
  count: number;
}

export interface DashboardStats {
  activeStudents: number;
  goalsAchieved: number;
  pendingReports: number;
  upcomingReviews: number;
  sessionsScheduled: number;
  avgProgress: number;
  totalGoals: number;
  totalAssessments: number;
}

export interface DashboardAlert {
  type: string;
  message: string;
  level: "info" | "warning" | "success";
}

export interface UpcomingReview {
  goalId: string;
  studentId: string;
  studentName: string;
  avatarColor: string;
  domain: string;
  reviewDate: string;
  progress: number;
}

export interface RecentStudent {
  id: string;
  name: string;
  grade: string;
  school: string;
  avatarColor: string;
  diagnosis: string[];
  goalCount: number;
  createdAt: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  goalsByDomain: GoalsByDomain[];
  statusCount: { active: number; achieved: number; "on-hold": number };
  progressTrend: { label: string; avg: number; count: number }[];
  upcomingReviews: UpcomingReview[];
  recentStudents: RecentStudent[];
  alerts: DashboardAlert[];
}

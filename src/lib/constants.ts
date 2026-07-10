// Mindful Therapy 360 - domain constants

export const DIAGNOSES = [
  "Autism Spectrum Disorder (ASD)",
  "ADHD",
  "Dyslexia",
  "Dysgraphia",
  "Dyscalculia",
  "Intellectual Disability",
  "Down Syndrome",
  "Cerebral Palsy",
  "Global Developmental Delay",
  "Learning Disability",
  "Emotional Behaviour Disorder",
  "Hearing Impairment",
  "Visual Impairment",
  "Multiple Disabilities",
  "Gifted with Learning Needs (Twice Exceptional)",
] as const;

export const GOAL_DOMAINS = [
  "Academic - Reading",
  "Academic - Writing",
  "Academic - Spelling",
  "Academic - Mathematics",
  "Communication - Speech",
  "Communication - Language",
  "Social Skills",
  "Daily Living Skills",
  "Motor Skills - Fine Motor",
  "Motor Skills - Gross Motor",
  "Executive Function",
  "Behaviour",
  "Sensory Regulation",
  "Play Skills",
  "Vocational Skills",
  "Independent Living",
  "Transition Skills",
  "Self-Advocacy",
  "Emotional Regulation",
] as const;

export const CURRICULA = [
  "IB",
  "Cambridge",
  "CBSE",
  "ICSE",
  "American Curriculum",
  "British Curriculum",
  "Australian Curriculum",
  "Custom Curriculum",
] as const;

export const THERAPY_TYPES = [
  "Speech Therapy",
  "Occupational Therapy",
  "Behaviour Therapy",
  "Special Education",
  "Counselling",
  "Play Therapy",
  "Music Therapy",
  "Art Therapy",
  "ABA",
] as const;

export const ASSESSMENT_TYPES = [
  { value: "psychological", label: "Psychological Assessment" },
  { value: "speech", label: "Speech Report" },
  { value: "ot", label: "Occupational Therapy Report" },
  { value: "teacher", label: "Teacher Observation" },
  { value: "parent", label: "Parent Observation" },
  { value: "behaviour", label: "Behaviour Log" },
  { value: "academic", label: "Academic Report" },
] as const;

export const REPORT_TYPES = [
  { value: "iep", label: "IEP Document" },
  { value: "progress", label: "Progress Report" },
  { value: "annual-review", label: "Annual Review" },
  { value: "parent-meeting", label: "Parent Meeting Summary" },
  { value: "teacher-report", label: "Teacher Report" },
  { value: "transition", label: "Transition Plan" },
  { value: "behaviour", label: "Behaviour Plan" },
  { value: "therapy-notes", label: "Therapy Notes" },
  { value: "psychological", label: "Psychological Summary" },
  { value: "accommodation", label: "School Accommodation Report" },
] as const;

export const ACCOMMODATION_CATEGORIES = [
  "Classroom Accommodations",
  "Exam Accommodations",
  "Communication Supports",
  "Environmental Modifications",
  "Technology Supports",
  "Sensory Accommodations",
  "Behaviour Supports",
] as const;

export const AVATAR_COLORS = [
  "#0d9488", "#0891b2", "#059669", "#ca8a04",
  "#dc2626", "#db2777", "#7c3aed", "#4f46e5",
  "#0f766e", "#b45309",
];

export const LEARNING_STYLES = [
  "Visual",
  "Auditory",
  "Kinesthetic",
  "Reading/Writing",
  "Multisensory",
] as const;

export const PROMPT_HIERARCHY = [
  "Independent",
  "Gesture Prompt",
  "Verbal Prompt",
  "Visual Prompt",
  "Model Prompt",
  "Partial Physical Prompt",
  "Full Physical Prompt",
] as const;

export function ageFromDob(dob: Date | string): number {
  const d = typeof dob === "string" ? new Date(dob) : dob;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function avatarColorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

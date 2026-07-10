import "server-only";
import { db } from "./db";
import { ageFromDob } from "./constants";

/**
 * Safely parse a student's diagnosis JSON string into a string array.
 * Used everywhere a Student row leaves the database.
 */
export function safeParseDiagnosis(raw: string | null | undefined): string[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Convert a raw Prisma Student row into the shape the API returns / the
 * frontend expects — diagnosis parsed from JSON string to string[].
 */
export function parseStudent<T extends { diagnosis: string | null }>(s: T): Omit<T, "diagnosis"> & { diagnosis: string[] } {
  return { ...s, diagnosis: safeParseDiagnosis(s.diagnosis) };
}

/**
 * Student enriched with derived fields commonly needed by AI routes.
 * Fetches + 404-checks + parses diagnosis + computes age in one call so
 * every AI route handler drops ~10 lines of boilerplate.
 */
export interface AIStudent {
  id: string;
  name: string;
  dob: Date;
  age: number;
  grade: string;
  gender: string;
  school: string;
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
  curriculum: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch a student by id for use in AI route handlers.
 * Returns `null` when not found (caller returns 404).
 * Parses diagnosis and computes age so callers don't repeat the boilerplate.
 */
export async function getStudentForAI(studentId: string): Promise<AIStudent | null> {
  const s = await db.student.findUnique({ where: { id: studentId } });
  if (!s) return null;
  return {
    ...s,
    diagnosis: safeParseDiagnosis(s.diagnosis),
    age: ageFromDob(s.dob),
  };
}

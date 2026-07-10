"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "./store";
import type { Student, StudentResponse } from "./types";

/** The active student — alias of the shared Student type. */
export type ActiveStudent = Student;

/**
 * Returns the active student (from store id -> fetched) plus loading/error flags.
 * Returns `null` for student when no active student is selected.
 */
export function useActiveStudent() {
  const activeStudentId = useAppStore((s) => s.activeStudentId);
  const openStudent = useAppStore((s) => s.openStudent);
  const setView = useAppStore((s) => s.setView);

  const query = useQuery({
    queryKey: ["student", activeStudentId],
    queryFn: async () => {
      if (!activeStudentId) return null;
      const res = await fetch(`/api/students/${activeStudentId}`);
      if (!res.ok) throw new Error("Failed to load student");
      const data = (await res.json()) as StudentResponse;
      return data.student;
    },
    enabled: !!activeStudentId,
  });

  return {
    studentId: activeStudentId,
    student: query.data ?? null,
    isLoading: activeStudentId ? query.isLoading : false,
    isError: query.isError,
    openStudent,
    setView,
  };
}

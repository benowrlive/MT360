"use client";
import { create } from "zustand";
import type { ViewId } from "./types";

interface AppState {
  view: ViewId;
  activeStudentId: string | null;
  sidebarOpen: boolean;
  setView: (v: ViewId) => void;
  setActiveStudentId: (id: string | null) => void;
  openStudent: (id: string, view?: ViewId) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "dashboard",
  activeStudentId: null,
  sidebarOpen: false,
  setView: (view) => set({ view, sidebarOpen: false }),
  setActiveStudentId: (id) => set({ activeStudentId: id }),
  openStudent: (id, view = "profile") =>
    set({ activeStudentId: id, view: view ?? "profile", sidebarOpen: false }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));

// views that require an active student
export const STUDENT_VIEWS: ViewId[] = [
  "profile",
  "assessment",
  "goals",
  "therapy",
  "behaviour",
  "progress",
  "reports",
  "lessons",
  "accommodations",
];

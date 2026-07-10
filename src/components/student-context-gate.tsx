"use client";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";

export function StudentContextGate({ children }: { children: React.ReactNode }) {
  const activeStudentId = useAppStore((s) => s.activeStudentId);
  const setView = useAppStore((s) => s.setView);

  if (!activeStudentId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">Select a student to begin</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Choose a student from the list or the switcher in the top bar to access their profile,
          assessments, goals, therapy plans, progress and reports.
        </p>
        <Button className="mt-5 gap-2" onClick={() => setView("students")}>
          Go to Students <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}

"use client";
import { useAppStore, STUDENT_VIEWS } from "@/lib/store";
import type { ViewId } from "@/lib/types";
import { useSession, signOut } from "next-auth/react";
import { LoginScreen } from "@/components/login-screen";
import { DashboardView } from "@/components/views/dashboard-view";
import { StudentsView } from "@/components/views/students-view";
import { ProfileView } from "@/components/views/profile-view";
import { AssessmentView } from "@/components/views/assessment-view";
import { GoalsView } from "@/components/views/goals-view";
import { TherapyView } from "@/components/views/therapy-view";
import { BehaviourView } from "@/components/views/behaviour-view";
import { ProgressView } from "@/components/views/progress-view";
import { ReportsView } from "@/components/views/reports-view";
import { LessonView } from "@/components/views/lesson-view";
import { AccommodationsView } from "@/components/views/accommodations-view";
import { StudentContextGate } from "@/components/student-context-gate";
import {
  LayoutDashboard,
  Users,
  Search,
  User,
  ClipboardList,
  Target,
  Activity,
  Brain,
  TrendingUp,
  FileText,
  BookOpen,
  Accessibility,
  Sparkles,
  HeartPulse,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";
import { initials, ageFromDob } from "@/lib/constants";
import type { StudentsListResponse, StudentListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "main" | "student";
}

const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { id: "students", label: "Students", icon: Users, group: "main" },
  { id: "search", label: "Search", icon: Search, group: "main" },
  { id: "profile", label: "Profile", icon: User, group: "student" },
  { id: "assessment", label: "Assessment", icon: ClipboardList, group: "student" },
  { id: "goals", label: "Goals", icon: Target, group: "student" },
  { id: "therapy", label: "Therapy Planner", icon: Activity, group: "student" },
  { id: "behaviour", label: "Behaviour Plan", icon: Brain, group: "student" },
  { id: "progress", label: "Progress", icon: TrendingUp, group: "student" },
  { id: "reports", label: "Reports", icon: FileText, group: "student" },
  { id: "lessons", label: "Lesson Planner", icon: BookOpen, group: "student" },
  { id: "accommodations", label: "Accommodations", icon: Accessibility, group: "student" },
];

async function fetchStudents(): Promise<StudentListItem[]> {
  const res = await fetch("/api/students");
  if (!res.ok) return [];
  const data = (await res.json()) as StudentsListResponse;
  return data.students ?? [];
}

/**
 * Top-level shell: gates the whole app behind a NextAuth session.
 * While the session status is loading we show a splash; when there's no
 * session we render the login screen; otherwise we mount the full workspace.
 * Splitting it this way means AppShellContent's data-fetching hooks only run
 * once authenticated (no wasted 401s on the login screen).
 */
export function AppShell() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <img src="/logo-mark-256.png" alt="" className="h-16 w-16 rounded-2xl object-contain" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading Mindful Therapy 360…
        </div>
      </div>
    );
  }
  if (!session) return <LoginScreen />;
  return <AppShellContent />;
}

function AppShellContent() {
  const { data: session } = useSession();
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const activeStudentId = useAppStore((s) => s.activeStudentId);
  const openStudent = useAppStore((s) => s.openStudent);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const { theme, setTheme } = useTheme();

  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });
  const activeStudent = students.find((s: { id: string }) => s.id === activeStudentId);

  const mainNav = NAV.filter((n) => n.group === "main");
  const studentNav = NAV.filter((n) => n.group === "student");

  const renderView = () => {
    if (STUDENT_VIEWS.includes(view)) {
      return (
        <StudentContextGate>
          {view === "profile" && <ProfileView />}
          {view === "assessment" && <AssessmentView />}
          {view === "goals" && <GoalsView />}
          {view === "therapy" && <TherapyView />}
          {view === "behaviour" && <BehaviourView />}
          {view === "progress" && <ProgressView />}
          {view === "reports" && <ReportsView />}
          {view === "lessons" && <LessonView />}
          {view === "accommodations" && <AccommodationsView />}
        </StudentContextGate>
      );
    }
    if (view === "dashboard") return <DashboardView />;
    if (view === "students") return <StudentsView />;
    if (view === "search") return <StudentsView initialMode="search" />;
    return <DashboardView />;
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5 border-b border-sidebar-border">
        <img src="/logo-mark-256.png" alt="Mindful Therapy 360" className="h-12 w-12 rounded-xl object-contain shrink-0" />
        <div className="leading-tight">
          <div className="font-bold text-base text-sidebar-foreground">Mindful Therapy 360</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            A Special Education Suite
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto iep-scroll px-3 py-4 space-y-6">
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </div>
          {mainNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              onClick={() => setView(item.id)}
            />
          ))}
        </div>

        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Student Workspace
          </div>
          {studentNav.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              disabled={!activeStudentId}
              onClick={() => activeStudentId && setView(item.id)}
            />
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-xl bg-sidebar-accent/60 p-3 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-sidebar-foreground">AI-assisted.</span> Every
            suggestion is editable — you remain the professional of record.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Ambient color wash — gives liquid-glass cards something to refract */}
      <div className="ambient-backdrop" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar relative z-10">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {SidebarContent}
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 backdrop-blur-md px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Active student switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 max-w-[280px] justify-start">
                {activeStudent ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback
                        style={{ backgroundColor: activeStudent.avatarColor, color: "white" }}
                        className="text-[10px]"
                      >
                        {initials(activeStudent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium">{activeStudent.name}</span>
                    <Badge variant="secondary" className="ml-auto hidden sm:inline-flex text-[10px]">
                      {ageFromDob(activeStudent.dob)}y · {activeStudent.grade}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <span className="text-muted-foreground">Select student…</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto iep-scroll">
              <DropdownMenuLabel>Switch active student</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {students.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No students yet
                </div>
              )}
              {students.map((s: any) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => openStudent(s.id, view === "dashboard" ? "profile" : view)}
                  className="gap-2.5"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      style={{ backgroundColor: s.avatarColor, color: "white" }}
                      className="text-[10px]"
                    >
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.grade} · {s.school}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="hidden h-5 w-5 dark:block" />
              <Moon className="block h-5 w-5 dark:hidden" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-primary/10 text-primary text-xs font-semibold outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  {(session?.user?.name ?? session?.user?.email ?? "SE")
                    .split(" ")
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join("")}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium truncate">
                    {session?.user?.name ?? "IEP User"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {session?.user?.email ?? ""}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 text-destructive focus:text-destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto iep-scroll">
          <div className="mx-auto w-full max-w-7xl p-4 lg:p-8 iep-fade-in" key={view + (activeStudentId ?? "")}>
            {renderView()}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-border bg-background px-4 py-3 text-center text-xs text-muted-foreground">
          Mindful Therapy 360 · AI-assisted special education & therapy planning · Always review AI output before use.
        </footer>
      </div>
    </div>
  );
}

function NavButton({
  item,
  active,
  disabled,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

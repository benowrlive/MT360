"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Users,
  Target,
  FileText,
  CalendarClock,
  Activity,
  TrendingUp,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { initials, ageFromDob } from "@/lib/constants";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import type { DashboardResponse as DashData } from "@/lib/types";

const STATUS_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];
const DOMAIN_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
];

const trendConfig = {
  avg: { label: "Avg Rating", color: "var(--chart-1)" },
} satisfies ChartConfig;

const domainConfig = {
  count: { label: "Goals", color: "var(--chart-2)" },
} satisfies ChartConfig;

const statusConfig = {
  active: { label: "Active", color: "var(--chart-1)" },
  achieved: { label: "Achieved", color: "var(--chart-2)" },
  "on-hold": { label: "On Hold", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function DashboardView() {
  const openStudent = useAppStore((s) => s.openStudent);
  const setView = useAppStore((s) => s.setView);
  const { data, isLoading } = useQuery<DashData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-9 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  const s = data.stats;
  const kpis = [
    { label: "Active Students", value: s.activeStudents, icon: Users, color: "var(--chart-1)" },
    { label: "Goals Achieved", value: s.goalsAchieved, icon: CheckCircle2, color: "var(--chart-2)" },
    { label: "Avg Progress", value: `${s.avgProgress}%`, icon: TrendingUp, color: "var(--chart-3)" },
    { label: "Upcoming Reviews", value: s.upcomingReviews, icon: CalendarClock, color: "var(--chart-4)" },
    { label: "Pending Reports", value: s.pendingReports, icon: FileText, color: "var(--chart-5)" },
    { label: "Sessions", value: s.sessionsScheduled, icon: Activity, color: "var(--chart-2)" },
  ];

  const statusData = [
    { name: "active", value: data.statusCount.active, fill: "var(--chart-1)" },
    { name: "achieved", value: data.statusCount.achieved, fill: "var(--chart-2)" },
    { name: "on-hold", value: data.statusCount["on-hold"], fill: "var(--chart-4)" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-assisted overview of your special education caseload.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setView("students")}>
          <Plus className="h-4 w-4" /> Add Student
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <GlassCard key={k.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in oklch, ${k.color} 15%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: k.color }} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-bold tabular-nums">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
              </CardContent>
            </GlassCard>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Progress Trend
            </CardTitle>
            <CardDescription>Average session rating across all students (last 12 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-64 w-full">
              <AreaChart data={data.progressTrend} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={11} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" /> Goal Status
            </CardTitle>
            <CardDescription>Distribution across {s.totalGoals} goals</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <EmptyMini text="No goals yet" />
            ) : (
              <ChartContainer config={statusConfig} className="h-48 w-full">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
            <div className="mt-3 space-y-1.5">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 capitalize">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {statusConfig[d.name as keyof typeof statusConfig]?.label}
                  </span>
                  <span className="font-medium tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Goals by domain */}
        <GlassCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Goals by Domain</CardTitle>
            <CardDescription>Where your students' goals are focused</CardDescription>
          </CardHeader>
          <CardContent>
            {data.goalsByDomain.length === 0 ? (
              <EmptyMini text="No goals yet" />
            ) : (
              <ChartContainer config={domainConfig} className="h-56 w-full">
                <BarChart data={data.goalsByDomain} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="domain"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={130}
                    tick={{ fill: "var(--muted-foreground)" }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {data.goalsByDomain.map((_, i) => (
                      <Cell key={i} fill={DOMAIN_COLORS[i % DOMAIN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </GlassCard>

        {/* Alerts */}
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Alerts
            </CardTitle>
            <CardDescription>AI-flagged items needing attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.alerts.length === 0 && <EmptyMini text="All clear" />}
            {data.alerts.map((a, i) => {
              const Icon =
                a.level === "warning"
                  ? AlertTriangle
                  : a.level === "success"
                    ? CheckCircle2
                    : Info;
              const color =
                a.level === "warning"
                  ? "var(--chart-4)"
                  : a.level === "success"
                    ? "var(--chart-2)"
                    : "var(--chart-1)";
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5"
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                  <span className="text-xs leading-relaxed">{a.message}</span>
                </div>
              );
            })}
          </CardContent>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming reviews */}
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Upcoming Reviews</CardTitle>
              <CardDescription>Goal review deadlines approaching</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("goals")}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto iep-scroll">
            {data.upcomingReviews.length === 0 && <EmptyMini text="No upcoming reviews" />}
            {data.upcomingReviews.map((r) => {
              const days = Math.ceil(
                (new Date(r.reviewDate).getTime() - Date.now()) / 86400000,
              );
              return (
                <button
                  key={r.goalId}
                  onClick={() => openStudent(r.studentId, "goals")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{ backgroundColor: r.avatarColor, color: "white" }}
                      className="text-[10px]"
                    >
                      {initials(r.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{r.studentName}</span>
                      <Badge
                        variant={days < 7 ? "destructive" : "secondary"}
                        className="text-[10px] shrink-0"
                      >
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </Badge>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{r.domain}</div>
                    <Progress value={r.progress} className="mt-1.5 h-1.5" />
                  </div>
                </button>
              );
            })}
          </CardContent>
        </GlassCard>

        {/* Recent students */}
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Recent Students</CardTitle>
              <CardDescription>Recently added to your caseload</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setView("students")}>
              All students <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto iep-scroll">
            {data.recentStudents.length === 0 && <EmptyMini text="No students yet" />}
            {data.recentStudents.map((st) => (
              <button
                key={st.id}
                onClick={() => openStudent(st.id, "profile")}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    style={{ backgroundColor: st.avatarColor, color: "white" }}
                    className="text-xs"
                  >
                    {initials(st.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{st.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {st.grade} · {st.school}
                  </div>
                  {st.diagnosis[0] && (
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {st.diagnosis[0].replace(/\s*\([^)]*\)/, "")}
                    </Badge>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <div className="font-medium text-foreground">{st.goalCount}</div>
                  <div>goals</div>
                </div>
              </button>
            ))}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

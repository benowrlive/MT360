import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [students, goals, reports, assessments, therapySessions, progressRecords] =
    await Promise.all([
      db.student.findMany({ include: { _count: { select: { goals: true } } } }),
      db.goal.findMany(),
      db.report.findMany({ orderBy: { createdAt: "desc" } }),
      db.assessment.findMany({ orderBy: { createdAt: "desc" } }),
      db.therapySession.findMany(),
      db.progressRecord.findMany({ orderBy: { date: "asc" } }),
    ]);

  const activeStudents = students.length;
  const goalsAchieved = goals.filter((g) => g.status === "achieved").length;
  const pendingReports = Math.max(
    0,
    students.length * 2 - reports.length,
  );
  const upcomingReviews = goals
    .filter((g) => g.reviewDate && new Date(g.reviewDate) > new Date())
    .sort((a, b) => new Date(a.reviewDate!).getTime() - new Date(b.reviewDate!).getTime())
    .slice(0, 6)
    .map((g) => {
      const s = students.find((st) => st.id === g.studentId);
      return {
        goalId: g.id,
        studentId: g.studentId,
        studentName: s?.name ?? "Unknown",
        avatarColor: s?.avatarColor ?? "#0d9488",
        domain: g.domain,
        reviewDate: g.reviewDate,
        progress: g.progress,
      };
    });

  // goals by domain
  const domainCount: Record<string, number> = {};
  for (const g of goals) domainCount[g.domain] = (domainCount[g.domain] ?? 0) + 1;
  const goalsByDomain = Object.entries(domainCount)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // goal status distribution
  const statusCount = {
    active: goals.filter((g) => g.status === "active").length,
    achieved: goals.filter((g) => g.status === "achieved").length,
    "on-hold": goals.filter((g) => g.status === "on-hold").length,
  };

  // avg progress overall
  const avgProgress =
    goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

  // progress trend (last 12 weeks aggregated avg rating)
  const now = new Date();
  const weeks: { label: string; date: Date; avg: number; count: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const start = new Date(now);
    start.setDate(start.getDate() - w * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() - w * 7);
    end.setHours(23, 59, 59, 999);
    const inRange = progressRecords.filter(
      (p) => new Date(p.date) >= start && new Date(p.date) <= end,
    );
    const avg =
      inRange.length > 0
        ? inRange.reduce((s, p) => s + p.rating, 0) / inRange.length
        : 0;
    weeks.push({
      label: `W${12 - w}`,
      date: end,
      avg: Number(avg.toFixed(2)),
      count: inRange.length,
    });
  }

  // recent students (top 5 by createdAt)
  const recentStudents = students.slice(0, 6).map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
    school: s.school,
    avatarColor: s.avatarColor,
    diagnosis: JSON.parse(s.diagnosis || "[]"),
    goalCount: s._count.goals,
    createdAt: s.createdAt,
  }));

  // alerts
  const alerts: { type: string; message: string; level: "info" | "warning" | "success" }[] = [];
  const overdue = goals.filter(
    (g) => g.reviewDate && new Date(g.reviewDate) < new Date() && g.status === "active",
  );
  if (overdue.length)
    alerts.push({
      type: "review",
      message: `${overdue.length} goal review${overdue.length > 1 ? "s are" : " is"} overdue`,
      level: "warning",
    });
  const lowProgress = goals.filter((g) => g.progress < 30 && g.status === "active");
  if (lowProgress.length)
    alerts.push({
      type: "progress",
      message: `${lowProgress.length} active goal${lowProgress.length > 1 ? "s" : ""} below 30% progress`,
      level: "info",
    });
  const achieved = goals.filter((g) => g.status === "achieved");
  if (achieved.length)
    alerts.push({
      type: "achieved",
      message: `${achieved.length} goal${achieved.length > 1 ? "s" : ""} achieved this cycle`,
      level: "success",
    });
  if (students.length === 0)
    alerts.push({
      type: "setup",
      message: "Add your first student to get started",
      level: "info",
    });

  return NextResponse.json({
    stats: {
      activeStudents,
      goalsAchieved,
      pendingReports,
      upcomingReviews: upcomingReviews.length,
      sessionsScheduled: therapySessions.length,
      avgProgress,
      totalGoals: goals.length,
      totalAssessments: assessments.length,
    },
    goalsByDomain,
    statusCount,
    progressTrend: weeks,
    upcomingReviews,
    recentStudents,
    alerts,
  });
}

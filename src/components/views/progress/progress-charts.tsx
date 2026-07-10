"use client";

import * as React from "react";
import { useMemo } from "react";
import { format, startOfWeek, subWeeks, addDays } from "date-fns";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
import { Star, TrendingUp, Activity } from "lucide-react";

import type { ProgressChartsProps, ProgressRecord } from "./types";

/* ------------------------------------------------------------------ */
/* Chart config + palette                                              */
/* ------------------------------------------------------------------ */

const RATING_COLORS: Record<number, string> = {
  1: "var(--chart-5)",
  2: "var(--chart-4)",
  3: "var(--chart-3)",
  4: "var(--chart-2)",
  5: "var(--chart-1)",
};

const trendConfig = {
  avg: { label: "Avg Rating", color: "var(--chart-1)" },
} satisfies ChartConfig;

const goalsConfig = {
  progress: { label: "Progress %", color: "var(--chart-1)" },
} satisfies ChartConfig;

const distConfig: ChartConfig = {
  "1": { label: "1 ★", color: RATING_COLORS[1] },
  "2": { label: "2 ★", color: RATING_COLORS[2] },
  "3": { label: "3 ★", color: RATING_COLORS[3] },
  "4": { label: "4 ★", color: RATING_COLORS[4] },
  "5": { label: "5 ★", color: RATING_COLORS[5] },
};

/* ------------------------------------------------------------------ */
/* ProgressCharts                                                      */
/* ------------------------------------------------------------------ */

/**
 * The charts section of the Progress Monitoring view.
 *
 * Renders three charts:
 *   1. Rating Trend — area chart, average weekly rating (last 12 weeks).
 *   2. Rating Distribution — donut chart, count of each star rating.
 *   3. Goal Completion — bar chart, progress % per active goal.
 *
 * The trend + distribution charts share a 3-column grid (trend spans 2).
 * Any children passed in (typically `<RatingStatCards />` from the
 * orchestrator) are rendered between that grid and the goal-completion
 * card, preserving the original page layout exactly.
 */
export function ProgressCharts({
  records,
  goals,
  children,
}: ProgressChartsProps & { children?: React.ReactNode }) {
  const trendData = useMemo(() => buildTrendData(records), [records]);
  const distribution = useMemo(() => buildDistribution(records), [records]);
  const goalBars = useMemo(
    () =>
      goals
        .slice(0, 8)
        .map((g) => ({
          name: shortDomain(g.domain),
          fullName: g.domain,
          progress: g.progress,
        })),
    [goals],
  );

  return (
    <>
      {/* Rating trend + distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Rating Trend
            </CardTitle>
            <CardDescription>
              Average weekly rating (last 12 weeks)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-60 w-full">
              <AreaChart data={trendData} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="progressTrendFill" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#progressTrendFill)"
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  connectNulls
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-primary" /> Rating Distribution
            </CardTitle>
            <CardDescription>Across {records.length} entries</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distConfig} className="mx-auto h-48 w-full">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={68}
                  paddingAngle={2}
                >
                  {distribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px]">
              {distribution.map((d) => (
                <div key={d.name} className="space-y-0.5">
                  <div
                    className="mx-auto h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: d.fill }}
                  />
                  <div className="text-muted-foreground">{d.label}</div>
                  <div className="font-semibold tabular-nums">{d.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Slot for the role stat cards (rendered by the orchestrator) */}
      {children}

      {/* Goal completion */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Goal Completion
          </CardTitle>
          <CardDescription>
            Active goals & their progress percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goalBars.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No active goals to display
            </div>
          ) : (
            <ChartContainer config={goalsConfig} className="h-56 w-full">
              <BarChart data={goalBars} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="progress" radius={[6, 6, 0, 0]} barSize={36}>
                  {goalBars.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.progress >= 75
                          ? "var(--chart-2)"
                          : entry.progress >= 40
                            ? "var(--chart-1)"
                            : "var(--chart-4)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </GlassCard>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chart data builders                                                 */
/* ------------------------------------------------------------------ */

function buildTrendData(records: ProgressRecord[]) {
  const weeks: { label: string; avg: number | null; count: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);
    const inWeek = records.filter((r) => {
      const d = new Date(r.date);
      return d >= weekStart && d < weekEnd;
    });
    weeks.push({
      label: format(weekStart, "d MMM"),
      avg:
        inWeek.length > 0
          ? Number(
              (inWeek.reduce((s, r) => s + r.rating, 0) / inWeek.length).toFixed(2),
            )
          : null,
      count: inWeek.length,
    });
  }
  return weeks;
}

function buildDistribution(records: ProgressRecord[]) {
  const counts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of records) {
    const k = String(Math.min(5, Math.max(1, r.rating)));
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return (["1", "2", "3", "4", "5"] as const).map((n) => ({
    name: n,
    label: `${n} ★`,
    value: counts[n],
    fill: RATING_COLORS[Number(n)],
  }));
}

function shortDomain(domain: string): string {
  if (!domain) return "General";
  // strip "Academic - " / "Motor Skills - " prefixes to keep axis labels short
  return domain
    .replace(/^(Academic|Motor Skills|Communication)\s*-\s*/i, "")
    .slice(0, 14);
}

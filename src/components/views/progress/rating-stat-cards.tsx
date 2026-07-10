"use client";

import { useMemo } from "react";
import { GraduationCap, Users, Stethoscope, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { RatingStatCardsProps, ProgressRecord } from "./types";

/* ------------------------------------------------------------------ */
/* Role metadata                                                       */
/* ------------------------------------------------------------------ */

const ROLE_META = [
  { key: "Teacher", label: "Teacher", icon: GraduationCap },
  { key: "Parent", label: "Parent", icon: Users },
  { key: "Therapist", label: "Therapist", icon: Stethoscope },
] as const;

/* ------------------------------------------------------------------ */
/* RatingStatCards                                                     */
/* ------------------------------------------------------------------ */

/**
 * Three GlassCards — one per role (Teacher, Parent, Therapist) — each
 * showing the average rating, entry count, star bar, and min/max range
 * for that role's progress records.
 */
export function RatingStatCards({ records }: RatingStatCardsProps) {
  const roleStats = useMemo(() => buildRoleStats(records), [records]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ROLE_META.map(({ key, label, icon: Icon }) => {
        const stat = roleStats[key];
        return (
          <GlassCard key={key}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {label} Ratings
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {stat.count} {stat.count === 1 ? "entry" : "entries"}
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums text-foreground">
                  {stat.avg}
                </span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <div className="mt-2 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "h-3.5 w-3.5",
                      n <= Math.round(stat.avgNum)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {stat.count > 0
                  ? `Range ${stat.min}–${stat.max} stars`
                  : "No entries recorded yet"}
              </p>
            </CardContent>
          </GlassCard>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats builder                                                       */
/* ------------------------------------------------------------------ */

function buildRoleStats(records: ProgressRecord[]) {
  const out: Record<string, { count: number; avg: string; avgNum: number; min: number; max: number }> = {};
  for (const { key } of ROLE_META) {
    const list = records.filter((r) =>
      r.recordedBy.toLowerCase().includes(key.toLowerCase()),
    );
    if (list.length === 0) {
      out[key] = { count: 0, avg: "—", avgNum: 0, min: 0, max: 0 };
    } else {
      const sum = list.reduce((s, r) => s + r.rating, 0);
      const avgNum = sum / list.length;
      out[key] = {
        count: list.length,
        avg: avgNum.toFixed(2),
        avgNum,
        min: Math.min(...list.map((r) => r.rating)),
        max: Math.max(...list.map((r) => r.rating)),
      };
    }
  }
  return out;
}

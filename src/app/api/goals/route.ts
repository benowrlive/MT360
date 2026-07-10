import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query param is required" },
        { status: 400 },
      );
    }
    const goals = await db.goal.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ goals });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch goals" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      domain,
      annualGoal,
      baseline,
      objective,
      teachingStrategy,
      accommodation,
      modification,
      resources,
      measurementMethod,
      progressIndicators,
      responsibleProfessional,
      reviewDate,
      isAiGenerated,
      status,
      progress,
    } = body as {
      studentId: string;
      domain: string;
      annualGoal: string;
      baseline?: string;
      objective?: string;
      teachingStrategy?: string;
      accommodation?: string;
      modification?: string;
      resources?: string;
      measurementMethod?: string;
      progressIndicators?: string;
      responsibleProfessional?: string;
      reviewDate?: string | null;
      isAiGenerated?: boolean;
      status?: string;
      progress?: number;
    };

    if (!studentId || !domain || !annualGoal) {
      return NextResponse.json(
        { error: "studentId, domain and annualGoal are required" },
        { status: 400 },
      );
    }

    const goal = await db.goal.create({
      data: {
        studentId,
        domain,
        annualGoal: annualGoal.trim(),
        baseline: baseline ?? "",
        objective: objective ?? "",
        teachingStrategy: teachingStrategy ?? "",
        accommodation: accommodation ?? "",
        modification: modification ?? "",
        resources: resources ?? "",
        measurementMethod: measurementMethod ?? "",
        progressIndicators: progressIndicators ?? "",
        responsibleProfessional: responsibleProfessional ?? "",
        reviewDate: reviewDate ? new Date(reviewDate) : null,
        isAiGenerated: Boolean(isAiGenerated),
        status: status ?? "active",
        progress: typeof progress === "number" ? progress : 0,
      },
    });
    return NextResponse.json({ goal }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create goal" },
      { status: 500 },
    );
  }
}

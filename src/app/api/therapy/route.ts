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
    const sessions = await db.therapySession.findMany({
      where: { studentId },
      orderBy: [{ therapyType: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ sessions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch therapy sessions" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      therapyType,
      week,
      sessionTitle,
      objectives,
      activities,
      materials,
      promptingLevel,
      reinforcement,
      dataCollection,
      homework,
      isAiGenerated,
    } = body as {
      studentId: string;
      therapyType: string;
      week: string;
      sessionTitle: string;
      objectives?: string;
      activities?: string;
      materials?: string;
      promptingLevel?: string;
      reinforcement?: string;
      dataCollection?: string;
      homework?: string;
      isAiGenerated?: boolean;
    };

    if (!studentId || !therapyType || !week || !sessionTitle) {
      return NextResponse.json(
        { error: "studentId, therapyType, week and sessionTitle are required" },
        { status: 400 },
      );
    }

    const session = await db.therapySession.create({
      data: {
        studentId,
        therapyType,
        week: week.trim(),
        sessionTitle: sessionTitle.trim(),
        objectives: objectives ?? "",
        activities: activities ?? "",
        materials: materials ?? "",
        promptingLevel: promptingLevel ?? "",
        reinforcement: reinforcement ?? "",
        dataCollection: dataCollection ?? "",
        homework: homework ?? "",
        isAiGenerated: Boolean(isAiGenerated),
      },
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create therapy session" },
      { status: 500 },
    );
  }
}

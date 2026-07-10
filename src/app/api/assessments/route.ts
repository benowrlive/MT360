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
    const assessments = await db.assessment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ assessments });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch assessments" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, type, title, rawContent, uploadedBy } = body as {
      studentId: string;
      type: string;
      title: string;
      rawContent?: string;
      uploadedBy?: string;
    };

    if (!studentId || !type || !title) {
      return NextResponse.json(
        { error: "studentId, type and title are required" },
        { status: 400 },
      );
    }

    const assessment = await db.assessment.create({
      data: {
        studentId,
        type,
        title: title.trim(),
        rawContent: rawContent ?? "",
        uploadedBy: uploadedBy?.trim() || "Therapist",
      },
    });
    return NextResponse.json({ assessment }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create assessment" },
      { status: 500 },
    );
  }
}

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
    const reports = await db.report.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    const serialised = reports.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      type: r.type,
      title: r.title,
      content: r.content,
      isAiGenerated: r.isAiGenerated,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ reports: serialised });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch reports" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, type, title, content, isAiGenerated } = body as {
      studentId: string;
      type: string;
      title: string;
      content: string;
      isAiGenerated?: boolean;
    };

    if (!studentId || !type || !title || !content) {
      return NextResponse.json(
        { error: "studentId, type, title and content are required" },
        { status: 400 },
      );
    }

    const report = await db.report.create({
      data: {
        studentId,
        type,
        title: title.trim(),
        content: content.trim(),
        isAiGenerated: Boolean(isAiGenerated),
      },
    });

    return NextResponse.json(
      {
        report: {
          id: report.id,
          studentId: report.studentId,
          type: report.type,
          title: report.title,
          content: report.content,
          isAiGenerated: report.isAiGenerated,
          createdAt: report.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create report" },
      { status: 500 },
    );
  }
}

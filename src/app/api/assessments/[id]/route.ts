import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.rawContent === "string") data.rawContent = body.rawContent;
    if (typeof body.summary === "string") data.summary = body.summary;
    if (typeof body.aiSummary === "string") data.aiSummary = body.aiSummary;
    if (typeof body.type === "string") data.type = body.type;
    if (typeof body.uploadedBy === "string") data.uploadedBy = body.uploadedBy;

    const updated = await db.assessment.update({
      where: { id },
      data,
    });
    return NextResponse.json({ assessment: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update assessment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.assessment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete assessment" },
      { status: 500 },
    );
  }
}

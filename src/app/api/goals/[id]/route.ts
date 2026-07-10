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
    const allowed = [
      "domain",
      "annualGoal",
      "baseline",
      "objective",
      "teachingStrategy",
      "accommodation",
      "modification",
      "resources",
      "measurementMethod",
      "progressIndicators",
      "responsibleProfessional",
      "status",
      "progress",
      "isAiGenerated",
    ];
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }
    if (body.reviewDate !== undefined) {
      data.reviewDate = body.reviewDate ? new Date(body.reviewDate) : null;
    }

    const updated = await db.goal.update({
      where: { id },
      data,
    });
    return NextResponse.json({ goal: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update goal" },
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
    await db.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete goal" },
      { status: 500 },
    );
  }
}

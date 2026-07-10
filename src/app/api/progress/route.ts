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
    const records = await db.progressRecord.findMany({
      where: { studentId },
      include: { goal: { select: { domain: true } } },
      orderBy: { date: "desc" },
    });
    const serialised = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      goalId: r.goalId,
      date: r.date.toISOString(),
      rating: r.rating,
      note: r.note,
      recordedBy: r.recordedBy,
      domain: r.domain,
      goalDomain: r.goal?.domain ?? null,
      createdAt: r.createdAt.toISOString(),
    }));
    return NextResponse.json({ records: serialised });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch progress records" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, goalId, date, rating, note, recordedBy, domain } =
      body as {
        studentId: string;
        goalId?: string | null;
        date: string;
        rating: number;
        note?: string;
        recordedBy?: string;
        domain?: string;
      };

    if (!studentId || !date) {
      return NextResponse.json(
        { error: "studentId and date are required" },
        { status: 400 },
      );
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "rating must be a number between 1 and 5" },
        { status: 400 },
      );
    }

    const record = await db.progressRecord.create({
      data: {
        studentId,
        goalId: goalId || null,
        date: new Date(date),
        rating: Math.round(ratingNum),
        note: (note ?? "").trim(),
        recordedBy: (recordedBy ?? "Therapist").trim() || "Therapist",
        domain: (domain ?? "").trim(),
      },
      include: { goal: { select: { domain: true } } },
    });

    return NextResponse.json(
      {
        record: {
          id: record.id,
          studentId: record.studentId,
          goalId: record.goalId,
          date: record.date.toISOString(),
          rating: record.rating,
          note: record.note,
          recordedBy: record.recordedBy,
          domain: record.domain,
          goalDomain: record.goal?.domain ?? null,
          createdAt: record.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create progress record" },
      { status: 500 },
    );
  }
}

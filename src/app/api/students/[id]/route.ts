import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseStudent } from "@/lib/student-utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const student = await db.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ student: parseStudent(student) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();
  const diagnosis = Array.isArray(body.diagnosis) ? body.diagnosis : undefined;
  const data: Record<string, unknown> = { ...body };
  if (diagnosis) data.diagnosis = JSON.stringify(diagnosis);
  if (body.dob) data.dob = new Date(body.dob);
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  const student = await db.student.update({ where: { id }, data });
  return NextResponse.json({ student: parseStudent(student) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await db.student.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

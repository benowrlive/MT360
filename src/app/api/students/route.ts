import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AVATAR_COLORS, avatarColorFor } from "@/lib/constants";
import { parseStudent } from "@/lib/student-utils";

export async function GET() {
  const students = await db.student.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { goals: true, assessments: true, reports: true } },
    },
  });
  return NextResponse.json({
    students: students.map(parseStudent),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const diagnosis = Array.isArray(body.diagnosis) ? body.diagnosis : [];
    const color =
      AVATAR_COLORS.includes(body.avatarColor) || body.avatarColor
        ? body.avatarColor
        : avatarColorFor(body.name || "student");
    const student = await db.student.create({
      data: {
        name: body.name?.trim() || "Unnamed Student",
        dob: new Date(body.dob),
        grade: body.grade || "",
        gender: body.gender || "",
        school: body.school || "",
        parentName: body.parentName || "",
        parentEmail: body.parentEmail || "",
        parentPhone: body.parentPhone || "",
        diagnosis: JSON.stringify(diagnosis),
        languages: body.languages || "",
        medicalConditions: body.medicalConditions || "",
        allergies: body.allergies || "",
        currentTherapies: body.currentTherapies || "",
        medications: body.medications || "",
        strengths: body.strengths || "",
        interests: body.interests || "",
        learningStyle: body.learningStyle || "",
        curriculum: body.curriculum || "IB",
        avatarColor: color,
      },
    });
    return NextResponse.json({ student: parseStudent(student) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create student" },
      { status: 400 },
    );
  }
}

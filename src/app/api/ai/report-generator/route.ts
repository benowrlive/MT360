import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import { REPORT_TYPES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { studentId, reportType } = (await req.json()) as {
      studentId: string;
      reportType: string;
    };

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }
    if (!reportType) {
      return NextResponse.json(
        { error: "reportType is required" },
        { status: 400 },
      );
    }

    const student = await getStudentForAI(studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 },
      );
    }

    const label =
      REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType;

    const goals = await db.goal.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
      select: {
        domain: true,
        annualGoal: true,
        baseline: true,
        objective: true,
        status: true,
        progress: true,
        reviewDate: true,
        responsibleProfessional: true,
        measurementMethod: true,
        accommodation: true,
      },
    });

    const assessments = await db.assessment.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        title: true,
        summary: true,
        uploadedBy: true,
        createdAt: true,
      },
    });

    // Recent progress records (last 12 weeks)
    const since = new Date();
    since.setDate(since.getDate() - 7 * 12);
    const records = await db.progressRecord.findMany({
      where: { studentId, date: { gte: since } },
      orderBy: { date: "desc" },
      select: {
        date: true,
        rating: true,
        note: true,
        domain: true,
        recordedBy: true,
      },
      take: 40,
    });

    const systemPrompt = `You are a senior special education professional. Generate a professional, HIPAA-conscious ${label} as Markdown. Use clear sections with ## headings, tables where appropriate, and professional tone. Include the student's relevant profile, present levels, goals, progress, accommodations and recommendations. Do not invent clinical data not provided. Refer to the student by initials in sensitive contexts if appropriate. Be specific to the student's actual data.`;

    const goalsBlock =
      goals.length === 0
        ? "No goals recorded."
        : goals
            .map(
              (g, i) =>
                `${i + 1}. [${g.status.toUpperCase()} · ${g.progress}%] ${g.domain}\n   - Annual Goal: ${g.annualGoal}\n   - Baseline: ${g.baseline || "Not specified"}\n   - Objective: ${g.objective || "Not specified"}\n   - Measurement: ${g.measurementMethod || "Not specified"}\n   - Accommodation: ${g.accommodation || "Not specified"}` +
                (g.responsibleProfessional
                  ? `\n   - Lead Professional: ${g.responsibleProfessional}`
                  : "") +
                (g.reviewDate
                  ? `\n   - Review Date: ${g.reviewDate.toISOString().slice(0, 10)}`
                  : ""),
            )
            .join("\n");

    const assessmentsBlock =
      assessments.length === 0
        ? "No assessments on file."
        : assessments
            .map(
              (a) =>
                `- ${a.type.toUpperCase()} (${a.createdAt.toISOString().slice(0, 10)}) — ${a.title}${a.summary ? `\n  Summary: ${a.summary.slice(0, 600)}` : ""}`,
            )
            .join("\n");

    const recordsBlock =
      records.length === 0
        ? "No progress records in the last 12 weeks."
        : records
            .slice(0, 25)
            .map(
              (r) =>
                `- ${r.date.toISOString().slice(0, 10)} | ${r.rating}/5 | ${r.domain || "General"} | by ${r.recordedBy}: ${r.note || "no note"}`,
            )
            .join("\n");

    const avgRating =
      records.length > 0
        ? (
            records.reduce((sum, r) => sum + r.rating, 0) / records.length
          ).toFixed(2)
        : "N/A";

    const userPrompt = [
      `REPORT TYPE: ${label} (${reportType})`,
      "",
      "=== STUDENT PROFILE ===",
      `Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Gender: ${student.gender || "Not specified"}`,
      `Grade: ${student.grade || "Not specified"}`,
      `School: ${student.school || "Not specified"}`,
      `Curriculum: ${student.curriculum || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Languages: ${student.languages || "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Medical Conditions: ${student.medicalConditions || "None specified"}`,
      `Current Therapies: ${student.currentTherapies || "None specified"}`,
      `Medications: ${student.medications || "None specified"}`,
      `Parent/Guardian: ${student.parentName || "Not specified"} (${student.parentEmail || "no email"} / ${student.parentPhone || "no phone"})`,
      "",
      `=== GOALS (${goals.length}) ===`,
      goalsBlock,
      "",
      `=== ASSESSMENTS (${assessments.length}) ===`,
      assessmentsBlock,
      "",
      `=== PROGRESS RECORDS (last 12 weeks, ${records.length} entries, avg rating ${avgRating}) ===`,
      recordsBlock,
      "",
      `Generate the ${label} now in Markdown. Use ## sections (e.g. Student Profile, Present Levels, Goals & Progress, Accommodations, Recommendations). Use Markdown tables where appropriate. Be professional, specific, and HIPAA-conscious — do not include invented clinical scores or diagnoses beyond what is provided.`,
    ].join("\n");

    const content = await generateText(systemPrompt, userPrompt);
    return NextResponse.json({ content });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI report generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

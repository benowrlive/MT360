import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateText } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";

export async function POST(req: NextRequest) {
  try {
    const { studentId } = (await req.json()) as { studentId: string };
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
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

    const goals = await db.goal.findMany({
      where: { studentId },
      orderBy: { createdAt: "asc" },
      select: {
        domain: true,
        annualGoal: true,
        baseline: true,
        status: true,
        progress: true,
        reviewDate: true,
        responsibleProfessional: true,
      },
    });

    // Last 8 weeks of progress records
    const since = new Date();
    since.setDate(since.getDate() - 7 * 8);
    const records = await db.progressRecord.findMany({
      where: { studentId, date: { gte: since } },
      orderBy: { date: "asc" },
      select: {
        date: true,
        rating: true,
        note: true,
        domain: true,
        recordedBy: true,
      },
    });

    const systemPrompt =
      "You are a special education progress analyst. Write a concise, professional progress summary (300-500 words) in Markdown covering: overall progress, strengths observed, goals on track, goals needing attention, and 2-3 recommendations. Use the student's data. Be specific and evidence-based. Use ## headings and bullet points.";

    const goalsBlock =
      goals.length === 0
        ? "No active goals recorded."
        : goals
            .map(
              (g, i) =>
                `${i + 1}. [${g.status.toUpperCase()} · ${g.progress}%] ${g.domain}: ${g.annualGoal}` +
                (g.responsibleProfessional
                  ? ` (Lead: ${g.responsibleProfessional})`
                  : ""),
            )
            .join("\n");

    const recordsBlock =
      records.length === 0
        ? "No progress records in the last 8 weeks."
        : records
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
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `School: ${student.school || "Not specified"}`,
      `Curriculum: ${student.curriculum || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      "",
      `=== GOALS (${goals.length}) ===`,
      goalsBlock,
      "",
      `=== PROGRESS RECORDS (last 8 weeks, ${records.length} entries, avg rating ${avgRating}) ===`,
      recordsBlock,
      "",
      "Write the progress summary now. Use ## headings (Overall Progress, Strengths Observed, Goals On Track, Goals Needing Attention, Recommendations) and bullet points. Do not invent clinical data not provided.",
    ].join("\n");

    const summary = await generateText(systemPrompt, userPrompt);
    return NextResponse.json({ summary });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI progress summary generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { AssessmentSummary } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { assessmentId } = (await req.json()) as { assessmentId: string };
    if (!assessmentId) {
      return NextResponse.json(
        { error: "assessmentId is required" },
        { status: 400 },
      );
    }

    const assessment = await db.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 },
      );
    }

    const student = await getStudentForAI(assessment.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found for this assessment" },
        { status: 404 },
      );
    }

    const systemPrompt =
      "You are a senior special education assessor. Produce a structured assessment summary as JSON with these exact keys: " +
      "presentLevels, strengths, areasOfNeed, functionalSkills, academicSkills, socialSkills, behaviour, communication, motorSkills, sensoryProfile, executiveFunctioning, emotionalRegulation, learningPreferences. " +
      "Each value should be 2-4 sentences of professional, evidence-based observation. " +
      "Base every observation strictly on the supplied assessment text and known student profile. " +
      "If a domain is not addressed in the report, briefly note that more data is needed rather than inventing details.";

    const userPrompt = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Gender: ${student.gender || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Curriculum: ${student.curriculum || "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths (profile): ${student.strengths || "Not specified"}`,
      `Languages: ${student.languages || "Not specified"}`,
      "",
      `Assessment Type: ${assessment.type}`,
      `Assessment Title: ${assessment.title}`,
      `Uploaded By: ${assessment.uploadedBy}`,
      "",
      "Assessment Raw Content:",
      assessment.rawContent || "(no raw content provided)",
    ].join("\n");

    const result = await generateJson<AssessmentSummary>(systemPrompt, userPrompt);

    const plainSummary =
      `${result.presentLevels || ""} ${result.strengths || ""} ${result.areasOfNeed || ""}`.trim();

    const updated = await db.assessment.update({
      where: { id: assessmentId },
      data: {
        aiSummary: JSON.stringify(result),
        summary: plainSummary.slice(0, 4000),
      },
    });

    return NextResponse.json({ summary: result, assessment: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI summary generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

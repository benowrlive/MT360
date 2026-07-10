import { NextRequest, NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { TherapyPlan } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { studentId, therapyType, week } = (await req.json()) as {
      studentId: string;
      therapyType: string;
      week: string;
    };

    if (!studentId || !therapyType || !week) {
      return NextResponse.json(
        { error: "studentId, therapyType and week are required" },
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

    const systemPrompt =
      "You are an expert therapy planner for special education. Generate a single weekly therapy session plan as JSON with keys: " +
      "sessionTitle, objectives, activities, materials, promptingLevel, reinforcement, dataCollection, homework. " +
      "objectives/activities/materials should be newline-separated lists. " +
      "promptingLevel should be one of: Independent, Gesture Prompt, Verbal Prompt, Visual Prompt, Model Prompt, Partial Physical Prompt, Full Physical Prompt. " +
      "Make it specific to the student's diagnosis, age and current therapies.";

    const userPrompt = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Current Therapies: ${student.currentTherapies || "None specified"}`,
      `Medical Conditions: ${student.medicalConditions || "None specified"}`,
      `Languages: ${student.languages || "Not specified"}`,
      "",
      `Therapy Type: ${therapyType}`,
      `Week Label: ${week}`,
      "",
      "Return a single JSON object with the keys listed above. Make the plan practical, age-appropriate and tailored to this student.",
    ].join("\n");

    const result = await generateJson<TherapyPlan>(systemPrompt, userPrompt);

    // Normalize: ensure required strings exist + include therapyType & week.
    const plan: TherapyPlan = {
      therapyType,
      week,
      sessionTitle: result.sessionTitle?.trim() || `${therapyType} · ${week}`,
      objectives: result.objectives ?? "",
      activities: result.activities ?? "",
      materials: result.materials ?? "",
      promptingLevel: result.promptingLevel ?? "",
      reinforcement: result.reinforcement ?? "",
      dataCollection: result.dataCollection ?? "",
      homework: result.homework ?? "",
    };

    return NextResponse.json({ plan });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI therapy plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

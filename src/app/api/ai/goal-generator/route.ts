import { NextRequest, NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { SmartGoal } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { studentId, domains } = (await req.json()) as {
      studentId: string;
      domains: string[];
    };

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }
    if (!Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        { error: "At least one domain must be selected" },
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
      "You are a special education expert. Generate one SMART IEP goal per requested domain as a JSON array. " +
      "Each goal object must have keys: domain, annualGoal, baseline, objective, teachingStrategy, accommodation, modification, resources, measurementMethod, progressIndicators, responsibleProfessional. " +
      "Make goals Specific, Measurable, Achievable, Relevant, Time-bound and aligned to the student's curriculum. " +
      "Ensure each domain appears exactly once in the response. Do not include any other text.";

    const userPrompt = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Curriculum: ${student.curriculum || "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Current Therapies: ${student.currentTherapies || "None specified"}`,
      `Medical Conditions: ${student.medicalConditions || "None specified"}`,
      "",
      `Requested Domains (${domains.length}):`,
      ...domains.map((d, i) => `${i + 1}. ${d}`),
      "",
      "Return a JSON array of objects — one goal per requested domain, in the same order.",
    ].join("\n");

    const result = await generateJson<SmartGoal[]>(systemPrompt, userPrompt);

    // Normalize: ensure each goal maps to a requested domain
    const normalized = Array.isArray(result) ? result : [];
    const mapped = normalized.map((g) => ({
      ...g,
      domain: g.domain || domains[0] || "General",
    }));

    return NextResponse.json({ goals: mapped });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI goal generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

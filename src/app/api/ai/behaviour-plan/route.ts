import { NextRequest, NextResponse } from "next/server";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { BehaviourPlanData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { studentId, behaviourOfConcern } = (await req.json()) as {
      studentId: string;
      behaviourOfConcern: string;
    };

    if (!studentId || !behaviourOfConcern) {
      return NextResponse.json(
        { error: "studentId and behaviourOfConcern are required" },
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
      "You are a Board Certified Behaviour Analyst. Generate a Function-Based Behaviour Support Plan as JSON with keys: " +
      "behaviourOfConcern, abcAntecedent, abcBehaviour, abcConsequence, behaviourFunction, triggers, maintainingFactors, " +
      "replacementBehaviours, preventiveStrategies, reactiveStrategies, rewardSystems. " +
      "behaviourFunction should identify the likely function (e.g. access, escape, attention, sensory). " +
      "Be evidence-based (ABA-informed), specific to the student.";

    const userPrompt = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Current Therapies: ${student.currentTherapies || "None specified"}`,
      `Medical Conditions: ${student.medicalConditions || "None specified"}`,
      `Medications: ${student.medications || "None specified"}`,
      "",
      `Behaviour of Concern: ${behaviourOfConcern}`,
      "",
      "Return a single JSON object with the keys listed above. Use clear, practical language. " +
      "Array-like fields (triggers, maintainingFactors, replacementBehaviours, preventiveStrategies, reactiveStrategies, rewardSystems) " +
      "should be newline-separated lists.",
    ].join("\n");

    const result = await generateJson<BehaviourPlanData>(systemPrompt, userPrompt);

    // Normalize fields so the frontend always has strings.
    const plan: BehaviourPlanData = {
      behaviourOfConcern: result.behaviourOfConcern?.trim() || behaviourOfConcern.trim(),
      abcAntecedent: result.abcAntecedent ?? "",
      abcBehaviour: result.abcBehaviour ?? "",
      abcConsequence: result.abcConsequence ?? "",
      behaviourFunction: result.behaviourFunction ?? "",
      triggers: result.triggers ?? "",
      maintainingFactors: result.maintainingFactors ?? "",
      replacementBehaviours: result.replacementBehaviours ?? "",
      preventiveStrategies: result.preventiveStrategies ?? "",
      reactiveStrategies: result.reactiveStrategies ?? "",
      rewardSystems: result.rewardSystems ?? "",
    };

    return NextResponse.json({ plan });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI behaviour plan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

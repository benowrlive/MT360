import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { GoalSuggestion } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { goalId } = (await req.json()) as { goalId: string };

    if (!goalId) {
      return NextResponse.json({ error: "goalId is required" }, { status: 400 });
    }

    const goal = await db.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const student = await getStudentForAI(goal.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found for this goal" },
        { status: 404 },
      );
    }

    const systemPrompt =
      "You are a behaviour and special education specialist. Suggest evidence-based supports for this IEP goal as JSON with these exact array keys: " +
      "shortTermGoals, longTermGoals, replacementBehaviours, interventions, teachingTechniques, reinforcementSchedules, promptHierarchy, taskAnalysis, visualSupports, socialStories, behaviourStrategies, sensoryStrategies, homeActivities, parentStrategies, teacherStrategies. " +
      "Each array should contain 3-6 concise, actionable items. Use plain language. For taskAnalysis and promptHierarchy list ordered steps where appropriate. Do not include any other text.";

    const userPrompt = [
      `Student Name: ${student.name}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Age Group / Grade: ${student.grade || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      "",
      "Goal Details:",
      `Domain: ${goal.domain}`,
      `Annual Goal: ${goal.annualGoal}`,
      `Baseline: ${goal.baseline || "Not specified"}`,
      `Objective: ${goal.objective || "Not specified"}`,
      `Teaching Strategy: ${goal.teachingStrategy || "Not specified"}`,
      `Accommodation: ${goal.accommodation || "Not specified"}`,
    ].join("\n");

    const result = await generateJson<GoalSuggestion>(systemPrompt, userPrompt);

    // Ensure all keys exist as arrays
    const keys: (keyof GoalSuggestion)[] = [
      "shortTermGoals",
      "longTermGoals",
      "replacementBehaviours",
      "interventions",
      "teachingTechniques",
      "reinforcementSchedules",
      "promptHierarchy",
      "taskAnalysis",
      "visualSupports",
      "socialStories",
      "behaviourStrategies",
      "sensoryStrategies",
      "homeActivities",
      "parentStrategies",
      "teacherStrategies",
    ];
    const safe: GoalSuggestion = { ...result } as GoalSuggestion;
    for (const k of keys) {
      if (!Array.isArray((safe as GoalSuggestion)[k])) {
        (safe as GoalSuggestion)[k] = [];
      }
    }

    return NextResponse.json({ suggestions: safe });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI suggestion generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import type { LessonPlan } from "@/lib/types";

interface GoalRow {
  id: string;
  domain: string;
  annualGoal: string;
  baseline: string;
  objective: string;
  teachingStrategy: string;
  accommodation: string;
  modification: string;
  measurementMethod: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      studentId: string;
      goalId?: string;
      domain?: string;
      topic?: string;
      duration?: string;
    };

    if (!body.studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 },
      );
    }

    const student = await getStudentForAI(body.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 },
      );
    }

    // Resolve goal context: a single goal if goalId is supplied, otherwise
    // pull the student's active goals so the AI can align the lesson.
    let goalContext: GoalRow | null = null;
    let activeGoals: GoalRow[] = [];
    if (body.goalId) {
      const g = await db.goal.findUnique({ where: { id: body.goalId } });
      if (g) {
        goalContext = {
          id: g.id,
          domain: g.domain,
          annualGoal: g.annualGoal,
          baseline: g.baseline,
          objective: g.objective,
          teachingStrategy: g.teachingStrategy,
          accommodation: g.accommodation,
          modification: g.modification,
          measurementMethod: g.measurementMethod,
        };
      }
    } else {
      const rows = await db.goal.findMany({
        where: { studentId: body.studentId, status: "active" },
        orderBy: { createdAt: "desc" },
        take: 6,
      });
      activeGoals = rows.map((g) => ({
        id: g.id,
        domain: g.domain,
        annualGoal: g.annualGoal,
        baseline: g.baseline,
        objective: g.objective,
        teachingStrategy: g.teachingStrategy,
        accommodation: g.accommodation,
        modification: g.modification,
        measurementMethod: g.measurementMethod,
      }));
    }

    const duration = body.duration?.trim() || "30 min";

    const systemPrompt =
      "You are an expert special education lesson designer. Generate a differentiated lesson plan as JSON with keys: " +
      "title, objective, duration, materials, teachingAids, visualSupports, introduction, mainActivity, differentiation, assessment, homework. " +
      "materials/teachingAids/visualSupports should be newline-separated lists. " +
      "Tailor to the student's grade, curriculum, learning style, diagnosis and strengths. " +
      "Use multisensory, evidence-based pedagogy. " +
      "The title should be concise and engaging. The objective must be measurable and observable. " +
      "The introduction, mainActivity, differentiation, assessment and homework should be 2-5 sentences each, written as natural prose. " +
      "Differentiation should explicitly address supports for the student's diagnosis and learning style. " +
      "Do not include any commentary or markdown — only valid JSON.";

    const userLines: string[] = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Curriculum: ${student.curriculum || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Lesson Duration: ${duration}`,
    ];

    if (body.topic && body.topic.trim()) {
      userLines.push(`Lesson Topic / Subject: ${body.topic.trim()}`);
    }

    if (goalContext) {
      userLines.push(
        "",
        "Align the lesson to this specific IEP goal:",
        `Goal Domain: ${goalContext.domain}`,
        `Annual Goal: ${goalContext.annualGoal}`,
        `Baseline: ${goalContext.baseline || "Not specified"}`,
        `Objective: ${goalContext.objective || "Not specified"}`,
        `Teaching Strategy: ${goalContext.teachingStrategy || "Not specified"}`,
        `Accommodation: ${goalContext.accommodation || "Not specified"}`,
        `Modification: ${goalContext.modification || "Not specified"}`,
        `Measurement Method: ${goalContext.measurementMethod || "Not specified"}`,
      );
    } else if (body.domain) {
      userLines.push("", `Target Domain: ${body.domain}`);
    }

    if (!goalContext && activeGoals.length > 0) {
      userLines.push(
        "",
        "Student's active IEP goals (for alignment context):",
        ...activeGoals.map(
          (g, i) =>
            `${i + 1}. [${g.domain}] ${g.annualGoal}${g.objective ? ` — ${g.objective}` : ""}`,
        ),
      );
    }

    userLines.push(
      "",
      `Return JSON with the 11 keys above. The "duration" field should be "${duration}".`,
    );

    const userPrompt = userLines.join("\n");

    const result = await generateJson<LessonPlan>(systemPrompt, userPrompt);

    // Normalize: ensure strings, fallbacks where missing.
    const lesson: LessonPlan = {
      title: (result.title ?? "Untitled Lesson").toString().trim(),
      objective: (result.objective ?? "").toString().trim(),
      duration: (result.duration ?? duration).toString().trim(),
      materials: (result.materials ?? "").toString().trim(),
      teachingAids: (result.teachingAids ?? "").toString().trim(),
      visualSupports: (result.visualSupports ?? "").toString().trim(),
      introduction: (result.introduction ?? "").toString().trim(),
      mainActivity: (result.mainActivity ?? "").toString().trim(),
      differentiation: (result.differentiation ?? "").toString().trim(),
      assessment: (result.assessment ?? "").toString().trim(),
      homework: (result.homework ?? "").toString().trim(),
    };

    return NextResponse.json({ lesson });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI lesson generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

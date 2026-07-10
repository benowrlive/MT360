import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "studentId query param is required" },
        { status: 400 },
      );
    }
    const plans = await db.behaviourPlan.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch behaviour plans" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studentId,
      behaviourOfConcern,
      abcAntecedent,
      abcBehaviour,
      abcConsequence,
      behaviourFunction,
      triggers,
      maintainingFactors,
      replacementBehaviours,
      preventiveStrategies,
      reactiveStrategies,
      rewardSystems,
      isAiGenerated,
    } = body as {
      studentId: string;
      behaviourOfConcern: string;
      abcAntecedent?: string;
      abcBehaviour?: string;
      abcConsequence?: string;
      behaviourFunction?: string;
      triggers?: string;
      maintainingFactors?: string;
      replacementBehaviours?: string;
      preventiveStrategies?: string;
      reactiveStrategies?: string;
      rewardSystems?: string;
      isAiGenerated?: boolean;
    };

    if (!studentId || !behaviourOfConcern) {
      return NextResponse.json(
        { error: "studentId and behaviourOfConcern are required" },
        { status: 400 },
      );
    }

    const plan = await db.behaviourPlan.create({
      data: {
        studentId,
        behaviourOfConcern: behaviourOfConcern.trim(),
        abcAntecedent: abcAntecedent ?? "",
        abcBehaviour: abcBehaviour ?? "",
        abcConsequence: abcConsequence ?? "",
        behaviourFunction: behaviourFunction ?? "",
        triggers: triggers ?? "",
        maintainingFactors: maintainingFactors ?? "",
        replacementBehaviours: replacementBehaviours ?? "",
        preventiveStrategies: preventiveStrategies ?? "",
        reactiveStrategies: reactiveStrategies ?? "",
        rewardSystems: rewardSystems ?? "",
        isAiGenerated: Boolean(isAiGenerated),
      },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create behaviour plan" },
      { status: 500 },
    );
  }
}

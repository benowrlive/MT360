import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateJson } from "@/lib/ai";
import { getStudentForAI } from "@/lib/student-utils";
import { ACCOMMODATION_CATEGORIES } from "@/lib/constants";
import type { AccommodationSet } from "@/lib/types";

const ALLOWED_CATEGORIES = new Set<string>(ACCOMMODATION_CATEGORIES);

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
      where: { studentId, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { domain: true, annualGoal: true, accommodation: true },
    });

    const systemPrompt =
      "You are a special education accommodations specialist. Generate a comprehensive set of accommodations as a JSON array. " +
      "Each element: { category, items: string[] }. " +
      `Use EXACTLY these 7 categories in this order: ${ACCOMMODATION_CATEGORIES.join(", ")}. ` +
      "Each items array should have 3-6 specific, actionable accommodations tailored to the student's diagnosis, learning style and needs. " +
      "Items must be concrete and observable (e.g. \"Provide a quiet testing space with reduced visual distractions\" rather than \"Modify environment\"). " +
      "Do not duplicate items across categories. Do not include any commentary or markdown — only the JSON array.";

    const userLines: string[] = [
      `Student Name: ${student.name}`,
      `Age: ${student.age} years`,
      `Grade: ${student.grade || "Not specified"}`,
      `Gender: ${student.gender || "Not specified"}`,
      `Diagnosis: ${student.diagnosis.length ? student.diagnosis.join(", ") : "Not specified"}`,
      `Learning Style: ${student.learningStyle || "Not specified"}`,
      `Strengths: ${student.strengths || "Not specified"}`,
      `Interests: ${student.interests || "Not specified"}`,
      `Current Therapies: ${student.currentTherapies || "None specified"}`,
      `Medical Conditions: ${student.medicalConditions || "None specified"}`,
      `Allergies: ${student.allergies || "None specified"}`,
      `Medications: ${student.medications || "None specified"}`,
      `Languages: ${student.languages || "Not specified"}`,
    ];

    if (goals.length > 0) {
      userLines.push(
        "",
        "Active IEP goals (for context):",
        ...goals.map(
          (g, i) =>
            `${i + 1}. [${g.domain}] ${g.annualGoal}${g.accommodation ? ` (existing accommodation: ${g.accommodation})` : ""}`,
        ),
      );
    }

    userLines.push(
      "",
      `Return a JSON array of exactly 7 objects — one per category, in this order: ${ACCOMMODATION_CATEGORIES.join(", ")}.`,
    );

    const userPrompt = userLines.join("\n");

    const result = await generateJson<AccommodationSet[]>(
      systemPrompt,
      userPrompt,
    );

    const raw = Array.isArray(result) ? result : [];

    // Normalize: guarantee exactly 7 categories in the canonical order, with
    // unique, non-empty items per category. Missing categories are filled in.
    const byCategory = new Map<string, string[]>();
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const cat = String(entry.category ?? "").trim();
      if (!cat) continue;
      // Match against canonical category either exactly or case-insensitively.
      const canonical =
        ALLOWED_CATEGORIES.has(cat)
          ? cat
          : ACCOMMODATION_CATEGORIES.find(
              (c) => c.toLowerCase() === cat.toLowerCase(),
            ) ?? null;
      if (!canonical) continue;
      const items = Array.isArray(entry.items)
        ? entry.items
            .map((it) => String(it ?? "").trim())
            .filter((it) => it.length > 0)
        : [];
      const existing = byCategory.get(canonical) ?? [];
      for (const it of items) {
        if (!existing.some((x) => x.toLowerCase() === it.toLowerCase())) {
          existing.push(it);
        }
      }
      byCategory.set(canonical, existing);
    }

    const accommodations: AccommodationSet[] = ACCOMMODATION_CATEGORIES.map(
      (category) => ({
        category,
        items: byCategory.get(category) ?? [],
      }),
    );

    return NextResponse.json({ accommodations });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "AI accommodations generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

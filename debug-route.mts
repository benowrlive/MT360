import { generateText, parseJsonRobust } from "./src/lib/ai.ts";

const systemPrompt = "You are a special education accommodations specialist. Generate a comprehensive set of accommodations as a JSON array. Each element: { category, items: string[] }. Use EXACTLY these 7 categories in this order: Classroom Accommodations, Exam Accommodations, Communication Supports, Environmental Modifications, Technology Supports, Sensory Accommodations, Behaviour Supports. Each items array should have 3-6 specific, actionable accommodations tailored to the student's diagnosis, learning style and needs. Items must be concrete and observable. Do not duplicate items across categories. Do not include any commentary or markdown — only the JSON array.\n\nRespond with valid JSON only. No markdown, no code fences, no commentary.";

const userPrompt = `Student Name: Ethan Williams
Age: 9 years
Grade: Grade 3
Gender: Male
Diagnosis: ADHD, Emotional Behaviour Disorder
Learning Style: Multisensory
Strengths: High energy, creative, strong leadership in group play
Interests: Football, building blocks, science experiments
Current Therapies: Behaviour Therapy, Counselling
Medical Conditions: None specified
Allergies: None specified
Medications: Atomoxetine
Languages: English

Return a JSON array of exactly 7 objects — one per category, in this order: Classroom Accommodations, Exam Accommodations, Communication Supports, Environmental Modifications, Technology Supports, Sensory Accommodations, Behaviour Supports.`;

try {
  const raw = await generateText(systemPrompt, userPrompt);
  console.log("=== RAW RESPONSE (first 1500 chars) ===");
  console.log(raw.slice(0, 1500));
  console.log("=== LENGTH:", raw.length);
  console.log("=== Attempting parse ===");
  const parsed = parseJsonRobust(raw);
  console.log("PARSED OK. Length:", Array.isArray(parsed) ? parsed.length : "not array");
} catch (e) {
  console.log("ERROR:", e.message);
}

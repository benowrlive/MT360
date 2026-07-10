// AI helper - server-side only. Wraps z-ai-web-dev-sdk for IEP generation tasks.
import "server-only";
import ZAI from "z-ai-web-dev-sdk";

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

/**
 * Generate text from a system + user prompt.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  retries = 2,
): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const zai = await getZai();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        thinking: { type: "disabled" },
      });
      const content = completion.choices[0]?.message?.content ?? "";
      if (!content.trim()) throw new Error("Empty AI response");
      return content.trim();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("AI generation failed");
}

/**
 * Generate a JSON object. Strips markdown fences and parses robustly.
 */
export async function generateJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const fullSystem = `${systemPrompt}\n\nRespond with valid JSON only. No markdown, no code fences, no commentary.`;
  const raw = await generateText(fullSystem, userPrompt);
  return parseJsonRobust<T>(raw);
}

export function parseJsonRobust<T>(raw: string): T {
  let text = raw.trim();
  // strip code fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  // Determine whether the response is an array or an object by checking
  // which opening bracket appears first, then slice from that opening
  // bracket to its matching closing bracket. This handles both
  // `[{...}, {...}]` and `{...}` payloads, even when the model wraps
  // the JSON in extra prose.
  const firstObj = text.indexOf("{");
  const firstArr = text.indexOf("[");
  let closeChar: "}" | "]";
  let start: number;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    closeChar = "]";
    start = firstArr;
  } else {
    closeChar = "}";
    start = firstObj;
  }
  const end = text.lastIndexOf(closeChar);
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return JSON.parse(text) as T;
}

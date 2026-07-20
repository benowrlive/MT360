// AI helper — server-side only.
// Provider-agnostic: supports Z.ai SDK (default) OR any OpenAI-compatible API
// (Groq, Google Gemini, OpenRouter, Together, OpenAI, Ollama, etc.).
//
// Configure via env vars (set ONE of these two groups):
//
//   Group A — Z.ai (original):
//     ZAI_API_KEY=...
//
//   Group B — OpenAI-compatible (recommended for India / free tier):
//     AI_API_KEY=...
//     AI_BASE_URL=https://api.groq.com/openai/v1   (example for Groq)
//     AI_MODEL=llama-3.3-70b-versatile              (example for Groq)
//
// Common providers + their base URLs:
//   Groq:          https://api.groq.com/openai/v1
//   Google Gemini: https://generativelanguage.googleapis.com/v1beta/openai/
//   OpenRouter:    https://openrouter.ai/api/v1
//   Together:      https://api.together.xyz/v1
//   OpenAI:        https://api.openai.com/v1
//   Ollama (local):http://localhost:11434/v1
import "server-only";
import ZAI from "z-ai-web-dev-sdk";
import OpenAI from "openai";

type Provider = "zai" | "openai-compat";

function detectProvider(): Provider {
  if (process.env.AI_API_KEY && process.env.AI_BASE_URL) return "openai-compat";
  if (process.env.ZAI_API_KEY) return "zai";
  // Fallback: try Z.ai (works in dev sandbox where the key is auto-injected)
  return "zai";
}

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;
let openaiInstance: OpenAI | null = null;

async function getZai() {
  if (!zaiInstance) zaiInstance = await ZAI.create();
  return zaiInstance;
}

function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
    });
  }
  return openaiInstance;
}

/**
 * Generate text from a system + user prompt. Uses the configured AI provider.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  retries = 2,
): Promise<string> {
  const provider = detectProvider();
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      if (provider === "openai-compat") {
        const client = getOpenAI();
        const model = process.env.AI_MODEL || "gpt-4o-mini";
        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const content = completion.choices[0]?.message?.content ?? "";
        if (!content.trim()) throw new Error("Empty AI response");
        return content.trim();
      } else {
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
      }
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
  // find first { or [ and last matching } or ]
  const firstObj = text.indexOf("{");
  const lastObj = text.lastIndexOf("}");
  const firstArr = text.indexOf("[");
  const lastArr = text.lastIndexOf("]");
  // pick whichever appears first
  if (firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)) {
    if (lastObj !== -1 && lastObj > firstObj) text = text.slice(firstObj, lastObj + 1);
  } else if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
    text = text.slice(firstArr, lastArr + 1);
  }
  return JSON.parse(text) as T;
}

/** Exposed for debugging / health checks */
export function getAiProviderInfo() {
  const p = detectProvider();
  return {
    provider: p,
    model: process.env.AI_MODEL || (p === "openai-compat" ? "gpt-4o-mini" : "glm-4.6"),
    baseUrl: p === "openai-compat" ? process.env.AI_BASE_URL : undefined,
    configured: p === "openai-compat" || !!process.env.ZAI_API_KEY,
  };
}

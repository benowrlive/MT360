import { NextResponse } from "next/server";
import { generateText, getAiProviderInfo } from "@/lib/ai";

/**
 * GET /api/ai/health — returns the configured AI provider (no key leak).
 * POST /api/ai/health — runs a tiny test generation to verify the key works.
 */
export async function GET() {
  return NextResponse.json(getAiProviderInfo());
}

export async function POST() {
  try {
    const info = getAiProviderInfo();
    if (!info.configured) {
      return NextResponse.json(
        { ok: false, error: "No AI provider configured. Set ZAI_API_KEY or AI_API_KEY+AI_BASE_URL+AI_MODEL." },
        { status: 400 },
      );
    }
    const test = await generateText(
      "You are a helpful assistant. Reply with exactly: OK",
      "Say OK.",
    );
    return NextResponse.json({ ok: true, provider: info.provider, model: info.model, response: test.slice(0, 50) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "AI test failed" },
      { status: 500 },
    );
  }
}

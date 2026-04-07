import { enhancePrompt, type EnhancedPromptResult, type PromptMode } from "@/lib/prompt-engine";
import type { AiEnhanceResult } from "@/lib/ai-result";
import type { EnhanceLanguage, EnhanceStrength, EnhanceStyle } from "@/lib/enhance-options";

type EnhanceRequest = {
  input?: string;
  mode?: PromptMode;
  language?: EnhanceLanguage;
  strength?: EnhanceStrength;
  style?: EnhanceStyle;
  analysisContext?: unknown;
};
type AiPayload = Partial<Omit<AiEnhanceResult, keyof EnhancedPromptResult | "source" | "provider" | "model" | "latencyMs">> & { enhancedPrompt?: string; summary?: string; improvements?: string[] };

const validModes: PromptMode[] = ["general", "coding", "marketing", "image", "research", "agentic"];
const validLanguages: EnhanceLanguage[] = ["auto", "english", "vietnamese", "bilingual"];
const validStrengths: EnhanceStrength[] = ["light", "balanced", "deep"];
const validStyles: EnhanceStyle[] = ["professional", "creative", "technical", "concise"];
const maxInputLength = 12000;

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function extractJson(content: string): AiPayload | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < firstBrace) return null;
  try { return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as AiPayload; } catch { return null; }
}

function createSystemPrompt(mode: PromptMode, language: EnhanceLanguage, strength: EnhanceStrength, style: EnhanceStyle) {
  return `You are PromptForge, an AI prompt consultant. Rewrite and improve the user's prompt for ${mode} work.

Controls: language=${language}, strength=${strength}, style=${style}

Return ONLY valid JSON. No markdown fences. Shape:
{
  "enhancedPrompt": "string",
  "summary": "string",
  "improvements": ["string"],
  "evaluation": {
    "score": 0,
    "grade": "string",
    "criteria": [{"label":"Clarity","score":0,"insight":"string"}],
    "issues": ["string"],
    "suggestions": ["string"]
  },
  "clarifyingQuestions": ["string"],
  "variants": [{"name":"Concise","prompt":"string","bestFor":"string"}],
  "changes": [{"title":"string","before":"string","after":"string","reason":"string"}],
  "checklist": [{"item":"string","passed":true,"note":"string"}],
  "metadata": {"title":"string","tags":["string"],"bestFor":["string"]}
}

Rules:
- Do not answer the user's task. Rewrite the prompt.
- Preserve intent.
- Include role, objective, context, constraints, workflow, output format, and success criteria.
- Provide exactly 3 variants: Concise, Structured, Expert.
- Give 0-3 clarifying questions only when useful.
- Scores must be 0-100.`;
}

async function callOpenAiCompatible(args: { baseUrl: string; apiKey: string; model: string; system: string; user: string; temperature: number; jsonMode: boolean }) {
  const body: Record<string, unknown> = {
    model: args.model,
    temperature: args.temperature,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  };
  if (args.jsonMode) body.response_format = { type: "json_object" };

  return fetch(`${args.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function normalizeResult(diagnostics: EnhancedPromptResult, ai: AiPayload, startedAt: number, provider: string, model: string): AiEnhanceResult {
  return {
    ...diagnostics,
    source: "llm",
    provider,
    model,
    latencyMs: Math.round(performance.now() - startedAt),
    enhancedPrompt: ai.enhancedPrompt ?? diagnostics.enhancedPrompt,
    summary: ai.summary ?? "AI prompt consultant completed the rewrite.",
    improvements: ai.improvements?.length ? ai.improvements : diagnostics.improvements,
    evaluation: ai.evaluation,
    clarifyingQuestions: ai.clarifyingQuestions ?? [],
    variants: ai.variants ?? [],
    changes: ai.changes ?? [],
    checklist: ai.checklist ?? [],
    metadata: ai.metadata,
  };
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  try {
    const body = (await request.json()) as EnhanceRequest;
    const input = typeof body.input === "string" ? body.input.trim().slice(0, maxInputLength) : "";
    const mode = isOneOf(body.mode, validModes) ? body.mode : "general";
    const language = isOneOf(body.language, validLanguages) ? body.language : "auto";
    const strength = isOneOf(body.strength, validStrengths) ? body.strength : "balanced";
    const style = isOneOf(body.style, validStyles) ? body.style : "professional";
    if (!input) return Response.json({ error: "Prompt input is required." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for AI enhancement." }, { status: 500 });

    const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const system = createSystemPrompt(mode, language, strength, style);
    const temperature = style === "creative" ? 0.75 : 0.35;

    const analysisContext = body.analysisContext ? `\n\nAnalysis context and clarifying answers:\n${JSON.stringify(body.analysisContext, null, 2)}` : "";
    const userMessage = `${input}${analysisContext}`;

    let response = await callOpenAiCompatible({ baseUrl, apiKey, model, system, user: userMessage, temperature, jsonMode: true });
    if (!response.ok && [400, 422].includes(response.status)) {
      response = await callOpenAiCompatible({ baseUrl, apiKey, model, system, user: userMessage, temperature, jsonMode: false });
    }
    if (!response.ok) return Response.json({ error: `OpenAI-compatible API failed with status ${response.status}.` }, { status: 502 });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return Response.json({ error: "OpenAI-compatible response did not include content." }, { status: 502 });
    const ai = extractJson(content);
    if (!ai?.enhancedPrompt) {
      return Response.json({ error: "AI model did not return the expected JSON. Try a stronger chat/instruct model.", rawPreview: content.slice(0, 220) }, { status: 502 });
    }

    return Response.json(normalizeResult(enhancePrompt(input, mode), ai, startedAt, new URL(baseUrl).hostname, model));
  } catch (error) {
    console.error("AI consultant enhancement failed", error);
    return Response.json({ error: "AI consultant enhancement failed. Check API key, model, and provider settings." }, { status: 500 });
  }
}

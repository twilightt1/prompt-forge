import { enhancePrompt, type EnhancedPromptResult, type PromptMode } from "@/lib/prompt-engine";
import type { AiEnhanceResult } from "@/lib/ai-result";
import type { EnhanceLanguage, EnhanceStrength, EnhanceStyle, RewriteFramework, RewriteLevel, RewriteOutputGoal, RewriteTargetModel } from "@/lib/enhance-options";

export const runtime = "nodejs";
export const maxDuration = 300;
type EnhanceRequest = {
  input?: string;
  mode?: PromptMode;
  language?: EnhanceLanguage;
  strength?: EnhanceStrength;
  style?: EnhanceStyle;
  analysisContext?: unknown;
  outputGoal?: RewriteOutputGoal;
  framework?: RewriteFramework;
  rewriteLevel?: RewriteLevel;
  targetModel?: RewriteTargetModel;
};
type AiPayload = Partial<Omit<AiEnhanceResult, keyof EnhancedPromptResult | "source" | "provider" | "model" | "latencyMs">> & { enhancedPrompt?: string; summary?: string; improvements?: string[] };

const validModes: PromptMode[] = ["general", "coding", "marketing", "image", "research", "agentic"];
const validLanguages: EnhanceLanguage[] = ["auto", "english", "vietnamese", "bilingual"];
const validStrengths: EnhanceStrength[] = ["light", "balanced", "deep"];
const validStyles: EnhanceStyle[] = ["professional", "creative", "technical", "concise"];
const validOutputGoals: RewriteOutputGoal[] = ["accurate-answer", "structured-plan", "json-api", "creative-ideation", "code-generation", "agent-instruction", "research-synthesis", "marketing-copy"];
const validFrameworks: RewriteFramework[] = ["auto", "rtf", "craft", "co-star", "tag", "risen", "agent-spec", "json-contract"];
const validRewriteLevels: RewriteLevel[] = ["clean", "structure", "expert", "production", "agentic"];
const validTargetModels: RewriteTargetModel[] = ["auto", "gpt", "claude", "gemini", "llama", "image-model", "coding-agent"];
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

function createSystemPrompt(mode: PromptMode, language: EnhanceLanguage, strength: EnhanceStrength, style: EnhanceStyle, profile: { outputGoal: RewriteOutputGoal; framework: RewriteFramework; rewriteLevel: RewriteLevel; targetModel: RewriteTargetModel }) {
  const languagePolicy = {
    auto: "Detect the user's input language and write the improved prompt in that same language.",
    english: "Write the improved prompt and every user-facing JSON string in English only.",
    vietnamese: "Write the improved prompt and every user-facing JSON string in professional, natural Vietnamese only. Translate all structural headings inside the prompt.",
    bilingual: "Write the improved prompt bilingually: Vietnamese first, then English.",
  } satisfies Record<EnhanceLanguage, string>;

  return `You are PromptForge Fast Rewrite Engine, an expert prompt consultant. Rewrite the user's prompt for ${mode} work.

Controls: language=${language}, strength=${strength}, style=${style}
Language policy: ${languagePolicy[language]}
Rewrite profile: outputGoal=${profile.outputGoal}, framework=${profile.framework}, level=${profile.rewriteLevel}, targetModel=${profile.targetModel}

Return ONLY valid JSON. No markdown fences. Shape:
{
  "enhancedPrompt": "string",
  "summary": "string",
  "improvements": ["string"],
  "evaluation": { "score": 0, "grade": "string", "suggestions": ["string"] },
  "metadata": { "title": "string", "tags": ["string"], "bestFor": ["string"] }
}

Rules:
- Do not answer the user's task. Rewrite the prompt.
- Preserve intent and important details.
- Improve clarity, context, constraints, workflow, output format, and success criteria.
- Keep enhancedPrompt practical and ready to paste into an AI tool.
- Use 3-5 concise improvements only.
- The selected language policy is mandatory for all user-facing JSON strings.
- If language=vietnamese, headings like Role, Objective, Context, Constraints, Workflow, Output Format, and Success Criteria must be Vietnamese.
- Scores must be 0-100.`;
}

async function callOpenAiCompatible(args: { baseUrl: string; apiKey: string; model: string; system: string; user: string; temperature: number; jsonMode: boolean; maxTokens?: number }) {
  const body: Record<string, unknown> = {
    model: args.model,
    temperature: args.temperature,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.user },
    ],
  };
  if (args.maxTokens) {
    body.max_tokens = args.maxTokens;
    body.max_completion_tokens = args.maxTokens;
  }
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
    rewriteProfile: ai.rewriteProfile,
    qualityContract: ai.qualityContract,
    semanticDiff: ai.semanticDiff ?? [],
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
    const outputGoal = isOneOf(body.outputGoal, validOutputGoals) ? body.outputGoal : "structured-plan";
    const framework = isOneOf(body.framework, validFrameworks) ? body.framework : "auto";
    const rewriteLevel = isOneOf(body.rewriteLevel, validRewriteLevels) ? body.rewriteLevel : "expert";
    const targetModel = isOneOf(body.targetModel, validTargetModels) ? body.targetModel : "auto";
    if (!input) return Response.json({ error: "Prompt input is required." }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for AI enhancement." }, { status: 500 });

    const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL_FAST ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    const system = createSystemPrompt(mode, language, strength, style, { outputGoal, framework, rewriteLevel, targetModel });
    const temperature = style === "creative" ? 0.75 : 0.35;

    const analysisContext = body.analysisContext ? `\n\nAnalysis context and clarifying answers:\n${JSON.stringify(body.analysisContext, null, 2)}` : "";
    const userMessage = `${input}${analysisContext}`;

    let response = await callOpenAiCompatible({ baseUrl, apiKey, model, system, user: userMessage, temperature, jsonMode: true, maxTokens: 1800 });
    if (!response.ok && [400, 422].includes(response.status)) {
      response = await callOpenAiCompatible({ baseUrl, apiKey, model, system, user: userMessage, temperature, jsonMode: false, maxTokens: 1800 });
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

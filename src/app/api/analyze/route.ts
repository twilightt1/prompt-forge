import type { AiPromptAnalysis } from "@/lib/ai-result";
import type { PromptMode } from "@/lib/prompt-engine";

type AnalyzeRequest = { input?: string };
const modes: PromptMode[] = ["general", "coding", "marketing", "image", "research", "agentic"];

function extractJson(content: string): AiPromptAnalysis | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < first) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)) as AiPromptAnalysis; } catch { return null; }
}

function fallbackAnalysis(input: string): AiPromptAnalysis {
  const text = input.toLowerCase();
  const recommendedMode: PromptMode = text.includes("code") || text.includes("bug") || text.includes("next") ? "coding" : text.includes("image") ? "image" : text.includes("research") ? "research" : text.includes("marketing") || text.includes("landing") ? "marketing" : "general";
  return {
    intent: "Improve a rough prompt into a clearer AI instruction",
    recommendedMode,
    audience: "AI assistant",
    riskLevel: input.length < 80 ? "medium" : "low",
    missingInfo: input.length < 80 ? ["Audience", "Desired output format", "Success criteria"] : ["Examples or constraints could make the prompt stronger"],
    questions: ["Output mong muốn là dạng markdown, JSON, checklist hay bài viết?", "Audience hoặc người dùng cuối là ai?", "Có constraint nào bắt buộc phải tuân thủ không?"],
    strategy: input.length < 80 ? "clarify-first" : "direct-rewrite",
    strategyReason: "Local analysis used because AI analysis was unavailable.",
  };
}

export async function POST(request: Request) {
  const { input = "" } = (await request.json()) as AnalyzeRequest;
  const prompt = input.trim();
  if (!prompt) return Response.json({ error: "Prompt input is required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey || apiKey === "your_api_key_here") return Response.json(fallbackAnalysis(prompt));

  const system = `Analyze the user's prompt before enhancement. Return ONLY JSON:
{"intent":"string","recommendedMode":"general|coding|marketing|image|research|agentic","audience":"string","riskLevel":"low|medium|high","missingInfo":["string"],"questions":["string"],"strategy":"clarify-first|direct-rewrite|expert-rewrite|test-required","strategyReason":"string"}
Ask up to 3 useful questions. recommendedMode must be one allowed value.`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
    });
    if (!response.ok) return Response.json(fallbackAnalysis(prompt));
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJson(content) : null;
    if (!parsed || !modes.includes(parsed.recommendedMode)) return Response.json(fallbackAnalysis(prompt));
    return Response.json(parsed);
  } catch {
    return Response.json(fallbackAnalysis(prompt));
  }
}

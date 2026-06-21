import type { AiOptimizeResult } from "@/lib/ai-result";

export const runtime = "nodejs";
export const maxDuration = 300;
type OptimizeRequest = { input?: string; enhancedPrompt?: string; analysisContext?: unknown };

function extractJson(content: string): AiOptimizeResult | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < first) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)) as AiOptimizeResult; } catch { return null; }
}

export async function POST(request: Request) {
  const body = (await request.json()) as OptimizeRequest;
  const input = body.input?.trim() ?? "";
  if (!input) return Response.json({ error: "Prompt input is required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for auto optimize." }, { status: 500 });

  const system = `You are PromptForge's senior prompt optimization loop. Return ONLY JSON:
{"iterations":[{"version":1,"prompt":"string","score":0,"critique":"string","changes":["string"]}],"finalPrompt":"string","finalScore":0,"reasoningSummary":"string","remainingRisks":["string"]}
Create 2-3 iterations. Each version should improve clarity, constraints, output format, guardrails, and testability. Scores are 0-100.`;
  const user = `Original prompt:\n${input}\n\nCurrent enhanced prompt:\n${body.enhancedPrompt ?? ""}\n\nAnalysis context:\n${JSON.stringify(body.analysisContext ?? {}, null, 2)}`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.35, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!response.ok) return Response.json({ error: `OpenAI-compatible API failed with status ${response.status}.` }, { status: 502 });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJson(content) : null;
    if (!parsed?.finalPrompt) return Response.json({ error: "AI optimize did not return expected JSON." }, { status: 502 });
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Auto optimize failed. Check API key, model, and provider settings." }, { status: 500 });
  }
}

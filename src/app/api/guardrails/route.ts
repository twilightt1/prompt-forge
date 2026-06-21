import type { AiGuardrailsResult } from "@/lib/ai-result";

export const runtime = "nodejs";
export const maxDuration = 60;
type GuardrailsRequest = { prompt?: string; mode?: string };

function extractJson(content: string): AiGuardrailsResult | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < first) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)) as AiGuardrailsResult; } catch { return null; }
}

export async function POST(request: Request) {
  const { prompt = "", mode = "general" } = (await request.json()) as GuardrailsRequest;
  if (!prompt.trim()) return Response.json({ error: "Prompt is required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for guardrails." }, { status: 500 });

  const system = `Generate production guardrails for a ${mode} prompt. Return ONLY JSON:
{"guardrails":["string"],"failurePrevention":["string"],"promptAddendum":"string"}
Guardrails should prevent hallucination, missing context, unsafe assumptions, wrong format, and overconfident claims.`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.25, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
    });
    if (!response.ok) return Response.json({ error: `OpenAI-compatible API failed with status ${response.status}.` }, { status: 502 });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJson(content) : null;
    if (!parsed?.promptAddendum) return Response.json({ error: "AI guardrails did not return expected JSON." }, { status: 502 });
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Guardrails generation failed. Check API key, model, and provider settings." }, { status: 500 });
  }
}

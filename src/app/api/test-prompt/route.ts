import type { AiPromptTestResult } from "@/lib/ai-result";

type TestPromptRequest = { prompt?: string; sampleInput?: string };

function extractJson(content: string): AiPromptTestResult | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < first) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)) as AiPromptTestResult; } catch { return null; }
}

export async function POST(request: Request) {
  const { prompt = "", sampleInput = "" } = (await request.json()) as TestPromptRequest;
  const enhancedPrompt = prompt.trim();
  if (!enhancedPrompt) return Response.json({ error: "Enhanced prompt is required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for prompt testing." }, { status: 500 });

  const system = `Test the provided enhanced prompt. Return ONLY JSON:
{"previewOutput":"string","strengths":["string"],"failureModes":["string"],"recommendedTweaks":["string"]}
Simulate a realistic output. Then critique strengths, likely failure modes, and tweaks.`;
  const user = `Enhanced prompt:\n${enhancedPrompt}\n\nSample input/context:\n${sampleInput || "Use a reasonable sample scenario."}`;

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
    if (!parsed?.previewOutput) return Response.json({ error: "AI test did not return expected JSON." }, { status: 502 });
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Prompt test failed. Check API key, model, and provider settings." }, { status: 500 });
  }
}

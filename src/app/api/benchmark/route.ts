import type { AiBenchmarkResult } from "@/lib/ai-result";

export const runtime = "nodejs";
export const maxDuration = 300;
type BenchmarkRequest = { original?: string; enhanced?: string; sampleInput?: string };

function extractJson(content: string): AiBenchmarkResult | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced ?? content;
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  if (first < 0 || last < first) return null;
  try { return JSON.parse(candidate.slice(first, last + 1)) as AiBenchmarkResult; } catch { return null; }
}

export async function POST(request: Request) {
  const { original = "", enhanced = "", sampleInput = "" } = (await request.json()) as BenchmarkRequest;
  if (!original.trim() || !enhanced.trim()) return Response.json({ error: "Original and enhanced prompts are required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  if (!apiKey || apiKey === "your_api_key_here") return Response.json({ error: "OPENAI_API_KEY is required for benchmark." }, { status: 500 });

  const system = `Benchmark two prompts. Return ONLY JSON:
{"originalScore":0,"enhancedScore":0,"winner":"original|enhanced|tie","summary":"string","comparison":[{"metric":"Clarity","original":0,"enhanced":0,"reason":"string"}]}
Use metrics: Clarity, Completeness, Output usability, Risk control, Testability. Scores are 0-100.`;
  const user = `Original prompt:\n${original}\n\nEnhanced prompt:\n${enhanced}\n\nSample input/context:\n${sampleInput || "Use a realistic generic sample."}`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    });
    if (!response.ok) return Response.json({ error: `OpenAI-compatible API failed with status ${response.status}.` }, { status: 502 });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? extractJson(content) : null;
    if (!parsed?.comparison) return Response.json({ error: "AI benchmark did not return expected JSON." }, { status: 502 });
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Benchmark failed. Check API key, model, and provider settings." }, { status: 500 });
  }
}

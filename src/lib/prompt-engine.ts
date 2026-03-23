export type PromptMode = "general" | "coding" | "marketing" | "image" | "research" | "agentic";
export function enhancePrompt(input: string, mode: PromptMode) {
  return {
    enhancedPrompt: input,
    score: 50,
    grade: "Rough draft",
    summary: "Basic upgrade",
    improvements: [],
    metrics: []
  };
}
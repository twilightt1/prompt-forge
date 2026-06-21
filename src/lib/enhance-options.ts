export type EnhanceLanguage = "auto" | "english" | "vietnamese" | "bilingual";
export type EnhanceStrength = "light" | "balanced" | "deep";
export type EnhanceStyle = "professional" | "creative" | "technical" | "concise";

export type RewriteOutputGoal = "accurate-answer" | "structured-plan" | "json-api" | "creative-ideation" | "code-generation" | "agent-instruction" | "research-synthesis" | "marketing-copy";
export type RewriteFramework = "auto" | "rtf" | "craft" | "co-star" | "tag" | "risen" | "agent-spec" | "json-contract";
export type RewriteLevel = "clean" | "structure" | "expert" | "production" | "agentic";
export type RewriteTargetModel = "auto" | "gpt" | "claude" | "gemini" | "llama" | "image-model" | "coding-agent";

export const enhanceLanguages: EnhanceLanguage[] = ["auto", "english", "vietnamese", "bilingual"];
export const enhanceStrengths: EnhanceStrength[] = ["light", "balanced", "deep"];
export const enhanceStyles: EnhanceStyle[] = ["professional", "creative", "technical", "concise"];

export const rewriteOutputGoals: RewriteOutputGoal[] = ["accurate-answer", "structured-plan", "json-api", "creative-ideation", "code-generation", "agent-instruction", "research-synthesis", "marketing-copy"];
export const rewriteFrameworks: RewriteFramework[] = ["auto", "rtf", "craft", "co-star", "tag", "risen", "agent-spec", "json-contract"];
export const rewriteLevels: RewriteLevel[] = ["clean", "structure", "expert", "production", "agentic"];
export const rewriteTargetModels: RewriteTargetModel[] = ["auto", "gpt", "claude", "gemini", "llama", "image-model", "coding-agent"];

import type { RewriteFramework, RewriteLevel, RewriteOutputGoal, RewriteTargetModel } from "./enhance-options";
import type { PromptMode } from "./prompt-engine";
import type { EnhancedPromptResult } from "./prompt-engine";

export type AiRiskLevel = "low" | "medium" | "high";
export type AiEnhancementStrategy = "clarify-first" | "direct-rewrite" | "expert-rewrite" | "test-required";

export type AiCriterionScore = {
  label: string;
  score: number;
  insight: string;
};

export type AiEvaluation = {
  score: number;
  grade: string;
  criteria: AiCriterionScore[];
  issues: string[];
  suggestions: string[];
};

export type AiVariant = {
  name: string;
  prompt: string;
  bestFor: string;
};

export type AiChange = {
  title: string;
  before: string;
  after: string;
  reason: string;
};

export type AiChecklistItem = {
  item: string;
  passed: boolean;
  note: string;
};

export type AiMetadata = {
  title: string;
  tags: string[];
  bestFor: string[];
};

export type AiPromptAnalysis = {
  intent: string;
  recommendedMode: PromptMode;
  audience: string;
  riskLevel: AiRiskLevel;
  missingInfo: string[];
  questions: string[];
  strategy: AiEnhancementStrategy;
  strategyReason: string;
};

export type AiPromptTestResult = {
  previewOutput: string;
  strengths: string[];
  failureModes: string[];
  recommendedTweaks: string[];
};

export type AiOptimizeIteration = {
  version: number;
  prompt: string;
  score: number;
  critique: string;
  changes: string[];
};

export type AiOptimizeResult = {
  iterations: AiOptimizeIteration[];
  finalPrompt: string;
  finalScore: number;
  reasoningSummary: string;
  remainingRisks: string[];
};

export type AiBenchmarkMetric = {
  metric: string;
  original: number;
  enhanced: number;
  reason: string;
};

export type AiBenchmarkResult = {
  originalScore: number;
  enhancedScore: number;
  winner: "original" | "enhanced" | "tie";
  summary: string;
  comparison: AiBenchmarkMetric[];
};

export type AiGuardrailsResult = {
  guardrails: string[];
  failurePrevention: string[];
  promptAddendum: string;
};

export type RewriteProfile = {
  outputGoal: RewriteOutputGoal;
  framework: RewriteFramework;
  level: RewriteLevel;
  targetModel: RewriteTargetModel;
};

export type AiQualityContract = {
  mustImprove: string[];
  mustPreserve: string[];
  mustAvoid: string[];
};

export type AiSemanticDiffItem = {
  category: string;
  impact: "low" | "medium" | "high";
  before: string;
  after: string;
  why: string;
};

export type AiEnhanceResult = EnhancedPromptResult & {
  source: "llm" | "local-fallback";
  provider?: string;
  model?: string;
  latencyMs?: number;
  evaluation?: AiEvaluation;
  clarifyingQuestions?: string[];
  variants?: AiVariant[];
  changes?: AiChange[];
  checklist?: AiChecklistItem[];
  metadata?: AiMetadata;
  rewriteProfile?: RewriteProfile;
  qualityContract?: AiQualityContract;
  semanticDiff?: AiSemanticDiffItem[];
};
